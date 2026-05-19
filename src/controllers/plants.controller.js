const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const { uploadImage, deleteImage } = require('../services/imagekit.service');

const prisma = new PrismaClient();

const plantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.string().min(1, 'El tipo es requerido'),
  tag: z.enum(['INTERIOR', 'EXTERIOR']),
  caresSummary: z.string().optional(),
});

const plantUpdateSchema = plantSchema.partial();

async function listPlants(req, res) {
  const { tag, sort } = req.query;

  const where = { userId: req.userId };
  if (tag === 'INTERIOR' || tag === 'EXTERIOR') where.tag = tag;

  const orderBy = sort === 'oldest' ? { addedAt: 'asc' } : { addedAt: 'desc' };

  const plants = await prisma.plant.findMany({ where, orderBy });
  return res.json(plants);
}

async function getPlant(req, res) {
  const plant = await prisma.plant.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
    include: { wateringEvents: { orderBy: { date: 'asc' } } },
  });
  if (!plant) return res.status(404).json({ error: 'Planta no encontrada' });
  return res.json(plant);
}

async function createPlant(req, res) {
  const result = plantSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const plant = await prisma.plant.create({
    data: { ...result.data, userId: req.userId },
  });
  return res.status(201).json(plant);
}

async function updatePlant(req, res) {
  const result = plantUpdateSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const existing = await prisma.plant.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!existing) return res.status(404).json({ error: 'Planta no encontrada' });

  const plant = await prisma.plant.update({
    where: { id: existing.id },
    data: result.data,
  });
  return res.json(plant);
}

async function deletePlant(req, res) {
  const plant = await prisma.plant.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!plant) return res.status(404).json({ error: 'Planta no encontrada' });

  if (plant.imageFileId) {
    await deleteImage(plant.imageFileId).catch(() => {});
  }

  await prisma.plant.delete({ where: { id: plant.id } });
  return res.status(204).end();
}

async function uploadPlantImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });

  const plant = await prisma.plant.findFirst({
    where: { id: Number(req.params.id), userId: req.userId },
  });
  if (!plant) return res.status(404).json({ error: 'Planta no encontrada' });

  // Eliminar imagen anterior si existe
  if (plant.imageFileId) {
    await deleteImage(plant.imageFileId).catch(() => {});
  }

  const ext = req.file.mimetype.split('/')[1] || 'jpg';
  const fileName = `plant-${plant.id}-${Date.now()}.${ext}`;
  const { url, fileId } = await uploadImage(req.file.buffer, fileName);

  const updated = await prisma.plant.update({
    where: { id: plant.id },
    data: { imageUrl: url, imageFileId: fileId },
  });

  return res.json(updated);
}

module.exports = { listPlants, getPlant, createPlant, updatePlant, deletePlant, uploadPlantImage };
