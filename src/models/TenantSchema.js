const mongoose = require('mongoose');

const tenantSchemaSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  schemaType: {
    type: String,
    required: true,
    enum: ['user', 'training', 'assessment', 'poll', 'presentation', 'custom']
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  schema: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  usage: {
    lastUsed: {
      type: Date,
      default: Date.now
    },
    useCount: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [String],
    category: String
  }
}, {
  timestamps: true
});

// Indexes for performance
tenantSchemaSchema.index({ tenantId: 1, schemaType: 1 });
tenantSchemaSchema.index({ tenantId: 1, isActive: 1 });

// Virtual for schema validation
tenantSchemaSchema.virtual('isValid').get(function() {
  try {
    // Basic validation - check if schema has required properties
    return this.schema && 
           typeof this.schema === 'object' && 
           this.schema.type && 
           this.schema.properties;
  } catch (error) {
    return false;
  }
});

// Virtual for schema complexity
tenantSchemaSchema.virtual('complexity').get(function() {
  if (!this.schema || !this.schema.properties) return 'unknown';
  
  const propertyCount = Object.keys(this.schema.properties).length;
  const requiredCount = this.schema.required ? this.schema.required.length : 0;
  
  if (propertyCount <= 5 && requiredCount <= 2) return 'simple';
  if (propertyCount <= 15 && requiredCount <= 5) return 'moderate';
  return 'complex';
});

// Pre-save middleware to validate schema
tenantSchemaSchema.pre('save', function(next) {
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
tenantSchemaSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Remove default flag from other schemas of the same type for this tenant
    await this.constructor.updateMany(
      { 
        tenantId: this.tenantId, 
        schemaType: this.schemaType, 
        _id: { $ne: this._id } 
      },
      { isDefault: false }
    );
  }
  
  next();
});

// Instance method to validate data against schema
tenantSchemaSchema.methods.validateData = function(data) {
  try {
    // Basic JSON Schema validation
    if (!this.schema || !this.schema.properties) {
      return { valid: false, errors: ['Schema not properly defined'] };
    }
    
    const errors = [];
    
    // Check required fields
    if (this.schema.required) {
      for (const field of this.schema.required) {
        if (!(field in data)) {
          errors.push(`Required field '${field}' is missing`);
        }
      }
    }
    
    // Check field types
    for (const [field, value] of Object.entries(data)) {
      if (this.schema.properties[field]) {
        const fieldSchema = this.schema.properties[field];
        if (fieldSchema.type && typeof value !== fieldSchema.type) {
          errors.push(`Field '${field}' must be of type ${fieldSchema.type}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  } catch (error) {
    return { valid: false, errors: [error.message] };
  }
};

// Instance method to get schema fields
tenantSchemaSchema.methods.getFields = function() {
  if (!this.schema || !this.schema.properties) {
    return [];
  }
  
  return Object.keys(this.schema.properties).map(field => ({
    name: field,
    type: this.schema.properties[field].type || 'string',
    required: this.schema.required ? this.schema.required.includes(field) : false,
    description: this.schema.properties[field].description || ''
  }));
};

// Instance method to update usage
tenantSchemaSchema.methods.updateUsage = function() {
  this.usage.lastUsed = new Date();
  this.usage.useCount += 1;
  return this.save();
};

// Static method to get default schema for tenant and type
tenantSchemaSchema.statics.getDefaultSchema = function(tenantId, schemaType) {
  return this.findOne({
    tenantId: tenantId,
    schemaType: schemaType,
    isDefault: true,
    isActive: true
  });
};

// Static method to get all schemas for tenant
tenantSchemaSchema.statics.getTenantSchemas = function(tenantId, schemaType = null) {
  const query = { tenantId: tenantId, isActive: true };
  if (schemaType) {
    query.schemaType = schemaType;
  }
  
  return this.find(query).sort({ isDefault: -1, createdAt: -1 });
};

// Static method to create default schema
tenantSchemaSchema.statics.createDefaultSchema = function(tenantId, schemaType, schemaData) {
  return this.create({
    tenantId: tenantId,
    schemaType: schemaType,
    name: schemaData.name || `${schemaType} Schema`,
    description: schemaData.description || '',
    schema: schemaData.schema,
    isDefault: true,
    isActive: true,
    metadata: schemaData.metadata || {}
  });
};

module.exports = mongoose.model('TenantSchema', tenantSchemaSchema);