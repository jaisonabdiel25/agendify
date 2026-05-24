---
name: build-test-lint
description: ejecuta el build del proyecto, si encuentras fallos corrigelos. ejecuta las test del proyecto con coberturas (pnpm run test:coverage) si alguna falla o la cobertura esta por debajo del lumbral, corrige. Ejecuta el lint del proyecto (pnpm run lint) si falla corrige los errores.
---

## Instrucciones

1. Ejecuta `pnpm run build`. Si hay errores de compilación, corrígelos.
2. Ejecuta `pnpm run test:coverage`. Si algún test falla o la cobertura está por debajo del umbral, corrige el código.
3. Ejecuta `pnpm run lint`. Si hay errores de lint, corrígelos.

Repite los pasos hasta que los tres pasen sin errores.