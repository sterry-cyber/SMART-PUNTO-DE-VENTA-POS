import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  ModuleId,
  TabItem,
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
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_PURCHASES,
  INITIAL_QUOTES,
  INITIAL_TRANSFERS,
  INITIAL_ORDERS,
  INITIAL_CLIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_ACCOUNT_MOVEMENTS,
  INITIAL_AUDITS,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL,
  INITIAL_EXPENSES,
  INITIAL_CASH_CLOSINGS,
  INITIAL_COMPANIES,
  INITIAL_USERS,
  INITIAL_CONFIG,
  MODULE_PERMISSION_MAP,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_DESCRIPTIONS,
} from '../data/mockData';
import {
  getSupabaseCredentials,
  pushAllToSupabase,
  pullAllFromSupabase,
  pullProductsAndSalesCount,
  syncTableDiffToSupabase,
  TableKey,
} from '../lib/supabase';

export const MODULE_METADATA: Record<ModuleId, { title: string; subtitle: string }> = {
  'control-center': { title: 'Inicio', subtitle: 'Smart Punto de Venta' },
  'ventas-lista': { title: 'Ventas', subtitle: 'Ventas - Smart Punto de Venta' },
  'venta-estandar': { title: 'Nueva Venta', subtitle: 'Nueva Venta - Smart Punto de Venta' },
  'venta-tactil': { title: 'Nueva Venta', subtitle: 'Nueva Venta - Smart Punto de Venta' },
  'preventas': { title: 'Ventas', subtitle: 'PreVentas - Smart Punto de Venta' },
  'cuentas-cobrar': { title: 'Cuentas Por Cobrar', subtitle: 'Cuentas Por Cobrar' },
  'reportes': { title: 'Lista de Reportes', subtitle: 'Lista de Reportes - Smart Punto de Venta' },
  'productos': { title: 'Productos', subtitle: 'Productos - Smart Punto de Venta' },
  'compras-lista': { title: 'Compras', subtitle: 'Compras - Smart Punto de Venta' },
  'compra-nueva': { title: 'Nueva Compra', subtitle: 'Nueva Compra - Smart Punto de Venta' },
  'cuentas-pagar': { title: 'Cuentas Por Pagar', subtitle: 'Cuentas Por Pagar' },
  'cotizaciones': { title: 'Lista de Cotizaciones', subtitle: 'Cotizaciones' },
  'traslados': { title: 'Traslado de Productos', subtitle: 'Traslados' },
  'pedidos': { title: 'Lista de Pedidos', subtitle: 'Pedidos' },
  'clientes': { title: 'Clientes', subtitle: 'Clientes - Smart Punto de Venta' },
  'proveedores': { title: 'Proveedores', subtitle: 'Proveedores' },
  'auditoria': { title: 'Auditoría de Productos', subtitle: 'Auditoría' },
  'diario-digital': { title: 'Diario Digital', subtitle: 'Diario Digital - Smart Punto de Venta' },
  'gastos-buscar': { title: 'Buscar y Organizar Gastos', subtitle: 'Gastos' },
  'gastos-admin': { title: 'Administrador de Gastos', subtitle: 'Gastos' },
  'planillas': { title: 'Administrador de Planillas', subtitle: 'Planillas' },
  'empleados': { title: 'Lista de Empleados', subtitle: 'Empleados' },
  'usuarios-permisos': { title: 'Usuarios & Permisos', subtitle: 'Usuarios' },
  'empresa-info': { title: 'Información de la Empresa', subtitle: 'Empresa' },
  'respaldos': { title: 'Respaldos & Restauración', subtitle: 'Respaldos' },
  'empresas-config': { title: 'Configurar Empresas', subtitle: 'Empresas' },
  'configuracion-general': { title: 'Configuración General', subtitle: 'Configuración' },
};

interface POSContextType {
  tabs: TabItem[];
  activeTab: ModuleId;
  openModule: (id: ModuleId) => void;
  closeTab: (id: ModuleId) => void;
  activeCompany: CompanyProfile;
  activeCompanyId: string;
  setActiveCompanyId: (id: string) => void;
  currentUser: UserRoleAccount;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserRoleAccount>>;
  canAccessModule: (id: ModuleId, userOverride?: UserRoleAccount) => boolean;
  hasPermission: (permKey: string, userOverride?: UserRoleAccount) => boolean;
  switchActiveRoleUser: (user: UserRoleAccount) => void;
  isAuthenticated: boolean;
  loginSuccess: () => void;
  logout: () => void;
  isScreenLocked: boolean;
  setIsScreenLocked: (locked: boolean) => void;
  toastMessage: string | null;
  notify: (msg: string, _type?: string) => void;
  supabaseConfigured: boolean;
  supabaseTablesReady: boolean;
  isSyncingSupabase: boolean;
  refreshSupabaseStatus: () => void;
  syncAllToCloud: () => Promise<void>;
  pullAllFromCloud: () => Promise<void>;

