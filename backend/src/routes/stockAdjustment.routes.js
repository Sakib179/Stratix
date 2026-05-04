const router = require('express').Router();
const ctrl = require('../controllers/stockAdjustment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',                          ctrl.list);
router.post('/',                         ctrl.create);
router.get('/product/:productId',        ctrl.productHistory);

module.exports = router;
