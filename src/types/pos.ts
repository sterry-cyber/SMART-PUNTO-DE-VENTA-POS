export type ModuleId =
  | 'control-center'
  | 'ventas-lista'
  | 'venta-estandar'
  | 'venta-tactil'
  | 'preventas'
  | 'cuentas-cobrar'
  | 'reportes'
  | 'productos'
  | 'compras-lista'
  | 'compra-nueva'
  | 'cuentas-pagar'
  | 'cotizaciones'
  | 'traslados'
  | 'pedidos'
  | 'clientes'
  | 'proveedores'
  | 'auditoria'
  | 'diario-digital'
  | 'gastos-buscar'
  | 'gastos-admin'
  | 'planillas'
  | 'empleados'
  | 'usuarios-permisos'
  | 'empresa-info'
  | 'respaldos'
  | 'empresas-config'
  | 'configuracion-general';

export interface TabItem {
  id: ModuleId;
  title: string;
  subtitle?: string;
  closable: boolean;
}

export interface BranchStock {
  branchId: string;
  branchName: string;
  stock: number;
  minStock: number;
  location: string;
}

export interface ProductHistoryEntry {
  id: string;
  date: string;
  type: 'VENTA' | 'COMPRA' | 'TRASLADO' | 'AJUSTE' | 'AUDITORIA';
  documentRef: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  user: string;
  note?: string;
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  brand: string;
  unit: string;
  cost: number;
  price: number;
  wholesalePrice: number;
  taxRate: number;
  stock: number;
  minStock: number;
  maxStock: number;
  expirationDate?: string;
  supplierId: string;
  supplierName: string;
  active: boolean;
  location: string;
  imageUrl?: string;
  branchStocks: BranchStock[];
  history: ProductHistoryEntry[];
}

export interface SaleItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  clientId: string;
  clientName: string;
  sellerName: string;
  mode: 'ESTANDAR' | 'TACTIL' | 'PREVENTA';
  paymentType: 'CONTADO' | 'CREDITO' | 'TARJETA' | 'TRANSFERENCIA' | 'MIXTO';
  status: 'COMPLETADA' | 'PENDIENTE_PREVENTA' | 'ANULADA' | 'CREDITO_VIGENTE' | 'CREDITO_VENCIDO';
  dueDate?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  balanceDue: number;
  notes?: string;
  items: SaleItem[];
}

export interface PurchaseItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitCost: number;
  previousCost: number;
  suggestedSalePrice: number;
  currentSalePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  documentNumber: string;
  supplierInvoice: string;
  date: string;
  supplierId: string;
  supplierName: string;
  paymentType: 'CONTADO' | 'CREDITO';
  status: 'BORRADOR' | 'FINALIZADA' | 'ANULADA';
  dueDate?: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  balanceDue: number;
  notes?: string;
  items: PurchaseItem[];
}

export interface Quote {
  id: string;
  quoteNumber: string;
  date: string;
  validUntil: string;
  clientId: string;
  clientName: string;
  status: 'ACTIVA' | 'CONVERTIDA' | 'VENCIDA';
  subtotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  items: SaleItem[];
}

export interface Transfer {
  id: string;
  transferNumber: string;
  date: string;
  originBranch: string;
  destinationBranch: string;
  status: 'EN_TRANSITO' | 'RECIBIDO' | 'BORRADOR' | 'ANULADO';
  createdBy: string;
  notes?: string;
  items: {
    productId: string;
    code: string;
    name: string;
    quantity: number;
  }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  expectedDate: string;
  supplierId: string;
  supplierName: string;
  status: 'PENDIENTE' | 'ENVIADO' | 'RECIBIDO_PARCIAL' | 'CONVERTIDO_COMPRA' | 'CANCELADO';
  totalEstimated: number;
  notes?: string;
  items: {
    productId: string;
    code: string;
    name: string;
    quantity: number;
    estimatedCost: number;
  }[];
}

