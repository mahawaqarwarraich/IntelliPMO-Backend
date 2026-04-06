import mongoose from 'mongoose';

const ONE_HOUR_MS = 60 * 60 * 1000;

const tokenSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expires_at: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + ONE_HOUR_MS),
      index: { expires: 0 }, // TTL: delete when expires_at is reached
    },
  },
  { timestamps: true }
);

const Token = mongoose.model('Token', tokenSchema);

export { Token };
export default Token;

