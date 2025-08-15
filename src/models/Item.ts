import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  user: Types.ObjectId;
  assignedAt: Date;
  returnedAt?: Date;
  action: 'assigned' | 'returned';
  priceAtAssignment?: number;
  quantity: number; // quantity assigned or returned in this history entry
  performedBy?: Types.ObjectId; // actor who performed the action
}

export interface IItem extends Document {
  category: string; // Added category field
  name: string;
  vendorname?: string;
  itemId?: string;
  price?: number;
  // quantity represents AVAILABLE stock
  quantity?: number;
  // totalQuantity represents TOTAL units ever added (for stock checks)
  totalQuantity?: number;
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
  quantity: { type: Number, required: true, min: 1 },
  performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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
    // quantity is AVAILABLE count
    quantity: { type: Number, default: 0, min: 0 },
    // totalQuantity is TOTAL count ever added (initially equals quantity)
    totalQuantity: { type: Number, default: 0, min: 0 },
    notes: { type: String },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    assignmentHistory: [AssignmentSchema],
  },
  { timestamps: true }
);

// In Next.js dev, the model may be cached with an old schema. Delete to force recompile.
if (mongoose.models.Item) {
  delete (mongoose.models as any).Item;
}
export default mongoose.model<IItem>('Item', ItemSchema);
