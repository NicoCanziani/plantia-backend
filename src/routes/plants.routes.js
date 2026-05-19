const { Router } = require('express');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth.middleware');
const {
  listPlants, getPlant, createPlant, updatePlant, deletePlant, uploadPlantImage,
} = require('../controllers/plants.controller');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

router.use(authMiddleware);

router.get('/', listPlants);
router.get('/:id', getPlant);
router.post('/', createPlant);
router.put('/:id', updatePlant);
router.delete('/:id', deletePlant);
router.post('/:id/image', upload.single('image'), uploadPlantImage);

module.exports = router;
