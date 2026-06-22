/** Especificación OpenAPI mínima para Swagger UI. */
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Canal Directo — Vacaciones API',
    version: '1.0.0',
    description: 'API REST para la gestión de vacaciones de empleados.',
  },
  servers: [{ url: '/api', description: 'API base' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: { email: { type: 'string' }, password: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Tokens y datos del usuario' }, '401': { description: 'Credenciales inválidas' } },
      },
    },
    '/auth/me': {
      get: { tags: ['Auth'], summary: 'Usuario autenticado', responses: { '200': { description: 'OK' } } },
    },
    '/auth/forgot-password': {
      post: { tags: ['Auth'], summary: 'Solicitar reset de contraseña', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/auth/reset-password': {
      post: { tags: ['Auth'], summary: 'Restablecer contraseña', security: [], responses: { '200': { description: 'OK' } } },
    },
    '/dashboard/summary': {
      get: { tags: ['Dashboard'], summary: 'Métricas del dashboard', responses: { '200': { description: 'OK' } } },
    },
    '/employees': {
      get: { tags: ['Empleados'], summary: 'Listar empleados', responses: { '200': { description: 'OK' } } },
      post: { tags: ['Empleados'], summary: 'Crear empleado (admin)', responses: { '201': { description: 'Creado' } } },
    },
    '/employees/{id}': {
      get: { tags: ['Empleados'], summary: 'Detalle de empleado', responses: { '200': { description: 'OK' } } },
      put: { tags: ['Empleados'], summary: 'Editar empleado (admin)', responses: { '200': { description: 'OK' } } },
      delete: { tags: ['Empleados'], summary: 'Eliminar empleado (admin)', responses: { '204': { description: 'Sin contenido' } } },
    },
    '/departments': {
      get: { tags: ['Departamentos'], summary: 'Listar departamentos', responses: { '200': { description: 'OK' } } },
      post: { tags: ['Departamentos'], summary: 'Crear departamento (admin)', responses: { '201': { description: 'Creado' } } },
    },
    '/vacations': {
      get: { tags: ['Vacaciones'], summary: 'Listar solicitudes', responses: { '200': { description: 'OK' } } },
      post: { tags: ['Vacaciones'], summary: 'Crear solicitud', responses: { '201': { description: 'Creada' } } },
    },
    '/vacations/calendar': {
      get: { tags: ['Vacaciones'], summary: 'Eventos para el calendario de equipo', responses: { '200': { description: 'OK' } } },
    },
    '/vacations/{id}/decision': {
      post: { tags: ['Vacaciones'], summary: 'Aprobar / rechazar (admin)', responses: { '200': { description: 'OK' } } },
    },
    '/reports': {
      get: { tags: ['Reportes'], summary: 'Datos de reportes (admin)', responses: { '200': { description: 'OK' } } },
    },
    '/reports/excel': {
      get: { tags: ['Reportes'], summary: 'Exportar a Excel (admin)', responses: { '200': { description: 'Archivo xlsx' } } },
    },
    '/reports/pdf': {
      get: { tags: ['Reportes'], summary: 'Exportar a PDF (admin)', responses: { '200': { description: 'Archivo pdf' } } },
    },
    '/notifications': {
      get: { tags: ['Notificaciones'], summary: 'Listar notificaciones', responses: { '200': { description: 'OK' } } },
    },
    '/audit': {
      get: { tags: ['Auditoría'], summary: 'Registros de auditoría (admin)', responses: { '200': { description: 'OK' } } },
    },
  },
};
