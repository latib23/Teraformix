import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(email: string, pass: string): Promise<{
        accessToken: string;
        role: any;
    }>;
    register(name: string, email: string, password: string): Promise<{
        accessToken: string;
        role: UserRole;
    }>;
}
