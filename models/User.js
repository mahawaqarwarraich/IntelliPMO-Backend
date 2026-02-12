import mongoose from 'mongoose';

const DEPARTMENTS = ['IT', 'CS', 'SE'];

/**
 * Base User schema – common fields for all user roles.
 * Admin, Student, Supervisor, and Evaluator extend this via Mongoose discriminators
 * (defined in their own files).
 */
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model('User', userSchema);

export { User, DEPARTMENTS };
export default User;
