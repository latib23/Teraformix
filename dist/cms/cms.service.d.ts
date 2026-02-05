import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ContentBlock } from './entities/content-block.entity';
export declare class CmsService implements OnModuleInit {
    private contentRepository;
    private readonly logger;
    constructor(contentRepository: Repository<ContentBlock>);
    onModuleInit(): Promise<void>;
    getContent(key: string): Promise<any>;
    getAllContent(): Promise<Record<string, any>>;
    updateContent(key: string, data: any): Promise<ContentBlock>;
    importRedirectsFromCsv(filePath: string): Promise<{
        imported: number;
        skipped: number;
    }>;
}
