# Guía de Desarrollo: Gestión y Carga de Feriados Anuales

Este documento describe la situación actual de los feriados en la aplicación y presenta propuestas técnicas para que un desarrollador implemente la carga anual de feriados de forma eficiente (por lote o automática) y corrija el cálculo de días de vacaciones solicitados.

---

## 1. Arquitectura y Estado Actual de los Feriados

### Base de Datos (`schema.prisma`)
El modelo `Holiday` almacena los feriados individuales:
```prisma
model Holiday {
  id              String   @id @default(uuid())
  name            String
  date            DateTime
  deductsVacation Boolean  @default(false) // true = se descuenta del saldo; false = día no laborable/feriado estándar
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([date])
}
```

### Rutas y Controladores (`holiday.routes.ts` & `holiday.controller.ts`)
Existen endpoints CRUD estándar bajo `/api/holidays`:
- `GET /api/holidays`: Lista todos los feriados.
- `POST /api/holidays`: Crea un feriado (solo Admin).
- `PUT /api/holidays/:id`: Modifica un feriado (solo Admin).
- `DELETE /api/holidays/:id`: Elimina un feriado (solo Admin).

### Limitaciones Actuales
1. **Carga Manual:** El sistema solo permite crear feriados de a uno por vez mediante la interfaz de usuario (`+ Nuevo feriado`), lo cual es tedioso al inicio de cada año (15-20 feriados anuales en Argentina).
2. **Cálculo de Días de Vacaciones:** La función `calendarDaysBetween` en `dates.ts` calcula los días de vacaciones como días corridos (calendario), pero **no consulta la base de datos** para restar los feriados que caen en el rango y que están configurados con `deductsVacation = false`.

---

## 2. Opciones de Solución para la Carga Anual (Próximo Año)

Para evitar la carga manual de a un feriado a la vez, se proponen dos alternativas de desarrollo:

### Opción A: Importación por Lotes vía Archivo JSON/CSV (Recomendada por Simplicidad)
Consiste en permitir que el Administrador suba un archivo (JSON o CSV) con el calendario del año, o bien correr un comando CLI desde la consola.

#### Implementación en Backend (Comando CLI de Semilla)
Crear un script `backend/src/scripts/import-holidays.ts` que lee un archivo y lo inserte usando `prisma.holiday.upsert`:
```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const filePath = path.join(__dirname, '../../holidays-2027.json');
  if (!fs.existsSync(filePath)) {
    console.error(`Archivo no encontrado: ${filePath}`);
    process.exit(1);
  }

  const holidays = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  console.log(`Importando ${holidays.length} feriados...`);

  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { date: new Date(h.date) },
      update: { name: h.name, deductsVacation: h.deductsVacation ?? false },
      create: {
        name: h.name,
        date: new Date(h.date),
        deductsVacation: h.deductsVacation ?? false,
      },
    });
  }
  console.log('✅ Feriados importados con éxito.');
}

main().finally(() => prisma.$disconnect());
```

#### Formato del JSON (`holidays-2027.json`)
```json
[
  { "date": "2027-01-01T00:00:00.000Z", "name": "Año Nuevo", "deductsVacation": false },
  { "date": "2027-02-08T00:00:00.000Z", "name": "Carnaval", "deductsVacation": false }
]
```

---

### Opción B: Integración Automática con API Externa (Recomendada por Experiencia de Usuario)
Consiste en consumir una API pública de feriados (por ejemplo, para Argentina la API de `nolaborables.com.ar`) y precargar los datos con un solo clic o mediante una tarea programada (cron).

#### Ejemplo de Implementación en Backend
Crear un endpoint `/api/holidays/import-external/:year` (solo para administradores):

```typescript
import axios from 'axios';

export async function importFromExternal(req: Request, res: Response) {
  const { year } = req.params;
  const targetYear = parseInt(year) || new Date().getFullYear();

  try {
    // API de feriados de Argentina
    const response = await axios.get(`https://nolaborables.com.ar/api/v1/feriados/${targetYear}`);
    const externalHolidays = response.data; // Array con [{ motivo, dia, mes, tipo }]

    let importedCount = 0;

    for (const item of externalHolidays) {
      // nolaborables.com.ar usa mes 1-indexed y día
      const date = new Date(Date.UTC(targetYear, item.mes - 1, item.dia));
      
      // Determinar si descuenta vacaciones
      // Por defecto, feriados inamovibles/trasladables no descuentan (deductsVacation = false)
      // Días no laborables pueden configurarse según política
      const deductsVacation = item.tipo === 'nolaborable'; 

      await prisma.holiday.upsert({
        where: { date },
        update: { name: item.motivo },
        create: {
          name: item.motivo,
          date,
          deductsVacation,
        },
      });
      importedCount++;
    }

    res.json({ message: `Se importaron/actualizaron ${importedCount} feriados para el año ${targetYear}` });
  } catch (error) {
    res.status(500).json({ error: 'Error al conectar con la API externa de feriados' });
  }
}
```

---

## 3. Corrección Crítica: Cálculo de Días en Solicitudes

Actualmente, al pedir vacaciones, no se restan los feriados del saldo a descontar. Para solucionarlo, se debe modificar la lógica de cálculo en la creación y edición de solicitudes en `vacation.controller.ts`:

### Propuesta de Corrección
En `vacation.controller.ts` (funciones `create` y `update`):
1. Obtener la lista de feriados registrados en la base de datos que caen dentro del rango solicitado y que tengan `deductsVacation = false`.
2. Restar esos días del total calculado por `calendarDaysBetween`.

```typescript
// En create y update de vacation.controller.ts:
const calendarDays = calendarDaysBetween(body.startDate, body.endDate);

// Buscar feriados registrados que caigan en el rango y NO descuenten vacaciones
const nonDeductibleHolidays = await prisma.holiday.count({
  where: {
    date: {
      gte: body.startDate,
      lte: body.endDate,
    },
    deductsVacation: false,
  },
});

// Los días a descontar reales son los días de calendario menos los feriados no laborables en el rango
const days = Math.max(0, calendarDays - nonDeductibleHolidays);
```
*(Nota: Si la empresa tampoco descuenta los fines de semana cuando están dentro de los feriados o si la ley LCT aplica días corridos de forma estricta, esta resta es la forma correcta de exceptuar los feriados nacionales del cómputo).*
