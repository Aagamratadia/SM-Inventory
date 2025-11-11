import mongoose, { Schema, Document, Types } from 'mongoose';

export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Completed';

export interface IRequestItem {
  itemId: Types.ObjectId;
  itemName: string;
  category?: string;
  qty: number;
}

export interface IRequest extends Document {
  requesterId: Types.ObjectId;
  status: RequestStatus;
  items: IRequestItem[];
  note?: string;
  submittedAt: Date;
  decisionAt?: Date;
  decisionBy?: Types.ObjectId;
  decisionNote?: string;
  fulfilledAt?: Date;
  fulfilledBy?: Types.ObjectId;
  fulfillmentNote?: string;
}

const RequestItemSchema = new Schema<IRequestItem>(
  {
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
    itemName: { type: String, required: true },
    category: { type: String },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const RequestSchema = new Schema<IRequest>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'], default: 'Pending', index: true },
    items: {
      type: [RequestItemSchema],
      required: true,
      validate: {
        validator: (v: IRequestItem[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one item is required in a request.'
      }
    },
    note: { type: String },
    submittedAt: { type: Date, default: Date.now, index: true },
    decisionAt: { type: Date },
    decisionBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decisionNote: { type: String },
    fulfilledAt: { type: Date },
    fulfilledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    fulfillmentNote: { type: String },
  },
  { timestamps: false }
);

RequestSchema.index({ requesterId: 1, submittedAt: -1 });

export default (mongoose.models.Request as mongoose.Model<IRequest>) || mongoose.model<IRequest>('Request', RequestSchema);
