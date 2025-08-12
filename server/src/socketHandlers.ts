import { Types } from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { Game as ChessGame, algebraicToSquare } from './chess-engine/index';
import { Game as GameModel } from './models/game';
import { Move as MoveModel } from './models/move';

export function registerSocketHandlers(io: SocketIOServer) {
    io.on('connection', socket => {
        socket.on('ping', () => socket.emit('pong'));

        // Handle chess move event
        socket.on('move', async ({ gameId, uci, clock }) => {
            console.log(`[socket] move received: gameId=${gameId}, uci=${uci}`);
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
            const from = uci.slice(0, 2);
            const to = uci.slice(2, 4);
            const promotion = uci.length > 4 ? uci[4] : undefined;
            const fromSq = algebraicToSquare(from);
            const toSq = algebraicToSquare(to);
            let promotionType = undefined;
            if (promotion) {
                switch (promotion.toLowerCase()) {
                    case 'q':
                        promotionType = 4;
                        break;
                    case 'r':
                        promotionType = 3;
                        break;
                    case 'b':
                        promotionType = 2;
                        break;
                    case 'n':
                        promotionType = 1;
                        break;
                }
            }
            const pieceType = chess.getPieceAt(fromSq)?.type;
            if (pieceType === undefined) {
                console.error(
                    `[socket] No piece at source square for move: ${uci}`
                );
                socket.emit('move_error', {
                    error: 'No piece at source square',
                });
                return;
            }
            const move = {
                from: fromSq,
                to: toSq,
                piece: pieceType,
                promotion: promotionType,
            };
            if (!chess.makeMove(move)) {
                console.error(`[socket] Illegal move: ${uci}`);
                socket.emit('move_error', { error: 'Illegal move' });
                return;
            }
            const newFen = chess.toFen();
            const moveDoc = await MoveModel.create({
                uci,
                fen: newFen,
                moveNumber: game.moves.length + 1,
                createdAt: new Date(),
            });
            game.moves.push(moveDoc._id as Types.ObjectId);
            await game.save();
            console.log(`[socket] Emitting move to room ${gameId}: ${uci}`);
            io.to(gameId).emit('move', {
                fen: newFen,
                move: uci,
                clock,
            });
        });

        // Join game room
        socket.on('join_game', ({ gameId }) => {
            console.log(
                `[socket] join_game: socket ${socket.id} joining room ${gameId}`
            );
            socket.join(gameId);
            socket.emit('join_game');
        });
    });
}
