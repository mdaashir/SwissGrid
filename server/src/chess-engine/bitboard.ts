/**
 * Bitboard Utilities
 * Core bitboard operations for chess engine
 */

import { Bitboard, Square } from './types';

// Constants
export const EMPTY_BOARD: Bitboard = 0n;
export const FULL_BOARD: Bitboard = 0xffffffffffffffffn;

// Files and ranks
export const FILE_A: Bitboard = 0x0101010101010101n;
export const FILE_B: Bitboard = 0x0202020202020202n;
export const FILE_C: Bitboard = 0x0404040404040404n;
export const FILE_D: Bitboard = 0x0808080808080808n;
export const FILE_E: Bitboard = 0x1010101010101010n;
export const FILE_F: Bitboard = 0x2020202020202020n;
export const FILE_G: Bitboard = 0x4040404040404040n;
export const FILE_H: Bitboard = 0x8080808080808080n;

export const RANK_1: Bitboard = 0x00000000000000ffn;
export const RANK_2: Bitboard = 0x000000000000ff00n;
export const RANK_3: Bitboard = 0x0000000000ff0000n;
export const RANK_4: Bitboard = 0x00000000ff000000n;
export const RANK_5: Bitboard = 0x000000ff00000000n;
export const RANK_6: Bitboard = 0x0000ff0000000000n;
export const RANK_7: Bitboard = 0x00ff000000000000n;
export const RANK_8: Bitboard = 0xff00000000000000n;

export const FILES = [
    FILE_A,
    FILE_B,
    FILE_C,
    FILE_D,
    FILE_E,
    FILE_F,
    FILE_G,
    FILE_H,
];
export const RANKS = [
    RANK_1,
    RANK_2,
    RANK_3,
    RANK_4,
    RANK_5,
    RANK_6,
    RANK_7,
    RANK_8,
];

// Knight attack patterns
export const KNIGHT_ATTACKS: Bitboard[] = new Array(64);

// King attack patterns
export const KING_ATTACKS: Bitboard[] = new Array(64);

// Pawn attack patterns
export const WHITE_PAWN_ATTACKS: Bitboard[] = new Array(64);
export const BLACK_PAWN_ATTACKS: Bitboard[] = new Array(64);

/**
 * Get a bitboard with only the specified square set
 */
export function squareToBitboard(square: Square): Bitboard {
    if (square === Square.NO_SQUARE) return EMPTY_BOARD;
    return 1n << BigInt(square);
}

/**
 * Check if a square is set in a bitboard
 */
export function isSquareSet(bitboard: Bitboard, square: Square): boolean {
    return (bitboard & squareToBitboard(square)) !== 0n;
}

/**
 * Set a square in a bitboard
 */
export function setSquare(bitboard: Bitboard, square: Square): Bitboard {
    return bitboard | squareToBitboard(square);
}

/**
 * Clear a square in a bitboard
 */
export function clearSquare(bitboard: Bitboard, square: Square): Bitboard {
    return bitboard & ~squareToBitboard(square);
}

/**
 * Count the number of set bits in a bitboard (population count)
 */
export function popcount(bitboard: Bitboard): number {
    let count = 0;
    let bb = bitboard;
    while (bb !== 0n) {
        count++;
        bb &= bb - 1n; // Clear the least significant set bit
    }
    return count;
}

/**
 * Get the least significant bit position
 */
export function lsb(bitboard: Bitboard): Square {
    if (bitboard === 0n) return Square.NO_SQUARE;

    let square = 0;
    let bb = bitboard;

    if ((bb & 0xffffffffn) === 0n) {
        square += 32;
        bb >>= 32n;
    }
    if ((bb & 0xffffn) === 0n) {
        square += 16;
        bb >>= 16n;
    }
    if ((bb & 0xffn) === 0n) {
        square += 8;
        bb >>= 8n;
    }
    if ((bb & 0xfn) === 0n) {
        square += 4;
        bb >>= 4n;
    }
    if ((bb & 0x3n) === 0n) {
        square += 2;
        bb >>= 2n;
    }
    if ((bb & 0x1n) === 0n) {
        square += 1;
    }

    return square as Square;
}

/**
 * Pop the least significant bit and return its position
 */
export function popLsb(bitboard: Bitboard): {
    square: Square;
    remaining: Bitboard;
} {
    const square = lsb(bitboard);
    const remaining = bitboard & (bitboard - 1n);
    return { square, remaining };
}

/**
 * Get file of a square (0-7)
 */
export function getFile(square: Square): number {
    return square % 8;
}

/**
 * Get rank of a square (0-7)
 */
export function getRank(square: Square): number {
    return Math.floor(square / 8);
}

/**
 * Create a square from file and rank
 */
export function createSquare(file: number, rank: number): Square {
    return (rank * 8 + file) as Square;
}

/**
 * Check if a square is on the board
 */
export function isValidSquare(file: number, rank: number): boolean {
    return file >= 0 && file <= 7 && rank >= 0 && rank <= 7;
}

/**
 * Get distance between two squares
 */
