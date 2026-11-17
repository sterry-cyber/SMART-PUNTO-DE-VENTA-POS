import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
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
} from '../types/pos';

const STORAGE_URL_KEY = 'smartpos_supabase_url';
const STORAGE_ANON_KEY = 'smartpos_supabase_anon_key';

const DEFAULT_SUPABASE_URL = 'https://myrfuddxhyavadzbmarl.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15cmZ1ZGR4aHlhdmFkemJtYXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyODUyOTEsImV4cCI6MjEwOTg2MTI5MX0.TdOom6vB9ldT9A8iDqUyAO9hqA8VdF-eTKx0AuFsD3w';

export function normalizeSupabaseUrl(rawUrl: string): string {
  return rawUrl
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

export function getSupabaseCredentials() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ANON_KEY) || '' : '';

  const finalUrl = normalizeSupabaseUrl(localUrl || envUrl);
  const finalKey = (localKey || envKey).trim();

  return {
    url: finalUrl,
    anonKey: finalKey,
    isConfigured: Boolean(finalUrl && finalKey),
  };
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem(STORAGE_URL_KEY, normalizeSupabaseUrl(url));
  localStorage.setItem(STORAGE_ANON_KEY, anonKey.trim());
}

let cachedClient: SupabaseClient | null = null;

export function createPOSClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;
  if (cachedClient) return cachedClient;
  try {
    cachedClient = createClient(url, anonKey);
    return cachedClient;
  } catch {
    return null;
  }
}

// ============================================================================
// ENTITY IMAGE CACHE FALLBACK (Respaldo inmediato si falta columna image_url)
// ============================================================================
const IMAGE_CACHE_KEY = 'smartpos_entity_images';

function getCachedImage(id: string): string | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed[id] || undefined;
  } catch {
    return undefined;
  }
}

