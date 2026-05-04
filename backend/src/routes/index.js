const router = require('express').Router();

router.use('/auth',             require('./auth.routes'));
router.use('/users',            require('./user.routes'));
router.use('/notifications',    require('./notification.routes'));
router.use('/products',         require('./product.routes'));
router.use('/clients',          require('./client.routes'));
router.use('/invoices',         require('./invoice.routes'));
router.use('/invoices/:invoiceId/payments', require('./payment.routes'));
router.use('/payments',         require('./payment.routes'));
router.use('/quotations',       require('./quotation.routes'));
router.use('/stock-adjustments',require('./stockAdjustment.routes'));
router.use('/expenses',         require('./expense.routes'));
router.use('/suppliers',        require('./supplier.routes'));
router.use('/purchase-orders',  require('./purchaseOrder.routes'));
router.use('/admin',            require('./admin.routes'));
router.use('/analytics',        require('./analytics.routes'));
router.use('/settings',         require('./settings.routes'));

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Stratix BMS API is running', version: '1.0.0', timestamp: new Date().toISOString() });
});

module.exports = router;
