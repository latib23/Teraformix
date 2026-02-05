import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CmsService } from '../../cms/cms.service';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly logger = new Logger(IpWhitelistGuard.name);

  constructor(
    private readonly cmsService: CmsService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If no user is logged in, or user is a regular buyer, skip IP check
    if (!user || (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.SALESPERSON)) {
      return true;
    }

    // Get allowed IPs from CMS settings
    const settings = await this.cmsService.getContent('security');

    // Check allowPkIp (legacy) and allowedIps (new list)
    // If no security settings configured, allow access (safe default)
    if (!settings) {
      return true;
    }

    const allowedIps: string[] = [];

    // Add legacy IP if present
    if (settings.allowPkIp && typeof settings.allowPkIp === 'string' && settings.allowPkIp.trim()) {
      allowedIps.push(settings.allowPkIp.trim());
    }

    // Add new list of IPs
    if (settings.allowedIps && Array.isArray(settings.allowedIps)) {
      settings.allowedIps.forEach((ip: string) => {
        if (ip && typeof ip === 'string' && ip.trim()) {
          allowedIps.push(ip.trim());
        }
      });
    }

    // If whitelist is empty, we assume the feature is disabled -> ALLOW
    if (allowedIps.length === 0) {
      return true;
    }

    // Get Client IP
    const clientIp = this.getClientIp(request);

    // Always allow localhost for development and testing
    if (clientIp === '127.0.0.1' || clientIp === '::1') {
      return true;
    }

    // Check if client IP is in the whitelist
    const isAllowed = allowedIps.some(ip => ip === clientIp);

    if (isAllowed) {
      return true;
    }

    this.logger.warn(`Blocked access for user ${user.email} (${user.role}) from IP ${clientIp}. Whitelisted: ${allowedIps.join(', ')}`);
    throw new ForbiddenException(`Access denied. Your IP (${clientIp}) is not whitelisted for administrative access.`);
  }

  private getClientIp(req: any): string {
    // Check x-forwarded-for first (standard for proxies/load balancers)
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // First IP is the client
      const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
      // Handle IPv6 mapping to IPv4 if needed (e.g. ::ffff:127.0.0.1)
      if (ip.startsWith('::ffff:')) return ip.substring(7);
      return ip;
    }

    let ip = req.connection?.remoteAddress || req.ip || '';
    if (ip.startsWith('::ffff:')) ip = ip.substring(7);
    return ip;
  }
}
