import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReconciliation extends Document {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  countedQty: number;
  systemQty: number;
  delta: number;
  department?: string;
  countedAt: Date;
  countedBy: Types.ObjectId;
  notes?: string;
}

const ReconciliationSchema = new Schema<IReconciliation>(
  {
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    countedQty: { type: Number, required: true, min: 0 },
    systemQty: { type: Number, required: true, min: 0 },
    delta: { type: Number, required: true },
    department: { type: String, trim: true, index: true },
    countedAt: { type: Date, default: Date.now, index: true },
    countedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default (mongoose.models.Reconciliation as mongoose.Model<IReconciliation>)
  || mongoose.model<IReconciliation>('Reconciliation', ReconciliationSchema);
