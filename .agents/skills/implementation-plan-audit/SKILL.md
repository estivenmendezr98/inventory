---
name: implementation-plan-audit
description: Auditar el monorepo frente a implementation_plan.md (permisos, módulos, facturación, Docker) y reportar brechas o riesgos.
---

# Auditoría vs `implementation_plan.md`

Usa esta habilidad cuando el usuario pida comprobar que el sistema cumple el plan, revisar un módulo (p. ej. ventas/POS) o generar un checklist de regresión.

## Orden de trabajo

1. **Leer** `implementation_plan.md` (matriz de permisos, facturación, infra).
2. **Fuente de verdad de permisos:** `backend/prisma/seed.ts` (arrays `roles` por `code`) y `backend/src/auth/role-seed-permissions.ts` (fallback JWT). La matriz del plan puede resumir nombres; el código usa códigos exactos (`pos.apply_discount`, no `pos.discount`).
3. **Controllers Nest:** buscar `@RequirePermissions` en `backend/src/modules/<modulo>/` y contrastar con el plan.
4. **Frontend:** `frontend/src/components/layout/Sidebar.tsx` (`permission` por ruta) y la página del módulo (`hasPermission`).
5. **Ventas / inventario:** revisar `sales.service.ts` — creación en `$transaction`, validación de stock, kardex OUT; `cancel` / `refund` con `reverseSaleStock` y estados `SaleStatus`.
6. **Facturación:** `invoices` + `invoice-artifacts.service.ts`, rutas `invoices.generate` **o** `invoices.create` en guards.
7. **E2E Playwright:** `npm run test:e2e:sales` (ventas + API); `npm run test:e2e:inventory` (productos). Requiere Vite, Keycloak y Nest según `playwright.config.ts`.

## Salida esperada

- Tabla o lista: **Cumple / Desviación / Riesgo** con referencia a archivo.
- Si no hay tests E2E del flujo, sugerir **comprobación manual** (rol CAJERO: POS → venta completada → inventario; ADMIN: cancelar venta → stock restaurado).

## No hacer

- No reescribir el plan entero salvo petición explícita; corregir solo filas desalineadas (nombres de permiso) o añadir notas aclaratorias.
