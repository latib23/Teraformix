import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';
import { UpdateUserTargetDto } from './dto/update-user.dto';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    updatePermissions(id: string, body: {
        role: UserRole;
        permissions: string[];
    }): Promise<import("./entities/user.entity").User>;
    findSalespeople(): Promise<any[]>;
    createSalesperson(createSalespersonDto: CreateSalespersonDto): Promise<Omit<import("./entities/user.entity").User, "passwordHash">>;
    findBuyers(): Promise<Pick<import("./entities/user.entity").User, "id" | "name" | "email" | "role">[]>;
    createBuyer(dto: CreateSalespersonDto): Promise<Omit<import("./entities/user.entity").User, "passwordHash">>;
    deleteBuyer(id: string): Promise<{
        success: true;
    }>;
    updateTarget(id: string, dto: UpdateUserTargetDto): Promise<import("./entities/user.entity").User>;
}
