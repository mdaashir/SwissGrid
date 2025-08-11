import {
    BLACK_PAWN_ATTACKS,
    generateBishopAttacks,
    generateQueenAttacks,
    generateRookAttacks,
    KING_ATTACKS,
    KNIGHT_ATTACKS,
    lsb,
    WHITE_PAWN_ATTACKS,
} from './bitboard';
import { Color, GameResult, GameState, Move, PieceType, Square } from './types';

export class Game {
    public gameState: GameState;
    public moveHistory: Move[] = [];
    private positionHistory: string[] = [];

    constructor(fen?: string) {
        if (fen) {
            this.gameState = this.parseFEN(fen);
        } else {
            this.gameState = this.getInitialGameState();
        }
        this.addPositionToHistory();
    }

    /**
     * Get initial game state
     */
    private getInitialGameState(): GameState {
        return {
            bitboards: {
                [Color.WHITE]: {
                    [PieceType.PAWN]: 0xff00n,
                    [PieceType.ROOK]: 0x81n,
                    [PieceType.KNIGHT]: 0x42n,
                    [PieceType.BISHOP]: 0x24n,
                    [PieceType.QUEEN]: 0x8n,
                    [PieceType.KING]: 0x10n,
                },
                [Color.BLACK]: {
                    [PieceType.PAWN]: 0xff000000000000n,
                    [PieceType.ROOK]: 0x8100000000000000n,
                    [PieceType.KNIGHT]: 0x4200000000000000n,
                    [PieceType.BISHOP]: 0x2400000000000000n,
                    [PieceType.QUEEN]: 0x800000000000000n,
                    [PieceType.KING]: 0x1000000000000000n,
                },
            },
            activeColor: Color.WHITE,
            castlingRights: {
                whiteKingSide: true,
                whiteQueenSide: true,
                blackKingSide: true,
                blackQueenSide: true,
            },
            enPassantTarget: Square.NO_SQUARE,
            halfmoveClock: 0,
            fullmoveNumber: 1,
        };
    }

    // Public API methods
    public getActiveColor(): Color {
        return this.gameState.activeColor;
    }

    public getGameState(): GameState {
        return this.gameState;
    }

    public getMoveHistory(): Move[] {
        return this.moveHistory;
    }

    public isCheckmate(): boolean {
        return this.getLegalMoves().length === 0 && this.isInCheck();
    }

    public isStalemate(): boolean {
        return this.getLegalMoves().length === 0 && !this.isInCheck();
    }

    public loadFromFen(fen: string): void {
        this.gameState = this.parseFEN(fen);
        this.moveHistory = [];
        this.positionHistory = [];
        this.addPositionToHistory();
    }

    public toFen(): string {
        return this.exportFEN();
    }

    /**
     * Generate all legal moves for the current player
     */
    public getLegalMoves(): Move[] {
        const pseudoLegalMoves = this.generatePseudoLegalMoves();
        const legalMoves: Move[] = [];

        for (const move of pseudoLegalMoves) {
            if (this.isMoveLegalTest(move)) {
                legalMoves.push(move);
            }
        }

        return legalMoves;
    }

    /**
     * Test if a move is legal without causing infinite recursion
     */
    private isMoveLegalTest(move: Move): boolean {
        // Create a test game state
        const testGame = new Game();
        testGame.gameState = this.deepCloneGameState();

        // Execute the move
        testGame.executeMoveDirect(move);

        // Check if our king is in check after the move
        const ourColor = this.gameState.activeColor;
        const kingSquare = testGame.findKingPosition(ourColor);

        if (kingSquare === null) return false;

        const opponentColor =
            ourColor === Color.WHITE ? Color.BLACK : Color.WHITE;
        return !testGame.isSquareAttackedBy(kingSquare, opponentColor);
    }

