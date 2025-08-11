import mongoose from 'mongoose';
import { Game } from '../models/game';
import { Move } from '../models/move';
import { Tournament } from '../models/tournament';
import { User } from '../models/user';
import {
    connectInMemoryMongo,
    disconnectInMemoryMongo,
} from './mongoMemoryServer';

describe('Mongoose Models', () => {
    let mongod: any;

    beforeAll(async () => {
        mongod = await connectInMemoryMongo();
    });

    afterAll(async () => {
        await disconnectInMemoryMongo(mongod);
    });

    afterEach(async () => {
        if (mongoose.connection.db) {
            await mongoose.connection.db.dropDatabase();
        }
    });

    it('creates a User', async () => {
        const user = await User.create({
            handle: 'alice',
            email: 'alice@example.com',
            elo: 1500,
        });
        expect(user.handle).toBe('alice');
        expect(user.elo).toBe(1500);
        expect(user.email).toBe('alice@example.com');
    });

    it('creates a Move', async () => {
        const move = await Move.create({
            uci: 'e2e4',
            fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1',
            moveNumber: 1,
        });
        expect(move.uci).toBe('e2e4');
        expect(move.moveNumber).toBe(1);
    });

    it('creates a Game', async () => {
        const user1 = await User.create({
            handle: 'bob',
            email: 'bob@example.com',
        });
        const user2 = await User.create({
            handle: 'carol',
            email: 'carol@example.com',
        });
        const move = await Move.create({
            uci: 'e2e4',
            fen: 'fen',
            moveNumber: 1,
        });
        const game = await Game.create({
            players: [user1._id, user2._id],
            pgn: '1. e4',
            result: 'ongoing',
            moves: [move._id],
        });
        expect(game.players).toHaveLength(2);
        expect(game.pgn).toBe('1. e4');
        expect(game.moves).toHaveLength(1);
    });

    it('creates a Tournament', async () => {
        const user = await User.create({
            handle: 'dave',
            email: 'dave@example.com',
        });
        const tournament = await Tournament.create({
            type: 'arena',
            round: 1,
            entries: [user._id],
        });
        expect(tournament.type).toBe('arena');
        expect(tournament.entries).toHaveLength(1);
    });
});
