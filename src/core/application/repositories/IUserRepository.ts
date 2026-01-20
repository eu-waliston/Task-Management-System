import { User,UserProps } from '../../damin/User';

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    create(user: UserProps): Promise<User>;
    update(id: string, user: Partial<UserProps>): Promise<User | null>;
    delete(id: string): Promise<boolean>;
}