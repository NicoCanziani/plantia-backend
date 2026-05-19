# Plantia — Backend

API REST para Plantia, una PWA de gestión de plantas domésticas con calendario de riego, identificación por IA y notificaciones push/email.

## Stack

- Node.js 20 / Express 5
- PostgreSQL (Neon) + Prisma ORM
- JWT + Google OAuth (Passport.js)
- ImageKit (almacenamiento de imágenes)
- Groq Cloud / LLaMA 4 Scout (IA con visión)
- web-push + Nodemailer (notificaciones)
- node-cron (scheduler de recordatorios)

## Requisitos

- Node.js 20 LTS
- npm 10+
- Cuenta en Neon (PostgreSQL hosteado)

## Instalación

```bash
npm install
cp .env.example .env
# Completar variables en .env
npx prisma migrate dev --name init
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor en modo desarrollo con nodemon |
| `npm start` | Servidor en producción |
| `npm run db:migrate` | Ejecutar migraciones de Prisma |
| `npm run db:generate` | Regenerar cliente de Prisma |
| `npm run db:seed` | Poblar base de datos con datos iniciales |
| `npm run db:studio` | Abrir Prisma Studio |

## Variables de entorno

Ver `.env.example` para la lista completa de variables requeridas por fase.

## Endpoints disponibles (Fase 1)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /healthz | Health check para UptimeRobot |
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Login con email y contraseña |
| POST | /api/auth/exchange | Canjear código OAuth por JWT |
| GET | /api/auth/me | Usuario autenticado (requiere JWT) |
| GET | /api/auth/google | Iniciar flujo OAuth con Google |
| GET | /api/auth/google/callback | Callback de Google OAuth |

## Flujo Google OAuth

1. Frontend redirige a `GET /api/auth/google`
2. Google autentica y llama al callback del backend
3. Backend genera un código de un solo uso (60s) y redirige a `CLIENT_URL/auth/callback?code=xxx`
4. Frontend hace `POST /api/auth/exchange` con el código
5. Backend valida, invalida el código y devuelve el JWT
