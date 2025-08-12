import Fastify, {
    FastifyBaseLogger,
    FastifyInstance,
    FastifyTypeProviderDefault,
    RawServerDefault,
} from 'fastify';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { DefaultEventsMap, Server as SocketIOServer } from 'socket.io';
import Client from 'socket.io-client';
import { User } from '../models/user';
import matchRoutes from '../routes/match';
import { registerSocketHandlers } from '../socketHandlers';
import {
    connectInMemoryMongo,
    disconnectInMemoryMongo,
} from './mongoMemoryServer';

let fastify: FastifyInstance<
        RawServerDefault,
        IncomingMessage,
        ServerResponse<IncomingMessage>,
        FastifyBaseLogger,
        FastifyTypeProviderDefault
    >,
    mongod: MongoMemoryServer,
    httpServer:
        | number
        | Server<typeof IncomingMessage, typeof ServerResponse>
        | undefined,
    io: SocketIOServer<
        DefaultEventsMap,
        DefaultEventsMap,
        DefaultEventsMap,
        any
    >;

beforeAll(async () => {
    mongod = await connectInMemoryMongo();
    fastify = Fastify();
    await matchRoutes(fastify);
    httpServer = createServer(fastify.server);
    io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
    registerSocketHandlers(io);
    await new Promise<void>(resolve =>
        (httpServer as Server).listen(0, () => resolve())
    );
});

afterAll(async () => {
    await fastify.close();
    io.close();
    if (httpServer) {
        await new Promise(resolve => (httpServer as Server).close(resolve));
    }
    await disconnectInMemoryMongo(mongod);
});

test('integration: create match and move via socket', async () => {
    // Create users
    const user1 = await User.create({ handle: 'p1', email: 'p1@x.com' });
    const user2 = await User.create({ handle: 'p2', email: 'p2@x.com' });
    // Create match
    const res = await fastify.inject({
        method: 'POST',
        url: '/api/match/create',
        payload: { player1: user1._id, player2: user2._id },
    });
    const matchResponse = res.json();
    // console.log('match creation response:', matchResponse);
    const { gameId } = matchResponse;
    // Connect sockets
    const address = (httpServer as Server).address();
    if (!address || typeof address !== 'object') {
        throw new Error('Could not get server address');
    }
    const port = address.port;
    const url = `http://localhost:${port}`;
    await new Promise((resolve, reject) => {
        const socket1 = Client(url);
        const socket2 = Client(url);
        let moveReceived = false;
        let joined1 = false;
        let joined2 = false;
        function trySendMove() {
            if (joined1 && joined2) {
                // console.log('Both sockets joined, sending move from socket2');
                socket2.emit('move', {
                    gameId,
                    uci: 'e2e4',
                    clock: { white: 300, black: 300 },
                });
            }
        }
        socket1.on('connect', () => {
            // console.log('socket1 connected');
            socket1.emit('join_game', { gameId });
        });
        socket2.on('connect', () => {
            // console.log('socket2 connected');
            socket2.emit('join_game', { gameId });
        });
        socket1.on('move', data => {
            try {
                // console.log('socket1 received move:', data);
                expect(data.fen).toBeDefined();
                expect(data.move).toBe('e2e4');
                moveReceived = true;
                socket1.close();
                socket2.close();
                resolve(null);
            } catch (err) {
                reject(err);
            }
        });
        socket2.on('move', data => {
            try {
                // console.log('socket2 received move:', data);
                expect(data).toBeDefined();
                // Not asserting here, just logging for debug
            } catch (err) {
                // console.error('Error in socket2 move handler:', err);
                socket1.close();
                socket2.close();
                reject(err);
            }
        });
        socket1.on('move_error', err => {
            // console.error('socket1 received move_error:', err);
            socket1.close();
            socket2.close();
            reject(new Error('Move error: ' + JSON.stringify(err)));
        });
        socket2.on('move_error', err => {
            // console.error('socket2 received move_error:', err);
            socket1.close();
            socket2.close();
            reject(new Error('Move error: ' + JSON.stringify(err)));
        });
        socket1.on('join_game', () => {
            // console.log('socket1 received join_game');
            joined1 = true;
            trySendMove();
        });
        socket2.on('join_game', () => {
            // console.log('socket2 received join_game');
            joined2 = true;
            trySendMove();
        });
        // Fallback: if join_game is not emitted by server, fallback to connect
        setTimeout(() => {
            if (!joined1) {
                // console.log('socket1 join_game fallback');
                joined1 = true;
                trySendMove();
            }
            if (!joined2) {
                // console.log('socket2 join_game fallback');
                joined2 = true;
                trySendMove();
            }
        }, 500);
        setTimeout(() => {
            if (!moveReceived) {
                // console.error('Move event not received in time');
                socket1.close();
                socket2.close();
                reject(new Error('Move event not received in time'));
            }
        }, 8000);
    });
}, 10000);
