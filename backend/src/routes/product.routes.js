const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/rbac.middleware');
const { productImageUpload, csvUpload } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/',           ctrl.list);
router.get('/categories', ctrl.listCategories);
router.get('/csv-template', ctrl.csvTemplate);
router.get('/:id',        ctrl.get);

router.post('/',          productImageUpload.single('image'), ctrl.create);
router.put('/:id',        productImageUpload.single('image'), ctrl.update);
router.delete('/:id',     ctrl.remove);

router.post('/categories',      requireAdmin, ctrl.createCategory);
router.delete('/categories/:id', requireAdmin, ctrl.deleteCategory);

router.post('/bulk-import', csvUpload.single('file'), ctrl.bulkImport);

module.exports = router;
