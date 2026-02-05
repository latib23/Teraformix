import { ConfigService } from '@nestjs/config';
export declare class NotificationsService {
    private configService;
    private readonly logger;
    private readonly salesEmail;
    private transporter;
    constructor(configService: ConfigService);
    sendEmail(subject: string, html: string, to?: string | string[]): Promise<void>;
}
