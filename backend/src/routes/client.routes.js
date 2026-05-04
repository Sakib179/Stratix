const router = require('express').Router();
const ctrl = require('../controllers/client.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',        ctrl.list);
router.get('/search',  ctrl.search);
router.get('/:id',     ctrl.get);
router.post('/',       ctrl.create);
router.put('/:id',     ctrl.update);

module.exports = router;
