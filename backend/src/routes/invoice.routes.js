const router = require('express').Router();
const ctrl = require('../controllers/invoice.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',                   ctrl.list);
router.get('/:id',                ctrl.get);
router.post('/',                  ctrl.create);
router.patch('/:id/status',       ctrl.updateStatus);
router.post('/:id/duplicate',     ctrl.duplicate);
router.get('/:id/pdf',            ctrl.exportPDF);
router.post('/:id/send-email',    ctrl.sendEmail);

module.exports = router;
