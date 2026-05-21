---
name: keycloak-security-auth
description: Usa esta habilidad para gestionar autenticación, Guards de permisos, rotación de tokens y eventos de Keycloak.
---

# Habilidad: Seguridad y Autenticación con Keycloak

Esta habilidad está dedicada a la implementación y gestión de la seguridad, control de acceso y flujos de autenticación en la arquitectura.

## Reglas de Código Limpio, Seguridad y Buenas Prácticas

- **Manejo Seguro de UserSessions**: Garantiza que las sesiones de usuario se gestionen y verifiquen de forma segura en cada solicitud, previniendo el secuestro de sesiones y controlando su expiración.
- **Integración Bidireccional de Usuarios**: Mantén sincronizada la información del usuario entre Keycloak y nuestra base de datos local según la arquitectura definida. Todo cambio de estado crítico debe reflejarse correctamente.
- **Validación Estricta de Roles/Permisos**: Implementa y usa Guards para proteger todos los endpoints o rutas. La validación debe basarse en el esquema de RBAC (Role-Based Access Control) y permisos granulares definidos, evitando cualquier acceso no autorizado por defecto (Fail-Secure).

## 🛑 Principio de "Cero Impulsividad"

**INSTRUCCIÓN OBLIGATORIA PARA TU YO DEL FUTURO:**
SIEMPRE que vayas a proponer o modificar código bajo esta habilidad, DEBES abrir un bloque `<thinking>` antes de tu respuesta. Analiza a fondo los vectores de ataque, el flujo del token y el esquema de permisos. La seguridad no perdona errores; planifica antes de codificar.
