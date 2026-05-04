const router = require('express').Router();
const userCtrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadProfileFile } = require('../middleware/upload.middleware');

router.use(authenticate);

router.get('/profile', userCtrl.getProfile);
router.patch('/profile', userCtrl.updateProfile);
router.patch('/:id/profile', userCtrl.updateProfile);

router.post('/change-password', userCtrl.changePassword);

router.get('/activity-log', userCtrl.getActivityLog);

router.get('/attachments', userCtrl.getAttachments);
router.get('/:id/attachments', userCtrl.getAttachments);
router.post('/attachments', uploadProfileFile, userCtrl.uploadAttachment);
router.post('/:id/attachments', uploadProfileFile, userCtrl.uploadAttachment);
router.delete('/attachments/:attachmentId', userCtrl.deleteAttachment);

router.post('/2fa/setup', userCtrl.setup2FA);
router.post('/2fa/verify-setup', userCtrl.verify2FASetup);
router.post('/2fa/disable', userCtrl.disable2FA);

module.exports = router;
