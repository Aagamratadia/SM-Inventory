import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType = 'request_submitted' | 'request_approved' | 'request_rejected';

export interface INotification extends Document {
  type: NotificationType;
  requestId?: Types.ObjectId;
  recipientId?: Types.ObjectId; // specific user
  recipientRole?: 'admin' | 'user'; // or broadcast by role
  message: string;
  read: boolean;
  createdAt: Date;
  meta?: Record<string, any>;
}

const NotificationSchema = new Schema<INotification>({
  type: { type: String, required: true, enum: ['request_submitted', 'request_approved', 'request_rejected'] },
  requestId: { type: Schema.Types.ObjectId, ref: 'Request' },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User' },
  recipientRole: { type: String, enum: ['admin', 'user'] },
  message: { type: String, required: true },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  meta: { type: Schema.Types.Mixed },
});

NotificationSchema.index({ recipientId: 1, createdAt: -1 });
NotificationSchema.index({ recipientRole: 1, createdAt: -1 });

export default (mongoose.models.Notification as mongoose.Model<INotification>) || mongoose.model<INotification>('Notification', NotificationSchema);
