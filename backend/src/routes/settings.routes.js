const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/',  ctrl.getAll);
router.put('/',  requireAdmin, ctrl.update);

module.exports = router;
