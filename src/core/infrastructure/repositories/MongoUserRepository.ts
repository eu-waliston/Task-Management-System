import { User, UserProps, UserRole } from '../../domain/User';
import { IUserRepository } from '../../application/repositories/IUserRepository';
import { Database } from '../../../config/database';
import { User, User, User, User, UserProps } from '../../damin/User';

export class MongoUserRepository implements IUserRepository {
    private collection;

    constructor() {
        this.collection = Database.getCollection('users');
    }

    async findById(id: string): Promise<User | null> {
        const userDoc = await this.collection.findOne({ id });
        return userDoc ? new User(userDoc) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const userDoc = await this.collection.findOne({ email });
        return userDoc ? new User(userDoc) : null;
    }

    async findAll(): Promise<User[]> {
        const userDocs = await this.collection.find().toArray();
        return userDocs.map(doc => new User(doc));
    }

    async create(userProps: UserProps): Promise<User> {
        const user = new User(userProps);
        await this.collection.insertOne(user);
        return user;
    }

    async update(id: string, userProps: Partial<UserProps>): Promise<User | null> {
        const result = await this.collection.findOneAndUpdate(
            {id},
            {$set: {...userProps, updateAt: new Date()}},
            {returnDocument: 'after'}
        )

        return result ? new User(result) : null;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ id });
        return result.deletedCount > 0;
    }
}