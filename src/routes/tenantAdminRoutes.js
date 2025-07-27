const express = require('express');
const router = express.Router();
const tenantAdminController = require('../controllers/tenantAdminController');
const { authenticateToken } = require('../middleware/auth');
const { identifyTenant, requireTenant } = require('../middleware/tenantIdentification');


// All routes require authentication
router.use(authenticateToken);


// Tenant user management routes
router.post('/users', tenantAdminController.addUserToTenant);
router.get('/users', tenantAdminController.getTenantUsers);
router.put('/users/:userId', tenantAdminController.updateTenantUser);
router.delete('/users/:userId', tenantAdminController.removeUserFromTenant);

module.exports = router;
