// environment variables
import dotenv from 'dotenv';
dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const ORIGIN = process.env.ORIGIN?.split(',') || ['http://localhost:3000'];

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
// import { connectToDatabase } from './db/connection';
import { Server as SocketIOServer } from 'socket.io';

const fastify = Fastify({ logger: true });

// Security headers
fastify.register(helmet);

// CORS
fastify.register(cors, { origin: ORIGIN });

// Swagger/OpenAPI v3
fastify.register(fastifySwagger, {
    openapi: {
        info: {
            title: 'SwissGrid API',
            description: 'API documentation for SwissGrid',
            version: '1.0.0',
        },
        servers: [{ url: `http://${HOST}:${PORT}` }],
    },
});

// Swagger UI at /docs
fastify.register(fastifySwaggerUi, { routePrefix: '/docs' });

// Health check endpoint
fastify.get(
    '/health',
    {
        schema: {
            description: 'Basic health check',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string', format: 'date-time' },
                    },
                },
            },
        },
    },
    async () => {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
);

// API health check
fastify.get(
    '/api/health',
    {
        schema: {
            description: 'API health check',
            tags: ['Health'],
            response: {
                200: {
                    type: 'object',
                    properties: { status: { type: 'string' } },
                },
            },
        },
    },
    async () => {
        return { status: 'ok' };
    }
);

// Attach Socket.IO to Fastify server
const io = new SocketIOServer(fastify.server, { cors: { origin: ORIGIN } });
io.on('connection', socket => {
    socket.on('ping', () => socket.emit('pong'));
});

// Start the server
const start = async () => {
    try {
        // Connect to MongoDB
        // await connectToDatabase();

        // Start listening
        await fastify.listen({ port: PORT, host: HOST });

        fastify.log.info(`Server listening on http://${HOST}:${PORT}`);
        fastify.log.info(`Swagger docs at http://${HOST}:${PORT}/docs`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