function setCachedImage(id: string, url?: string) {
  try {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    if (url) {
      parsed[id] = url;
    } else {
      delete parsed[id];
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage quota errors
  }
}

// ============================================================================
// ROW MAPPERS (TypeScript <-> PostgreSQL Snake Case)
// ============================================================================
export const dbMappers = {
  companies: {
    toDb: (c: CompanyProfile) => {
      setCachedImage(c.id, c.imageUrl);
      return {
        id: c.id,
        name: c.name,
        commercial_name: c.commercialName,
        tax_id: c.taxId,
        phone: c.phone,
        email: c.email,
        address: c.address,
        city: c.city,
        currency_symbol: c.currencySymbol,
        currency_code: c.currencyCode,
        is_primary: c.isPrimary,
        branch_code: c.branchCode,
        image_url: c.imageUrl || '',
      };
    },
    fromDb: (r: Record<string, any>): CompanyProfile => ({
      id: r.id,
      name: r.name || 'SMART PUNTO DE VENTA',
      commercialName: r.commercial_name || '',
      taxId: r.tax_id || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      city: r.city || '',
      currencySymbol:
        !r.currency_symbol || r.currency_symbol === 'L' || r.currency_symbol === 'L.'
          ? 'C$'
          : r.currency_symbol,
      currencyCode: !r.currency_code || r.currency_code === 'HNL' ? 'NIO' : r.currency_code,
      isPrimary: Boolean(r.is_primary),
      branchCode: r.branch_code || 'ABARROTERÍA',
      imageUrl: r.image_url || getCachedImage(r.id),
    }),
  },
  suppliers: {
    toDb: (s: Supplier) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      contact_name: s.contactName,
      tax_id: s.taxId,
      phone: s.phone,
      email: s.email,
      address: s.address,
      credit_limit: s.creditLimit,
      current_balance: s.currentBalance,
      credit_days: s.creditDays,
      enabled: s.enabled,
      logo_optimized: s.logoOptimized,
    }),
    fromDb: (r: Record<string, any>): Supplier => ({
      id: r.id,
      code: r.code || '',
      name: r.name || '',
      contactName: r.contact_name || '',
      taxId: r.tax_id || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      creditLimit: Number(r.credit_limit || 0),
      currentBalance: Number(r.current_balance || 0),
      creditDays: Number(r.credit_days || 0),
      enabled: r.enabled !== false,
      logoOptimized: Boolean(r.logo_optimized),
    }),
  },
  clients: {
    toDb: (c: Client) => {
      setCachedImage(c.id, c.imageUrl);
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        tax_id: c.taxId,
        phone: c.phone,
        email: c.email,
        address: c.address,
        credit_limit: c.creditLimit,
        current_balance: c.currentBalance,
        credit_days: c.creditDays,
        price_tier: c.priceTier,
        enabled: c.enabled,
        avatar_optimized: c.avatarOptimized,
        image_url: c.imageUrl || '',
      };
    },
    fromDb: (r: Record<string, any>): Client => ({
      id: r.id,
      code: r.code || '',
      name: r.name || '',
      taxId: r.tax_id || '',
      phone: r.phone || '',
      email: r.email || '',
      address: r.address || '',
      creditLimit: Number(r.credit_limit || 0),
      currentBalance: Number(r.current_balance || 0),
      creditDays: Number(r.credit_days || 0),
      priceTier: r.price_tier || 'DETALLE',
      enabled: r.enabled !== false,
      avatarOptimized: Boolean(r.avatar_optimized),
      imageUrl: r.image_url || getCachedImage(r.id),
    }),
  },
  products: {
    toDb: (p: Product) => {
      setCachedImage(p.id, p.imageUrl);
      return {
        id: p.id,
        code: p.code,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        brand: p.brand,
        unit: p.unit,
        cost: p.cost,
        price: p.price,
        wholesale_price: p.wholesalePrice,
        tax_rate: p.taxRate,
        stock: p.stock,
        min_stock: p.minStock,
        max_stock: p.maxStock,
        expiration_date: p.expirationDate || null,
        supplier_id: p.supplierId,
        supplier_name: p.supplierName,
        active: p.active,
        location: p.location,
        image_url: p.imageUrl || '',
        branch_stocks: p.branchStocks,
        history: p.history,
      };
    },
    fromDb: (r: Record<string, any>): Product => ({
      id: r.id,
      code: r.code || '',
      barcode: r.barcode || '',
      name: r.name || '',
      category: r.category || 'GENERAL',
      brand: r.brand || 'GENERAL',
      unit: r.unit || 'UNIDAD',
      cost: Number(r.cost || 0),
      price: Number(r.price || 0),
      wholesalePrice: Number(r.wholesale_price || 0),
      taxRate: Number(r.tax_rate ?? 15),
      stock: Number(r.stock || 0),
      minStock: Number(r.min_stock || 0),
      maxStock: Number(r.max_stock || 100),
      expirationDate: r.expiration_date || undefined,
      supplierId: r.supplier_id || '',
      supplierName: r.supplier_name || '',
      active: r.active !== false,
      location: r.location || 'GENERAL',
      imageUrl: r.image_url || getCachedImage(r.id),
      branchStocks: r.branch_stocks || [],
      history: r.history || [],
    }),
  },
  sales: {
    toDb: (s: Sale) => ({
      id: s.id,
      invoice_number: s.invoiceNumber,
      date: s.date,
      client_id: s.clientId,
      client_name: s.clientName,
      seller_name: s.sellerName,
      mode: s.mode,
      payment_type: s.paymentType,
      status: s.status,
      due_date: s.dueDate || null,
      subtotal: s.subtotal,
      discount_total: s.discountTotal,
      tax_total: s.taxTotal,
      total: s.total,
      balance_due: s.balanceDue,
      notes: s.notes || null,
      items: s.items,
    }),
    fromDb: (r: Record<string, any>): Sale => ({
      id: r.id,
      invoiceNumber: r.invoice_number || '',
      date: r.date || '',
      clientId: r.client_id || '',
      clientName: r.client_name || 'CONSUMIDOR FINAL',
      sellerName: r.seller_name || 'ADMINISTRADOR',
      mode: r.mode || 'ESTANDAR',
      paymentType: r.payment_type || 'CONTADO',
      status: r.status || 'COMPLETADA',
      dueDate: r.due_date || undefined,
      subtotal: Number(r.subtotal || 0),
      discountTotal: Number(r.discount_total || 0),
      taxTotal: Number(r.tax_total || 0),
      total: Number(r.total || 0),
      balanceDue: Number(r.balance_due || 0),
      notes: r.notes || undefined,
      items: r.items || [],
    }),
  },
  purchases: {
    toDb: (p: Purchase) => ({
      id: p.id,
      document_number: p.documentNumber,
      supplier_invoice: p.supplierInvoice,
      date: p.date,
      supplier_id: p.supplierId,
      supplier_name: p.supplierName,
      payment_type: p.paymentType,
      status: p.status,
      due_date: p.dueDate || null,
      subtotal: p.subtotal,
      tax_total: p.taxTotal,
      total: p.total,
      balance_due: p.balanceDue,
      notes: p.notes || null,
      items: p.items,
    }),
    fromDb: (r: Record<string, any>): Purchase => ({
      id: r.id,
      documentNumber: r.document_number || '',
      supplierInvoice: r.supplier_invoice || '',
      date: r.date || '',
      supplierId: r.supplier_id || '',
      supplierName: r.supplier_name || '',
      paymentType: r.payment_type || 'CONTADO',
      status: r.status || 'FINALIZADA',
      dueDate: r.due_date || undefined,
      subtotal: Number(r.subtotal || 0),
      taxTotal: Number(r.tax_total || 0),
      total: Number(r.total || 0),
      balanceDue: Number(r.balance_due || 0),
      notes: r.notes || undefined,
      items: r.items || [],
    }),
  },
  quotes: {
    toDb: (q: Quote) => ({
      id: q.id,
      quote_number: q.quoteNumber,
      date: q.date,
      valid_until: q.validUntil,
      client_id: q.clientId,
      client_name: q.clientName,
      status: q.status,
      subtotal: q.subtotal,
      tax_total: q.taxTotal,
      total: q.total,
      notes: q.notes || null,
      items: q.items,
    }),
    fromDb: (r: Record<string, any>): Quote => ({
      id: r.id,
      quoteNumber: r.quote_number || '',
      date: r.date || '',
      validUntil: r.valid_until || '',
      clientId: r.client_id || '',
      clientName: r.client_name || '',
      status: r.status || 'ACTIVA',
      subtotal: Number(r.subtotal || 0),
      taxTotal: Number(r.tax_total || 0),
      total: Number(r.total || 0),
      notes: r.notes || undefined,
      items: r.items || [],
    }),
  },
  transfers: {
    toDb: (t: Transfer) => ({
      id: t.id,
      transfer_number: t.transferNumber,
      date: t.date,
      origin_branch: t.originBranch,
      destination_branch: t.destinationBranch,
      status: t.status,
      created_by: t.createdBy,
      notes: t.notes || null,
      items: t.items,
    }),
    fromDb: (r: Record<string, any>): Transfer => ({
      id: r.id,
      transferNumber: r.transfer_number || '',
      date: r.date || '',
      originBranch: r.origin_branch || '',
      destinationBranch: r.destination_branch || '',
      status: r.status || 'EN_TRANSITO',
      createdBy: r.created_by || '',
      notes: r.notes || undefined,
      items: r.items || [],
    }),
  },
  orders: {
    toDb: (o: Order) => ({
      id: o.id,
      order_number: o.orderNumber,
      date: o.date,
      expected_date: o.expectedDate,
      supplier_id: o.supplierId,
      supplier_name: o.supplierName,
      status: o.status,
      total_estimated: o.totalEstimated,
      notes: o.notes || null,
      items: o.items,
    }),
    fromDb: (r: Record<string, any>): Order => ({
      id: r.id,
      orderNumber: r.order_number || '',
      date: r.date || '',
      expectedDate: r.expected_date || '',
      supplierId: r.supplier_id || '',
      supplierName: r.supplier_name || '',
      status: r.status || 'PENDIENTE',
      totalEstimated: Number(r.total_estimated || 0),
      notes: r.notes || undefined,
      items: r.items || [],
    }),
  },
  account_movements: {
    toDb: (m: AccountMovement) => ({
      id: m.id,
      account_type: m.accountType,
      entity_id: m.entityId,
      entity_name: m.entityName,
      document_id: m.documentId,
      document_number: m.documentNumber,
      date: m.date,
      movement_type: m.movementType,
      payment_method: m.paymentMethod,
      check_number: m.checkNumber || null,
      bank_name: m.bankName || null,
      check_status: m.checkStatus || null,
      amount: m.amount,
      reference: m.reference,
      notes: m.notes || null,
    }),
    fromDb: (r: Record<string, any>): AccountMovement => ({
      id: r.id,
      accountType: r.account_type || 'COBRAR',
      entityId: r.entity_id || '',
      entityName: r.entity_name || '',
      documentId: r.document_id || '',
      documentNumber: r.document_number || '',
      date: r.date || '',
      movementType: r.movement_type || 'ABONO',
      paymentMethod: r.payment_method || 'EFECTIVO',
      checkNumber: r.check_number || undefined,
      bankName: r.bank_name || undefined,
      checkStatus: r.check_status || undefined,
      amount: Number(r.amount || 0),
      reference: r.reference || '',
      notes: r.notes || undefined,
    }),
  },
  product_audits: {
    toDb: (a: ProductAudit) => ({
      id: a.id,
      audit_number: a.auditNumber,
      date: a.date,
      branch_name: a.branchName,
      responsible: a.responsible,
      status: a.status,
      notes: a.notes,
      items: a.items,
    }),
    fromDb: (r: Record<string, any>): ProductAudit => ({
      id: r.id,
      auditNumber: r.audit_number || '',
      date: r.date || '',
      branchName: r.branch_name || '',
      responsible: r.responsible || '',
      status: r.status || 'EN_PROCESO',
      notes: r.notes || '',
      items: r.items || [],
    }),
  },
  employees: {
    toDb: (e: Employee) => ({
      id: e.id,
      code: e.code,
      full_name: e.fullName,
      document_id: e.documentId,
      position: e.position,
      department: e.department,
      base_salary: e.baseSalary,
      hire_date: e.hireDate,
      phone: e.phone,
      email: e.email,
      enabled: e.enabled,
      sort_order: e.sortOrder,
    }),
    fromDb: (r: Record<string, any>): Employee => ({
      id: r.id,
      code: r.code || '',
      fullName: r.full_name || '',
      documentId: r.document_id || '',
      position: r.position || '',
      department: r.department || '',
      baseSalary: Number(r.base_salary || 0),
      hireDate: r.hire_date || '',
      phone: r.phone || '',
      email: r.email || '',
      enabled: r.enabled !== false,
      sortOrder: Number(r.sort_order || 1),
    }),
  },
  payroll_movements: {
    toDb: (p: PayrollMovement) => ({
      id: p.id,
      employee_id: p.employeeId,
      employee_name: p.employeeName,
      period: p.period,
      date: p.date,
      type: p.type,
      concept: p.concept,
      amount: p.amount,
      is_deduction: p.isDeduction,
    }),
    fromDb: (r: Record<string, any>): PayrollMovement => ({
      id: r.id,
      employeeId: r.employee_id || '',
      employeeName: r.employee_name || '',
      period: r.period || '',
      date: r.date || '',
      type: r.type || 'SALARIO_BASE',
      concept: r.concept || '',
      amount: Number(r.amount || 0),
      isDeduction: Boolean(r.is_deduction),
    }),
  },
  expenses: {
    toDb: (e: Expense) => ({
      id: e.id,
      date: e.date,
      book_name: e.bookName,
      category: e.category,
      operation_type: e.operationType,
      description: e.description,
      reference: e.reference,
      payment_method: e.paymentMethod,
      amount: e.amount,
      registered_by: e.registeredBy,
    }),
    fromDb: (r: Record<string, any>): Expense => ({
      id: r.id,
      date: r.date || '',
      bookName: r.book_name || '',
      category: r.category || 'GASTOS',
      operationType: r.operation_type || 'GASTO_OPERATIVO',
      description: r.description || '',
      reference: r.reference || 'NO',
      paymentMethod: r.payment_method || 'EFECTIVO',
      amount: Number(r.amount || 0),
      registeredBy: r.registered_by || 'ADMINISTRADOR',
    }),
  },
  cash_closings: {
    toDb: (c: CashClosing) => ({
      id: c.id,
      date: c.date,
      shift: c.shift,
      cashier: c.cashier,
      opening_balance: c.openingBalance,
      cash_sales: c.cashSales,
      card_sales: c.cardSales,
      transfer_sales: c.transferSales,
      credit_collections: c.creditCollections,
      expenses_out: c.expensesOut,
      expected_cash: c.expectedCash,
      counted_cash: c.countedCash,
      difference: c.difference,
      status: c.status,
      notes: c.notes,
    }),
    fromDb: (r: Record<string, any>): CashClosing => ({
      id: r.id,
      date: r.date || '',
      shift: r.shift || 'COMPLETO',
      cashier: r.cashier || 'ADMINISTRADOR',
      openingBalance: Number(r.opening_balance || 0),
      cashSales: Number(r.cash_sales || 0),
      cardSales: Number(r.card_sales || 0),
      transferSales: Number(r.transfer_sales || 0),
      creditCollections: Number(r.credit_collections || 0),
      expensesOut: Number(r.expenses_out || 0),
      expectedCash: Number(r.expected_cash || 0),
      countedCash: Number(r.counted_cash || 0),
      difference: Number(r.difference || 0),
      status: r.status || 'ABIERTO',
      notes: r.notes || '',
    }),
  },
  pos_users: {
    toDb: (u: UserRoleAccount) => ({
      id: u.id,
      username: u.username,
      full_name: u.fullName,
      role: u.role,
      branch: u.branch,
      active: u.active,
      pin: u.pin,
      permissions: u.permissions,
    }),
    fromDb: (r: Record<string, any>): UserRoleAccount => ({
      id: r.id,
      username: r.username || 'ADMINISTRADOR',
      fullName: r.full_name || 'ADMINISTRADOR',
      role: r.role || 'ADMINISTRADOR',
      branch: r.branch || 'ABARROTERÍA',
      active: r.active !== false,
      pin: r.pin || '1234',
      permissions: r.permissions || ['ALL'],
    }),
  },
};

