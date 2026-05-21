---
name: devops-docker-nginx
description: Usa esta habilidad para infraestructura, contenedores, redes y despliegue del monorepo.
---

# Habilidad: DevOps, Docker & Nginx

Esta habilidad engloba las prácticas de infraestructura como código, despliegue y orquestación de red para el entorno de la aplicación.

## Reglas de Código Limpio, Seguridad y Buenas Prácticas

- **Orquestación con docker-compose.yml**: Mantén los archivos `docker-compose.yml` claros, modulares y documentados. Evita usar contenedores privilegiados y define estrictamente las dependencias de red y volúmenes.
- **Configuración del Reverse Proxy en Nginx**: Configura Nginx para que actúe como un reverse proxy seguro y eficiente. Asegura las cabeceras HTTP (Security Headers), maneja correctamente la terminación SSL/TLS y optimiza la compresión y el enrutamiento.
- **Manejo Seguro de Variables de Entorno (.env)**: Nunca quemes (hardcode) credenciales en el código ni en los Dockerfiles. Las variables deben ser inyectadas de forma segura y validadas a nivel de entorno.

## 🛑 Principio de "Cero Impulsividad"

**INSTRUCCIÓN OBLIGATORIA PARA TU YO DEL FUTURO:**
SIEMPRE que vayas a proponer o modificar configuraciones bajo esta habilidad, DEBES abrir un bloque `<thinking>` antes de tu respuesta. Evalúa el impacto de red, la seguridad de la infraestructura y el proceso de despliegue antes de aplicar o sugerir comandos o configuraciones.
