import { Response } from 'express';
import { QuotesService } from './quotes.service';
import { QuoteStatus } from './entities/quote.entity';
import { ConciergeRequestDto } from './dto/concierge-request.dto';
import { BulkQuoteRequestDto } from './dto/bulk-quote-request.dto';
import { BomUploadRequestDto } from './dto/bom-upload-request.dto';
import { QuoteBeatingRequestDto } from './dto/quote-beating-request.dto';
import { ContactRequestDto } from './dto/contact-request.dto';
export declare class QuotesController {
    private readonly quotesService;
    constructor(quotesService: QuotesService);
    findAll(): Promise<import("./entities/quote.entity").Quote[]>;
    requestQuote(body: any): {
        message: string;
    };
    findMyQuotes(req: any): Promise<import("./entities/quote.entity").Quote[]>;
    approveQuote(id: string, total: number): Promise<import("./entities/quote.entity").Quote>;
    updateQuote(id: string, body: any): Promise<import("./entities/quote.entity").Quote>;
    createManualQuote(body: any): Promise<import("./entities/quote.entity").Quote>;
    conciergeRequest(body: ConciergeRequestDto): Promise<{
        message: string;
        referenceNumber: string;
    }>;
    bulkQuoteRequest(body: BulkQuoteRequestDto): Promise<{
        message: string;
        referenceNumber: string;
    }>;
    bomUploadRequest(body: BomUploadRequestDto): Promise<{
        message: string;
        referenceNumber: string;
    }>;
    quoteBeatingRequest(body: QuoteBeatingRequestDto): Promise<{
        message: string;
        referenceNumber: string;
    }>;
    contactRequest(body: ContactRequestDto): Promise<{
        message: string;
        referenceNumber: string;
    }>;
    downloadBomFile(id: string, _req: any, _body: any, res: Response): Promise<Response<any, Record<string, any>>>;
    trackQuote(body: {
        referenceNumber: string;
        email: string;
    }): Promise<{
        found: boolean;
        data?: undefined;
    } | {
        found: boolean;
        data: {
            id: string;
            referenceNumber: string;
            type: import("./entities/quote.entity").QuoteType;
            status: QuoteStatus;
            createdAt: Date;
            submissionData: {
                parts: any;
                timeline: any;
                fileName: any;
            };
        };
    }>;
    getPublicQuote(id: string): Promise<{
        id: string;
        referenceNumber: string;
        status: QuoteStatus;
        createdAt: Date;
        total: any;
        paymentTerms: string;
        items: any;
        customer: {
            name: string;
            email: string;
            company: string;
        };
    }>;
    payQuote(id: string, paymentDetails: any): Promise<import("./entities/quote.entity").Quote>;
    captureAbandoned(body: any): Promise<{
        id: string;
        referenceNumber: string;
    }>;
    syncQuote(id: string): Promise<{
        message: string;
    }>;
}
