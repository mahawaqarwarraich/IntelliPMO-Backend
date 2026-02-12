import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

const Domain = mongoose.model('Domain', domainSchema);

export { Domain };
export default Domain;
