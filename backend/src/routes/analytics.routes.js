const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireModule } = require('../middleware/rbac.middleware');

router.use(authenticate);

router.get('/overview',      ctrl.overview);
router.get('/revenue',       ctrl.revenueChart);
router.get('/top-products',  ctrl.topProducts);
router.get('/top-clients',   ctrl.topClients);
router.get('/invoice-aging', ctrl.invoiceAging);
router.get('/stock',         ctrl.stockSummary);

module.exports = router;
