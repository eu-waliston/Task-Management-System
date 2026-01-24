import { MongoClient, Db } from 'mongodb';
import { config } from './config';

export class Database {
    private static client: MongoClient;
    private static db: Db;

    static async connect(): Promise<void> {
        try {
            this.client = new MongoClient(config.database.url);
            await this.client.connect();
            console.log('Connected to mingoDB successfully');

        } catch (error) {
            console.error('Failed to COnnect to MongoDB', error);
            process.exit(1);
        }
    }

    static getCollection(CollectionName: string) {
        if (!this.db) {
            throw new Error('Database not initialized. Call connect() first');
        }
        return this.db.collection(CollectionName);
    }

    static async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            console.log('Disconnected from MongoDB')
        }
    }
}