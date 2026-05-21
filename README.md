# Sistema de Inventario (INVENTORY)

Monorepo: **NestJS + Prisma + PostgreSQL**, **React + Vite**, **Keycloak**, **Docker/Podman**.

## Contenido del repositorio

- Código fuente completo (`backend/`, `frontend/`, `nginx/`, `keycloak/`)
- Variables de entorno (`.env`, `backend/.env`) — **use repositorio privado**
- Volcados SQL con datos: `backend/database-export/`

## Arranque rápido

```bash
cp .env.example .env   # si no usa el .env incluido
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy
```

## Restaurar bases de datos con datos

Ver [backend/database-export/README.md](backend/database-export/README.md).

## Credenciales por defecto (desarrollo)

- Keycloak / app: ver `.env.example` y `keycloak/realm-export.json`
- Usuario típico: `superadmin` / `admin123`

**Importante:** al ser público o compartido, rote contraseñas y secretos en producción.
