/**
 * Chess Engine Tests
 * Comprehensive test suite for chess game engine including legal/illegal moves,
 * Scholar's Mate, stalemate, threefold repetition, and more
 */

import { algebraicToSquare } from '../bitboard';
import { Game } from '../game';
import { Color, GameResult, PieceType, Square } from '../types';

describe('Chess Game Engine', () => {
    let game: Game;

    beforeEach(() => {
        game = new Game();
    });

    describe('Initial Position', () => {
        test('should start with correct initial position', () => {
            expect(game.getActiveColor()).toBe(Color.WHITE);
            expect(game.isInCheck()).toBe(false);
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });

        test('should have all pieces in starting positions', () => {
            // White pieces
            expect(game.getPieceAt(Square.A1)).toEqual({
                type: PieceType.ROOK,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.B1)).toEqual({
                type: PieceType.KNIGHT,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.C1)).toEqual({
                type: PieceType.BISHOP,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.D1)).toEqual({
                type: PieceType.QUEEN,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.E1)).toEqual({
                type: PieceType.KING,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.F1)).toEqual({
                type: PieceType.BISHOP,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.G1)).toEqual({
                type: PieceType.KNIGHT,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.H1)).toEqual({
                type: PieceType.ROOK,
                color: Color.WHITE,
            });

            // White pawns
            for (let file = 0; file < 8; file++) {
                const square = file + 8; // Second rank
                expect(game.getPieceAt(square as Square)).toEqual({
                    type: PieceType.PAWN,
                    color: Color.WHITE,
                });
            }

            // Black pieces
            expect(game.getPieceAt(Square.A8)).toEqual({
                type: PieceType.ROOK,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.B8)).toEqual({
                type: PieceType.KNIGHT,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.C8)).toEqual({
                type: PieceType.BISHOP,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.D8)).toEqual({
                type: PieceType.QUEEN,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.E8)).toEqual({
                type: PieceType.KING,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.F8)).toEqual({
                type: PieceType.BISHOP,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.G8)).toEqual({
                type: PieceType.KNIGHT,
                color: Color.BLACK,
            });
            expect(game.getPieceAt(Square.H8)).toEqual({
                type: PieceType.ROOK,
                color: Color.BLACK,
            });

            // Black pawns
            for (let file = 0; file < 8; file++) {
                const square = file + 48; // Seventh rank
                expect(game.getPieceAt(square as Square)).toEqual({
                    type: PieceType.PAWN,
                    color: Color.BLACK,
                });
            }
        });

        test('should generate correct initial legal moves', () => {
            const legalMoves = game.getLegalMoves();
            expect(legalMoves).toHaveLength(20); // 16 pawn moves + 4 knight moves
        });
    });

    describe('Basic Move Validation', () => {
        test('should allow legal pawn moves', () => {
            const move = {
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            };
            expect(game.makeMove(move)).toBe(true);
            expect(game.getActiveColor()).toBe(Color.BLACK);
        });

        test('should reject illegal moves', () => {
            const illegalMove = {
                from: Square.E2,
                to: Square.E5, // Can't move pawn 3 squares
                piece: PieceType.PAWN,
            };
            expect(game.makeMove(illegalMove)).toBe(false);
            expect(game.getActiveColor()).toBe(Color.WHITE); // Should not change
        });

        test('should reject moves from empty squares', () => {
            const move = {
                from: Square.E4, // Empty square
                to: Square.E5,
                piece: PieceType.PAWN,
            };
            expect(game.makeMove(move)).toBe(false);
        });

        test('should reject moves to squares occupied by own pieces', () => {
            const move = {
                from: Square.B1,
                to: Square.C3,
                piece: PieceType.KNIGHT,
            };
            game.makeMove(move);

            const illegalMove = {
                from: Square.G1,
                to: Square.C3, // Occupied by own knight
                piece: PieceType.KNIGHT,
            };
            expect(game.makeMove(illegalMove)).toBe(false);
        });
    });

    describe('Piece Movement Rules', () => {
        test('should allow knight L-shaped moves', () => {
            const moves = [
                { from: Square.B1, to: Square.C3, piece: PieceType.KNIGHT },
                { from: Square.G8, to: Square.F6, piece: PieceType.KNIGHT },
            ];

            for (const move of moves) {
                expect(game.makeMove(move)).toBe(true);
            }
        });

        test('should allow bishop diagonal moves', () => {
            // Open diagonal for bishop
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            });

            const bishopMove = {
                from: Square.F1,
                to: Square.C4,
                piece: PieceType.BISHOP,
            };
            expect(game.makeMove(bishopMove)).toBe(true);
        });

        test('should allow rook straight moves', () => {
            // Open file for rook
            game.makeMove({
                from: Square.A2,
                to: Square.A4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.A7,
                to: Square.A5,
                piece: PieceType.PAWN,
            });

            const rookMove = {
                from: Square.A1,
                to: Square.A3,
                piece: PieceType.ROOK,
            };
            expect(game.makeMove(rookMove)).toBe(true);
        });

        test('should allow queen multiple direction moves', () => {
            // Open diagonal for queen
            game.makeMove({
                from: Square.D2,
                to: Square.D4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.D7,
                to: Square.D5,
                piece: PieceType.PAWN,
            });

            const queenMove = {
                from: Square.D1,
                to: Square.D3,
                piece: PieceType.QUEEN,
            };
            expect(game.makeMove(queenMove)).toBe(true);
        });

        test('should allow king one square moves', () => {
            // Open space for king
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            });

            const kingMove = {
                from: Square.E1,
                to: Square.E2,
                piece: PieceType.KING,
            };
            expect(game.makeMove(kingMove)).toBe(true);
        });
    });

    describe('Castling', () => {
        test('should allow king-side castling when conditions are met', () => {
            // Clear squares between king and rook
            // Move 1: Clear the knight
            game.makeMove({
                from: Square.G1,
                to: Square.F3,
                piece: PieceType.KNIGHT,
            });

            // Move 2: Black pawn move
            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            });

            // Move 3: Clear a path for the bishop by moving the pawn
            game.makeMove({
                from: Square.E2,
                to: Square.E3,
                piece: PieceType.PAWN,
            });

            // Move 4: Black pawn move
            game.makeMove({
                from: Square.D7,
                to: Square.D5,
                piece: PieceType.PAWN,
            });

            // Move 5: Now move the bishop
            game.makeMove({
                from: Square.F1,
                to: Square.E2,
                piece: PieceType.BISHOP,
            });

            // Move 6: Black pawn move
            game.makeMove({
                from: Square.C7,
                to: Square.C5,
                piece: PieceType.PAWN,
            });

            const castlingMove = {
                from: Square.E1,
                to: Square.G1,
                piece: PieceType.KING,
                isCastling: true,
                isKingSide: true,
            };
            expect(game.makeMove(castlingMove)).toBe(true);

            // Check that rook also moved
            expect(game.getPieceAt(Square.F1)).toEqual({
                type: PieceType.ROOK,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.H1)).toBe(null);
        });

        test('should not allow castling when king has moved', () => {
            // Move king and back
            game.makeMove({
                from: Square.E1,
                to: Square.E2,
                piece: PieceType.KING,
            });
            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.E2,
                to: Square.E1,
                piece: PieceType.KING,
            });
            game.makeMove({
                from: Square.D7,
                to: Square.D5,
                piece: PieceType.PAWN,
            });

            // Clear squares for castling
            game.makeMove({
                from: Square.G1,
                to: Square.F3,
                piece: PieceType.KNIGHT,
            });
            game.makeMove({
                from: Square.B8,
                to: Square.C6,
                piece: PieceType.KNIGHT,
            });
            game.makeMove({
                from: Square.F1,
                to: Square.E2,
                piece: PieceType.BISHOP,
            });
            game.makeMove({
                from: Square.G8,
                to: Square.F6,
                piece: PieceType.KNIGHT,
            });

            const castlingMove = {
                from: Square.E1,
                to: Square.G1,
                piece: PieceType.KING,
                isCastling: true,
                isKingSide: true,
            };
            expect(game.makeMove(castlingMove)).toBe(false);
        });

        test('should not allow castling through check', () => {
            // Set up position where king would pass through check
            game.loadFromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');

            // Place enemy rook attacking f1
            game.loadFromFen('r3k2r/8/8/8/8/8/8/R2rK2R w KQkq - 0 1');

            const castlingMove = {
                from: Square.E1,
                to: Square.G1,
                piece: PieceType.KING,
                isCastling: true,
                isKingSide: true,
            };
            expect(game.makeMove(castlingMove)).toBe(false);
        });
    });

    describe('En Passant', () => {
        test('should allow en passant capture', () => {
            // Set up en passant scenario
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.A7,
                to: Square.A6,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.E4,
                to: Square.E5,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.F7,
                to: Square.F5,
                piece: PieceType.PAWN,
            }); // Two-square move

            const enPassantMove = {
                from: Square.E5,
                to: Square.F6,
                piece: PieceType.PAWN,
                captured: PieceType.PAWN,
                isEnPassant: true,
            };
            expect(game.makeMove(enPassantMove)).toBe(true);

            // Check that captured pawn is removed
            expect(game.getPieceAt(Square.F5)).toBe(null);
            expect(game.getPieceAt(Square.F6)).toEqual({
                type: PieceType.PAWN,
                color: Color.WHITE,
            });
        });

        test('should not allow en passant after intervening move', () => {
            // Set up en passant scenario
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.A7,
                to: Square.A6,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.E4,
                to: Square.E5,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.F7,
                to: Square.F5,
                piece: PieceType.PAWN,
            }); // Two-square move
            game.makeMove({
                from: Square.B1,
                to: Square.C3,
                piece: PieceType.KNIGHT,
            }); // Intervening move
            game.makeMove({
                from: Square.B8,
                to: Square.C6,
                piece: PieceType.KNIGHT,
            });

            const enPassantMove = {
                from: Square.E5,
                to: Square.F6,
                piece: PieceType.PAWN,
                captured: PieceType.PAWN,
                isEnPassant: true,
            };
            expect(game.makeMove(enPassantMove)).toBe(false);
        });
    });

    describe('Pawn Promotion', () => {
        test('should require promotion when pawn reaches end rank', () => {
            // Set up pawn near promotion with kings on the board
            game.loadFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

            const promotionMove = {
                from: Square.A7,
                to: Square.A8,
                piece: PieceType.PAWN,
                promotion: PieceType.QUEEN,
            };
            expect(game.makeMove(promotionMove)).toBe(true);
            expect(game.getPieceAt(Square.A8)).toEqual({
                type: PieceType.QUEEN,
                color: Color.WHITE,
            });
        });

        test('should allow promotion to different pieces', () => {
            const promotionPieces = [
                PieceType.QUEEN,
                PieceType.ROOK,
                PieceType.BISHOP,
                PieceType.KNIGHT,
            ];

            for (const promotionPiece of promotionPieces) {
                const testGame = new Game();
                testGame.loadFromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');

                const promotionMove = {
                    from: Square.A7,
                    to: Square.A8,
                    piece: PieceType.PAWN,
                    promotion: promotionPiece,
                };
                expect(testGame.makeMove(promotionMove)).toBe(true);
                expect(testGame.getPieceAt(Square.A8)).toEqual({
                    type: promotionPiece,
                    color: Color.WHITE,
                });
            }
        });
    });

    describe("Scholar's Mate", () => {
        test("should detect Scholar's Mate checkmate", () => {
            // Scholar's Mate sequence
            const moves = [
                { from: Square.E2, to: Square.E4, piece: PieceType.PAWN },
                { from: Square.E7, to: Square.E5, piece: PieceType.PAWN },
                { from: Square.F1, to: Square.C4, piece: PieceType.BISHOP },
                { from: Square.B8, to: Square.C6, piece: PieceType.KNIGHT },
                { from: Square.D1, to: Square.H5, piece: PieceType.QUEEN },
                { from: Square.G8, to: Square.F6, piece: PieceType.KNIGHT },
                {
                    from: Square.H5,
                    to: Square.F7,
                    piece: PieceType.QUEEN,
                    captured: PieceType.PAWN,
                },
            ];

            for (const move of moves) {
                expect(game.makeMove(move)).toBe(true);
            }

            expect(game.isCheckmate()).toBe(true);
            expect(game.getGameResult()).toBe(GameResult.WHITE_WINS);
        });

        test('should detect check but not checkmate when king can escape', () => {
            // Simple check scenario where king has clear escape
            const moves = [
                { from: Square.E2, to: Square.E4, piece: PieceType.PAWN },
                { from: Square.E7, to: Square.E5, piece: PieceType.PAWN },
                { from: Square.D1, to: Square.H5, piece: PieceType.QUEEN }, // Queen to h5
                { from: Square.B8, to: Square.C6, piece: PieceType.KNIGHT }, // Knight development
                {
                    from: Square.H5,
                    to: Square.E5,
                    piece: PieceType.QUEEN,
                    captured: PieceType.PAWN,
                }, // Queen takes pawn on e5 with check
            ];

            for (const move of moves) {
                expect(game.makeMove(move)).toBe(true);
            }

            // Black king is in check but can escape (has legal moves)
            expect(game.isInCheck()).toBe(true);
            expect(game.isCheckmate()).toBe(false);
        });
    });

    describe('Stalemate', () => {
        test('should detect stalemate when no legal moves but not in check', () => {
            // Stalemate position: Black king in corner with white queen creating stalemate
            // King on a8, Queen on c7, this creates stalemate for black
            game.loadFromFen('k7/2Q5/8/8/8/8/8/7K b - - 0 1');

            expect(game.isInCheck()).toBe(false);
            expect(game.getLegalMoves()).toHaveLength(0);
            expect(game.isStalemate()).toBe(true);
            expect(game.getGameResult()).toBe(GameResult.STALEMATE);
        });

        test('should not detect stalemate when in check', () => {
            // Simple checkmate position that should be working
            // Use a known working checkmate pattern from the Scholar's Mate test
            game.loadFromFen(
                'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'
            );

            expect(game.isInCheck()).toBe(true);
            expect(game.isStalemate()).toBe(false);
            expect(game.isCheckmate()).toBe(true);
        });
    });

    describe('Threefold Repetition', () => {
        test('should detect threefold repetition', () => {
            // Create a position that can be repeated
            const repetitiveMoves = [
                { from: Square.G1, to: Square.F3, piece: PieceType.KNIGHT },
                { from: Square.G8, to: Square.F6, piece: PieceType.KNIGHT },
                { from: Square.F3, to: Square.G1, piece: PieceType.KNIGHT },
                { from: Square.F6, to: Square.G8, piece: PieceType.KNIGHT },
            ];

            // Repeat the sequence 3 times
            for (let i = 0; i < 3; i++) {
                for (const move of repetitiveMoves) {
                    game.makeMove(move);
                }
            }

            expect(game.getGameResult()).toBe(GameResult.THREEFOLD_REPETITION);
        });

        test('should not detect repetition for similar but different positions', () => {
            // Test case: After king moves, castling rights are lost, so positions should be different

            // First, move pieces to create space for king movement
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            }); // e4
            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            }); // e5

            // Knight development to prepare for king moves
            game.makeMove({
                from: Square.G1,
                to: Square.F3,
                piece: PieceType.KNIGHT,
            }); // Nf3
            game.makeMove({
                from: Square.G8,
                to: Square.F6,
                piece: PieceType.KNIGHT,
            }); // Nf6

            // Bishop moves to make room for king
            game.makeMove({
                from: Square.F1,
                to: Square.E2,
                piece: PieceType.BISHOP,
            }); // Be2
            game.makeMove({
                from: Square.F8,
                to: Square.E7,
                piece: PieceType.BISHOP,
            }); // Be7

            // Now the king can move to F1 - this should lose castling rights
            expect(
                game.makeMove({
                    from: Square.E1,
                    to: Square.F1,
                    piece: PieceType.KING,
                })
            ).toBe(true); // Kf1 (loses castling)

            game.makeMove({
                from: Square.F6,
                to: Square.G8,
                piece: PieceType.KNIGHT,
            }); // Ng8

            expect(
                game.makeMove({
                    from: Square.F1,
                    to: Square.E1,
                    piece: PieceType.KING,
                })
            ).toBe(true); // Ke1

            game.makeMove({
                from: Square.G8,
                to: Square.F6,
                piece: PieceType.KNIGHT,
            }); // Nf6

            // Return to the earlier position with knight moves
            game.makeMove({
                from: Square.F3,
                to: Square.G1,
                piece: PieceType.KNIGHT,
            }); // Ng1
            game.makeMove({
                from: Square.F6,
                to: Square.G8,
                piece: PieceType.KNIGHT,
            }); // Ng8

            // Even though we're back to a similar position, castling rights were lost
            // so it shouldn't be threefold repetition
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });
    });

    describe('Fifty-Move Rule', () => {
        test('should detect fifty-move rule', () => {
            // Set up position with only kings and a few pieces
            game.loadFromFen('8/8/8/4k3/8/8/4K3/8 w - - 99 1');

            // Make one more move without pawn move or capture
            game.makeMove({
                from: Square.E2,
                to: Square.F2,
                piece: PieceType.KING,
            });

            expect(game.getGameResult()).toBe(GameResult.FIFTY_MOVE_RULE);
        });

        test('should reset fifty-move counter on pawn move', () => {
            // Set up position with pawn
            game.loadFromFen('8/8/8/4k3/8/8/4KP2/8 w - - 49 1');

            // Move pawn - should reset counter
            game.makeMove({
                from: Square.F2,
                to: Square.F3,
                piece: PieceType.PAWN,
            });

            expect(game.getGameState().halfmoveClock).toBe(0);
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });

        test('should reset fifty-move counter on capture', () => {
            // Set up position where white king can safely capture an isolated rook
            game.loadFromFen('8/4q3/8/4k3/8/8/8/4Kr2 w - - 49 1');

            // Capture piece - should reset counter (king captures rook)
            game.makeMove({
                from: Square.E1,
                to: Square.F1,
                piece: PieceType.KING,
                captured: PieceType.ROOK,
            });

            expect(game.getGameState().halfmoveClock).toBe(0);
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });
    });

    describe('Insufficient Material', () => {
        test('should detect insufficient material - King vs King', () => {
            game.loadFromFen('8/8/8/4k3/8/8/4K3/8 w - - 0 1');
            expect(game.getGameResult()).toBe(GameResult.INSUFFICIENT_MATERIAL);
        });

        test('should detect insufficient material - King + Knight vs King', () => {
            game.loadFromFen('8/8/8/4k3/8/8/4KN2/8 w - - 0 1');
            expect(game.getGameResult()).toBe(GameResult.INSUFFICIENT_MATERIAL);
        });

        test('should detect insufficient material - King + Bishop vs King', () => {
            game.loadFromFen('8/8/8/4k3/8/8/4KB2/8 w - - 0 1');
            expect(game.getGameResult()).toBe(GameResult.INSUFFICIENT_MATERIAL);
        });

        test('should not detect insufficient material with pawns', () => {
            game.loadFromFen('8/8/8/4k3/8/8/4KP2/8 w - - 0 1');
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });

        test('should not detect insufficient material with queens', () => {
            game.loadFromFen('8/8/8/4k3/8/8/4KQ2/8 w - - 0 1');
            expect(game.getGameResult()).toBe(GameResult.IN_PROGRESS);
        });
    });

    describe('FEN Loading and Export', () => {
        test('should load position from FEN correctly', () => {
            const fen =
                'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
            game.loadFromFen(fen);

            expect(game.getActiveColor()).toBe(Color.BLACK);
            expect(game.getPieceAt(Square.E4)).toEqual({
                type: PieceType.PAWN,
                color: Color.WHITE,
            });
            expect(game.getGameState().enPassantTarget).toBe(
                algebraicToSquare('e3')
            );
        });

        test('should export position to FEN correctly', () => {
            const originalFen =
                'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
            game.loadFromFen(originalFen);
            const exportedFen = game.toFen();

            expect(exportedFen).toBe(originalFen);
        });

        test('should handle complex FEN positions', () => {
            const complexFen =
                'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 4 4';
            game.loadFromFen(complexFen);

            expect(game.toFen()).toBe(complexFen);
            expect(game.getGameState().halfmoveClock).toBe(4);
            expect(game.getGameState().fullmoveNumber).toBe(4);
        });
    });

    describe('Move History and Game State', () => {
        test('should track move history correctly', () => {
            const moves = [
                { from: Square.E2, to: Square.E4, piece: PieceType.PAWN },
                { from: Square.E7, to: Square.E5, piece: PieceType.PAWN },
                { from: Square.G1, to: Square.F3, piece: PieceType.KNIGHT },
            ];

            for (const move of moves) {
                game.makeMove(move);
            }

            const history = game.getMoveHistory();
            expect(history).toHaveLength(3);
            expect(history[0]).toEqual(moves[0]);
            expect(history[1]).toEqual(moves[1]);
            expect(history[2]).toEqual(moves[2]);
        });

        test('should update game state correctly after moves', () => {
            // Test fullmove counter
            expect(game.getGameState().fullmoveNumber).toBe(1);

            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            expect(game.getGameState().fullmoveNumber).toBe(1); // Still move 1 after white's move

            game.makeMove({
                from: Square.E7,
                to: Square.E5,
                piece: PieceType.PAWN,
            });
            expect(game.getGameState().fullmoveNumber).toBe(2); // Move 2 after black's move
        });

        test('should handle captures correctly', () => {
            // Set up a capture scenario
            game.makeMove({
                from: Square.E2,
                to: Square.E4,
                piece: PieceType.PAWN,
            });
            game.makeMove({
                from: Square.D7,
                to: Square.D5,
                piece: PieceType.PAWN,
            });

            const captureMove = {
                from: Square.E4,
                to: Square.D5,
                piece: PieceType.PAWN,
                captured: PieceType.PAWN,
            };
            expect(game.makeMove(captureMove)).toBe(true);

            expect(game.getPieceAt(Square.D5)).toEqual({
                type: PieceType.PAWN,
                color: Color.WHITE,
            });
            expect(game.getPieceAt(Square.E4)).toBe(null);

            // Check that halfmove clock was reset
            expect(game.getGameState().halfmoveClock).toBe(0);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle invalid FEN strings', () => {
            expect(() => {
                game.loadFromFen('invalid fen string');
            }).toThrow('Invalid FEN string');
        });

        test('should prevent king from moving into check', () => {
            // Set up position where king would move into check
            // Black rook on E3, white king on E1, king tries to move to E2 (into rook's attack)
            game.loadFromFen('8/8/8/8/8/4r3/8/4K3 w - - 0 1');

            const illegalMove = {
                from: Square.E1,
                to: Square.E2,
                piece: PieceType.KING,
            };
            expect(game.makeMove(illegalMove)).toBe(false);
        });

        test('should detect pinned pieces correctly', () => {
            // Set up pin scenario
            game.loadFromFen('8/8/8/8/8/2b5/1P6/K7 w - - 0 1');

            // Pawn is pinned and cannot move
            const pinnedMove = {
                from: Square.B2,
                to: Square.B3,
                piece: PieceType.PAWN,
            };
            expect(game.makeMove(pinnedMove)).toBe(false);
        });

        test('should handle discovered check correctly', () => {
            // Set up discovered check scenario
            game.loadFromFen('8/8/8/8/8/2bN4/8/K6k w - - 0 1');

            // Knight move would expose king to check - should be illegal
            const discoveredCheckMove = {
                from: Square.D3,
                to: Square.E5,
                piece: PieceType.KNIGHT,
            };
            expect(game.makeMove(discoveredCheckMove)).toBe(false);
        });
    });
});
