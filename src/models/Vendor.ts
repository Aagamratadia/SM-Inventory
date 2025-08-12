import mongoose, { Schema, Document } from 'mongoose';

export interface IVendor extends Document {
  name: string;
  contactInfo?: string;
}

const VendorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a vendor name.'],
      unique: true,
      trim: true,
    },
    contactInfo: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);
