import mongoose from 'mongoose';
import { User } from './User.js';

const adminSchema = new mongoose.Schema(
  {
    designation: { type: String, trim: true, default: null },
    session_id: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Session' },
  },
  { _id: false }
);

const Admin = User.discriminator('Admin', adminSchema);

export { Admin };
export default Admin;
