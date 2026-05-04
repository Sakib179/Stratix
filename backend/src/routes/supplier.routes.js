const router = require('express').Router();
const ctrl = require('../controllers/supplier.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',     ctrl.list);
router.post('/',    ctrl.create);
router.get('/:id',  ctrl.get);
router.put('/:id',  ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
