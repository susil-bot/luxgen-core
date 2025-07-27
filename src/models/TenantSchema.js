const mongoose = require('mongoose');

const tenantSchemaSchema = new mongoose.Schema({

  // Reference to Tenant
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },


  // Schema Information
  schemaType: {
    type: String,
    required: true,
    enum: ['user_profile', 'poll_template', 'custom_form', 'assessment', 'survey', 'feedback_form'],
    trim: true
  },

  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },

  description: {
    type: String,
    trim: true,
    maxlength: 500
  },


  // Schema Definition (JSON Schema format)
  schema: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },


  // Schema Version
  version: {
    type: String,
    default: '1.0.0'
  },


  // Schema Status
  isActive: {
    type: Boolean,
    default: true
  },

  isDefault: {
    type: Boolean,
    default: false
  },


  // Validation Rules
  validationRules: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {} },


  // UI Configuration
  uiConfig: {
    layout: {
      type: String,
      enum: ['single_column', 'two_column', 'three_column', 'custom'],
      default: 'single_column'
    },
    theme: {
      type: String,
      enum: ['default', 'minimal', 'professional', 'creative'],
      default: 'default'
    },
    showProgress: {
      type: Boolean,
      default: true
    },
    allowSaveDraft: {
      type: Boolean,
      default: true
    },
    allowEdit: {
      type: Boolean,
      default: false
    } },


  // Access Control
  permissions: {
    view: {
      type: [String],
      enum: ['admin', 'manager', 'user', 'guest'],
      default: ['admin', 'manager', 'user']
    },
    edit: {
      type: [String],
      enum: ['admin', 'manager'],
      default: ['admin']
    },
    delete: {
      type: [String],
      enum: ['admin'],
      default: ['admin']
    } },


  // Usage Statistics
  usage: {
    timesUsed: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date,
      default: Date.now
    },
    totalResponses: {
      type: Number,
      default: 0
    },
    averageCompletionTime: {
      type: Number,
      default: 0
      // in minutes
    } },


  // Metadata
  metadata: {
    tags: [String],
    category: String,
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    estimatedTime: {
      type: Number,
      default: 5
      // in minutes
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    source: String,
    notes: String
  } }, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true } });


// Indexes for performance
tenantSchemaSchema.index({ tenantId: 1 });
tenantSchemaSchema.index({ schemaType: 1 });
tenantSchemaSchema.index({ isActive: 1 });
tenantSchemaSchema.index({ 'metadata.tags': 1 });
tenantSchemaSchema.index({ createdAt: -1 });
tenantSchemaSchema.index({ 'usage.lastUsed': -1 });


// Compound indexes
tenantSchemaSchema.index({ tenantId: 1, schemaType: 1 });
tenantSchemaSchema.index({ tenantId: 1, isActive: 1 });


// Virtual for schema validation
tenantSchemaSchema.virtual('isValid').get(function () {
  try {
    // Basic validation - check if schema has required properties
    return this.schema &&
           typeof this.schema === 'object' &&
           this.schema.type &&
           this.schema.properties;
  } catch (error) {
    return false;
  } });


// Virtual for schema complexity
tenantSchemaSchema.virtual('complexity').get(function () {
  if (!this.schema || !this.schema.properties) {
    return 'unknown';
  }
  const propertyCount = Object.keys(this.schema.properties).length;
  const requiredCount = this.schema.required ? this.schema.required.length : 0;

  if (propertyCount <= 5 && requiredCount <= 2) {
    return 'simple';
  }
  if (propertyCount <= 15 && requiredCount <= 5) {
    return 'moderate';
  }
  return 'complex';
});


// Pre-save middleware to validate schema
tenantSchemaSchema.pre('save', function (next) {
// Validate JSON Schema structure
  if (!this.schema || typeof this.schema !== 'object') {
    return next(new Error('Schema must be a valid object'));
  }
  if (!this.schema.type) {
    return next(new Error('Schema must have a type property'));
  }
  if (!this.schema.properties) {
    return next(new Error('Schema must have properties defined'));
  }
  // Update usage timestamp
  this.usage.lastUsed = new Date();

  next();
});


