import { Document, Schema, Types, model } from 'mongoose';

export interface IGame extends Document {
    players: Types.ObjectId[];
    pgn: string;
    result: '1-0' | '0-1' | '1/2-1/2' | 'ongoing';
    moves: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const GameSchema = new Schema<IGame>(
    {
        players: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
        pgn: { type: String, required: true },
        result: {
            type: String,
            enum: ['1-0', '0-1', '1/2-1/2', 'ongoing'],
            default: 'ongoing',
        },
        moves: [{ type: Schema.Types.ObjectId, ref: 'Move' }],
    },
    { timestamps: true }
);

export const Game = model<IGame>('Game', GameSchema);
