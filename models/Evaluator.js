import mongoose from 'mongoose';
import { User } from './User.js';

const evaluatorSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    designation: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const Evaluator = User.discriminator('Evaluator', evaluatorSchema);

export { Evaluator };
export default Evaluator;
