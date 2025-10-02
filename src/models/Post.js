const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  tenantId: { type: String, required: true, index: true },
  author: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    title: { type: String },
    avatar: { type: String },
    verified: { type: Boolean, default: false }
  },
  content: {
    text: { type: String, required: true },
    images: [{ type: String }],
    videos: [{ type: String }],
    links: [{
      url: { type: String },
      title: { type: String },
      description: { type: String },
      image: { type: String }
    }]
  },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  visibility: {
    type: { type: String, enum: ['public', 'connections', 'private'], default: 'public' },
    audience: [{ type: String }] // For targeted posts
  },
  hashtags: [{ type: String }],
  mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String }],
  location: {
    name: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  status: {
    type: String,
    enum: ['published', 'draft', 'archived', 'deleted'],
    default: 'published'
  },
  metadata: {
    source: { type: String }, // 'web', 'mobile', 'api'
    device: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  analytics: {
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    engagementRate: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for performance
postSchema.index({ tenantId: 1, createdAt: -1 });
postSchema.index({ 'author.userId': 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ content: 'text' });

// Virtual for engagement rate
postSchema.virtual('engagementRate').get(function() {
  if (this.engagement.views === 0) return 0;
  return ((this.engagement.likes + this.engagement.comments + this.engagement.shares) / this.engagement.views) * 100;
});

// Pre-save middleware
postSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Post', postSchema);