  // Data collections (100% synced with Supabase)
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  accountMovements: AccountMovement[];
  setAccountMovements: React.Dispatch<React.SetStateAction<AccountMovement[]>>;
  audits: ProductAudit[];
  setAudits: React.Dispatch<React.SetStateAction<ProductAudit[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  payroll: PayrollMovement[];
  setPayroll: React.Dispatch<React.SetStateAction<PayrollMovement[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  cashClosings: CashClosing[];
  setCashClosings: React.Dispatch<React.SetStateAction<CashClosing[]>>;
  companies: CompanyProfile[];
  setCompanies: React.Dispatch<React.SetStateAction<CompanyProfile[]>>;
  users: UserRoleAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserRoleAccount[]>>;
  config: SystemConfig;
  setConfig: React.Dispatch<React.SetStateAction<SystemConfig>>;

  // Cross-module actions
  recordSale: (saleData: Omit<Sale, 'id' | 'invoiceNumber'>) => Sale;
  convertQuoteToSale: (quoteId: string) => void;
  convertOrderToPurchase: (orderId: string) => void;
  finalizePurchase: (purchaseId: string, updateSalePrices: boolean) => void;
  registerAccountMovement: (mov: Omit<AccountMovement, 'id'>) => void;
  exportToExcelCSV: (filename: string, rows: Record<string, unknown>[]) => void;
  resetAllDemoData: () => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

// Hook that automatically persists every state mutation (insert/update/delete) directly to Supabase
function useSupabaseTableState<T extends { id: string }>(
  table: TableKey,
  initialValue: T[]
): [T[], React.Dispatch<React.SetStateAction<T[]>>, (fromCloud: T[]) => void] {
  const [state, setStateInternal] = useState<T[]>(initialValue);

  const setState: React.Dispatch<React.SetStateAction<T[]>> = useCallback(
    (updater) => {
      setStateInternal((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: T[]) => T[])(prev) : updater;
        // Persist diff to Supabase immediately
        syncTableDiffToSupabase(table, prev, next);
        return next;
      });
    },
    [table]
  );

  const hydrateFromCloud = useCallback((fromCloud: T[]) => {
    setStateInternal(fromCloud);
  }, []);

  return [state, setState, hydrateFromCloud];
}

export const POSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: 'control-center', title: 'Inicio', subtitle: 'Smart Punto de Venta', closable: true },
  ]);
  const [activeTab, setActiveTab] = useState<ModuleId>('control-center');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('smartpos_authenticated') === 'true';
  });
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean>(() => getSupabaseCredentials().isConfigured);
  const [supabaseTablesReady, setSupabaseTablesReady] = useState<boolean>(false);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState<boolean>(false);

  // Clean up any legacy demo localStorage keys on boot
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('smartpos_') && !k.includes('supabase')) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
  }, []);

  // All 14 collections backed directly by Supabase PostgreSQL
  const [products, setProducts, hydrateProducts] = useSupabaseTableState<Product>('products', INITIAL_PRODUCTS);
  const [sales, setSales, hydrateSales] = useSupabaseTableState<Sale>('sales', INITIAL_SALES);
  const [purchases, setPurchases, hydratePurchases] = useSupabaseTableState<Purchase>('purchases', INITIAL_PURCHASES);
  const [quotes, setQuotes, hydrateQuotes] = useSupabaseTableState<Quote>('quotes', INITIAL_QUOTES);
  const [transfers, setTransfers, hydrateTransfers] = useSupabaseTableState<Transfer>('transfers', INITIAL_TRANSFERS);
  const [orders, setOrders, hydrateOrders] = useSupabaseTableState<Order>('orders', INITIAL_ORDERS);
  const [clients, setClients, hydrateClients] = useSupabaseTableState<Client>('clients', INITIAL_CLIENTS);
  const [suppliers, setSuppliers, hydrateSuppliers] = useSupabaseTableState<Supplier>('suppliers', INITIAL_SUPPLIERS);
  const [accountMovements, setAccountMovements, hydrateMovements] = useSupabaseTableState<AccountMovement>(
    'account_movements',
    INITIAL_ACCOUNT_MOVEMENTS
  );
  const [audits, setAudits, hydrateAudits] = useSupabaseTableState<ProductAudit>('product_audits', INITIAL_AUDITS);
  const [employees, setEmployees, hydrateEmployees] = useSupabaseTableState<Employee>('employees', INITIAL_EMPLOYEES);
  const [payroll, setPayroll, hydratePayroll] = useSupabaseTableState<PayrollMovement>(
    'payroll_movements',
    INITIAL_PAYROLL
  );
  const [expenses, setExpenses, hydrateExpenses] = useSupabaseTableState<Expense>('expenses', INITIAL_EXPENSES);
  const [cashClosings, setCashClosings, hydrateCashClosings] = useSupabaseTableState<CashClosing>(
    'cash_closings',
    INITIAL_CASH_CLOSINGS
  );
  const [companies, setCompanies, hydrateCompanies] = useSupabaseTableState<CompanyProfile>(
    'companies',
    INITIAL_COMPANIES
  );
  const [users, setUsers, hydrateUsers] = useSupabaseTableState<UserRoleAccount>('pos_users', INITIAL_USERS);
  const [config, setConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  const [activeCompanyId, setActiveCompanyId] = useState<string>('comp-1');
  const [currentUser, setCurrentUser] = useState<UserRoleAccount>(INITIAL_USERS[0]);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || companies[0] || INITIAL_COMPANIES[0];

  const loginSuccess = () => {
    sessionStorage.setItem('smartpos_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('smartpos_authenticated');
    setIsAuthenticated(false);
  };

  const notify = (msg: string, _type?: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4200);
  };

  const pullAllFromCloud = useCallback(async () => {
    setIsSyncingSupabase(true);
    const res = await pullAllFromSupabase();
    setIsSyncingSupabase(false);
    if (res.ok) {
      setSupabaseTablesReady(true);
      if (res.companies && res.companies.length > 0) {
        hydrateCompanies(res.companies);
      } else {
        // Seed mandatory company record in Supabase if table is empty
        syncTableDiffToSupabase('companies', [], INITIAL_COMPANIES);
      }

      if (res.clients && res.clients.length > 0) {
        hydrateClients(res.clients);
      } else {
        // Seed CONSUMIDOR FINAL in Supabase if table is empty
        syncTableDiffToSupabase('clients', [], INITIAL_CLIENTS);
      }

      if (res.users && res.users.length > 0) {
        // Ensure all 4 standard role accounts exist so the system is divided by roles out-of-the-box
        const existingUsernames = new Set(res.users.map((u) => u.username.toUpperCase()));
        const missingRoleUsers = INITIAL_USERS.filter((u) => !existingUsernames.has(u.username.toUpperCase()));
        if (missingRoleUsers.length > 0) {
          const mergedUsers = [...res.users, ...missingRoleUsers];
          hydrateUsers(mergedUsers);
          syncTableDiffToSupabase('pos_users', res.users, mergedUsers);
        } else {
          hydrateUsers(res.users);
        }
      } else {
        syncTableDiffToSupabase('pos_users', [], INITIAL_USERS);
      }

      if (res.suppliers) hydrateSuppliers(res.suppliers);
      if (res.products) hydrateProducts(res.products);
      if (res.sales) hydrateSales(res.sales);
      if (res.purchases) hydratePurchases(res.purchases);
      if (res.quotes) hydrateQuotes(res.quotes);
      if (res.transfers) hydrateTransfers(res.transfers);
      if (res.orders) hydrateOrders(res.orders);
      if (res.accountMovements) hydrateMovements(res.accountMovements);
      if (res.audits) hydrateAudits(res.audits);
      if (res.employees) hydrateEmployees(res.employees);
      if (res.payroll) hydratePayroll(res.payroll);
      if (res.expenses) hydrateExpenses(res.expenses);
      if (res.cashClosings) hydrateCashClosings(res.cashClosings);
    } else {
      notify(res.message);
    }
  }, [
    hydrateCompanies,
    hydrateClients,
    hydrateUsers,
    hydrateSuppliers,
    hydrateProducts,
    hydrateSales,
    hydratePurchases,
    hydrateQuotes,
    hydrateTransfers,
    hydrateOrders,
    hydrateMovements,
    hydrateAudits,
    hydrateEmployees,
    hydratePayroll,
    hydrateExpenses,
    hydrateCashClosings,
  ]);

  const refreshSupabaseStatus = useCallback(async () => {
    const creds = getSupabaseCredentials();
    setSupabaseConfigured(creds.isConfigured);
    if (creds.isConfigured) {
      const check = await pullProductsAndSalesCount();
      setSupabaseTablesReady(check.tablesReady);
      if (check.tablesReady) {
        await pullAllFromCloud();
      }
    }
  }, [pullAllFromCloud]);

  // Automatically load all data from Supabase on mount
  useEffect(() => {
    refreshSupabaseStatus();
  }, [refreshSupabaseStatus]);

  const syncAllToCloud = async () => {
    setIsSyncingSupabase(true);
    const res = await pushAllToSupabase({
      companies,
      suppliers,
      clients,
      products,
      sales,
      purchases,
      quotes,
      transfers,
      orders,
      accountMovements,
      audits,
      employees,
      payroll,
      expenses,
      cashClosings,
      users,
    });
    setIsSyncingSupabase(false);
    if (res.ok) {
      setSupabaseTablesReady(true);
    }
    notify(res.message);
  };

  const hasPermission = useCallback(
    (permKey: string, userOverride?: UserRoleAccount): boolean => {
      const targetUser = userOverride || currentUser;
      if (!targetUser) return false;
      if (targetUser.role === 'ADMINISTRADOR') return true;
      const perms = targetUser.permissions?.length
        ? targetUser.permissions
        : ROLE_DEFAULT_PERMISSIONS[targetUser.role] || [];
      if (perms.includes('ALL')) return true;
      return perms.includes(permKey);
    },
    [currentUser]
  );

  const canAccessModule = useCallback(
    (id: ModuleId, userOverride?: UserRoleAccount): boolean => {
      if (id === 'control-center') return true;
      const requiredPerm = MODULE_PERMISSION_MAP[id];
      if (!requiredPerm || requiredPerm === 'INICIO') return true;
      return hasPermission(requiredPerm, userOverride);
    },
    [hasPermission]
  );

  const openModule = (id: ModuleId) => {
    const meta = MODULE_METADATA[id];
    if (!canAccessModule(id)) {
      notify(
        `Acceso restringido: El rol ${currentUser.role} (${currentUser.username}) no tiene permiso para "${meta.title}".`,
        'warning'
      );
      return;
    }
    setTabs((prev) => {
      if (prev.some((t) => t.id === id)) return prev;
      return [...prev, { id, title: meta.title, subtitle: meta.subtitle, closable: id !== 'control-center' }];
    });
    setActiveTab(id);
  };

  const switchActiveRoleUser = (user: UserRoleAccount) => {
    setCurrentUser(user);
    const defaultMod = ROLE_DESCRIPTIONS[user.role]?.defaultModule || 'control-center';
    const targetMod = canAccessModule(defaultMod, user) ? defaultMod : 'control-center';
    const targetMeta = MODULE_METADATA[targetMod];

    setTabs((prev) => {
      const allowed = prev.filter((t) => canAccessModule(t.id, user));
      if (!allowed.some((t) => t.id === targetMod)) {
        allowed.push({
          id: targetMod,
          title: targetMeta.title,
          subtitle: targetMeta.subtitle,
          closable: targetMod !== 'control-center',
        });
      }
      return allowed.length > 0
        ? allowed
        : [{ id: 'control-center', title: 'Inicio', subtitle: 'Smart Punto de Venta', closable: false }];
    });
    setActiveTab(targetMod);
    notify(`Rol activo cambiado a: ${user.role} (${user.username})`, 'info');
  };

  const closeTab = (id: ModuleId) => {
    if (id === 'control-center') return;
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTab === id) {
        const last = filtered[filtered.length - 1];
        setActiveTab(last ? last.id : 'control-center');
      }
      return filtered;
    });
  };

  const getNextDocNumber = (existingNumbers: string[]): string => {
    const maxNum = existingNumbers.reduce((max, numStr) => {
      const parsed = parseInt(numStr, 10);
      return !isNaN(parsed) && parsed > max ? parsed : max;
    }, 0);
    return String(maxNum + 1);
  };

  const recordSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber'>): Sale => {
    const isPreventa = saleData.mode === 'PREVENTA' || saleData.status === 'PENDIENTE_PREVENTA';
    const invoiceNumber = getNextDocNumber(sales.map((s) => s.invoiceNumber));

    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      invoiceNumber,
    };

    // setSales automatically inserts into Supabase `sales`
    setSales((prev) => [newSale, ...prev]);

    if (!isPreventa) {
      setConfig((prev) => ({
        ...prev,
        invoice: { ...prev.invoice, nextNumber: prev.invoice.nextNumber + 1 },
      }));

      // setProducts automatically updates stock & history in Supabase `products`
      setProducts((prev) =>
        prev.map((prod) => {
          const soldQty = saleData.items
            .filter((i) => i.productId === prod.id || i.code === prod.code)
            .reduce((sum, i) => sum + i.quantity, 0);
          if (soldQty <= 0) return prod;
          const newStock = Math.max(0, Number((prod.stock - soldQty).toFixed(4)));
          return {
            ...prod,
            stock: newStock,
            history: [
              {
                id: `h-${Date.now()}-${prod.id}`,
                date: saleData.date,
                type: 'VENTA',
                documentRef: invoiceNumber,
                quantity: -soldQty,
                previousStock: prod.stock,
                newStock,
                user: currentUser.username,
                note: `Venta (${saleData.mode}) a ${saleData.clientName}`,
              },
              ...prod.history,
            ],
          };
        })
      );

      if (saleData.paymentType === 'CREDITO' && saleData.balanceDue > 0) {
        setClients((prev) =>
          prev.map((cli) =>
            cli.id === saleData.clientId
              ? { ...cli, currentBalance: Number((cli.currentBalance + saleData.balanceDue).toFixed(2)) }
              : cli
          )
        );
      }
    }

    notify(`${isPreventa ? 'PreVenta' : 'Factura'} Nº ${invoiceNumber} guardada en Supabase.`);
    return newSale;
  };

  const convertQuoteToSale = (quoteId: string) => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) return;
    if (quote.status === 'CONVERTIDA') {
      notify('Esta cotización ya fue convertida en venta.');
      return;
    }

    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    recordSale({
      date: now,
      clientId: quote.clientId,
      clientName: quote.clientName,
      sellerName: currentUser.fullName,
      mode: 'ESTANDAR',
      paymentType: 'CONTADO',
      status: 'COMPLETADA',
      subtotal: quote.subtotal,
      discountTotal: 0,
      taxTotal: quote.taxTotal,
      total: quote.total,
      balanceDue: 0,
      notes: `Cotización ${quote.quoteNumber}`,
      items: quote.items,
    });

    setQuotes((prev) => prev.map((q) => (q.id === quoteId ? { ...q, status: 'CONVERTIDA' } : q)));
    openModule('ventas-lista');
  };

  const convertOrderToPurchase = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const newPurchase: Purchase = {
      id: `pur-${Date.now()}`,
      documentNumber: getNextDocNumber(purchases.map((p) => p.documentNumber)),
      supplierInvoice: `PED-${order.orderNumber}`,
      date: new Date().toISOString().slice(0, 10),
      supplierId: order.supplierId,
      supplierName: order.supplierName,
      paymentType: 'CREDITO',
      status: 'BORRADOR',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      subtotal: order.totalEstimated,
      taxTotal: Number((order.totalEstimated * 0.15).toFixed(2)),
      total: Number((order.totalEstimated * 1.15).toFixed(2)),
      balanceDue: Number((order.totalEstimated * 1.15).toFixed(2)),
      notes: '15 DIAS',
      items: order.items.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.estimatedCost,
          previousCost: prod ? prod.cost : item.estimatedCost,
          suggestedSalePrice: Number((item.estimatedCost * 1.4).toFixed(2)),
          currentSalePrice: prod ? prod.price : Number((item.estimatedCost * 1.4).toFixed(2)),
          total: Number((item.quantity * item.estimatedCost).toFixed(2)),
        };
      }),
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'CONVERTIDO_COMPRA' } : o)));
    notify(`Pedido ${order.orderNumber} convertido en Compra #${newPurchase.documentNumber} en Supabase.`);
    openModule('compras-lista');
  };

  const finalizePurchase = (purchaseId: string, updateSalePrices: boolean) => {
    const pur = purchases.find((p) => p.id === purchaseId);
    if (!pur || pur.status === 'FINALIZADA') return;

    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              status: 'FINALIZADA',
              balanceDue: p.paymentType === 'CREDITO' ? p.total : 0,
            }
          : p
      )
    );

    setProducts((prev) =>
      prev.map((prod) => {
        const matchingItems = pur.items.filter((i) => i.productId === prod.id || i.code === prod.code);
        if (matchingItems.length === 0) return prod;
        const addedQty = matchingItems.reduce((sum, i) => sum + i.quantity, 0);
        const lastItem = matchingItems[matchingItems.length - 1];
        const newStock = Number((prod.stock + addedQty).toFixed(4));
        return {
          ...prod,
          stock: newStock,
          cost: lastItem.unitCost,
          price: updateSalePrices ? lastItem.suggestedSalePrice : prod.price,
          history: [
            {
              id: `h-${Date.now()}-${prod.id}`,
              date: pur.date,
              type: 'COMPRA',
              documentRef: pur.documentNumber,
              quantity: addedQty,
              previousStock: prod.stock,
              newStock,
              user: currentUser.username,
              note: `Compra finalizada (${pur.supplierName})`,
            },
            ...prod.history,
          ],
        };
      })
    );

    if (pur.paymentType === 'CREDITO') {
      const creditAdd = pur.balanceDue ?? pur.total;
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === pur.supplierId ? { ...s, currentBalance: Number((s.currentBalance + creditAdd).toFixed(2)) } : s
        )
      );
    }

    notify(`Compra #${pur.documentNumber} recibida y sincronizada en Supabase.`);
  };

  const registerAccountMovement = (mov: Omit<AccountMovement, 'id'>) => {
    const newMov: AccountMovement = { ...mov, id: `mov-${Date.now()}` };
    setAccountMovements((prev) => [newMov, ...prev]);

    const delta = mov.movementType === 'RECARGO' ? mov.amount : -mov.amount;

    if (mov.accountType === 'COBRAR') {
      setClients((prev) =>
        prev.map((c) =>
          c.id === mov.entityId
            ? { ...c, currentBalance: Math.max(0, Number((c.currentBalance + delta).toFixed(2))) }
            : c
        )
      );
      if (mov.documentId) {
        setSales((prev) =>
          prev.map((s) => {
            if (s.id !== mov.documentId) return s;
            const nextBal = Math.max(0, Number((s.balanceDue + delta).toFixed(2)));
            return {
              ...s,
              balanceDue: nextBal,
              status: nextBal === 0 ? 'COMPLETADA' : s.status,
            };
          })
        );
      }
    } else {
      setSuppliers((prev) =>
        prev.map((sup) =>
          sup.id === mov.entityId
            ? { ...sup, currentBalance: Math.max(0, Number((sup.currentBalance + delta).toFixed(2))) }
            : sup
        )
      );
      if (mov.documentId) {
        setPurchases((prev) =>
          prev.map((p) => {
            if (p.id !== mov.documentId) return p;
            const nextBal = Math.max(0, Number((p.balanceDue + delta).toFixed(2)));
            return { ...p, balanceDue: nextBal };
          })
        );
      }
    }

    notify(`${mov.movementType} por C$${mov.amount.toFixed(2)} guardado en Supabase.`);
  };

  const exportToExcelCSV = (filename: string, rows: Record<string, unknown>[]) => {
    if (!rows.length) {
      notify('No hay registros para exportar.');
      return;
    }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Archivo Excel/CSV "${filename}.csv" descargado correctamente.`);
  };

  const resetAllDemoData = () => {
    pullAllFromCloud();
  };

  return (
    <POSContext.Provider
      value={{
        tabs,
        activeTab,
        openModule,
        closeTab,
        activeCompany,
        activeCompanyId,
        setActiveCompanyId,
        currentUser,
        setCurrentUser,
        canAccessModule,
        hasPermission,
        switchActiveRoleUser,
        isAuthenticated,
        loginSuccess,
        logout,
        isScreenLocked,
        setIsScreenLocked,
        toastMessage,
        notify,
        supabaseConfigured,
        supabaseTablesReady,
        isSyncingSupabase,
        refreshSupabaseStatus,
        syncAllToCloud,
        pullAllFromCloud,
        products,
        setProducts,
        sales,
        setSales,
        purchases,
        setPurchases,
        quotes,
        setQuotes,
        transfers,
        setTransfers,
        orders,
        setOrders,
        clients,
        setClients,
        suppliers,
        setSuppliers,
        accountMovements,
        setAccountMovements,
        audits,
        setAudits,
        employees,
        setEmployees,
        payroll,
        setPayroll,
        expenses,
        setExpenses,
        cashClosings,
        setCashClosings,
        companies,
        setCompanies,
        users,
        setUsers,
        config,
        setConfig,
        recordSale,
        convertQuoteToSale,
        convertOrderToPurchase,
        finalizePurchase,
        registerAccountMovement,
        exportToExcelCSV,
        resetAllDemoData,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error('usePOS debe usarse dentro de POSProvider');
  return ctx;
};
