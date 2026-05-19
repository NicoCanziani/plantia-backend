const { Router } = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const { identify, careSummary, wateringSuggestion } = require('../controllers/ai.controller');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.use(authMiddleware);

// Acepta archivo (campo "image") O campo de texto "imageUrl" en multipart
router.post('/identify', upload.single('image'), identify);
router.post('/care-summary', careSummary);
router.post('/watering-suggestion', wateringSuggestion);

module.exports = router;
