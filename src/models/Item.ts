import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  user: Types.ObjectId;
  assignedAt: Date;
  returnedAt?: Date;
  action: 'assigned' | 'returned';
  priceAtAssignment?: number;
  quantity: number;
}

export interface IItem extends Document {
  category: string; // Added category field
  name: string;
  vendorname?: string;
  itemId?: string;
  price?: number;
  quantity?: number;
  notes?: string;
  assignedTo?: Types.ObjectId;
  assignmentHistory: IAssignment[];
}

const AssignmentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  returnedAt: { type: Date },
  priceAtAssignment: { type: Number },
  action: { type: String, required: true, enum: ['assigned', 'returned'] },
  quantity: { type: Number, required: true },
});

const ItemSchema: Schema = new Schema(
  {
    category: {
      type: String,
      required: [true, 'Please provide an item category.'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide an item name.'],
      unique: true,
      trim: true,
    },
    vendorname: {
      type: String,
      required: [true, 'Please provide an vendor name.'],
      unique: true,
      trim: true,
    },
    itemId: { type: String, trim: true },
    shape: { type: String, trim: true },
    price: { type: Number },
    quantity: { type: Number },
    notes: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignmentHistory: [AssignmentSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Item || mongoose.model<IItem>('Item', ItemSchema);
