import mongoose from 'mongoose';
import { User } from './User.js';

const supervisorSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    domain: { type: String, required: true, trim: true },
    designation: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const Supervisor = User.discriminator('Supervisor', supervisorSchema);

export { Supervisor };
export default Supervisor;
