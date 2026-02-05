import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly salesEmail = 'sales@servertechcentral.com';
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {}

  async sendEmail(subject: string, html: string, to?: string | string[]): Promise<void> {
    try {
      const apiToken = this.configService.get<string>('MAILTRAP_TOKEN');
      const fromEmail = this.configService.get<string>('MAILTRAP_FROM') || 'noreply@servertechcentral.com';
      const fromName = this.configService.get<string>('MAILTRAP_FROM_NAME') || 'Server Tech Central';
      const recipients: string[] = Array.isArray(to) ? to.filter(Boolean) : (to ? [to] : []);
      if (!recipients.includes(this.salesEmail)) recipients.push(this.salesEmail);
      if (recipients.length === 0) recipients.push(this.salesEmail);

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
        const host = this.configService.get<string>('MAILTRAP_HOST') || 'sandbox.smtp.mailtrap.io';
        const port = Number(this.configService.get<string>('MAILTRAP_PORT') || 2525);
        const user = this.configService.get<string>('MAILTRAP_USER');
        const pass = this.configService.get<string>('MAILTRAP_PASS');
        if (!user || !pass) {
          this.logger.warn('Email not sent: MAILTRAP_TOKEN or MAILTRAP_USER/MAILTRAP_PASS are not configured.');
          this.logger.warn('Subject: ' + subject);
          this.logger.warn('To: ' + to);
          return;
        }
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: false,
          auth: { user, pass },
        });
      }

      await this.transporter!.sendMail({ from: fromEmail, to: recipients.join(', '), subject, html });
      this.logger.log(`Email successfully sent via SMTP to ${recipients.join(', ')}`);
    } catch (error: any) {
      const msg = String(error?.message || error?.toString?.() || 'Unknown email error');
      this.logger.error(`Failed to send email: ${msg}`);
      throw new Error('Email sending failed');
    }
  }
}
