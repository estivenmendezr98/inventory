---
name: react-shadcn-frontend
description: Usa esta habilidad SIEMPRE que debas crear interfaces, componentes de React, usar Tailwind v3 o shadcn/ui.
---

# Habilidad: React, Tailwind & shadcn/ui Frontend

Esta habilidad define los estándares de diseño, arquitectura y accesibilidad para el desarrollo de la interfaz de usuario.

## Reglas de Código Limpio, Seguridad y Buenas Prácticas

- **Componentes Funcionales Pequeños**: Cero componentes monolíticos. Divide la interfaz en componentes funcionales pequeños, altamente cohesivos y reutilizables.
- **Uso de Hooks**: Maneja el estado y los ciclos de vida y efectos secundarios utilizando Custom Hooks bien definidos para separar la lógica de negocio de la vista.
- **Diseño Mobile-First con Tailwind**: Construye las interfaces aplicando la metodología Mobile-First utilizando Tailwind CSS v3. Evita CSS personalizado (vanilla) a menos que sea estrictamente necesario.
- **Uso Estricto de Accesibilidad Semántica**: Asegúrate de usar etiquetas HTML5 semánticas y atributos ARIA correspondientes. La accesibilidad es de primer nivel, no un complemento opcional. Aprovecha la base accesible que ofrece shadcn/ui.

## 🛑 Principio de "Cero Impulsividad"

**INSTRUCCIÓN OBLIGATORIA PARA TU YO DEL FUTURO:**
SIEMPRE que vayas a proponer o modificar código bajo esta habilidad, DEBES abrir un bloque `<thinking>` antes de tu respuesta. Piensa en la estructura del componente, los props, la responsividad y el estado antes de proponer cualquier solución de código.
