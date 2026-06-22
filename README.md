# Canal Directo — Gestión de Vacaciones

Aplicación web moderna y responsive para que una empresa registre, visualice y administre las vacaciones de sus empleados mediante un calendario interactivo.

![stack](https://img.shields.io/badge/stack-React%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-blue)

## ✨ Funcionalidades

- **Dashboard** con calendario (mes / semana / año) y métricas en tiempo real.
- **Gestión de empleados** (CRUD completo) con departamentos, cargos y saldo anual.
- **Solicitudes de vacaciones** desde el calendario, con cálculo automático de días, validación de saldo y de superposición.
- **Aprobación de solicitudes** con comentarios e historial de decisiones.
- **Calendario de equipo** con colores por departamento y tooltips.
- **Reportes** por empleado y por departamento, con exportación a **Excel** y **PDF**.
- **Roles y permisos**: Administrador y Empleado.
- **Autenticación JWT** con login y recuperación de contraseña.
- **Notificaciones por email** al aprobar/rechazar.
- **Auditoría de cambios** y **API REST documentada** (Swagger).
- **Modo claro/oscuro** y diseño tipo SaaS.

## 🧱 Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + componentes propios estilo shadcn/ui |
| Calendario | FullCalendar |
| Backend | Node.js + Express + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (access + refresh) |
| Docs | Swagger / OpenAPI |
| Despliegue | Docker + docker-compose |

## 📂 Estructura

```
.
├── backend/            # API REST (Express + Prisma)
│   ├── prisma/         # schema + seed
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/
│       └── utils/
├── frontend/           # SPA (React + Vite)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── lib/
│       └── pages/
├── docker-compose.yml
└── README.md
```

## 🚀 Puesta en marcha

### Opción A — Docker (recomendada)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:4000/api
- Docs API: http://localhost:4000/api/docs

La base de datos se migra y se siembra automáticamente al levantar el contenedor del backend.

### Opción B — Local

Requisitos: Node 20+, PostgreSQL 15+.

**Backend**

```bash
cd backend
cp .env.example .env          # ajusta DATABASE_URL y secretos
npm install
npm run prisma:migrate        # crea las tablas
npm run seed                  # carga datos de ejemplo
npm run dev                   # http://localhost:4000
```

**Frontend**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

## 👤 Credenciales de ejemplo

Por defecto, al ejecutar el seed, la base de datos se inicializa con un único usuario administrador:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | `admin@canaldirecto.com` | `Admin123!` |

> [!NOTE]
> *(Los usuarios con rol de empleado deben ser creados desde el panel de administración una vez dentro del sistema).*

## 📖 Documentación de la API

Disponible en `http://localhost:4000/api/docs` (Swagger UI) una vez levantado el backend.

## 🧪 Scripts útiles (backend)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor en modo desarrollo (hot reload) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm start` | Ejecuta la build de producción |
| `npm run prisma:migrate` | Aplica migraciones |
| `npm run prisma:studio` | Abre Prisma Studio |
| `npm run seed` | Siembra datos de ejemplo |

## 🔐 Variables de entorno

Ver `backend/.env.example` y `frontend/.env.example`.

## 📝 Licencia

MIT
