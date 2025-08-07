import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'staff' | 'user';
  image?: string;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name.'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email.'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      select: false, // Do not return password by default
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'user'],
      default: 'user',
    },
    image: {
        type: String,
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
