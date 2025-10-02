const mongoose = require('mongoose');
const crypto = require('crypto'); const sessionSchema = new mongoose.Schema({ // Core session information userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true }, // Token information tokenHash: { type: String, required: true, unique: true }, refreshTokenHash: { type: String, sparse: true }, // Session metadata ipAddress: { type: String, trim: true }, userAgent: { type: String, trim: true }, deviceInfo: { type: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown'}, browser: String, os: String, version: String }, // Location information location: { country: String, region: String, city: String, timezone: String, coordinates: { latitude: Number, longitude: Number } }, // Session status and timing isActive: { type: Boolean, default: true }, expiresAt: { type: Date, required: true }, lastActivityAt: { type: Date, default: Date.now }, // Security information security: { isSecure: { type: Boolean, default: false }, isHttpOnly: { type: Boolean, default: true }, sameSite: { type: String, enum: ['strict', 'lax', 'none'], default: 'lax'}, fingerprint: String, riskScore: { type: Number, default: 0, min: 0, max: 100 } }, // Session context context: { loginMethod: { type: String, enum: ['password', 'sso', 'magic_link', 'oauth'], default: 'password'}, mfaVerified: { type: Boolean, default: false }, permissions: [String], roles: [String] }, // Activity tracking activity: { pageViews: { type: Number, default: 0 }, apiCalls: { type: Number, default: 0 }, lastApiCall: Date, lastPageView: Date }, // Metadata metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }
}); // Virtual for is expired
sessionSchema.virtual('isExpired').get(function() { return this.expiresAt < new Date();
}); // Virtual for session duration
sessionSchema.virtual('duration').get(function() { return Date.now() - this.createdAt.getTime();
}); // Virtual for time until expiry
sessionSchema.virtual('timeUntilExpiry').get(function() { return this.expiresAt.getTime() - Date.now();
}); // Indexes for performance
sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ tenantId: 1, isActive: 1 });
sessionSchema.index({ expiresAt: 1 });
sessionSchema.index({ lastActivityAt: -1 });
sessionSchema.index({ createdAt: -1 }); // Pre-save middleware
sessionSchema.pre('save', function(next) { // Auto-deactivate expired sessions if (this.isExpired) { this.isActive = false; } next();
}); // Instance methods
sessionSchema.methods.updateActivity = async function() { this.lastActivityAt = new Date(); this.activity.pageViews += 1; this.lastPageView = new Date(); return this.save();
}; sessionSchema.methods.updateApiActivity = async function() { this.lastActivityAt = new Date(); this.activity.apiCalls += 1; this.lastApiCall = new Date(); return this.save();
}; sessionSchema.methods.extend = async function(duration = 24 * 60 * 60 * 1000) { // 24 hours this.expiresAt = new Date(Date.now() + duration); return this.save();
}; sessionSchema.methods.deactivate = async function() { this.isActive = false; return this.save();
}; sessionSchema.methods.updateSecurityInfo = async function(securityInfo) { this.security = { ...this.security, ...securityInfo }; return this.save();
}; // Static methods
sessionSchema.statics.createSession = async function(userId, tenantId, options = {}) { const Session = mongoose.model('Session'); // Generate token hash const token = crypto.randomBytes(32).toString('hex'); const tokenHash = crypto.createHash('sha256').update(token).digest('hex'); // Generate refresh token const refreshToken = crypto.randomBytes(32).toString('hex'); const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex'); // Calculate expiry const expiresAt = new Date(Date.now() + (options.duration || 24 * 60 * 60 * 1000)); const session = new Session({ userId, tenantId, tokenHash, refreshTokenHash, ipAddress: options.ipAddress, userAgent: options.userAgent, deviceInfo: options.deviceInfo, location: options.location, expiresAt, security: options.security, context: options.context }); await session.save(); return { session, token, refreshToken };
}; sessionSchema.statics.findByToken = function(token) { const tokenHash = crypto.createHash('sha256').update(token).digest('hex'); return this.findOne({ tokenHash, isActive: true });
}; sessionSchema.statics.findByRefreshToken = function(refreshToken) { const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex'); return this.findOne({ refreshTokenHash, isActive: true });
}; sessionSchema.statics.findActiveByUser = function(userId) { return this.find({ userId, isActive: true, expiresAt: { $gt: new Date() } });
}; sessionSchema.statics.findActiveByTenant = function(tenantId) { return this.find({ tenantId, isActive: true, expiresAt: { $gt: new Date() } });
}; sessionSchema.statics.cleanupExpired = async function() { return this.updateMany( { expiresAt: { $lt: new Date() }, isActive: true }, { isActive: false } );
}; sessionSchema.statics.getSessionStatistics = function(tenantId) { return this.aggregate([ { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } }, { $group: { _id: null, totalSessions: { $sum: 1 }, activeSessions: { $sum: { $cond: [ { $and: ['$isActive', { $gt: ['$expiresAt', new Date()] }] }, 1, 0 ] } }, averageSessionDuration: { $avg: '$duration'}, uniqueUsers: { $addToSet: '$userId'} } }, { $project: { totalSessions: 1, activeSessions: 1, averageSessionDuration: 1, uniqueUsers: { $size: '$uniqueUsers'} } } ]);
}; module.exports = mongoose.model('Session', sessionSchema); 