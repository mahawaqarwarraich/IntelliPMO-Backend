import mongoose from 'mongoose';
import { User } from './User.js';

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    session: { type: String, required: true, match: /^\d{4}-\d{4}$/ },
  },
  { _id: false }
);

const Admin = User.discriminator('Admin', adminSchema);

export { Admin };
export default Admin;
