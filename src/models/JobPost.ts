import mongoose, { Schema, Document, Model } from 'mongoose';
import { ITenant } from './ITenant';

export interface IJobPost extends Document {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'remote';
  status: 'active' | 'inactive' | 'draft' | 'archived';
  salary?: number;
  requirements: string;
  benefits: string[];
  skills: string[];
  experience: string;
  education: string;
  company: string;
  contactEmail: string;
  contactPhone?: string;
  applicationDeadline?: Date;
  startDate?: Date;
  isRemote: boolean;
  isUrgent: boolean;
  isFeatured: boolean;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  views: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  metadata: Record<string, any>;
}

export interface IJobPostMethods {
  validateBusinessRules(): boolean;
  getPublicData(): Partial<IJobPost>;
  incrementViews(): Promise<void>;
  incrementLikes(): Promise<void>;
  incrementComments(): Promise<void>;
  incrementShares(): Promise<void>;
}

export interface IJobPostStatics {
  findByTenant(tenantId: string): Promise<IJobPost[]>;
  getStatistics(tenantId: string): Promise<Record<string, number>>;
  findByDepartment(tenantId: string, department: string): Promise<IJobPost[]>;
  findByStatus(tenantId: string, status: string): Promise<IJobPost[]>;
  searchJobPosts(tenantId: string, query: string): Promise<IJobPost[]>;
}

const jobPostSchema = new Schema<IJobPost, IJobPostMethods, IJobPostStatics>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'draft', 'archived'],
    default: 'draft'
  },
  salary: {
    type: Number,
    min: 0
  },
  requirements: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  benefits: [{
    type: String,
    trim: true
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: String,
    required: true,
    trim: true
  },
  education: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  applicationDeadline: {
    type: Date
  },
  startDate: {
    type: Date
  },
  isRemote: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: {
    type: Number,
    default: 0,
    min: 0
  },
  shares: {
    type: Number,
    default: 0,
    min: 0
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: {
    type: Date
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  versionKey: false,
  collection: 'jobposts'
});

// Indexes for performance
jobPostSchema.index({ tenantId: 1, createdAt: -1 });
jobPostSchema.index({ tenantId: 1, status: 1 });
jobPostSchema.index({ tenantId: 1, department: 1 });
jobPostSchema.index({ tenantId: 1, type: 1 });
jobPostSchema.index({ tenantId: 1, isFeatured: 1 });
jobPostSchema.index({ tenantId: 1, isUrgent: 1 });
jobPostSchema.index({ title: 'text', description: 'text', requirements: 'text' });

// Instance methods
jobPostSchema.methods.validateBusinessRules = function(): boolean {
  // Business logic validation
  if (this.applicationDeadline && this.applicationDeadline < new Date()) {
    return false;
  }
  if (this.startDate && this.applicationDeadline && this.startDate < this.applicationDeadline) {
    return false;
  }
  return true;
};

jobPostSchema.methods.getPublicData = function(): Partial<IJobPost> {
  return {
    _id: this._id,
    title: this.title,
    description: this.description,
    department: this.department,
    location: this.location,
    type: this.type,
    status: this.status,
    salary: this.salary,
    requirements: this.requirements,
    benefits: this.benefits,
    skills: this.skills,
    experience: this.experience,
    education: this.education,
    company: this.company,
    contactEmail: this.contactEmail,
    contactPhone: this.contactPhone,
    applicationDeadline: this.applicationDeadline,
    startDate: this.startDate,
    isRemote: this.isRemote,
    isUrgent: this.isUrgent,
    isFeatured: this.isFeatured,
    tags: this.tags,
    likes: this.likes,
    comments: this.comments,
    shares: this.shares,
    views: this.views,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    publishedAt: this.publishedAt
  };
};

jobPostSchema.methods.incrementViews = async function(): Promise<void> {
  this.views += 1;
  await this.save();
};

jobPostSchema.methods.incrementLikes = async function(): Promise<void> {
  this.likes += 1;
  await this.save();
};

jobPostSchema.methods.incrementComments = async function(): Promise<void> {
  this.comments += 1;
  await this.save();
};

jobPostSchema.methods.incrementShares = async function(): Promise<void> {
  this.shares += 1;
  await this.save();
};

// Static methods
jobPostSchema.statics.findByTenant = async function(tenantId: string): Promise<IJobPost[]> {
  return this.find({ tenantId }).sort({ createdAt: -1 });
};

jobPostSchema.statics.getStatistics = async function(tenantId: string): Promise<Record<string, number>> {
  const stats = await this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
    { $group: { 
      _id: null, 
      total: { $sum: 1 },
      active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
      draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
      archived: { $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] } },
      totalLikes: { $sum: '$likes' },
      totalComments: { $sum: '$comments' },
      totalShares: { $sum: '$shares' },
      totalViews: { $sum: '$views' }
    }}
  ]);
  return stats[0] || { total: 0, active: 0, inactive: 0, draft: 0, archived: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0 };
};

jobPostSchema.statics.findByDepartment = async function(tenantId: string, department: string): Promise<IJobPost[]> {
  return this.find({ tenantId, department }).sort({ createdAt: -1 });
};

jobPostSchema.statics.findByStatus = async function(tenantId: string, status: string): Promise<IJobPost[]> {
  return this.find({ tenantId, status }).sort({ createdAt: -1 });
};

jobPostSchema.statics.searchJobPosts = async function(tenantId: string, query: string): Promise<IJobPost[]> {
  return this.find({
    tenantId,
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { department: { $regex: query, $options: 'i' } },
      { location: { $regex: query, $options: 'i' } },
      { requirements: { $regex: query, $options: 'i' } },
      { skills: { $in: [new RegExp(query, 'i')] } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ]
  }).sort({ createdAt: -1 });
};

export const JobPost: Model<IJobPost, IJobPostMethods, IJobPostStatics> = 
  mongoose.model<IJobPost, IJobPostMethods, IJobPostStatics>('JobPost', jobPostSchema);