// Pre-save middleware to ensure only one default schema per type per tenant
tenantSchemaSchema.pre('save', async function (next) {
  if (this.isDefault) {
    // Remove default flag from other schemas of the same type for this tenant
    await this.constructor.updateMany(
      {
        tenantId: this.tenantId,
        schemaType: this.schemaType,
        _id: { $ne: this._id } },
      { isDefault: false } );
  }
  next();
});


// Instance method to validate data against schema
tenantSchemaSchema.methods.validateData = function (data) {
// This is a simplified validation - in production, you might want to use a proper JSON Schema validator
  const errors = [];

  if (!this.schema || !this.schema.properties) {
    errors.push('Invalid schema definition');
    return { isValid: false, errors } }
  // Check required fields
  if (this.schema.required) {
    this.schema.required.forEach(field => {
      if (!data.hasOwnProperty(field)) {
        errors.push(`Required field '${field}' is missing`);
      } });
  }
  // Check field types (simplified)
  Object.entries(this.schema.properties).forEach(([field, config]) => {
    if (data.hasOwnProperty(field)) {
      const value = data[field];

      switch (config.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Field '${field}' must be a string`);
          }
          break;
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field '${field}' must be a number`);
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field '${field}' must be a boolean`);
          }
          break;
        case 'array':
          if (!Array.isArray(value)) {
            errors.push(`Field '${field}' must be an array`);
          }
          break;
        case 'object':
          if (typeof value !== 'object' || Array.isArray(value)) {
            errors.push(`Field '${field}' must be an object`);
          }
          break;
      } }
  });

  return {
    isValid: errors.length === 0,
    errors
  } }
// Instance method to increment usage
tenantSchemaSchema.methods.incrementUsage = function () {
  this.usage.timesUsed += 1;
  this.usage.lastUsed = new Date();
  return this.save();
}
// Instance method to update response statistics
tenantSchemaSchema.methods.updateResponseStats = function (completionTime) {
  this.usage.totalResponses += 1;


  // Update average completion time
  const currentAvg = this.usage.averageCompletionTime;
  const { totalResponses } = this.usage;
  this.usage.averageCompletionTime = ((currentAvg * (totalResponses - 1)) + completionTime) / totalResponses;

  return this.save();
}
// Instance method to get schema as form fields
tenantSchemaSchema.methods.getFormFields = function () {
  if (!this.schema || !this.schema.properties) {
    return [];
  }
  return Object.entries(this.schema.properties).map(([name, config]) => ({
    name,
    type: config.type || 'text',
    label: config.title || name,
    placeholder: config.description || '',
    required: this.schema.required ? this.schema.required.includes(name) : false,
    options: config.enum || null,
    validation: config.pattern ? new RegExp(config.pattern) : null,
    ...config
  }));
}
// Static method to find schemas by tenant
tenantSchemaSchema.statics.findByTenant = function (tenantId, options = {}) {
  const query = { tenantId }
  if (options.schemaType) {
    query.schemaType = options.schemaType;
  }
  if (options.isActive !== undefined) {
    query.isActive = options.isActive;
  }
  if (options.isDefault !== undefined) {
    query.isDefault = options.isDefault;
  }
  return this.find(query).sort({ createdAt: -1 });
}
// Static method to find default schema for a type
tenantSchemaSchema.statics.findDefault = function (tenantId, schemaType) {
  return this.findOne({
    tenantId,
    schemaType,
    isDefault: true,
    isActive: true
  });
}
// Static method to find active schemas
tenantSchemaSchema.statics.findActive = function (tenantId) {
  return this.find({ tenantId, isActive: true });
}
// Static method to find schemas by tags
tenantSchemaSchema.statics.findByTags = function (tenantId, tags) {
  return this.find({
    tenantId,
    'metadata.tags': { $in: tags },
    isActive: true
  });
}
module.exports = mongoose.model('TenantSchema', tenantSchemaSchema);
