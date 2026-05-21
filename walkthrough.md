# Fase 1 — Walkthrough

## Resumen

Se implementó la Fase 1 completa del Sistema de Inventario con código funcional y verificado. Ambos builds (frontend y backend) pasan exitosamente.

---

## Archivos Creados

### Infraestructura (Raíz)

| Archivo | Descripción |
|---------|-------------|
| [docker-compose.yml](file:///d:/SOFTWARE/INVENTORY/docker-compose.yml) | 9 servicios: 2×PostgreSQL, Keycloak, Redis, MinIO, Nginx, Netdata, Backend, Frontend |
| [.env.example](file:///d:/SOFTWARE/INVENTORY/.env.example) | Variables: `DB_APP_USER=root`, `DB_APP_PASSWORD=1234`, Keycloak, Redis, MinIO |
| [.env](file:///d:/SOFTWARE/INVENTORY/.env) | Copia funcional del .env.example |
| [.gitignore](file:///d:/SOFTWARE/INVENTORY/.gitignore) | Exclusiones para Node, Docker, Prisma |
| [nginx/conf.d/default.conf](file:///d:/SOFTWARE/INVENTORY/nginx/conf.d/default.conf) | Reverse proxy: `/api` → backend, `/` → frontend, WebSocket support |
| [keycloak/realm-export.json](file:///d:/SOFTWARE/INVENTORY/keycloak/realm-export.json) | Realm `inventory` con 3 roles exactos y 3 usuarios seed |
| [scripts/setup.ps1](file:///d:/SOFTWARE/INVENTORY/scripts/setup.ps1) | Setup completo para Windows 11 |

---

### Backend NestJS

| Archivo | Descripción |
|---------|-------------|
| [prisma/schema.prisma](file:///d:/SOFTWARE/INVENTORY/backend/prisma/schema.prisma) | Schema completo: 6 tablas RBAC normalizadas + 15 tablas de negocio |
| [prisma/seed.ts](file:///d:/SOFTWARE/INVENTORY/backend/prisma/seed.ts) | **58 permisos** + 3 roles + matrix RolePermission + usuario superadmin |
| [src/main.ts](file:///d:/SOFTWARE/INVENTORY/backend/src/main.ts) | Entry point con ValidationPipe, CORS, prefijo `/api` |
| [src/app.module.ts](file:///d:/SOFTWARE/INVENTORY/backend/src/app.module.ts) | Root module: Config, Prisma, Auth, Health |
| [src/prisma/](file:///d:/SOFTWARE/INVENTORY/backend/src/prisma) | PrismaModule (global) + PrismaService |
| [src/auth/](file:///d:/SOFTWARE/INVENTORY/backend/src/auth) | AuthModule + AuthService + AuthController + JwtStrategy (JWKS Keycloak) |
| [src/common/guards/](file:///d:/SOFTWARE/INVENTORY/backend/src/common/guards) | PermissionsGuard (resuelve permisos desde RolePermission) |
| [src/common/decorators/](file:///d:/SOFTWARE/INVENTORY/backend/src/common/decorators) | `@RequirePermissions()` + `@CurrentUser()` |
| [src/common/filters/](file:///d:/SOFTWARE/INVENTORY/backend/src/common/filters) | AllExceptionsFilter |
| [src/modules/health/](file:///d:/SOFTWARE/INVENTORY/backend/src/modules/health) | `/api/health` (200 + `status`), `/api/health/live`, `/api/health/ready` (503 si BD cae) |

---

### Frontend React

| Archivo | Descripción |
|---------|-------------|
| [vite.config.ts](file:///d:/SOFTWARE/INVENTORY/frontend/vite.config.ts) | Vite + React plugin + alias `@/` |
| [tailwind.config.js](file:///d:/SOFTWARE/INVENTORY/frontend/tailwind.config.js) | Tailwind v3 con variables CSS shadcn/ui-compatible |
| [src/index.css](file:///d:/SOFTWARE/INVENTORY/frontend/src/index.css) | Design tokens dark/light, Inter + JetBrains Mono, scrollbar styles |
| [src/App.tsx](file:///d:/SOFTWARE/INVENTORY/frontend/src/App.tsx) | Keycloak init + user sync + loading/error states |
| [src/router.tsx](file:///d:/SOFTWARE/INVENTORY/frontend/src/router.tsx) | React Router con AppShell layout |
| [src/lib/keycloak.ts](file:///d:/SOFTWARE/INVENTORY/frontend/src/lib/keycloak.ts) | Keycloak JS client config |
| [src/lib/utils.ts](file:///d:/SOFTWARE/INVENTORY/frontend/src/lib/utils.ts) | `cn()` utility (clsx + tailwind-merge) |
| [src/stores/](file:///d:/SOFTWARE/INVENTORY/frontend/src/stores) | Zustand: auth.store + sidebar.store |
| [src/components/layout/](file:///d:/SOFTWARE/INVENTORY/frontend/src/components/layout) | AppShell, Sidebar (permission-filtered), Header (role badge + theme toggle) |
| [src/features/dashboard/](file:///d:/SOFTWARE/INVENTORY/frontend/src/features/dashboard) | Dashboard con stat cards, alertas stock bajo, ventas recientes |

---

## Modelo RBAC Normalizado

### Tablas Creadas
- `roles` → 3 roles: SUPER_ADMINISTRADOR, ADMINISTRADOR, CAJERO
- `permissions` → 58 permisos estandarizados
- `role_permissions` → Relación N:N normalizada
- `users` → FK a roles
- `user_sessions` → Sesiones JWT
- `audit_logs` → Auditoría de acciones

### Permisos Estandarizados (muestra)
```
pos.access, pos.apply_discount, pos.suspend_sale, pos.resume_sale
cash_register.open, cash_register.close, cash_register.movement, cash_register.view_all
invoices.view, invoices.create, invoices.cancel, invoices.reprint, invoices.config
```

---

## Verificación

| Test | Resultado |
|------|-----------|
| `npx nest build` | ✅ Exitoso |
| `npx vite build` | ✅ Exitoso (330KB JS, 12KB CSS) |
| `npx prisma generate` | ✅ Client generado |
| `docker compose build` | ⏳ Requiere Docker Desktop |
| `docker compose up -d` | ⏳ Requiere Docker Desktop |
| `npx prisma migrate deploy` | ⏳ Requiere PostgreSQL activo |
| `npx prisma db seed` | ⏳ Requiere PostgreSQL activo |

---

## Próximos Pasos

Para ejecutar el sistema completo:

```powershell
cd d:\SOFTWARE\INVENTORY
.\scripts\setup.ps1
```

O manualmente:
```powershell
docker compose build
docker compose up -d
# Esperar ~30s para que los servicios arranquen
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

Servicios disponibles:
- **Frontend**: http://localhost
- **API Health**: `/api/health` (siempre 200, ver `status` en JSON), liveness `/api/health/live`, readiness `/api/health/ready` (503 si la BD falla)
- **Keycloak**: http://localhost:8080 (admin/admin)
- **MinIO Console**: http://localhost:9001
- **Netdata**: http://localhost:19999
