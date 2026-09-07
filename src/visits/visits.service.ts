import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UAParser } from 'ua-parser-js';
import * as geoip from 'geoip-lite';
import { Visit, VisitDocument } from './visit.schema';
import { CreateVisitDto } from './dto/create-visit.dto';

// The funnel this store cares about — landing page, order form,
// then the payment result page. '/' is folded into '/index.html' since
// both mean "the landing page" depending on how the URL was typed.
const FUNNEL_PAGES = ['/index.html', '/commande.html', '/successpay.html'];

@Injectable()
export class VisitsService {
  constructor(
    @InjectModel(Visit.name) private visitModel: Model<VisitDocument>,
  ) {}

  // Own domain — excluded from "top referrers" so index→commande→successpay
  // navigation (referrer = your own previous page) doesn't drown out actual
  // acquisition channels (Facebook, Google, etc.). Update PUBLIC_SITE_HOST
  // if the storefront domain ever changes.
  private readonly ownHost = (
    process.env.PUBLIC_SITE_HOST || 'dixtri.com'
  ).replace(/^www\./, '');

  private parseDevice(userAgent: string) {
    const result = new UAParser(userAgent || '').getResult();
    let device = 'desktop';
    if (result.device.type === 'mobile') device = 'mobile';
    else if (result.device.type === 'tablet') device = 'tablet';
    else if (/bot|crawl|spider|slurp/i.test(userAgent || '')) device = 'bot';
    return {
      device,
      browser: result.browser.name || 'Inconnu',
      os: result.os.name || 'Inconnu',
    };
  }

  // geoip-lite ships an offline MaxMind GeoLite2 snapshot bundled with the
  // package — no external API call, so the visitor's IP never leaves your
  // server. Country is generally reliable; city-level results for Bénin
  // specifically can be sparse or approximate (free-tier DB limitation).
  private lookupGeo(ip: string) {
    if (!ip) return { country: '', city: '' };
    const geo = geoip.lookup(ip);
    return { country: geo?.country || '', city: geo?.city || '' };
  }

  private parseReferrerHost(referrer: string): string {
    if (!referrer) return '';
    try {
      return new URL(referrer).hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }

  async create(dto: CreateVisitDto, ip: string, userAgent: string): Promise<VisitDocument> {
    const { device, browser, os } = this.parseDevice(userAgent);
    const { country, city } = this.lookupGeo(ip);
    const referrerHost = this.parseReferrerHost(dto.referrer || '');

    const visit = new this.visitModel({
      ...dto,
      path: dto.path === '/' ? '/index.html' : dto.path,
      ip,
      userAgent,
      device,
      browser,
      os,
      country,
      city,
      referrerHost,
    });
    return visit.save();
  }

  async updateDuration(id: string, durationMs: number): Promise<void> {
    // No NotFoundException on a bad id — this is fired via
    // navigator.sendBeacon with no response handling on the client side,
    // so there's nothing useful to surface an error to anyway.
    await this.visitModel.findByIdAndUpdate(id, { durationMs }).exec().catch(() => undefined);
  }

  async findRecent(days: number, limit: number): Promise<VisitDocument[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.visitModel
      .find({ createdAt: { $gte: cutoff } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  private async aggregateTop(match: Record<string, any>, field: string, limit: number, excludeBlank: boolean) {
    const pipeline: any[] = [{ $match: match }];
    if (excludeBlank) pipeline.push({ $match: { [field]: { $nin: ['', null] } } });
    pipeline.push(
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, value: '$_id', count: 1 } },
    );
    return this.visitModel.aggregate(pipeline);
  }

  // Distinct sessions that reached each step of the funnel, and the
  // conversion rate between consecutive steps. A session that skipped
  // straight to /commande.html (e.g. a saved link) still counts at that
  // step — this measures "did they reach X", not "did they follow the
  // exact expected order".
  private async getFunnel(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.visitModel.aggregate([
      { $match: { createdAt: { $gte: cutoff }, path: { $in: FUNNEL_PAGES } } },
      { $group: { _id: '$path', sessions: { $addToSet: '$sessionId' } } },
    ]);

    const byPage: Record<string, Set<string>> = {};
    for (const row of rows) byPage[row._id] = new Set(row.sessions);

    const landing = byPage['/index.html'] || new Set<string>();
    const commande = byPage['/commande.html'] || new Set<string>();
    const success = byPage['/successpay.html'] || new Set<string>();

    const landingToCommande = [...landing].filter((s) => commande.has(s)).length;
    const commandeToSuccess = [...commande].filter((s) => success.has(s)).length;

    return {
      steps: [
        { label: 'Landing', sessions: landing.size },
        { label: 'Commande', sessions: commande.size },
        { label: 'Paiement', sessions: success.size },
      ],
      landingToCommandeRate: landing.size ? Math.round((landingToCommande / landing.size) * 100) : 0,
      commandeToSuccessRate: commande.size ? Math.round((commandeToSuccess / commande.size) * 100) : 0,
    };
  }

  async getStats(days: number) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const match = { createdAt: { $gte: cutoff } };

    const [totals] = await this.visitModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalVisits: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
          avgDurationMs: { $avg: '$durationMs' },
        },
      },
      {
        $project: {
          _id: 0,
          totalVisits: 1,
          uniqueVisitors: { $size: '$uniqueVisitors' },
          avgDurationMs: { $round: [{ $ifNull: ['$avgDurationMs', 0] }, 0] },
        },
      },
    ]);

    const visitsPerDay = await this.visitModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          uniqueVisitors: { $addToSet: '$visitorId' },
        },
      },
      { $project: { _id: 0, date: '$_id', count: 1, uniqueVisitors: { $size: '$uniqueVisitors' } } },
      { $sort: { date: 1 } },
    ]);

    const [topReferrers, topUtmSources, topPages, topCountries, deviceBreakdown, funnel] = await Promise.all([
      this.aggregateTop({ ...match, referrerHost: { $ne: this.ownHost } }, 'referrerHost', 8, true),
      this.aggregateTop(match, 'utmSource', 8, true),
      this.aggregateTop(match, 'path', 10, true),
      this.aggregateTop(match, 'country', 8, true),
      this.aggregateTop(match, 'device', 6, false),
      this.getFunnel(days),
    ]);

    return {
      totalVisits: totals?.totalVisits || 0,
      uniqueVisitors: totals?.uniqueVisitors || 0,
      avgDurationMs: totals?.avgDurationMs || 0,
      visitsPerDay,
      topReferrers,
      topUtmSources,
      topPages,
      topCountries,
      deviceBreakdown,
      funnel,
    };
  }
}
