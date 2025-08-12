// environment variables
import dotenv from 'dotenv';
dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const ORIGIN = process.env.ORIGIN?.split(',') || ['http://localhost:3000'];

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
// import { connectToDatabase } from './db/connection';
import { Server as SocketIOServer } from 'socket.io';

import { Types } from 'mongoose';
import matchRoutes from './routes/match';

const fastify = Fastify({ logger: true });

// Register match routes
matchRoutes(fastify);

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

    // Handle chess move event
    socket.on('move', async ({ gameId, uci, clock }) => {
        console.log(`[socket] move received: gameId=${gameId}, uci=${uci}`);
        // Import here to avoid circular deps
        const { Game: GameModel } = await import('./models/game.js');
        const { Move: MoveModel } = await import('./models/move.js');
        const { Game: ChessGame } = await import('./chess-engine/index.js');

        // Find game
        const game = await GameModel.findById(gameId).populate('moves');
        if (!game) {
            console.error(`[socket] Game not found: ${gameId}`);
            socket.emit('move_error', { error: 'Game not found' });
            return;
        }

        // Get last FEN or start position
        let fen = undefined;
        if (game.moves.length > 0) {
            // Need to fetch the last move document to get FEN
            const lastMoveId = game.moves[game.moves.length - 1];
            const lastMoveDoc = await MoveModel.findById(lastMoveId);
            fen = lastMoveDoc?.fen;
        }
        let chess;
        if (!fen) {
            chess = new ChessGame();
        } else {
            chess = new ChessGame(fen);
        }

        // Parse UCI move
        // Assume uci is like 'e2e4' or 'e7e8q'
        const from = uci.slice(0, 2);
        const to = uci.slice(2, 4);
        const promotion = uci.length > 4 ? uci[4] : undefined;
        // Convert algebraic to square index
        const { algebraicToSquare } = await import('./chess-engine/index.js');
        const fromSq = algebraicToSquare(from);
        const toSq = algebraicToSquare(to);
        // Map promotion char to PieceType enum value
        let promotionType = undefined;
        if (promotion) {
            switch (promotion.toLowerCase()) {
                case 'q':
                    promotionType = 4;
                    break; // QUEEN
                case 'r':
                    promotionType = 3;
                    break; // ROOK
                case 'b':
                    promotionType = 2;
                    break; // BISHOP
                case 'n':
                    promotionType = 1;
                    break; // KNIGHT
            }
        }
        const pieceType = chess.getPieceAt(fromSq)?.type;
        if (pieceType === undefined) {
            console.error(
                `[socket] No piece at source square for move: ${uci}`
            );
            socket.emit('move_error', { error: 'No piece at source square' });
            return;
        }
        const move = {
            from: fromSq,
            to: toSq,
            piece: pieceType,
            promotion: promotionType,
        };
        // Validate and make move
        if (!chess.makeMove(move)) {
            console.error(`[socket] Illegal move: ${uci}`);
            socket.emit('move_error', { error: 'Illegal move' });
            return;
        }
        const newFen = chess.toFen();
        // Save move to DB
        const moveDoc = await MoveModel.create({
            uci,
            fen: newFen,
            moveNumber: game.moves.length + 1,
            createdAt: new Date(),
        });
        // Directly push moveDoc._id (already ObjectId)
        // Use ObjectId type for moveDoc._id
        game.moves.push(moveDoc._id as Types.ObjectId);
        await game.save();
        // Emit to both players

        console.log(`[socket] Emitting move to room ${gameId}: ${uci}`);
        io.to(gameId).emit('move', {
            fen: newFen,
            move: uci,
            clock, // send updated clock if provided
        });
    });

    // Join game room
    socket.on('join_game', ({ gameId }) => {
        console.log(
            `[socket] join_game: socket ${socket.id} joining room ${gameId}`
        );
        socket.join(gameId);
        // Optionally, emit an ack event
        socket.emit('join_game');
    });
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
