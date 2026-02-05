import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        role: any;
    }>;
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        role: import("../users/entities/user.entity").UserRole;
    }>;
}