export function getDistance(sq1: Square, sq2: Square): number {
    const file1 = getFile(sq1);
    const rank1 = getRank(sq1);
    const file2 = getFile(sq2);
    const rank2 = getRank(sq2);

    return Math.max(Math.abs(file1 - file2), Math.abs(rank1 - rank2));
}

/**
 * Initialize attack tables
 */
export function initializeAttackTables(): void {
    // Initialize knight attacks
    for (let square = 0; square < 64; square++) {
        const file = getFile(square);
        const rank = getRank(square);
        let attacks = EMPTY_BOARD;

        const knightMoves = [
            [-2, -1],
            [-2, 1],
            [-1, -2],
            [-1, 2],
            [1, -2],
            [1, 2],
            [2, -1],
            [2, 1],
        ];

        for (const [df, dr] of knightMoves) {
            const newFile = file + df;
            const newRank = rank + dr;
            if (isValidSquare(newFile, newRank)) {
                attacks = setSquare(attacks, createSquare(newFile, newRank));
            }
        }

        KNIGHT_ATTACKS[square] = attacks;
    }

    // Initialize king attacks
    for (let square = 0; square < 64; square++) {
        const file = getFile(square);
        const rank = getRank(square);
        let attacks = EMPTY_BOARD;

        for (let df = -1; df <= 1; df++) {
            for (let dr = -1; dr <= 1; dr++) {
                if (df === 0 && dr === 0) continue;
                const newFile = file + df;
                const newRank = rank + dr;
                if (isValidSquare(newFile, newRank)) {
                    attacks = setSquare(
                        attacks,
                        createSquare(newFile, newRank)
                    );
                }
            }
        }

        KING_ATTACKS[square] = attacks;
    }

    // Initialize pawn attacks
    for (let square = 0; square < 64; square++) {
        const file = getFile(square);
        const rank = getRank(square);

        // White pawn attacks (moving up)
        let whiteAttacks = EMPTY_BOARD;
        if (rank < 7) {
            if (file > 0) {
                whiteAttacks = setSquare(
                    whiteAttacks,
                    createSquare(file - 1, rank + 1)
                );
            }
            if (file < 7) {
                whiteAttacks = setSquare(
                    whiteAttacks,
                    createSquare(file + 1, rank + 1)
                );
            }
        }
        WHITE_PAWN_ATTACKS[square] = whiteAttacks;

        // Black pawn attacks (moving down)
        let blackAttacks = EMPTY_BOARD;
        if (rank > 0) {
            if (file > 0) {
                blackAttacks = setSquare(
                    blackAttacks,
                    createSquare(file - 1, rank - 1)
                );
            }
            if (file < 7) {
                blackAttacks = setSquare(
                    blackAttacks,
                    createSquare(file + 1, rank - 1)
                );
            }
        }
        BLACK_PAWN_ATTACKS[square] = blackAttacks;
    }
}

/**
 * Generate sliding piece attacks (bishop, rook, queen)
 */
export function generateSlidingAttacks(
    square: Square,
    occupied: Bitboard,
    directions: number[][]
): Bitboard {
    let attacks = EMPTY_BOARD;
    const file = getFile(square);
    const rank = getRank(square);

    for (const [df, dr] of directions) {
        let newFile = file + df;
        let newRank = rank + dr;

        while (isValidSquare(newFile, newRank)) {
            const targetSquare = createSquare(newFile, newRank);
            attacks = setSquare(attacks, targetSquare);

            // Stop if we hit an occupied square
            if (isSquareSet(occupied, targetSquare)) {
                break;
            }

            newFile += df;
            newRank += dr;
        }
    }

    return attacks;
}

/**
 * Generate bishop attacks
 */
export function generateBishopAttacks(
    square: Square,
    occupied: Bitboard
): Bitboard {
    const directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
    ];
    return generateSlidingAttacks(square, occupied, directions);
}

/**
 * Generate rook attacks
 */
export function generateRookAttacks(
    square: Square,
    occupied: Bitboard
): Bitboard {
    const directions = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
    ];
    return generateSlidingAttacks(square, occupied, directions);
}

/**
 * Generate queen attacks
 */
export function generateQueenAttacks(
    square: Square,
    occupied: Bitboard
): Bitboard {
    return (
        generateBishopAttacks(square, occupied) |
        generateRookAttacks(square, occupied)
    );
}

/**
 * Convert square to algebraic notation
 */
export function squareToAlgebraic(square: Square): string {
    if (square === Square.NO_SQUARE) return '-';
    const file = String.fromCharCode('a'.charCodeAt(0) + getFile(square));
    const rank = (getRank(square) + 1).toString();
    return file + rank;
}

/**
 * Convert algebraic notation to square
 */
export function algebraicToSquare(algebraic: string): Square {
    if (algebraic === '-' || algebraic.length !== 2) return Square.NO_SQUARE;
    const file = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
    const rank = parseInt(algebraic[1]) - 1;
    if (!isValidSquare(file, rank)) return Square.NO_SQUARE;
    return createSquare(file, rank);
}

// Initialize attack tables when module loads
initializeAttackTables();