export type TableKey = keyof typeof dbMappers;

// Automatically sync state changes (insert/update/delete) to Supabase PostgreSQL
export async function syncTableDiffToSupabase<T extends { id: string }>(
  table: TableKey,
  prevRows: T[],
  nextRows: T[]
): Promise<void> {
  const sb = createPOSClient();
  if (!sb) return;

  const mapper = dbMappers[table] as unknown as { toDb: (item: T) => Record<string, any> };
  const prevMap = new Map(prevRows.map((r) => [r.id, r]));
  const nextIds = new Set(nextRows.map((r) => r.id));

  // Find added or modified rows
  const toUpsert: Record<string, any>[] = [];
  for (const row of nextRows) {
    const prev = prevMap.get(row.id);
    if (!prev || JSON.stringify(prev) !== JSON.stringify(row)) {
      toUpsert.push(mapper.toDb(row));
    }
  }

  // Find deleted row IDs
  const toDelete: string[] = [];
  for (const prev of prevRows) {
    if (!nextIds.has(prev.id)) {
      toDelete.push(prev.id);
    }
  }

  try {
    if (toUpsert.length > 0) {
      const { error } = await sb.from(table).upsert(toUpsert);
      if (error && error.message?.includes('image_url')) {
        const sanitized = toUpsert.map(({ image_url: _omit, ...rest }) => rest);
        await sb.from(table).upsert(sanitized);
      }
    }
    if (toDelete.length > 0) {
      await sb.from(table).delete().in('id', toDelete);
    }
  } catch (err) {
    console.error(`Error syncing ${table} to Supabase:`, err);
  }
}

