---
name: build-test-lint
description: |
  Valida la calidad del código ejecutando build, tests con cobertura, lint y type-check.
  Úsalo después de realizar cambios grandes (modificación o creación de más de 8 archivos).
---

## Objetivo
Asegurar que el proyecto compila, los tests pasan con cobertura suficiente, 
el código cumple las reglas de estilo y no tiene errores de tipos.

## Pasos

1. `pnpm run type-check` — corrige errores de tipado antes de compilar.
2. `pnpm run build` — corrige errores de compilación.
3. `pnpm run test:coverage` — corrige tests fallidos o cobertura por debajo del umbral.
4. `pnpm run lint` — corrige errores de lint (usa `pnpm run lint:fix` si existe).

## Reglas de corrección

- Corrige solo archivos relacionados con los cambios actuales (`git diff` como referencia).
- Máximo **3 iteraciones** por paso. Si persiste el error, detente y reporta.
- No deshabilites reglas de lint (no `eslint-disable`) sin justificación explícita.
