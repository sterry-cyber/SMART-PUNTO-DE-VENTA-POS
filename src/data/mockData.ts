import {
  ModuleId,
  Product,
  Sale,
  Purchase,
  Quote,
  Transfer,
  Order,
  Client,
  Supplier,
  AccountMovement,
  ProductAudit,
  Employee,
  PayrollMovement,
  Expense,
  CashClosing,
  CompanyProfile,
  UserRoleAccount,
  SystemConfig,
} from '../types/pos';

// Mapa de permisos requerido por cada módulo del sistema
export const MODULE_PERMISSION_MAP: Record<ModuleId, string> = {
  'control-center': 'INICIO',
  'ventas-lista': 'VENTAS',
  'venta-estandar': 'VENTAS',
  'venta-tactil': 'VENTAS',
  'preventas': 'VENTAS',
  'cuentas-cobrar': 'CUENTAS_COBRAR',
  'reportes': 'REPORTES',
  'productos': 'PRODUCTOS',
  'compras-lista': 'COMPRAS',
  'compra-nueva': 'COMPRAS',
  'cuentas-pagar': 'CUENTAS_PAGAR',
  'cotizaciones': 'COTIZACIONES',
  'traslados': 'TRASLADOS',
  'pedidos': 'PEDIDOS',
  'clientes': 'CLIENTES',
  'proveedores': 'PROVEEDORES',
  'auditoria': 'AUDITORIA',
  'diario-digital': 'DIARIO',
  'gastos-buscar': 'GASTOS',
  'gastos-admin': 'GASTOS',
  'planillas': 'PLANILLAS',
  'empleados': 'EMPLEADOS',
  'usuarios-permisos': 'USUARIOS',
  'empresa-info': 'CONFIGURACION',
  'respaldos': 'RESPALDOS',
  'empresas-config': 'CONFIGURACION',
  'configuracion-general': 'CONFIGURACION',
};

// Permisos predeterminados por cada rol del sistema
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRoleAccount['role'], string[]> = {
  ADMINISTRADOR: ['ALL'],
  CAJERO: ['VENTAS', 'CLIENTES', 'COTIZACIONES', 'CUENTAS_COBRAR', 'DIARIO'],
  INVENTARIO: ['PRODUCTOS', 'COMPRAS', 'TRASLADOS', 'PEDIDOS', 'PROVEEDORES', 'AUDITORIA'],
  CONTABILIDAD: [
    'REPORTES',
    'CUENTAS_COBRAR',
    'CUENTAS_PAGAR',
    'DIARIO',
    'GASTOS',
    'PLANILLAS',
    'EMPLEADOS',
    'VENTAS',
    'COMPRAS',
    'CLIENTES',
    'PROVEEDORES',
  ],
};

export const ROLE_DESCRIPTIONS: Record<
  UserRoleAccount['role'],
  { label: string; badgeColor: string; summary: string; defaultModule: ModuleId }
> = {
  ADMINISTRADOR: {
    label: 'ADMINISTRADOR GENERAL',
    badgeColor: 'bg-blue-900 text-[#fff3a1] border-blue-950',
    summary: 'Control total de Facturación, Administración, Inventario, Usuarios, Empresas y Configuración.',
    defaultModule: 'control-center',
  },
  CAJERO: {
    label: 'CAJERO / FACTURACIÓN',
    badgeColor: 'bg-emerald-700 text-white border-emerald-900',
    summary: 'Acceso a Ventas (Estándar, Táctil, PreVentas), Cotizaciones, Clientes, Cobros y Cierre de Caja.',
    defaultModule: 'venta-tactil',
  },
  INVENTARIO: {
    label: 'BODEGA E INVENTARIO',
    badgeColor: 'bg-amber-600 text-white border-amber-800',
    summary: 'Acceso a Productos, Kardex, Compras, Recepción, Traslados entre Sucursales, Pedidos, Proveedores y Auditoría.',
    defaultModule: 'productos',
  },
  CONTABILIDAD: {
    label: 'CONTABILIDAD Y FINANZAS',
    badgeColor: 'bg-indigo-700 text-white border-indigo-900',
    summary: 'Acceso a Reportes Financieros, Cuentas por Cobrar/Pagar, Diario Digital, Gastos, Planillas y Empleados.',
    defaultModule: 'reportes',
  },
};

