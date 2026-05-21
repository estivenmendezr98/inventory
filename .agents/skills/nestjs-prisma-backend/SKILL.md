---
name: nestjs-prisma-backend
description: Usa esta habilidad SIEMPRE que debas crear o modificar el backend, endpoints, servicios de NestJS o esquemas de Prisma.
---

# Habilidad: NestJS & Prisma Backend

Esta habilidad establece las directrices fundamentales para el desarrollo, modificación y mantenimiento del backend usando NestJS y Prisma.

## Reglas de Código Limpio, Seguridad y Buenas Prácticas

### NestJS
- **Patrón de Inyección de Dependencias**: Respeta estrictamente la arquitectura modular y la inyección de dependencias de NestJS. Mantén un alto grado de desacoplamiento.
- **Validación con DTOs**: Todas las entradas desde los controladores deben ser rigurosamente validadas usando Data Transfer Objects (DTOs) combinados con `class-validator`.
- **Manejo de Excepciones Global**: Implementa y respeta el manejo de excepciones a nivel global (Exception Filters) para estandarizar las respuestas de error y evitar la fuga de información sensible.

### Prisma
- **Consultas Optimizadas**: Evita el problema N+1 asegurando un uso adecuado de consultas relacionales (`include`, `select`).
- **Manejo Transaccional**: Toda operación que involucre múltiples pasos de mutación en la base de datos debe ser envuelta en una transacción de Prisma (`$transaction`) para asegurar la integridad de la data.

## 🛑 Principio de "Cero Impulsividad"

**INSTRUCCIÓN OBLIGATORIA PARA TU YO DEL FUTURO:**
SIEMPRE que vayas a proponer o modificar código bajo esta habilidad, DEBES abrir un bloque `<thinking>` antes de tu respuesta. Analiza el requerimiento, la lógica y los posibles efectos secundarios en la base de datos o arquitectura antes de emitir una sola línea de código.
