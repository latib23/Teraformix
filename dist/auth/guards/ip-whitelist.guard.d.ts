import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CmsService } from '../../cms/cms.service';
export declare class IpWhitelistGuard implements CanActivate {
    private readonly cmsService;
    private readonly reflector;
    private readonly logger;
    constructor(cmsService: CmsService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getClientIp;
}
