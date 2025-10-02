const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const likeSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { 
    type: String, 
    enum: ['post', 'comment', 'message'], 
    required: true 
  },
  targetId: { type: Schema.Types.ObjectId, required: true },
  reactionType: { 
    type: String, 
    enum: ['like', 'love', 'laugh', 'wow', 'sad', 'angry'], 
    default: 'like' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
likeSchema.index({ tenantId: 1, targetType: 1, targetId: 1 });
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 });
likeSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate likes
likeSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
