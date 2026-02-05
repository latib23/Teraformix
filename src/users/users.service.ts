
import { Injectable, Logger, NotFoundException, OnModuleInit, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateUserTargetDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) { }

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
      // Seeder for Admin and Sales users if they don't exist
      const admin = await this.userRepository.findOneBy({ email: 'admin@servertechcentral.com' });
      if (!admin) {
        const adminPass = process.env.SEED_ADMIN_PASSWORD || 'password123';
        const passwordHash = await bcrypt.hash(adminPass, 10);
        const newAdmin = this.userRepository.create({
          name: 'System Admin',
          email: 'admin@servertechcentral.com',
          passwordHash,
          role: UserRole.SUPER_ADMIN
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
          role: UserRole.SALESPERSON,
          target: 50000,
          quarterlyTarget: 150000
        });
        await this.userRepository.save(newSalesUser);
        this.logger.log('Seeded default sales user.');
      }
    } catch (error) {
      this.logger.error('Failed to seed users', error);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email }, select: ['id', 'name', 'email', 'passwordHash', 'role', 'permissions'] });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      order: { role: 'ASC', name: 'ASC' }
    });
  }

  async updatePermissions(id: string, role: UserRole, permissions: string[]): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');

    user.role = role;
    user.permissions = permissions;
    return this.userRepository.save(user);
  }

  async createSalesperson(dto: CreateSalespersonDto): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepository.findOneBy({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      role: UserRole.SALESPERSON,
      target: 0, // Default monthly target
      quarterlyTarget: 0
    });

    const savedUser = await this.userRepository.save(newUser);

    // Don't return the hash
    const { passwordHash: _, ...result } = savedUser;
    return result;
  }

  async createBuyer(name: string, email: string, password: string): Promise<Omit<User, 'passwordHash'>> {
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      name,
      email,
      passwordHash,
      role: UserRole.BUYER,
      target: 0,
      quarterlyTarget: 0,
    });
    const savedUser = await this.userRepository.save(newUser);
    const { passwordHash: _, ...result } = savedUser;
    return result;
  }

  async findBuyers(): Promise<Array<Pick<User, 'id' | 'name' | 'email' | 'role'>>> {
    const buyers = await this.userRepository.find({
      where: { role: UserRole.BUYER },
      select: ['id', 'name', 'email', 'role'],
      order: { name: 'ASC' },
    });
    return buyers;
  }

  async deleteBuyer(id: string): Promise<{ success: true }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.BUYER) throw new BadRequestException('Only buyer accounts can be deleted');
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
      .where('user.role = :role', { role: UserRole.SALESPERSON })
      .groupBy('user.id')
      .addGroupBy('user.name')
      .getRawMany();

    return salespeople.map(sp => ({
      ...sp,
      target: parseFloat(sp.target) || 0,
      quarterlyTarget: parseFloat(sp.quarterlyTarget) || 0,
      totalSales: parseFloat(sp.totalsales) || 0
    }));
  }

  async updateTarget(id: string, dto: UpdateUserTargetDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id, role: UserRole.SALESPERSON });
    if (!user) {
      throw new NotFoundException('Salesperson not found');
    }

    if (dto.monthlyTarget !== undefined) user.target = dto.monthlyTarget;
    if (dto.quarterlyTarget !== undefined) user.quarterlyTarget = dto.quarterlyTarget;

    return this.userRepository.save(user);
  }
}
