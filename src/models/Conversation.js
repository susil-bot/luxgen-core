const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
    lastReadAt: { type: Date }
  }],
  title: { type: String },
  description: { type: String },
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct'
  },
  lastMessage: {
    content: { type: String },
    sender: { type: String },
    timestamp: { type: Date }
  },
  settings: {
    notifications: { type: Boolean, default: true },
    muteUntil: { type: Date },
    archive: { type: Boolean, default: false }
  },
  metadata: {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    source: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
conversationSchema.index({ tenantId: 1, 'participants.userId': 1 });
conversationSchema.index({ tenantId: 1, type: 1, updatedAt: -1 });
conversationSchema.index({ 'participants.userId': 1, updatedAt: -1 });

// Pre-save middleware
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
