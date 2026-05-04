const router = require('express').Router({ mergeParams: true });
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',    ctrl.listByInvoice);
router.post('/',   ctrl.create);
router.delete('/:id', ctrl.remove);

module.exports = router;
