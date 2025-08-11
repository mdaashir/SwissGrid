import { Document, Schema, model } from 'mongoose';

export interface IMove extends Document {
    uci: string;
    fen: string;
    moveNumber: number;
    createdAt: Date;
}

const MoveSchema = new Schema<IMove>({
    uci: { type: String, required: true },
    fen: { type: String, required: true },
    moveNumber: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
});

export const Move = model<IMove>('Move', MoveSchema);
