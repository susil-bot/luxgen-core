const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    avatar: { type: String }
  },
  content: {
    text: { type: String },
    attachments: [{
      type: { type: String, enum: ['image', 'video', 'file', 'link'] },
      url: { type: String },
      filename: { type: String },
      size: { type: Number },
      mimeType: { type: String }
    }]
  },
  recipients: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date },
    deliveredAt: { type: Date }
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'system'],
    default: 'text'
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
messageSchema.index({ tenantId: 1, conversationId: 1, createdAt: -1 });
messageSchema.index({ 'sender.userId': 1, createdAt: -1 });
messageSchema.index({ 'recipients.userId': 1, createdAt: -1 });
messageSchema.index({ status: 1 });

// Pre-save middleware
messageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Message', messageSchema);
