const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    avatar: { type: String }
  },
  content: { type: String, required: true },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' }, // For nested comments
  engagement: {
    likes: { type: Number, default: 0 },
    replies: { type: Number, default: 0 }
  },
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  hashtags: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'deleted', 'hidden'],
    default: 'active'
  },
  metadata: {
    source: { type: String },
    device: { type: String },
    ipAddress: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
commentSchema.index({ tenantId: 1, postId: 1, createdAt: -1 });
commentSchema.index({ 'author.userId': 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ status: 1 });

// Pre-save middleware
commentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
