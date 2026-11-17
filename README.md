# Smart Punto de Venta

Sistema de Punto de Venta (POS), facturación, control de inventario y administración comercial desarrollado con **React**, **TypeScript**, **Tailwind CSS** y **Supabase PostgreSQL**. 

---

## Características principales

### 1. Autenticación, Roles y Seguridad
- **Inicio de sesión dual**: Por **Usuario / PIN** (PIN por defecto: `1234`) o **Supabase Auth**, con fondo animado en tiempo real (`<canvas>` + CSS).
- **Control de acceso por roles**:
  - `ADMINISTRADOR`: Control total de facturación, inventario, compras, caja, usuarios, empresas y configuración.
  - `CAJERO`: Enfocado en ventas, preventas, caja y consultas rápidas.
  - `INVENTARIO`: Gestión de productos, compras, traslados y auditorías físicas.
  - `CONTABILIDAD`: Cuentas por cobrar/pagar, diario digital, gastos, planilla y reportes.
- **Cambio de rol seguro**: Requiere validación de contraseña/PIN del usuario destino y cuenta con botón directo de **Cerrar Sesión**.

### 2. Ventas y Facturación (`SalesModule`)
- Modos **Venta Estándar**, **Nueva Venta Táctil** (tarjetas visuales con imágenes de productos), **Lista de Ventas** y **PreVentas**.
- Condiciones de pago: **Contado**, **Crédito** y **Tarjeta**, con soporte de exoneración de impuestos, descuentos por línea y niveles de precio.
- Numeración secuencial automática (`max + 1`), descuento de inventario en tiempo real y actualización de saldo de clientes al crear, editar o eliminar ventas.

### 3. Sistema de Impresión y Vista Previa en Vivo (`printService.ts`)
- Impresión limpia mediante `iframe` aislado con reglas `@page` dedicadas (sin imprimir menús ni barras de la interfaz).
- **Vista previa en vivo** antes de imprimir con cambio instantáneo entre formatos:
  - **Ticket Térmico 80mm** (`TICKET_80MM`): Encabezado con logo, RUC, detalle compacto, totales, código de barras y pie de página.
  - **Ticket Térmico 58mm** (`TICKET_58MM`): Versión compacta para impresoras portátiles de 58mm.
  - **Boleta de Venta / Media Carta** (`MEDIA_CARTA`, 140 mm × 216 mm): Diseño tipo recibo con filas alternadas y firma de recepción.
  - **Factura Formal / Carta A4** (`CARTA_A4`): Diseño corporativo completo con color configurable, desglose fiscal (Gravado, Exento, ISV 15%), leyenda *Original / Copia* y doble firma.
- También incluye impresión de **Comprobantes de Compra** y **Etiquetas Térmicas** (50 mm × 28 mm) con código y precio en `C$`.

### 4. Productos e Inventario (`ProductsModule`)
- Cálculo bidireccional de `COSTO`, `UTILIDAD %`, `ISV %`, `PRECIO DE VENTA` y `UTILIDAD` en los 4 niveles de precio.
- Soporte para imágenes de productos (Supabase Storage + respaldo local), historial de movimientos (Kardex), kits/combos e impresión de etiquetas.

### 5. Compras, Caja, Cuentas y Operaciones
- **Compras (`PurchasesModule`)**: Ingreso de mercadería con cálculo de ISV incluido o agregado, actualización de costos, existencias y cuentas por pagar.
- **Diario Digital y Caja (`ExpensesCashModule`)**: Control de efectivo de inicio, ingresos, gastos, retiros, abonos y cierre de caja (excluyendo preventas y ventas anuladas).
- **Cuentas por Cobrar / Pagar (`AccountsModule`)**: Registro de abonos, recargos y cheques con actualización automática de saldos.
- **Operaciones, Auditoría, RRHH y Reportes**: Cotizaciones convertibles a venta, traslados entre sucursales, auditorías de inventario, empleados/planilla y exportación a CSV/Excel.

---

## Tecnologías utilizadas

- **Frontend**: React 18.3, TypeScript 5.6, Vite 6.0
- **Estilos e Iconos**: Tailwind CSS 3.4, Lucide React
- **Base de Datos y Auth**: `@supabase/supabase-js` (PostgreSQL + Storage + Auth)

---

## Base de datos (`supabase/schema.sql`)

El esquema en Supabase PostgreSQL incluye las siguientes tablas en `public`:

- `companies`, `pos_users`
- `clients`, `suppliers`, `products`
- `sales`, `purchases`, `quotes`, `transfers`, `orders`
- `account_movements`, `expenses`, `cash_closings`
- `product_audits`, `employees`, `payroll_movements`

---

## Estructura del proyecto

```text
├── public/                 # Recursos estáticos (logo, fondo de login)
├── supabase/
│   └── schema.sql          # Esquema SQL de tablas para Supabase
├── src/
│   ├── components/         # DesktopShell, LoginScreen
│   ├── context/            # POSContext (estado global y sincronización)
│   ├── data/               # Catálogos iniciales
│   ├── lib/                # Cliente Supabase y mapeadores DB
│   ├── modules/            # Módulos funcionales (Ventas, Compras, Productos, etc.)
│   ├── types/              # Interfaces TypeScript del sistema POS
│   ├── utils/              # Servicio de impresión (printService.ts)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```

---

## Instalación y ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno** (`.env` en la raíz del proyecto):
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

3. **Inicializar la base de datos**:
   - Ejecuta el contenido de `supabase/schema.sql` en el **SQL Editor** de tu proyecto en Supabase.

4. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```

5. **Compilar para producción**:
   ```bash
   npm run build
   ```

6. **Previsualizar compilación de producción**:
   ```bash
   npm run preview
   ```
