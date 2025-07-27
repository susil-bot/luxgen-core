
// Export all models for easy importing
const User = require('./User');
const Tenant = require('./Tenant');
const Session = require('./Session');
const Group = require('./Group');
const Poll = require('./Poll');
const Notification = require('./Notification');
const AuditLog = require('./AuditLog');
const TenantSchema = require('./TenantSchema');
const TrainingSession = require('./TrainingSession');
const TrainingCourse = require('./TrainingCourse');
const TrainingModule = require('./TrainingModule');
const TrainingAssessment = require('./TrainingAssessment');
const Presentation = require('./Presentation');

module.exports = {
  User,
  Tenant,
  Session,
  Group,
  Poll,
  Notification,
  AuditLog,
  TenantSchema,
  TrainingSession,
  TrainingCourse,
  TrainingModule,
  TrainingAssessment,
  Presentation
}