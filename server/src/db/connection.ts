import { Db, MongoClient } from 'mongodb';

let client: MongoClient;
let db: Db;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'swissgrid';

export const connectToDatabase = async (): Promise<Db> => {
    try {
        if (!client) {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            console.log('📊 Connected to MongoDB');
        }

        if (!db) {
            db = client.db(DB_NAME);
        }

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
};

export const getDatabase = (): Db => {
    if (!db) {
        throw new Error(
            'Database not initialized. Call connectToDatabase first.'
        );
    }
    return db;
};

export const closeConnection = async (): Promise<void> => {
    if (client) {
        await client.close();
        console.log('📊 Disconnected from MongoDB');
    }
};