    /**
     * Execute a move directly on the board without validation
     */
    private executeMoveDirect(move: Move): void {
        const { from, to, piece, promotion } = move;
        const activeColor = this.gameState.activeColor;
        const opponentColor =
            activeColor === Color.WHITE ? Color.BLACK : Color.WHITE;

        // Handle captures - remove enemy piece at destination
        for (const pieceType of Object.values(PieceType)) {
            if (typeof pieceType === 'number') {
                if (
                    (this.gameState.bitboards[opponentColor][pieceType] &
                        (1n << BigInt(to))) !==
                    0n
                ) {
                    this.gameState.bitboards[opponentColor][pieceType] &= ~(
                        1n << BigInt(to)
                    );
                    break;
                }
            }
        }

        // Remove piece from source
        this.gameState.bitboards[activeColor][piece] &= ~(1n << BigInt(from));

        // Add piece to destination (handle promotion)
        const finalPiece = promotion || piece;
        this.gameState.bitboards[activeColor][finalPiece] |= 1n << BigInt(to);

        // Handle castling
        if (piece === PieceType.KING && Math.abs(to - from) === 2) {
            const isKingSide = to > from;
            const rank = activeColor === Color.WHITE ? 0 : 7;

            if (isKingSide) {
                // King side castling - move rook from h-file to f-file
                const rookFrom = rank * 8 + 7;
                const rookTo = rank * 8 + 5;

                // Clear any piece at the rook destination (should be empty, but just in case)
                for (const pieceType of Object.values(PieceType)) {
                    if (typeof pieceType === 'number') {
                        this.gameState.bitboards[activeColor][pieceType] &= ~(
                            1n << BigInt(rookTo)
                        );
                        this.gameState.bitboards[opponentColor][pieceType] &= ~(
                            1n << BigInt(rookTo)
                        );
                    }
                }

                this.gameState.bitboards[activeColor][PieceType.ROOK] &= ~(
                    1n << BigInt(rookFrom)
                );
                this.gameState.bitboards[activeColor][PieceType.ROOK] |=
                    1n << BigInt(rookTo);
            } else {
                // Queen side castling - move rook from a-file to d-file
                const rookFrom = rank * 8;
                const rookTo = rank * 8 + 3;

                // Clear any piece at the rook destination (should be empty, but just in case)
                for (const pieceType of Object.values(PieceType)) {
                    if (typeof pieceType === 'number') {
                        this.gameState.bitboards[activeColor][pieceType] &= ~(
                            1n << BigInt(rookTo)
                        );
                        this.gameState.bitboards[opponentColor][pieceType] &= ~(
                            1n << BigInt(rookTo)
                        );
                    }
                }

                this.gameState.bitboards[activeColor][PieceType.ROOK] &= ~(
                    1n << BigInt(rookFrom)
                );
                this.gameState.bitboards[activeColor][PieceType.ROOK] |=
                    1n << BigInt(rookTo);
            }
        }

        // Handle en passant capture
        if (
            piece === PieceType.PAWN &&
            this.gameState.enPassantTarget !== Square.NO_SQUARE &&
            this.gameState.enPassantTarget === to
        ) {
            const captureSquare = activeColor === Color.WHITE ? to - 8 : to + 8;
            this.gameState.bitboards[opponentColor][PieceType.PAWN] &= ~(
                1n << BigInt(captureSquare)
            );
        }

        // Don't switch color here - will be done in updateGameStateAfterMove
    }

    /**
     * Find king position for a given color
     */
    private findKingPosition(color: Color): Square | null {
        const kingBitboard = this.gameState.bitboards[color][PieceType.KING];
        if (kingBitboard === 0n) return null;

        for (let i = 0; i < 64; i++) {
            if ((kingBitboard & (1n << BigInt(i))) !== 0n) {
                return i;
            }
        }
        return null;
    }

    /**
     * Check if a square is attacked by a given color
     */
    private isSquareAttackedBy(square: Square, attackingColor: Color): boolean {
        const occupied = this.getOccupied();

        // Check pawn attacks
        const pawnAttacks =
            attackingColor === Color.WHITE
                ? WHITE_PAWN_ATTACKS[square]
                : BLACK_PAWN_ATTACKS[square];
        if (
            (pawnAttacks &
                this.gameState.bitboards[attackingColor][PieceType.PAWN]) !==
            0n
        ) {
            return true;
        }

        // Check knight attacks
        const knightAttacks = KNIGHT_ATTACKS[square];
        if (
            (knightAttacks &
                this.gameState.bitboards[attackingColor][PieceType.KNIGHT]) !==
            0n
        ) {
            return true;
        }

        // Check bishop/queen attacks
        const bishopAttacks = generateBishopAttacks(square, occupied);
        if (
            (bishopAttacks &
                (this.gameState.bitboards[attackingColor][PieceType.BISHOP] |
                    this.gameState.bitboards[attackingColor][
                        PieceType.QUEEN
                    ])) !==
            0n
        ) {
            return true;
        }

        // Check rook/queen attacks
        const rookAttacks = generateRookAttacks(square, occupied);
        if (
            (rookAttacks &
                (this.gameState.bitboards[attackingColor][PieceType.ROOK] |
                    this.gameState.bitboards[attackingColor][
                        PieceType.QUEEN
                    ])) !==
            0n
        ) {
            return true;
        }

        // Check king attacks
        const kingAttacks = KING_ATTACKS[square];
        if (
            (kingAttacks &
                this.gameState.bitboards[attackingColor][PieceType.KING]) !==
            0n
        ) {
            return true;
        }

        return false;
    }

    /**
     * Get occupied squares bitboard
     */
    private getOccupied(): bigint {
        let occupied = 0n;
        for (const color of [Color.WHITE, Color.BLACK]) {
            for (const piece of Object.values(PieceType)) {
                if (typeof piece === 'number') {
                    occupied |= this.gameState.bitboards[color][piece];
                }
            }
        }
        return occupied;
    }

    /**
     * Generate pseudo-legal moves (may leave king in check)
     */
    private generatePseudoLegalMoves(): Move[] {
        const moves: Move[] = [];
        const activeColor = this.gameState.activeColor;

        for (const piece of Object.values(PieceType)) {
            if (typeof piece === 'number') {
                moves.push(...this.generatePieceMoves(piece, activeColor));
            }
        }

        return moves;
    }

