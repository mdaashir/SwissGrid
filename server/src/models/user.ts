import { Document, Schema, model } from 'mongoose';

export interface IUser extends Document {
    handle: string;
    email: string;
    elo: number;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        handle: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        elo: { type: Number, default: 1200 },
    },
    { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
