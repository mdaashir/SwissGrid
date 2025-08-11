/**
 * Chess Engine Types
 * Comprehensive type definitions for a bitboard-based chess engine
 */

// Basic chess types
export enum Color {
    WHITE = 0,
    BLACK = 1,
}

export enum PieceType {
    PAWN = 0,
    KNIGHT = 1,
    BISHOP = 2,
    ROOK = 3,
    QUEEN = 4,
    KING = 5,
}

export enum Square {
    A1,
    B1,
    C1,
    D1,
    E1,
    F1,
    G1,
    H1,
    A2,
    B2,
    C2,
    D2,
    E2,
    F2,
    G2,
    H2,
    A3,
    B3,
    C3,
    D3,
    E3,
    F3,
    G3,
    H3,
    A4,
    B4,
    C4,
    D4,
    E4,
    F4,
    G4,
    H4,
    A5,
    B5,
    C5,
    D5,
    E5,
    F5,
    G5,
    H5,
    A6,
    B6,
    C6,
    D6,
    E6,
    F6,
    G6,
    H6,
    A7,
    B7,
    C7,
    D7,
    E7,
    F7,
    G7,
    H7,
    A8,
    B8,
    C8,
    D8,
    E8,
    F8,
    G8,
    H8,
    NO_SQUARE = 64,
}

// Bitboard type - represents a 64-bit board
export type Bitboard = bigint;

// Piece representation
export interface Piece {
    type: PieceType;
    color: Color;
}

// Move representation
export interface Move {
    from: Square;
    to: Square;
    piece: PieceType;
    captured?: PieceType;
    promotion?: PieceType;
    isEnPassant?: boolean;
    isCastling?: boolean;
    isKingSide?: boolean;
}

// Castling rights
export interface CastlingRights {
    whiteKingSide: boolean;
    whiteQueenSide: boolean;
    blackKingSide: boolean;
    blackQueenSide: boolean;
}

// Game state
export interface GameState {
    bitboards: {
        [Color.WHITE]: {
            [PieceType.PAWN]: Bitboard;
            [PieceType.KNIGHT]: Bitboard;
            [PieceType.BISHOP]: Bitboard;
            [PieceType.ROOK]: Bitboard;
            [PieceType.QUEEN]: Bitboard;
            [PieceType.KING]: Bitboard;
        };
        [Color.BLACK]: {
            [PieceType.PAWN]: Bitboard;
            [PieceType.KNIGHT]: Bitboard;
            [PieceType.BISHOP]: Bitboard;
            [PieceType.ROOK]: Bitboard;
            [PieceType.QUEEN]: Bitboard;
            [PieceType.KING]: Bitboard;
        };
    };
    activeColor: Color;
    castlingRights: CastlingRights;
    enPassantTarget: Square;
    halfmoveClock: number;
    fullmoveNumber: number;
}

// Game result
export enum GameResult {
    IN_PROGRESS = 'in_progress',
    WHITE_WINS = 'white_wins',
    BLACK_WINS = 'black_wins',
    DRAW = 'draw',
    STALEMATE = 'stalemate',
    INSUFFICIENT_MATERIAL = 'insufficient_material',
    THREEFOLD_REPETITION = 'threefold_repetition',
    FIFTY_MOVE_RULE = 'fifty_move_rule',
}

// Move validation result
export interface MoveValidationResult {
    isValid: boolean;
    error?: string;
}

// Position hash for repetition detection
export type PositionHash = string;
