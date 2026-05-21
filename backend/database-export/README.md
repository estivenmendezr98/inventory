# Respaldo de bases de datos

Volcados PostgreSQL generados para restaurar el entorno con datos.

## Archivos

| Archivo | Base de datos | Contenido |
|---------|---------------|-----------|
| `inventory_bd_full.sql` | `inventory_bd` | Inventario, productos, ventas, usuarios locales, notificaciones, etc. |
| `keycloak_bd_full.sql` | `keycloak_bd` | Usuarios y realm de Keycloak |

## Restaurar (Docker)

Con los contenedores Postgres en marcha:

```bash
# App
docker exec -i inventory-postgres-app psql -U root -d inventory_bd < backend/database-export/inventory_bd_full.sql

# Keycloak (opcional, si necesitas el mismo estado de login)
docker exec -i inventory-postgres-keycloak psql -U keycloak_user -d keycloak_bd < backend/database-export/keycloak_bd_full.sql
```

En instalación nueva, crea las bases vacías antes o usa `docker compose up` y deja que Postgres inicialice; luego importa sobre la BD ya creada (puede requerir `--clean` en pg_restore; con SQL plano, a veces conviene dropear y recrear el schema).

## Regenerar el volcado

```bash
docker exec inventory-postgres-app pg_dump -U root -d inventory_bd --no-owner --no-acl > backend/database-export/inventory_bd_full.sql
docker exec inventory-postgres-keycloak pg_dump -U keycloak_user -d keycloak_bd --no-owner --no-acl > backend/database-export/keycloak_bd_full.sql
```
