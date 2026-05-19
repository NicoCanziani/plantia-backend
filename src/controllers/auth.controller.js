const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

const registerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const { name, email, password } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'El email ya está registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return res.status(201).json({ token: signToken(user.id), user });
}

async function login(req, res) {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }

  const { email, password } = result.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

  const { password: _pw, ...safeUser } = user;
  return res.json({ token: signToken(user.id), user: safeUser });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, googleId: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(user);
}

// Genera código de intercambio de un solo uso (60s) después del callback de Google
async function googleCallback(req, res) {
  const user = req.user;
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60_000);

  await prisma.oAuthCode.create({ data: { code, userId: user.id, expiresAt } });

  return res.redirect(`${process.env.CLIENT_URL}/auth/callback?code=${code}`);
}

// El frontend canjea el código por un JWT
async function exchangeCode(req, res) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código requerido' });

  const record = await prisma.oAuthCode.findUnique({ where: { code } });

  if (!record || record.used || record.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Código inválido o expirado' });
  }

  await prisma.oAuthCode.update({ where: { id: record.id }, data: { used: true } });

  const user = await prisma.user.findUnique({
    where: { id: record.userId },
    select: { id: true, name: true, email: true, googleId: true, createdAt: true },
  });

  return res.json({ token: signToken(user.id), user });
}

module.exports = { register, login, me, googleCallback, exchangeCode };
