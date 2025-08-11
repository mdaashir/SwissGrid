import { Document, Schema, Types, model } from 'mongoose';

export interface ITournament extends Document {
    type: 'arena' | 'swiss';
    round: number;
    entries: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const TournamentSchema = new Schema<ITournament>(
    {
        type: { type: String, enum: ['arena', 'swiss'], required: true },
        round: { type: Number, default: 1 },
        entries: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { timestamps: true }
);

export const Tournament = model<ITournament>('Tournament', TournamentSchema);
