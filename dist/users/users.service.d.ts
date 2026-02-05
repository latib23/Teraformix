import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateUserTargetDto } from './dto/update-user.dto';
export declare class UsersService implements OnModuleInit {
    private userRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>);
    onModuleInit(): Promise<void>;
    findByEmail(email: string): Promise<User | undefined>;
    findAll(): Promise<User[]>;
    updatePermissions(id: string, role: UserRole, permissions: string[]): Promise<User>;
    createSalesperson(dto: CreateSalespersonDto): Promise<Omit<User, 'passwordHash'>>;
    createBuyer(name: string, email: string, password: string): Promise<Omit<User, 'passwordHash'>>;
    findBuyers(): Promise<Array<Pick<User, 'id' | 'name' | 'email' | 'role'>>>;
    deleteBuyer(id: string): Promise<{
        success: true;
    }>;
    findSalespeopleWithSales(): Promise<any[]>;
    updateTarget(id: string, dto: UpdateUserTargetDto): Promise<User>;
}
