import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';
import { connectToDatabase } from './db/connection';

const fastify = Fastify({
    logger: true,
});

// Register plugins
fastify.register(cors, {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
});

fastify.register(helmet);

// Health check route
fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// API routes
fastify.get('/api/health', async () => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'SwissGrid API',
        version: '1.0.0',
    };
});

fastify.get('/api/hello', async () => {
    return {
        message: 'Hello from SwissGrid API!',
        tech: {
            server: 'Node.js 18 + Fastify',
            database: 'MongoDB',
            language: 'TypeScript',
        },
    };
});

// Start server
const start = async () => {
    try {
        // Connect to MongoDB
        await connectToDatabase();

        // Start the server
        await fastify.listen({ port: 5000, host: '0.0.0.0' });
        console.log('🚀 Server is running on http://localhost:5000');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
