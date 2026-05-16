
## Diseño
- Todos los diseños que se realzen siempre tienen que ser responsive para cualquier pantalla.

## Arquitectura

**Next.js App Router con dos grupos de rutas:**
- `app/(app)/` — páginas autenticadas (`/payment`, `/vehicle`, `/profile`)
- `app/(auth)/` — páginas públicas (`/signin`, `/register`)
- `app/api/` — rutas REST (auth)


## Reglas

- **No modificar `src/components/ui/`** — son generados por shadcn/ui y se sobreescriben en actualizaciones. Las personalizaciones van en los componentes de cada módulo bajo `modules/`.
- **No instalar dependencias** sin aprobación explícita.
- **No usar `any` como tipo** — siempre tipar correctamente.
- **Siempre manejar errores** en las rutas API.
- **No modificar `/config`** sin preguntar primero.