// Registros base del sistema (sin datos de demostración)
export const INITIAL_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp-1',
    name: 'SMART PUNTO DE VENTA',
    commercialName: 'SOFTWARE DE FACTURACIÓN Y CONTROL DE INVENTARIO',
    taxId: '00000000000000',
    phone: '0000-0000',
    email: 'SMARTPUNTODEVENTA@GMAIL.COM',
    address: 'B. BELLA VISTA',
    city: 'NICARAGUA',
    currencySymbol: 'C$',
    currencyCode: 'NIO',
    isPrimary: true,
    branchCode: 'ABARROTERÍA',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-0',
    code: '0',
    name: 'CONSUMIDOR FINAL',
    taxId: '',
    phone: '',
    email: '',
    address: '',
    creditLimit: 0,
    currentBalance: 0,
    creditDays: 0,
    priceTier: 'DETALLE',
    enabled: true,
    avatarOptimized: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_SALES: Sale[] = [];

export const INITIAL_PURCHASES: Purchase[] = [];

export const INITIAL_QUOTES: Quote[] = [];

export const INITIAL_TRANSFERS: Transfer[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_ACCOUNT_MOVEMENTS: AccountMovement[] = [];

export const INITIAL_AUDITS: ProductAudit[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [];

export const INITIAL_PAYROLL: PayrollMovement[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_CASH_CLOSINGS: CashClosing[] = [];

export const INITIAL_USERS: UserRoleAccount[] = [
  {
    id: 'usr-1',
    username: 'ADMINISTRADOR',
    fullName: 'ADMINISTRADOR GENERAL',
    role: 'ADMINISTRADOR',
    branch: 'ABARROTERÍA',
    active: true,
    pin: '1234',
    permissions: ['ALL'],
  },
  {
    id: 'usr-2',
    username: 'CAJERO',
    fullName: 'OPERADOR DE CAJA Y VENTAS',
    role: 'CAJERO',
    branch: 'ABARROTERÍA',
    active: true,
    pin: '1234',
    permissions: ROLE_DEFAULT_PERMISSIONS.CAJERO,
  },
  {
    id: 'usr-3',
    username: 'INVENTARIO',
    fullName: 'ENCARGADO DE BODEGA E INVENTARIO',
    role: 'INVENTARIO',
    branch: 'ABARROTERÍA',
    active: true,
    pin: '1234',
    permissions: ROLE_DEFAULT_PERMISSIONS.INVENTARIO,
  },
  {
    id: 'usr-4',
    username: 'CONTABILIDAD',
    fullName: 'CONTADOR Y FINANZAS',
    role: 'CONTABILIDAD',
    branch: 'ABARROTERÍA',
    active: true,
    pin: '1234',
    permissions: ROLE_DEFAULT_PERMISSIONS.CONTABILIDAD,
  },
];

export const INITIAL_CONFIG: SystemConfig = {
  general: {
    defaultTaxRate: 15,
    allowNegativeStock: false,
    autoBackupDaily: true,
    requireSellerOnSale: false,
    screenLockTimeoutMinutes: 15,
    screenLockPin: '1234',
  },
  invoice: {
    format: 'CARTA_A4',
    prefix: '',
    nextNumber: 1,
    footerNotes: '¡Gracias por su compra!',
    showLogo: true,
    showBarcode: true,
    showTaxBreakdown: true,
    showClientSignature: false,
    headerColor: '#1c2b42',
  },
  productsConfig: {
    autoGenerateCode: true,
    codePrefix: '',
    defaultMarginPercent: 35,
    alertDaysBeforeExpiry: 30,
  },
  accountsConfig: {
    defaultCreditDays: 15,
    lateFeePercent: 2,
    blockSalesOnOverdue: false,
  },
};
