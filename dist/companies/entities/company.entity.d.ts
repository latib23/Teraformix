import { User } from '../../users/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';
export declare class Company {
    id: string;
    name: string;
    taxId: string;
    creditLimit: number;
    isApproved: boolean;
    users: User[];
    orders: Order[];
}
