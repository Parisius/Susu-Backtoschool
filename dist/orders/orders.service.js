"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const order_schema_1 = require("./order.schema");
let OrdersService = class OrdersService {
    constructor(orderModel) {
        this.orderModel = orderModel;
    }
    generateRef() {
        return 'SUSU-' + Date.now().toString().slice(-6);
    }
    async create(dto) {
        const order = new this.orderModel({
            ...dto,
            ref: this.generateRef(),
            status: 'nouveau',
            paymentStatus: 'en_attente',
            date: new Date().toISOString(),
        });
        return order.save();
    }
    async findByRef(ref) {
        const order = await this.orderModel.findOne({ ref }).exec();
        if (!order)
            throw new common_1.NotFoundException('Commande introuvable.');
        return order;
    }
    async updateByRef(ref, update) {
        return this.orderModel
            .findOneAndUpdate({ ref }, update, { new: true })
            .exec();
    }
    async findAll() {
        return this.orderModel.find().sort({ createdAt: -1 }).exec();
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(order_schema_1.Order.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], OrdersService);