    /**
     * Generate moves for a specific piece type
     */
    private generatePieceMoves(pieceType: PieceType, color: Color): Move[] {
        const moves: Move[] = [];
        let pieces = this.gameState.bitboards[color][pieceType];

        while (pieces !== 0n) {
            const square = lsb(pieces);
            pieces &= pieces - 1n; // Remove the least significant bit

            switch (pieceType) {
                case PieceType.PAWN:
                    moves.push(...this.generatePawnMoves(square, color));
                    break;
                case PieceType.ROOK:
                    moves.push(...this.generateRookMoves(square, color));
                    break;
                case PieceType.KNIGHT:
                    moves.push(...this.generateKnightMoves(square, color));
                    break;
                case PieceType.BISHOP:
                    moves.push(...this.generateBishopMoves(square, color));
                    break;
                case PieceType.QUEEN:
                    moves.push(...this.generateQueenMoves(square, color));
                    break;
                case PieceType.KING:
                    moves.push(...this.generateKingMoves(square, color));
                    break;
            }
        }

        return moves;
    }

    // Move generation methods
    private generatePawnMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const rank = Math.floor(square / 8);
        const file = square % 8;
        const direction = color === Color.WHITE ? 1 : -1;
        const startRank = color === Color.WHITE ? 1 : 6;
        const promotionRank = color === Color.WHITE ? 7 : 0;

        // Forward moves
        const oneStep = square + direction * 8;
        if (oneStep >= 0 && oneStep < 64 && !this.isSquareOccupied(oneStep)) {
            if (Math.floor(oneStep / 8) === promotionRank) {
                // Promotion
                for (const promoPiece of [
                    PieceType.QUEEN,
                    PieceType.ROOK,
                    PieceType.BISHOP,
                    PieceType.KNIGHT,
                ]) {
                    moves.push({
                        from: square,
                        to: oneStep,
                        piece: PieceType.PAWN,
                        promotion: promoPiece,
                    });
                }
            } else {
                moves.push({
                    from: square,
                    to: oneStep,
                    piece: PieceType.PAWN,
                });

                // Two steps from starting position
                if (rank === startRank) {
                    const twoStep = square + direction * 16;
                    if (
                        twoStep >= 0 &&
                        twoStep < 64 &&
                        !this.isSquareOccupied(twoStep)
                    ) {
                        moves.push({
                            from: square,
                            to: twoStep,
                            piece: PieceType.PAWN,
                        });
                    }
                }
            }
        }

        // Captures
        for (const fileOffset of [-1, 1]) {
            if (file + fileOffset >= 0 && file + fileOffset < 8) {
                const captureSquare = square + direction * 8 + fileOffset;
                if (captureSquare >= 0 && captureSquare < 64) {
                    const enemyColor =
                        color === Color.WHITE ? Color.BLACK : Color.WHITE;
                    if (
                        this.isSquareOccupiedBy(captureSquare, enemyColor) ||
                        (this.gameState.enPassantTarget !== Square.NO_SQUARE &&
                            this.gameState.enPassantTarget === captureSquare)
                    ) {
                        if (Math.floor(captureSquare / 8) === promotionRank) {
                            // Promotion capture
                            for (const promoPiece of [
                                PieceType.QUEEN,
                                PieceType.ROOK,
                                PieceType.BISHOP,
                                PieceType.KNIGHT,
                            ]) {
                                moves.push({
                                    from: square,
                                    to: captureSquare,
                                    piece: PieceType.PAWN,
                                    promotion: promoPiece,
                                });
                            }
                        } else {
                            // Check if this is en passant
                            if (
                                this.gameState.enPassantTarget !==
                                    Square.NO_SQUARE &&
                                this.gameState.enPassantTarget === captureSquare
                            ) {
                                moves.push({
                                    from: square,
                                    to: captureSquare,
                                    piece: PieceType.PAWN,
                                    isEnPassant: true,
                                });
                            } else {
                                moves.push({
                                    from: square,
                                    to: captureSquare,
                                    piece: PieceType.PAWN,
                                });
                            }
                        }
                    }
                }
            }
        }