export interface Client {
  id: string;
  code: string;
  name: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  creditDays: number;
  priceTier: 'DETALLE' | 'MAYORISTA';
  enabled: boolean;
  avatarOptimized: boolean;
  imageUrl?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  currentBalance: number;
  creditDays: number;
  enabled: boolean;
  logoOptimized: boolean;
}

export interface AccountMovement {
  id: string;
  accountType: 'COBRAR' | 'PAGAR';
  entityId: string;
  entityName: string;
  documentId: string;
  documentNumber: string;
  date: string;
  movementType: 'ABONO' | 'RECARGO' | 'CHEQUE' | 'FACTURA';
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'RECARGO_MORA';
  checkNumber?: string;
  bankName?: string;
  checkStatus?: 'PENDIENTE' | 'COBRADO' | 'RECHAZADO';
  amount: number;
  reference: string;
  notes?: string;
}

export interface ProductAuditItem {
  productId: string;
  code: string;
  name: string;
  systemStock: number;
  physicalCount: number;
  difference: number;
  unitCost: number;
}

export interface ProductAudit {
  id: string;
  auditNumber: string;
  date: string;
  branchName: string;
  responsible: string;
  status: 'EN_PROCESO' | 'FINALIZADA';
  notes: string;
  items: ProductAuditItem[];
}

export interface Employee {
  id: string;
  code: string;
  fullName: string;
  documentId: string;
  position: string;
  department: string;
  baseSalary: number;
  hireDate: string;
  phone: string;
  email: string;
  enabled: boolean;
  sortOrder: number;
}

export interface PayrollMovement {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  date: string;
  type: 'SALARIO_BASE' | 'HORAS_EXTRA' | 'BONIFICACION' | 'COMISION' | 'DEDUCCION_SEGURO' | 'ADELANTO';
  concept: string;
  amount: number;
  isDeduction: boolean;
}

export interface Expense {
  id: string;
  date: string;
  bookName: string;
  category: string;
  operationType: 'GASTO_OPERATIVO' | 'SERVICIOS_PUBLICOS' | 'ALQUILER' | 'MANTENIMIENTO' | 'CAJA_CHICA' | 'IMPUESTOS';
  description: string;
  reference: string;
  paymentMethod: 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'CHEQUE';
  amount: number;
  registeredBy: string;
}

export interface CashClosing {
  id: string;
  date: string;
  shift: 'MAÑANA' | 'TARDE' | 'COMPLETO';
  cashier: string;
  openingBalance: number;
  cashSales: number;
  cardSales: number;
  transferSales: number;
  creditCollections: number;
  expensesOut: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
  status: 'ABIERTO' | 'CERRADO';
  notes: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  commercialName: string;
  taxId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  currencySymbol: string;
  currencyCode: string;
  isPrimary: boolean;
  branchCode: string;
  imageUrl?: string;
}

export interface UserRoleAccount {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMINISTRADOR' | 'CAJERO' | 'INVENTARIO' | 'CONTABILIDAD';
  branch: string;
  active: boolean;
  pin: string;
  permissions: string[];
}

export interface SystemConfig {
  general: {
    defaultTaxRate: number;
    allowNegativeStock: boolean;
    autoBackupDaily: boolean;
    requireSellerOnSale: boolean;
    screenLockTimeoutMinutes: number;
    screenLockPin: string;
  };
  invoice: {
    format: 'TICKET_80MM' | 'TICKET_58MM' | 'CARTA_A4' | 'MEDIA_CARTA';
    prefix: string;
    nextNumber: number;
    footerNotes: string;
    showLogo: boolean;
    showBarcode: boolean;
    showTaxBreakdown: boolean;
    showClientSignature: boolean;
    headerColor: string;
  };
  productsConfig: {
    autoGenerateCode: boolean;
    codePrefix: string;
    defaultMarginPercent: number;
    alertDaysBeforeExpiry: number;
  };
  accountsConfig: {
    defaultCreditDays: number;
    lateFeePercent: number;
    blockSalesOnOverdue: boolean;
  };
}

