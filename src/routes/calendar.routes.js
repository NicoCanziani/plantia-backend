const { Router } = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const { listEvents, createEvent, updateEvent, deleteEvent, completeEvent } = require('../controllers/calendar.controller');

const router = Router();
router.use(authMiddleware);

router.get('/', listEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);
router.patch('/:id/complete', completeEvent);

module.exports = router;