        return moves;
    }

    private generateRookMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const attacks = generateRookAttacks(square, this.getOccupied());
        this.addMovesFromBitboard(
            moves,
            square,
            PieceType.ROOK,
            attacks,
            color
        );
        return moves;
    }

    private generateKnightMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const attacks = KNIGHT_ATTACKS[square];
        this.addMovesFromBitboard(
            moves,
            square,
            PieceType.KNIGHT,
            attacks,
            color
        );
        return moves;
    }

    private generateBishopMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const attacks = generateBishopAttacks(square, this.getOccupied());
        this.addMovesFromBitboard(
            moves,
            square,
            PieceType.BISHOP,
            attacks,
            color
        );
        return moves;
    }

    private generateQueenMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const attacks = generateQueenAttacks(square, this.getOccupied());
        this.addMovesFromBitboard(
            moves,
            square,
            PieceType.QUEEN,
            attacks,
            color
        );
        return moves;
    }

    private generateKingMoves(square: Square, color: Color): Move[] {
        const moves: Move[] = [];
        const attacks = KING_ATTACKS[square];
        this.addMovesFromBitboard(
            moves,
            square,
            PieceType.KING,
            attacks,
            color
        );

        // Add castling moves with proper validation
        if (color === Color.WHITE && square === 4 && !this.isInCheck()) {
            if (
                this.gameState.castlingRights.whiteKingSide &&
                !this.isSquareOccupied(5) &&
                !this.isSquareOccupied(6) &&
                !this.isSquareAttackedBy(5, Color.BLACK) &&
                !this.isSquareAttackedBy(6, Color.BLACK)
            ) {
                moves.push({
                    from: 4,
                    to: 6,
                    piece: PieceType.KING,
                    isCastling: true,
                    isKingSide: true,
                });
            }
            if (
                this.gameState.castlingRights.whiteQueenSide &&
                !this.isSquareOccupied(3) &&
                !this.isSquareOccupied(2) &&
                !this.isSquareOccupied(1) &&
                !this.isSquareAttackedBy(3, Color.BLACK) &&
                !this.isSquareAttackedBy(2, Color.BLACK)
            ) {
                moves.push({
                    from: 4,
                    to: 2,
                    piece: PieceType.KING,
                    isCastling: true,
                    isKingSide: false,
                });
            }
        } else if (
            color === Color.BLACK &&
            square === 60 &&
            !this.isInCheck()
        ) {
            if (
                this.gameState.castlingRights.blackKingSide &&
                !this.isSquareOccupied(61) &&
                !this.isSquareOccupied(62) &&
                !this.isSquareAttackedBy(61, Color.WHITE) &&
                !this.isSquareAttackedBy(62, Color.WHITE)
            ) {
                moves.push({
                    from: 60,
                    to: 62,
                    piece: PieceType.KING,
                    isCastling: true,
                    isKingSide: true,
                });
            }
            if (
                this.gameState.castlingRights.blackQueenSide &&
                !this.isSquareOccupied(59) &&
                !this.isSquareOccupied(58) &&
                !this.isSquareOccupied(57) &&
                !this.isSquareAttackedBy(59, Color.WHITE) &&
                !this.isSquareAttackedBy(58, Color.WHITE)
            ) {
                moves.push({
                    from: 60,
                    to: 58,
                    piece: PieceType.KING,
                    isCastling: true,
                    isKingSide: false,
                });
            }
        }

        return moves;
    }

    private addMovesFromBitboard(
        moves: Move[],
        from: Square,
        piece: PieceType,
        attacks: bigint,
        color: Color
    ): void {
        let targets = attacks;
        const ownPieces = this.getColorBitboard(color);
        targets &= ~ownPieces; // Remove own pieces

        while (targets !== 0n) {
            const to = lsb(targets);
            targets &= targets - 1n;
            moves.push({ from, to, piece });
        }
    }

    private getColorBitboard(color: Color): bigint {
        let result = 0n;
        for (const piece of Object.values(PieceType)) {
            if (typeof piece === 'number') {
                result |= this.gameState.bitboards[color][piece];
            }
        }
        return result;
    }

    private isSquareOccupied(square: Square): boolean {
        const occupied = this.getOccupied();
        return (occupied & (1n << BigInt(square))) !== 0n;
    }

    private isSquareOccupiedBy(square: Square, color: Color): boolean {
        const colorPieces = this.getColorBitboard(color);
        return (colorPieces & (1n << BigInt(square))) !== 0n;
    }

    /**
     * Deep clone game state to avoid BigInt issues
     */
    private deepCloneGameState(): GameState {
        const cloned: GameState = {
            bitboards: {
                [Color.WHITE]: {
                    [PieceType.PAWN]:
                        this.gameState.bitboards[Color.WHITE][PieceType.PAWN],
                    [PieceType.ROOK]:
                        this.gameState.bitboards[Color.WHITE][PieceType.ROOK],
                    [PieceType.KNIGHT]:
                        this.gameState.bitboards[Color.WHITE][PieceType.KNIGHT],
                    [PieceType.BISHOP]:
                        this.gameState.bitboards[Color.WHITE][PieceType.BISHOP],
                    [PieceType.QUEEN]:
                        this.gameState.bitboards[Color.WHITE][PieceType.QUEEN],
                    [PieceType.KING]:
                        this.gameState.bitboards[Color.WHITE][PieceType.KING],
                },
                [Color.BLACK]: {
                    [PieceType.PAWN]:
                        this.gameState.bitboards[Color.BLACK][PieceType.PAWN],
                    [PieceType.ROOK]:
                        this.gameState.bitboards[Color.BLACK][PieceType.ROOK],
                    [PieceType.KNIGHT]:
                        this.gameState.bitboards[Color.BLACK][PieceType.KNIGHT],
                    [PieceType.BISHOP]:
                        this.gameState.bitboards[Color.BLACK][PieceType.BISHOP],
                    [PieceType.QUEEN]:
                        this.gameState.bitboards[Color.BLACK][PieceType.QUEEN],
                    [PieceType.KING]:
                        this.gameState.bitboards[Color.BLACK][PieceType.KING],
                },
            },
            activeColor: this.gameState.activeColor,
            castlingRights: { ...this.gameState.castlingRights },
            enPassantTarget: this.gameState.enPassantTarget,
            halfmoveClock: this.gameState.halfmoveClock,
            fullmoveNumber: this.gameState.fullmoveNumber,
        };
        return cloned;
    }

    public makeMove(move: Move): boolean {
        // First check if there's actually a piece at the source square
        const pieceAtSource = this.getPieceAt(move.from);
        if (!pieceAtSource) {
            return false;
        }

        // Check if the piece matches the move
        if (pieceAtSource.type !== move.piece) {
            return false;
        }

        // Check if it's our piece
        if (pieceAtSource.color !== this.gameState.activeColor) {
            return false;
        }

        // Check if target square is occupied by our own piece
        const pieceAtTarget = this.getPieceAt(move.to);
        if (
            pieceAtTarget &&
            pieceAtTarget.color === this.gameState.activeColor
        ) {
            return false;
        }

        // Special validation for pawn promotion
        if (move.piece === PieceType.PAWN) {
            const toRank = Math.floor(move.to / 8);
            const promotionRank =
                this.gameState.activeColor === Color.WHITE ? 7 : 0;

            if (toRank === promotionRank && !move.promotion) {
                return false; // Must promote when reaching end rank
            }

            if (toRank !== promotionRank && move.promotion) {
                return false; // Can't promote when not reaching end rank
            }
        }

        // Basic piece movement pattern validation
        if (!this.isValidPieceMovement(move)) {
            return false;
        }

        // Special validation for en passant
        if (move.isEnPassant) {
            if (this.gameState.enPassantTarget !== move.to) {
                return false;
            }
        }

        // Final check: ensure this move doesn't leave our king in check
        if (!this.isMoveLegalTest(move)) {
            return false;
        }

        // Check for capture before executing move
        const isCapture =
            pieceAtTarget !== null ||
            (move.piece === PieceType.PAWN &&
                this.gameState.enPassantTarget === move.to);

        this.executeMoveDirect(move);
        this.updateGameStateAfterMove(move, isCapture);
        this.moveHistory.push(move);
        this.addPositionToHistory();
        return true;
    }

    /**
     * Basic piece movement pattern validation
     */
    private isValidPieceMovement(move: Move): boolean {
        const { from, to, piece } = move;
        const fromRank = Math.floor(from / 8);
        const fromFile = from % 8;
        const toRank = Math.floor(to / 8);
        const toFile = to % 8;
        const rankDiff = Math.abs(toRank - fromRank);
        const fileDiff = Math.abs(toFile - fromFile);

        switch (piece) {
            case PieceType.PAWN:
                return this.isValidPawnMove(
                    move,
                    fromRank,
                    fromFile,
                    toRank,
                    toFile
                );
            case PieceType.ROOK:
                return (
                    (rankDiff === 0 || fileDiff === 0) &&
                    this.isPathClear(from, to)
                );
            case PieceType.BISHOP:
                return (
                    rankDiff === fileDiff &&
                    rankDiff > 0 &&
                    this.isPathClear(from, to)
                );
            case PieceType.QUEEN:
                return (
                    (rankDiff === 0 ||
                        fileDiff === 0 ||
                        rankDiff === fileDiff) &&
                    rankDiff + fileDiff > 0 &&
                    this.isPathClear(from, to)
                );
            case PieceType.KNIGHT:
                return (
                    (rankDiff === 2 && fileDiff === 1) ||
                    (rankDiff === 1 && fileDiff === 2)
                );
            case PieceType.KING:
                // Regular king move (1 square) or castling (2 squares)
                if (rankDiff <= 1 && fileDiff <= 1 && rankDiff + fileDiff > 0) {
                    return true;
                }
                // Castling - king moves 2 squares horizontally
                if (rankDiff === 0 && fileDiff === 2) {
                    const isKingSide = to > from;
                    return this.canCastle(isKingSide);
                }
                return false;
            default:
                return false;
        }
    }

    /**
     * Validate pawn movement patterns
     */
    private isValidPawnMove(
        move: Move,
        fromRank: number,
        fromFile: number,
        toRank: number,
        toFile: number
    ): boolean {
        const { from, to } = move;
        const color = this.gameState.activeColor;
        const direction = color === Color.WHITE ? 1 : -1;
        const startRank = color === Color.WHITE ? 1 : 6;
        const rankDiff = toRank - fromRank;
        const fileDiff = Math.abs(toFile - fromFile);

        // Forward move
        if (fileDiff === 0) {
            // One square forward
            if (rankDiff === direction && !this.isSquareOccupied(to)) {
                return true;
            }
            // Two squares from starting position
            if (
                fromRank === startRank &&
                rankDiff === 2 * direction &&
                !this.isSquareOccupied(to) &&
                !this.isSquareOccupied(from + direction * 8)
            ) {
                return true;
            }
        }

        // Diagonal capture
        if (fileDiff === 1 && rankDiff === direction) {
            const enemyColor =
                color === Color.WHITE ? Color.BLACK : Color.WHITE;
            // Regular capture
            if (this.isSquareOccupiedBy(to, enemyColor)) {
                return true;
            }
            // En passant
            if (move.isEnPassant && this.gameState.enPassantTarget === to) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if path between two squares is clear (for sliding pieces)
     */
    private isPathClear(from: Square, to: Square): boolean {
        const fromRank = Math.floor(from / 8);
        const fromFile = from % 8;
        const toRank = Math.floor(to / 8);
        const toFile = to % 8;

        const rankStep = toRank > fromRank ? 1 : toRank < fromRank ? -1 : 0;
        const fileStep = toFile > fromFile ? 1 : toFile < fromFile ? -1 : 0;

        let currentRank = fromRank + rankStep;
        let currentFile = fromFile + fileStep;

        while (currentRank !== toRank || currentFile !== toFile) {
            const square = currentRank * 8 + currentFile;
            if (this.isSquareOccupied(square)) {
                return false;
            }
            currentRank += rankStep;
            currentFile += fileStep;
        }

        return true;
    }

    /**
     * Check if castling is possible
     */
    private canCastle(isKingSide: boolean): boolean {
        const color = this.gameState.activeColor;

        // King must not be in check
        if (this.isInCheck()) {
            return false;
        }

        if (color === Color.WHITE) {
            if (isKingSide) {
                if (!this.gameState.castlingRights.whiteKingSide) {
                    return false;
                }
                if (this.isSquareOccupied(5)) {
                    return false;
                }
                if (this.isSquareOccupied(6)) {
                    return false;
                }
                if (this.isSquareAttackedBy(5, Color.BLACK)) {
                    return false;
                }
                if (this.isSquareAttackedBy(6, Color.BLACK)) {
                    return false;
                }
                return true;
            } else {
                return (
                    this.gameState.castlingRights.whiteQueenSide &&
                    !this.isSquareOccupied(3) &&
                    !this.isSquareOccupied(2) &&
                    !this.isSquareOccupied(1) &&
                    !this.isSquareAttackedBy(3, Color.BLACK) &&
                    !this.isSquareAttackedBy(2, Color.BLACK)
                );
            }
        } else {
            if (isKingSide) {
                return (
                    this.gameState.castlingRights.blackKingSide &&
                    !this.isSquareOccupied(61) &&
                    !this.isSquareOccupied(62) &&
                    !this.isSquareAttackedBy(61, Color.WHITE) &&
                    !this.isSquareAttackedBy(62, Color.WHITE)
                );
            } else {
                return (
                    this.gameState.castlingRights.blackQueenSide &&
                    !this.isSquareOccupied(59) &&
                    !this.isSquareOccupied(58) &&
                    !this.isSquareOccupied(57) &&
                    !this.isSquareAttackedBy(59, Color.WHITE) &&
                    !this.isSquareAttackedBy(58, Color.WHITE)
                );
            }
        }
    }

    /**
     * Update game state after a move (clock, en passant, castling rights, active color)
     */
    private updateGameStateAfterMove(move: Move, isCapture: boolean): void {
        const { from, to, piece } = move;
        const activeColor = this.gameState.activeColor;

        // Update castling rights
        if (piece === PieceType.KING) {
            if (activeColor === Color.WHITE) {
                this.gameState.castlingRights.whiteKingSide = false;
                this.gameState.castlingRights.whiteQueenSide = false;
            } else {
                this.gameState.castlingRights.blackKingSide = false;
                this.gameState.castlingRights.blackQueenSide = false;
            }
        } else if (piece === PieceType.ROOK) {
            if (activeColor === Color.WHITE) {
                if (from === 0)
                    this.gameState.castlingRights.whiteQueenSide = false;
                if (from === 7)
                    this.gameState.castlingRights.whiteKingSide = false;
            } else {
                if (from === 56)
                    this.gameState.castlingRights.blackQueenSide = false;
                if (from === 63)
                    this.gameState.castlingRights.blackKingSide = false;
            }
        }

        // Update en passant target
        this.gameState.enPassantTarget = Square.NO_SQUARE;
        if (piece === PieceType.PAWN && Math.abs(to - from) === 16) {
            // Double pawn move - set en passant target
            this.gameState.enPassantTarget =
                activeColor === Color.WHITE ? from + 8 : from - 8;
        }

        // Update clocks
        if (move.piece === PieceType.PAWN || isCapture) {
            this.gameState.halfmoveClock = 0;
        } else {
            this.gameState.halfmoveClock++;
        }

        // Update fullmove number (after black's move)
        if (activeColor === Color.BLACK) {
            this.gameState.fullmoveNumber++;
        }

        // Switch active color
        this.gameState.activeColor =
            activeColor === Color.WHITE ? Color.BLACK : Color.WHITE;
    }

    public isGameOver(): boolean {
        return this.getLegalMoves().length === 0;
    }

    public isInCheck(): boolean {
        const kingSquare = this.findKingPosition(this.gameState.activeColor);
        if (kingSquare === null) return false;
        const opponentColor =
            this.gameState.activeColor === Color.WHITE
                ? Color.BLACK
                : Color.WHITE;
        return this.isSquareAttackedBy(kingSquare, opponentColor);
    }

    public getGameResult(): GameResult {
        const legalMoves = this.getLegalMoves();
        if (legalMoves.length === 0) {
            if (this.isInCheck()) {
                return this.gameState.activeColor === Color.WHITE
                    ? GameResult.BLACK_WINS
                    : GameResult.WHITE_WINS;
            } else {
                return GameResult.STALEMATE;
            }
        }

        // Check for fifty-move rule
        if (this.gameState.halfmoveClock >= 100) {
            return GameResult.FIFTY_MOVE_RULE;
        }

        // Check for threefold repetition
        if (this.hasThreefoldRepetition()) {
            return GameResult.THREEFOLD_REPETITION;
        }

        // Check for insufficient material (last, only if game is ongoing)
        if (this.hasInsufficientMaterial()) {
            return GameResult.INSUFFICIENT_MATERIAL;
        }

        return GameResult.IN_PROGRESS;
    }

    private hasInsufficientMaterial(): boolean {
        let whitePieces = 0;
        let blackPieces = 0;
        let whiteKnights = 0;
        let blackKnights = 0;
        let whiteBishops = 0;
        let blackBishops = 0;

        for (const piece of Object.values(PieceType)) {
            if (typeof piece === 'number') {
                const whitePieceCount = this.countPieces(Color.WHITE, piece);
                const blackPieceCount = this.countPieces(Color.BLACK, piece);

                if (
                    piece === PieceType.PAWN ||
                    piece === PieceType.ROOK ||
                    piece === PieceType.QUEEN
                ) {
                    if (whitePieceCount > 0 || blackPieceCount > 0) {
                        return false;
                    }
                }

                if (piece === PieceType.KNIGHT) {
                    whiteKnights = whitePieceCount;
                    blackKnights = blackPieceCount;
                }

                if (piece === PieceType.BISHOP) {
                    whiteBishops = whitePieceCount;
                    blackBishops = blackPieceCount;
                }

                whitePieces += whitePieceCount;
                blackPieces += blackPieceCount;
            }
        }

        // King vs King
        if (whitePieces === 1 && blackPieces === 1) {
            return true;
        }

        // King + Knight vs King or King vs King + Knight
        if (
            (whitePieces === 2 && whiteKnights === 1 && blackPieces === 1) ||
            (blackPieces === 2 && blackKnights === 1 && whitePieces === 1)
        ) {
            return true;
        }

        // King + Bishop vs King or King vs King + Bishop
        if (
            (whitePieces === 2 && whiteBishops === 1 && blackPieces === 1) ||
            (blackPieces === 2 && blackBishops === 1 && whitePieces === 1)
        ) {
            return true;
        }

        return false;
    }

    private countPieces(color: Color, pieceType: PieceType): number {
        let count = 0;
        let bitboard = this.gameState.bitboards[color][pieceType];
        while (bitboard !== 0n) {
            count++;
            bitboard &= bitboard - 1n;
        }
        return count;
    }

    private hasThreefoldRepetition(): boolean {
        // For threefold repetition, we only compare position-relevant parts of FEN
        // (piece placement, active color, castling rights, en passant target)
        // NOT the move counters (halfmove clock and fullmove number)
        const currentPositionKey = this.getPositionKey();
        let repetitionCount = 1; // Count the current position

        for (const positionKey of this.positionHistory) {
            if (positionKey === currentPositionKey) {
                repetitionCount++;
            }
        }

        return repetitionCount >= 3;
    }

    private getPositionKey(): string {
        const fen = this.exportFEN();
        const parts = fen.split(' ');
        // Return only position-relevant parts: piece placement, active color, castling rights, en passant
        return parts.slice(0, 4).join(' ');
    }

    private parseFEN(fen: string): GameState {
        const parts = fen.split(' ');
        if (parts.length !== 6) {
            throw new Error('Invalid FEN string');
        }

        const [
            piecePlacement,
            activeColor,
            castlingRights,
            enPassantTarget,
            halfmoveClock,
            fullmoveNumber,
        ] = parts;

        const gameState = this.getInitialGameState();

        // Clear all bitboards
        for (const color of [Color.WHITE, Color.BLACK]) {
            for (const piece of Object.values(PieceType)) {
                if (typeof piece === 'number') {
                    gameState.bitboards[color][piece] = 0n;
                }
            }
        }

        // Parse piece placement
        const ranks = piecePlacement.split('/');
        for (let rank = 0; rank < 8; rank++) {
            let file = 0;
            const rankStr = ranks[rank];
            for (const char of rankStr) {
                if (char >= '1' && char <= '8') {
                    file += parseInt(char);
                } else {
                    const square = (7 - rank) * 8 + file;
                    const color =
                        char === char.toUpperCase() ? Color.WHITE : Color.BLACK;
                    const pieceType = this.charToPieceType(char.toLowerCase());
                    gameState.bitboards[color][pieceType] |=
                        1n << BigInt(square);
                    file++;
                }
            }
        }

        // Parse active color
        gameState.activeColor = activeColor === 'w' ? Color.WHITE : Color.BLACK;

        // Parse castling rights
        gameState.castlingRights = {
            whiteKingSide: castlingRights.includes('K'),
            whiteQueenSide: castlingRights.includes('Q'),
            blackKingSide: castlingRights.includes('k'),
            blackQueenSide: castlingRights.includes('q'),
        };

        // Parse en passant target
        gameState.enPassantTarget =
            enPassantTarget === '-'
                ? Square.NO_SQUARE
                : this.algebraicToSquare(enPassantTarget);

        // Parse clocks
        gameState.halfmoveClock = parseInt(halfmoveClock);
        gameState.fullmoveNumber = parseInt(fullmoveNumber);

        return gameState;
    }

    private charToPieceType(char: string): PieceType {
        switch (char) {
            case 'p':
                return PieceType.PAWN;
            case 'r':
                return PieceType.ROOK;
            case 'n':
                return PieceType.KNIGHT;
            case 'b':
                return PieceType.BISHOP;
            case 'q':
                return PieceType.QUEEN;
            case 'k':
                return PieceType.KING;
            default:
                throw new Error(`Invalid piece character: ${char}`);
        }
    }

    private algebraicToSquare(algebraic: string): Square {
        if (algebraic.length !== 2) return Square.NO_SQUARE;
        const file = algebraic.charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = parseInt(algebraic[1]) - 1;
        if (file < 0 || file > 7 || rank < 0 || rank > 7)
            return Square.NO_SQUARE;
        return rank * 8 + file;
    }

    public exportFEN(): string {
        let fen = '';

        // Build piece placement
        for (let rank = 7; rank >= 0; rank--) {
            let emptyCount = 0;
            for (let file = 0; file < 8; file++) {
                const square = rank * 8 + file;
                const piece = this.getPieceAt(square);

                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount.toString();
                        emptyCount = 0;
                    }
                    fen += this.pieceToChar(piece.type, piece.color);
                } else {
                    emptyCount++;
                }
            }
            if (emptyCount > 0) {
                fen += emptyCount.toString();
            }
            if (rank > 0) fen += '/';
        }

        // Active color
        fen += ` ${this.gameState.activeColor === Color.WHITE ? 'w' : 'b'}`;

        // Castling rights
        let castling = '';
        if (this.gameState.castlingRights.whiteKingSide) castling += 'K';
        if (this.gameState.castlingRights.whiteQueenSide) castling += 'Q';
        if (this.gameState.castlingRights.blackKingSide) castling += 'k';
        if (this.gameState.castlingRights.blackQueenSide) castling += 'q';
        fen += ` ${castling || '-'}`;

        // En passant target
        fen += ` ${this.gameState.enPassantTarget === Square.NO_SQUARE ? '-' : this.squareToAlgebraic(this.gameState.enPassantTarget)}`;

        // Clocks
        fen += ` ${this.gameState.halfmoveClock} ${this.gameState.fullmoveNumber}`;

        return fen;
    }

    private pieceToChar(pieceType: PieceType, color: Color): string {
        const chars = {
            [PieceType.PAWN]: 'p',
            [PieceType.ROOK]: 'r',
            [PieceType.KNIGHT]: 'n',
            [PieceType.BISHOP]: 'b',
            [PieceType.QUEEN]: 'q',
            [PieceType.KING]: 'k',
        };
        const char = chars[pieceType];
        return color === Color.WHITE ? char.toUpperCase() : char;
    }

    private squareToAlgebraic(square: Square): string {
        const file = String.fromCharCode('a'.charCodeAt(0) + (square % 8));
        const rank = Math.floor(square / 8) + 1;
        return `${file}${rank}`;
    }

    private addPositionToHistory(): void {
        this.positionHistory.push(this.getPositionKey());
    }

    public getPieceAt(
        square: Square
    ): { type: PieceType; color: Color } | null {
        for (const color of [Color.WHITE, Color.BLACK]) {
            for (const piece of Object.values(PieceType)) {
                if (typeof piece === 'number') {
                    if (
                        (this.gameState.bitboards[color][piece] &
                            (1n << BigInt(square))) !==
                        0n
                    ) {
                        return { type: piece, color };
                    }
                }
            }
        }
        return null;
    }
}
