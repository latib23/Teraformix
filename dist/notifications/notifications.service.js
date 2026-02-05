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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.salesEmail = 'sales@servertechcentral.com';
        this.transporter = null;
    }
    async sendEmail(subject, html, to) {
        var _a;
        try {
            const apiToken = this.configService.get('MAILTRAP_TOKEN');
            const fromEmail = this.configService.get('MAILTRAP_FROM') || 'noreply@servertechcentral.com';
            const fromName = this.configService.get('MAILTRAP_FROM_NAME') || 'Server Tech Central';
            const recipients = Array.isArray(to) ? to.filter(Boolean) : (to ? [to] : []);
            if (!recipients.includes(this.salesEmail))
                recipients.push(this.salesEmail);
            if (recipients.length === 0)
                recipients.push(this.salesEmail);
            if (apiToken) {
                const resp = await fetch('https://send.api.mailtrap.io/api/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: { email: fromEmail, name: fromName },
                        to: recipients.map(e => ({ email: e })),
                        subject,
                        html,
                    }),
                });
                if (!resp.ok) {
                    const errText = await resp.text();
                    throw new Error(`Mailtrap API error ${resp.status}: ${errText}`);
                }
                this.logger.log(`Email successfully sent via Mailtrap API to ${recipients.join(', ')}`);
                return;
            }
            if (!this.transporter) {
                const host = this.configService.get('MAILTRAP_HOST') || 'sandbox.smtp.mailtrap.io';
                const port = Number(this.configService.get('MAILTRAP_PORT') || 2525);
                const user = this.configService.get('MAILTRAP_USER');
                const pass = this.configService.get('MAILTRAP_PASS');
                if (!user || !pass) {
                    this.logger.warn('Email not sent: MAILTRAP_TOKEN or MAILTRAP_USER/MAILTRAP_PASS are not configured.');
                    this.logger.warn('Subject: ' + subject);
                    this.logger.warn('To: ' + to);
                    return;
                }
                this.transporter = nodemailer_1.default.createTransport({
                    host,
                    port,
                    secure: false,
                    auth: { user, pass },
                });
            }
            await this.transporter.sendMail({ from: fromEmail, to: recipients.join(', '), subject, html });
            this.logger.log(`Email successfully sent via SMTP to ${recipients.join(', ')}`);
        }
        catch (error) {
            const msg = String((error === null || error === void 0 ? void 0 : error.message) || ((_a = error === null || error === void 0 ? void 0 : error.toString) === null || _a === void 0 ? void 0 : _a.call(error)) || 'Unknown email error');
            this.logger.error(`Failed to send email: ${msg}`);
            throw new Error('Email sending failed');
        }
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map