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
  vendorContact?: string;
  vendorEmail?: string;
  vendorAddress?: string;
  itemId?: string;
  price?: number;
  // quantity represents AVAILABLE stock
  quantity: number;
  // totalQuantity represents TOTAL units ever added (for stock checks)
  totalQuantity: number;
  notes?: string;
  assignedTo?: Types.ObjectId | null;
  assignmentHistory: IAssignment[];
  isScrap?: boolean;
  scrappedAt?: Date;
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
      required: [true, 'Please provide a vendor name.'],
      trim: true,
    },
    vendorContact: {
      type: String,
      trim: true,
    },
    vendorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    vendorAddress: {
      type: String,
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
    isScrap: { type: Boolean, default: false },
    scrappedAt: { type: Date },
  },
  { timestamps: true }
);

// Non-unique index to speed up category queries
ItemSchema.index({ category: 1 }, { name: 'category_1' });

// In Next.js dev, the model may be cached with an old schema. Delete to force recompile.
if (mongoose.models.Item) {
  delete (mongoose.models as any).Item;
}
export default mongoose.model<IItem>('Item', ItemSchema);
