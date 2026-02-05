"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = UsersService_1 = class UsersService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async onModuleInit() {
        try {
            const seedFlag = (process.env.SEED_DEFAULT_USERS || '').toLowerCase() === 'true';
            const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
            if (!seedFlag) {
                this.logger.log('User seeding disabled. Set SEED_DEFAULT_USERS=true to enable.');
                return;
            }
            if (isProduction) {
                this.logger.warn('Skipping user seeding in production environment.');
                return;
            }
            const admin = await this.userRepository.findOneBy({ email: 'admin@servertechcentral.com' });
            if (!admin) {
                const adminPass = process.env.SEED_ADMIN_PASSWORD || 'password123';
                const passwordHash = await bcrypt.hash(adminPass, 10);
                const newAdmin = this.userRepository.create({
                    name: 'System Admin',
                    email: 'admin@servertechcentral.com',
                    passwordHash,
                    role: user_entity_1.UserRole.SUPER_ADMIN
                });
                await this.userRepository.save(newAdmin);
                this.logger.log('Seeded default admin user.');
            }
            const salesUser = await this.userRepository.findOneBy({ email: 'sales@servertechcentral.com' });
            if (!salesUser) {
                const salesPass = process.env.SEED_SALES_PASSWORD || 'password123';
                const passwordHash = await bcrypt.hash(salesPass, 10);
                const newSalesUser = this.userRepository.create({
                    name: 'Alex Sales',
                    email: 'sales@servertechcentral.com',
                    passwordHash,
                    role: user_entity_1.UserRole.SALESPERSON,
                    target: 50000,
                    quarterlyTarget: 150000
                });
                await this.userRepository.save(newSalesUser);
                this.logger.log('Seeded default sales user.');
            }
        }
        catch (error) {
            this.logger.error('Failed to seed users', error);
        }
    }
    async findByEmail(email) {
        return this.userRepository.findOne({ where: { email }, select: ['id', 'name', 'email', 'passwordHash', 'role', 'permissions'] });
    }
    async findAll() {
        return this.userRepository.find({
            order: { role: 'ASC', name: 'ASC' }
        });
    }
    async updatePermissions(id, role, permissions) {
        const user = await this.userRepository.findOneBy({ id });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        user.role = role;
        user.permissions = permissions;
        return this.userRepository.save(user);
    }
    async createSalesperson(dto) {
        const existingUser = await this.userRepository.findOneBy({ email: dto.email });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const newUser = this.userRepository.create({
            name: dto.name,
            email: dto.email,
            passwordHash,
            role: user_entity_1.UserRole.SALESPERSON,
            target: 0,
            quarterlyTarget: 0
        });
        const savedUser = await this.userRepository.save(newUser);
        const { passwordHash: _ } = savedUser, result = __rest(savedUser, ["passwordHash"]);
        return result;
    }
    async createBuyer(name, email, password) {
        const existingUser = await this.userRepository.findOneBy({ email });
        if (existingUser) {
            throw new common_1.ConflictException('A user with this email already exists.');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = this.userRepository.create({
            name,
            email,
            passwordHash,
            role: user_entity_1.UserRole.BUYER,
            target: 0,
            quarterlyTarget: 0,
        });
        const savedUser = await this.userRepository.save(newUser);
        const { passwordHash: _ } = savedUser, result = __rest(savedUser, ["passwordHash"]);
        return result;
    }
    async findBuyers() {
        const buyers = await this.userRepository.find({
            where: { role: user_entity_1.UserRole.BUYER },
            select: ['id', 'name', 'email', 'role'],
            order: { name: 'ASC' },
        });
        return buyers;
    }
    async deleteBuyer(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (user.role !== user_entity_1.UserRole.BUYER)
            throw new common_1.BadRequestException('Only buyer accounts can be deleted');
        await this.userRepository.delete({ id });
        return { success: true };
    }
    async findSalespeopleWithSales() {
        const salespeople = await this.userRepository
            .createQueryBuilder('user')
            .leftJoin('user.createdOrders', 'order')
            .select('user.id', 'id')
            .addSelect('user.name', 'name')
            .addSelect('user.email', 'email')
            .addSelect('user.target', 'target')
            .addSelect('user.quarterly_target', 'quarterlyTarget')
            .addSelect('SUM(order.total)', 'totalSales')
            .where('user.role = :role', { role: user_entity_1.UserRole.SALESPERSON })
            .groupBy('user.id')
            .addGroupBy('user.name')
            .getRawMany();
        return salespeople.map(sp => (Object.assign(Object.assign({}, sp), { target: parseFloat(sp.target) || 0, quarterlyTarget: parseFloat(sp.quarterlyTarget) || 0, totalSales: parseFloat(sp.totalsales) || 0 })));
    }
    async updateTarget(id, dto) {
        const user = await this.userRepository.findOneBy({ id, role: user_entity_1.UserRole.SALESPERSON });
        if (!user) {
            throw new common_1.NotFoundException('Salesperson not found');
        }
        if (dto.monthlyTarget !== undefined)
            user.target = dto.monthlyTarget;
        if (dto.quarterlyTarget !== undefined)
            user.quarterlyTarget = dto.quarterlyTarget;
        return this.userRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map