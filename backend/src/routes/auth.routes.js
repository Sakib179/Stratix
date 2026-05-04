const router = require('express').Router();
const authCtrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { loginLimiter, authLimiter } = require('../middleware/rateLimit.middleware');
const passport = require('../config/passport');
const env = require('../config/env');

router.post('/login',           loginLimiter, authCtrl.login);
router.post('/verify-2fa',      authLimiter,  authCtrl.verifyTwoFactor);
router.post('/refresh',         authLimiter,  authCtrl.refresh);
router.post('/logout',                        authCtrl.logout);
router.get ('/me',              authenticate, authCtrl.getMe);

router.post('/forgot-password', authLimiter,  authCtrl.forgotPassword);
router.post('/reset-password',  authLimiter,  authCtrl.resetPassword);

// Helper: return a clear JSON error if OAuth provider is not configured
const notConfigured = (provider) => (req, res) =>
  res.status(501).json({ success: false, message: `${provider} OAuth is not configured on this server.` });

// ── Google ────────────────────────────────────────────────────────────────────
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );
  router.get('/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed`,
    }),
    authCtrl.oauthCallback
  );
} else {
  router.get('/google',          notConfigured('Google'));
  router.get('/google/callback', notConfigured('Google'));
}

// ── Facebook ──────────────────────────────────────────────────────────────────
if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  router.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'], session: false })
  );
  router.get('/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed`,
    }),
    authCtrl.oauthCallback
  );
} else {
  router.get('/facebook',          notConfigured('Facebook'));
  router.get('/facebook/callback', notConfigured('Facebook'));
}

// ── LinkedIn ──────────────────────────────────────────────────────────────────
if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
  router.get('/linkedin',
    passport.authenticate('linkedin', { session: false })
  );
  router.get('/linkedin/callback',
    passport.authenticate('linkedin', {
      session: false,
      failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed`,
    }),
    authCtrl.oauthCallback
  );
} else {
  router.get('/linkedin',          notConfigured('LinkedIn'));
  router.get('/linkedin/callback', notConfigured('LinkedIn'));
}

module.exports = router;
