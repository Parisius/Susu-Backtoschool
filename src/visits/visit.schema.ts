import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VisitDocument = Visit & Document;

// device: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown' — parsed
// server-side from the User-Agent header (ua-parser-js). Never trust a
// client-supplied device value; a bot or a curious visitor could send
// anything.
@Schema({ timestamps: true })
export class Visit {
  @Prop({ required: true }) visitorId: string; // persists across visits (localStorage) — used for "unique visitors"
  @Prop({ required: true }) sessionId: string; // one per tab/session (sessionStorage) — used for the funnel
  @Prop({ required: true }) path: string; // e.g. '/index.html', '/commande.html', '/successpay.html'

  @Prop({ default: '' }) referrer: string; // raw document.referrer, kept for the raw export
  @Prop({ default: '' }) referrerHost: string; // hostname only, parsed server-side — what stats actually group on

  @Prop() utmSource: string;
  @Prop() utmMedium: string;
  @Prop() utmCampaign: string;

  @Prop() userAgent: string;
  @Prop({ default: 'unknown' }) device: string; // mobile | tablet | desktop | bot | unknown
  @Prop() browser: string;
  @Prop() os: string;

  // Geolocation is looked up server-side from an offline database
  // (geoip-lite — a bundled MaxMind GeoLite2 snapshot), so the IP is never
  // sent to a third-party service. City-level accuracy for Bénin
  // specifically can be sparse — treat 'city' as indicative, not precise.
  @Prop() ip: string;
  @Prop({ default: '' }) country: string;
  @Prop({ default: '' }) city: string;

  @Prop() language: string;
  @Prop() timezone: string;
  @Prop() screenWidth: number;
  @Prop() screenHeight: number;

  // Filled in later by PATCH /visits/:id/duration, fired via
  // navigator.sendBeacon when the visitor leaves or hides the tab.
  @Prop({ default: 0 }) durationMs: number;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

// Frequently filtered/grouped on — keeps stats aggregation and the raw
// table fast as volume grows well past what orders.js's full-client-fetch
// pattern could comfortably handle.
VisitSchema.index({ createdAt: -1 });
VisitSchema.index({ visitorId: 1 });
VisitSchema.index({ sessionId: 1 });
VisitSchema.index({ path: 1 });