export interface POSCloudDataset {
  companies: CompanyProfile[];
  suppliers: Supplier[];
  clients: Client[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  quotes: Quote[];
  transfers: Transfer[];
  orders: Order[];
  accountMovements: AccountMovement[];
  audits: ProductAudit[];
  employees: Employee[];
  payroll: PayrollMovement[];
  expenses: Expense[];
  cashClosings: CashClosing[];
  users?: UserRoleAccount[];
}

export async function pushAllToSupabase(data: POSCloudDataset): Promise<{ ok: boolean; message: string }> {
  const sb = createPOSClient();
  if (!sb) return { ok: false, message: 'Cliente Supabase no configurado.' };

  try {
    if (data.companies.length) {
      const { error } = await sb.from('companies').upsert(data.companies.map(dbMappers.companies.toDb));
      if (error) throw error;
    }
    if (data.suppliers.length) {
      const { error } = await sb.from('suppliers').upsert(data.suppliers.map(dbMappers.suppliers.toDb));
      if (error) throw error;
    }
    if (data.clients.length) {
      const { error } = await sb.from('clients').upsert(data.clients.map(dbMappers.clients.toDb));
      if (error) throw error;
    }
    if (data.products.length) {
      const { error } = await sb.from('products').upsert(data.products.map(dbMappers.products.toDb));
      if (error) throw error;
    }
    if (data.sales.length) {
      const { error } = await sb.from('sales').upsert(data.sales.map(dbMappers.sales.toDb));
      if (error) throw error;
    }
    if (data.purchases.length) {
      const { error } = await sb.from('purchases').upsert(data.purchases.map(dbMappers.purchases.toDb));
      if (error) throw error;
    }
    if (data.quotes.length) {
      await sb.from('quotes').upsert(data.quotes.map(dbMappers.quotes.toDb));
    }
    if (data.transfers.length) {
      await sb.from('transfers').upsert(data.transfers.map(dbMappers.transfers.toDb));
    }
    if (data.orders.length) {
      await sb.from('orders').upsert(data.orders.map(dbMappers.orders.toDb));
    }
    if (data.accountMovements.length) {
      await sb.from('account_movements').upsert(data.accountMovements.map(dbMappers.account_movements.toDb));
    }
    if (data.audits.length) {
      await sb.from('product_audits').upsert(data.audits.map(dbMappers.product_audits.toDb));
    }
    if (data.employees.length) {
      await sb.from('employees').upsert(data.employees.map(dbMappers.employees.toDb));
    }
    if (data.payroll.length) {
      await sb.from('payroll_movements').upsert(data.payroll.map(dbMappers.payroll_movements.toDb));
    }
    if (data.expenses.length) {
      await sb.from('expenses').upsert(data.expenses.map(dbMappers.expenses.toDb));
    }
    if (data.cashClosings.length) {
      await sb.from('cash_closings').upsert(data.cashClosings.map(dbMappers.cash_closings.toDb));
    }
    if (data.users && data.users.length) {
      await sb.from('pos_users').upsert(data.users.map(dbMappers.pos_users.toDb));
    }

    return { ok: true, message: 'Base de datos Supabase sincronizada correctamente.' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Aviso de Supabase: ${msg}. Asegúrate de haber ejecutado supabase/schema.sql en el SQL Editor.`,
    };
  }
}

export async function pullProductsAndSalesCount(): Promise<{
  reachable: boolean;
  tablesReady: boolean;
  productCount: number;
  errorMsg?: string;
}> {
  const sb = createPOSClient();
  if (!sb) return { reachable: false, tablesReady: false, productCount: 0 };

  const { count, error } = await sb.from('products').select('*', { count: 'exact', head: true });
  if (error) {
    return {
      reachable: true,
      tablesReady: false,
      productCount: 0,
      errorMsg: error.message,
    };
  }
  return {
    reachable: true,
    tablesReady: true,
    productCount: count || 0,
  };
}

export async function pullAllFromSupabase(): Promise<{
  ok: boolean;
  message: string;
  companies?: CompanyProfile[];
  suppliers?: Supplier[];
  clients?: Client[];
  products?: Product[];
  sales?: Sale[];
  purchases?: Purchase[];
  quotes?: Quote[];
  transfers?: Transfer[];
  orders?: Order[];
  accountMovements?: AccountMovement[];
  audits?: ProductAudit[];
  employees?: Employee[];
  payroll?: PayrollMovement[];
  expenses?: Expense[];
  cashClosings?: CashClosing[];
  users?: UserRoleAccount[];
}> {
  const sb = createPOSClient();
  if (!sb) return { ok: false, message: 'Cliente Supabase no configurado.' };

  try {
    const [
      compRes,
      supRes,
      cliRes,
      prodRes,
      saleRes,
      purRes,
      quoteRes,
      transRes,
      ordRes,
      movRes,
      audRes,
      empRes,
      payRes,
      expRes,
      cashRes,
      usrRes,
    ] = await Promise.all([
      sb.from('companies').select('*'),
      sb.from('suppliers').select('*'),
      sb.from('clients').select('*'),
      sb.from('products').select('*'),
      sb.from('sales').select('*').order('created_at', { ascending: false }),
      sb.from('purchases').select('*').order('created_at', { ascending: false }),
      sb.from('quotes').select('*'),
      sb.from('transfers').select('*'),
      sb.from('orders').select('*'),
      sb.from('account_movements').select('*').order('created_at', { ascending: false }),
      sb.from('product_audits').select('*'),
      sb.from('employees').select('*'),
      sb.from('payroll_movements').select('*'),
      sb.from('expenses').select('*').order('created_at', { ascending: false }),
      sb.from('cash_closings').select('*'),
      sb.from('pos_users').select('*'),
    ]);

    if (prodRes.error) throw prodRes.error;

    return {
      ok: true,
      message: 'Conectado a Supabase PostgreSQL.',
      companies: (compRes.data || []).map(dbMappers.companies.fromDb),
      suppliers: (supRes.data || []).map(dbMappers.suppliers.fromDb),
      clients: (cliRes.data || []).map(dbMappers.clients.fromDb),
      products: (prodRes.data || []).map(dbMappers.products.fromDb),
      sales: (saleRes.data || []).map(dbMappers.sales.fromDb),
      purchases: (purRes.data || []).map(dbMappers.purchases.fromDb),
      quotes: (quoteRes.data || []).map(dbMappers.quotes.fromDb),
      transfers: (transRes.data || []).map(dbMappers.transfers.fromDb),
      orders: (ordRes.data || []).map(dbMappers.orders.fromDb),
      accountMovements: (movRes.data || []).map(dbMappers.account_movements.fromDb),
      audits: (audRes.data || []).map(dbMappers.product_audits.fromDb),
      employees: (empRes.data || []).map(dbMappers.employees.fromDb),
      payroll: (payRes.data || []).map(dbMappers.payroll_movements.fromDb),
      expenses: (expRes.data || []).map(dbMappers.expenses.fromDb),
      cashClosings: (cashRes.data || []).map(dbMappers.cash_closings.fromDb),
      users: (usrRes.data || []).map(dbMappers.pos_users.fromDb),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, message: `Error al consultar Supabase: ${msg}` };
  }
}

// ============================================================================
// SUPABASE STORAGE IMAGE UPLOAD HELPER
// ============================================================================
export type StorageBucketName = 'productos' | 'clientes' | 'empresa' | 'pos-images';

export async function uploadImageToSupabaseStorage(
  bucket: StorageBucketName,
  file: File,
  customPrefix = 'img'
): Promise<{ ok: boolean; url: string; fromStorage: boolean; message?: string }> {
  const sb = createPOSClient();

  const readAsDataUrl = (): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  if (!sb) {
    const fallbackUrl = await readAsDataUrl();
    return { ok: true, url: fallbackUrl, fromStorage: false };
  }

  try {
    const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeName = `${customPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error: uploadError } = await sb.storage.from(bucket).upload(safeName, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/png',
    });

    if (uploadError) {
      const fallbackUrl = await readAsDataUrl();
      return {
        ok: true,
        url: fallbackUrl,
        fromStorage: false,
        message: uploadError.message,
      };
    }

    const { data } = sb.storage.from(bucket).getPublicUrl(safeName);
    if (data?.publicUrl) {
      return { ok: true, url: data.publicUrl, fromStorage: true };
    }

    const fallbackUrl = await readAsDataUrl();
    return { ok: true, url: fallbackUrl, fromStorage: false };
  } catch (err: unknown) {
    const fallbackUrl = await readAsDataUrl();
    return {
      ok: true,
      url: fallbackUrl,
      fromStorage: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
