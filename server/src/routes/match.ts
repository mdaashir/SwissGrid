import { FastifyInstance } from 'fastify';
import { Types } from 'mongoose';
import { Game } from '../models/game';
import { User } from '../models/user';

export default async function matchRoutes(fastify: FastifyInstance) {
    fastify.post('/api/match/create', async (request, reply) => {
        const { player1, player2 } = request.body as {
            player1: string;
            player2: string;
        };
        if (!player1 || !player2) {
            return reply
                .status(400)
                .send({ error: 'Both player1 and player2 are required' });
        }
        // Validate users exist
        const users = await User.find({ _id: { $in: [player1, player2] } });
        if (users.length !== 2) {
            return reply
                .status(404)
                .send({ error: 'One or both users not found' });
        }
        // Create game
        const game = await Game.create({
            players: [new Types.ObjectId(player1), new Types.ObjectId(player2)],
            // Standard initial PGN for a new chess game
            pgn: '[Event "Casual Game"]\n[Site "?"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n*',
            result: 'ongoing',
            moves: [],
        });
        return reply.send({ gameId: game._id });
    });
}
