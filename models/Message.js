import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    fileUrl: {
      type: String,
      trim: true,
      default: '',
    },
    fileName: {
      type: String,
      trim: true,
      default: '',
    },
    fileType: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

messageSchema.index({ groupId: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

export { Message };
export default Message;
