import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
export declare class CompaniesService {
    private companyRepository;
    constructor(companyRepository: Repository<Company>);
    findAll(): Promise<Company[]>;
}
