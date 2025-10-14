import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  requestId: Types.ObjectId;
  itemId: Types.ObjectId;
  qty: number;
  assignedToId: Types.ObjectId;
  assignedToName: string;
  assignedById: Types.ObjectId;
  assignedByName: string;
  assignedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  qty: { type: Number, required: true, min: 1 },
  assignedToId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedToName: { type: String, required: true },
  assignedById: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedByName: { type: String, required: true },
  assignedAt: { type: Date, default: Date.now, index: true },
});

export default (mongoose.models.Assignment as mongoose.Model<IAssignment>) || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
