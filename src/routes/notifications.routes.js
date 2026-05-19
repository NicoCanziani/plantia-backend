const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { getSettings, updateSettings, subscribe, unsubscribe } = require('../controllers/notifications.controller');

const router = Router();
router.use(authMiddleware);

router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/subscribe', subscribe);
router.delete('/subscribe', unsubscribe);

module.exports = router;
