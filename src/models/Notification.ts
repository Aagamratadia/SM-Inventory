import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'request_submitted' | 'request_approved' | 'request_rejected' | 'request_ready_for_fulfillment' | 'request_fulfilled';

export interface INotification extends Document {
  type: NotificationType;
  requestId?: Types.ObjectId;
  recipientId?: Types.ObjectId; // specific user
  recipientRole?: 'admin' | 'user' | 'warehouse'; // or broadcast by role
  message: string;
  read: boolean;
  createdAt: Date;
  meta?: Record<string, any>;
}

const NotificationSchema = new Schema<INotification>({
  type: { type: String, required: true, enum: ['request_submitted', 'request_approved', 'request_rejected', 'request_ready_for_fulfillment', 'request_fulfilled'] },
  requestId: { type: Schema.Types.ObjectId, ref: 'Request' },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
  recipientRole: { type: String, enum: ['admin', 'user', 'warehouse'] },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  meta: { type: Schema.Types.Mixed },
});

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });

// In Next.js dev, the model may be cached with an old schema. Delete to force recompile.
if (mongoose.models.Notification) {
  delete (mongoose.models as any).Notification;
}
export default mongoose.model<INotification>('Notification', NotificationSchema);
