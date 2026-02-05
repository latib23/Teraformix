import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET');
    const isProduction = (config.get<string>('NODE_ENV') || '').toLowerCase() === 'production';
    if (isProduction && !secret) {
      throw new Error('JWT_SECRET must be configured in production');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'SECRETKEY',
    });
  }

  async validate(payload: any) {
    // In a real app, you'd fetch the user from the DB here to attach to the request
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
