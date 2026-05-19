const { Router } = require('express');
const passport = require('../config/passport');
const authMiddleware = require('../middlewares/auth.middleware');
const { register, login, me, googleCallback, exchangeCode } = require('../controllers/auth.controller');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/exchange', exchangeCode);
router.get('/me', authMiddleware, me);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth`, session: false }),
  googleCallback
);

module.exports = router;
