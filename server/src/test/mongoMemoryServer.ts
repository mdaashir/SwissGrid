import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export async function connectInMemoryMongo() {
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    return mongod;
}

export async function disconnectInMemoryMongo(mongod: MongoMemoryServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
}
