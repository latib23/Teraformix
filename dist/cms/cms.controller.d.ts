import { CmsService } from './cms.service';
export declare class CmsController {
    private readonly cmsService;
    private readonly logger;
    constructor(cmsService: CmsService);
    health(): {
        status: string;
        module: string;
    };
    getAll(): Promise<Record<string, any>>;
    getOne(key: string): Promise<any>;
    uploadFile(file: any): {
        url: string;
    };
    update(key: string, data: any, req: any): Promise<import("./entities/content-block.entity").ContentBlock>;
    importRedirects(file: any): Promise<{
        imported: number;
        skipped: number;
    }>;
}
