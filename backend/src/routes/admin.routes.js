const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

router.use(authenticate, requireAdmin);

router.get('/stats',              ctrl.systemStats);
router.get('/audit-logs',         ctrl.auditLogs);
router.get('/users',              ctrl.listUsers);
router.get('/users/:id',          ctrl.getUser);
router.post('/users',             ctrl.createUser);
router.put('/users/:id',          ctrl.updateUser);
router.delete('/users/:id',       ctrl.deleteUser);
router.post('/users/:id/reset-password',   ctrl.resetPassword);
router.put('/users/:id/permissions',       ctrl.updatePermissions);

module.exports = router;
