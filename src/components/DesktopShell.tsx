import React, { useState } from 'react';
import {
  ShoppingCart,
  LayoutList,
  Grid,
  HandCoins,
  BarChart3,
  Plus,
  UserCheck,
  FileCheck,
  Truck,
  Users,
  UserCog,
  Home,
  RotateCcw,
  Network,
  Settings,
  Lock,
  Building2,
  User,
  KeyRound,
  Download,
  Info,
  ChevronUp,
  ChevronDown,
  Calculator,
  Search,
  ClipboardList,
  Receipt,
  ClipboardCheck,
  CheckCircle2,
  LogIn,
  LogOut,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ROLE_DESCRIPTIONS, ROLE_DEFAULT_PERMISSIONS } from '../data/mockData';
import { ModuleId, UserRoleAccount } from '../types/pos';
import { createPOSClient } from '../lib/supabase';

// Exports kept for compatibility with any other module importing them
export const FACTURACION_MENU_ITEMS: { id: ModuleId; label: string; shortcut?: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'ventas-lista', label: 'Lista de Ventas', shortcut: 'F2', icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />, group: 'Ventas' },
  { id: 'venta-estandar', label: 'Nueva Venta Estándar', shortcut: 'F3', icon: <LayoutList className="w-4 h-4 text-blue-600" />, group: 'Ventas' },
  { id: 'venta-tactil', label: 'Nueva Venta Táctil', shortcut: 'F4', icon: <Grid className="w-4 h-4 text-purple-600" />, group: 'Ventas' },
  { id: 'cuentas-cobrar', label: 'Cuentas Por Cobrar', shortcut: 'F5', icon: <HandCoins className="w-4 h-4 text-emerald-700" />, group: 'Ventas' },
  { id: 'reportes', label: 'Lista de Reportes', icon: <BarChart3 className="w-4 h-4 text-indigo-600" />, group: 'Ventas' },
  { id: 'productos', label: 'Productos', shortcut: 'F6', icon: <ShoppingCart className="w-4 h-4 text-orange-500" />, group: 'Produ..' },
  { id: 'compras-lista', label: 'Lista de Compras', icon: <ShoppingCart className="w-4 h-4 text-emerald-600" />, group: 'Compras' },
  { id: 'compra-nueva', label: 'Nueva Compra', icon: <Plus className="w-4 h-4 text-blue-600" />, group: 'Compras' },
  { id: 'cuentas-pagar', label: 'Cuentas Por Pagar', icon: <HandCoins className="w-4 h-4 text-rose-600" />, group: 'Compras' },
  { id: 'cotizaciones', label: 'Lista de Cotizaciones', icon: <FileCheck className="w-4 h-4 text-blue-600" />, group: 'Cotizacio..' },
  { id: 'traslados', label: 'Traslado de Productos', icon: <Truck className="w-4 h-4 text-emerald-600" />, group: 'Traslado' },
  { id: 'pedidos', label: 'Lista de Pedidos', icon: <Truck className="w-4 h-4 text-blue-500" />, group: 'Pedi..' },
  { id: 'clientes', label: 'Clientes', icon: <Users className="w-4 h-4 text-emerald-600" />, group: 'Clientes & Proveed..' },
  { id: 'proveedores', label: 'Proveedores', icon: <Users className="w-4 h-4 text-blue-600" />, group: 'Clientes & Proveed..' },
  { id: 'usuarios-permisos', label: 'Usuarios & Permisos', icon: <UserCog className="w-4 h-4 text-slate-600" />, group: 'Usuarios' },
  { id: 'empresa-info', label: 'Información de la Empresa', icon: <Home className="w-4 h-4 text-emerald-600" />, group: 'Empresa' },
  { id: 'respaldos', label: 'Respaldos & Restauración', icon: <RotateCcw className="w-4 h-4 text-blue-600" />, group: 'Respaldos & Configuración' },
  { id: 'empresas-config', label: 'Configurar Empresas', icon: <Network className="w-4 h-4 text-teal-600" />, group: 'Respaldos & Configuración' },
  { id: 'configuracion-general', label: 'Configuración General', icon: <Settings className="w-4 h-4 text-blue-700" />, group: 'Respaldos & Configuración' },
];

export const ADMINISTRACION_MENU_ITEMS: { id: ModuleId; label: string; shortcut?: string; icon: React.ReactNode }[] = [
  { id: 'diario-digital', label: 'Diario Digital (Cierre de Caja)', shortcut: 'F8', icon: <Calculator className="w-4 h-4 text-emerald-600" /> },
  { id: 'gastos-buscar', label: 'Buscar y Organizar Gastos', icon: <Search className="w-4 h-4 text-amber-600" /> },
  { id: 'planillas', label: 'Administrador de Planillas', icon: <ClipboardList className="w-4 h-4 text-blue-600" /> },
  { id: 'empleados', label: 'Lista de Empleados', icon: <UserCheck className="w-4 h-4 text-indigo-600" /> },
  { id: 'gastos-admin', label: 'Administrador de Gastos', icon: <Receipt className="w-4 h-4 text-rose-600" /> },
];

interface RibbonButtonItem {
  id: ModuleId;
  line1: string;
  line2: string;
  icon: React.ReactNode;
}

interface RibbonGroup {
  groupTitle: string;
  items: RibbonButtonItem[];
}

const FACTURACION_RIBBON_GROUPS: RibbonGroup[] = [
  {
    groupTitle: 'Ventas',
    items: [
      {
        id: 'ventas-lista',
        line1: 'Lista de',
        line2: 'Ventas',
        icon: (
          <div className="relative flex items-center justify-center w-8 h-8">
            <ShoppingCart className="w-7 h-7 text-emerald-600 stroke-[2.2]" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 bg-white rounded-full absolute -top-0.5 -right-0.5" />
          </div>
        ),
      },
      {
        id: 'venta-estandar',
        line1: 'Nueva Venta',
        line2: 'Estándar',
        icon: (
          <div className="w-8 h-8 rounded bg-gradient-to-b from-sky-400 to-blue-600 p-1 flex flex-col justify-between shadow-sm border border-blue-700/40">
            <div className="h-1 bg-white/90 rounded-sm w-full" />
            <div className="space-y-0.5">
              <div className="h-0.5 bg-white/80 w-full" />
              <div className="h-0.5 bg-white/80 w-4/5" />
              <div className="h-0.5 bg-white/80 w-full" />
            </div>
          </div>
        ),
      },
      {
        id: 'venta-tactil',
        line1: 'Nueva Venta',
        line2: 'Táctil',
        icon: (
          <div className="w-7 h-7 grid grid-cols-3 gap-0.5 p-0.5 bg-slate-400/30 rounded">
            <span className="bg-amber-400 rounded-[1px]" />
            <span className="bg-sky-500 rounded-[1px]" />
            <span className="bg-emerald-500 rounded-[1px]" />
            <span className="bg-rose-500 rounded-[1px]" />
            <span className="bg-amber-500 rounded-[1px]" />
            <span className="bg-blue-600 rounded-[1px]" />
            <span className="bg-teal-500 rounded-[1px]" />
            <span className="bg-orange-400 rounded-[1px]" />
            <span className="bg-indigo-500 rounded-[1px]" />
          </div>
        ),
      },
      {
        id: 'cuentas-cobrar',
        line1: 'Cuentas',
        line2: 'Por Cobrar',
        icon: (
          <div className="relative flex items-center justify-center w-8 h-8">
            <HandCoins className="w-7 h-7 text-emerald-700 stroke-[2]" />
          </div>
        ),
      },
      {
        id: 'reportes',
        line1: 'Lista de',
        line2: 'Reportes',
        icon: (
          <div className="w-7 h-7 flex items-end justify-center gap-0.5 pt-1">
            <span className="w-1.5 h-3 bg-rose-500 rounded-t-[1px]" />
            <span className="w-1.5 h-4 bg-amber-400 rounded-t-[1px]" />
            <span className="w-1.5 h-6 bg-emerald-500 rounded-t-[1px]" />
            <span className="w-1.5 h-5 bg-sky-500 rounded-t-[1px]" />
          </div>
        ),
      },
    ],
  },
  {
    groupTitle: 'Produ..',
    items: [
      {
        id: 'productos',
        line1: 'Productos',
        line2: '',
        icon: <ShoppingCart className="w-7 h-7 text-orange-500 stroke-[2.2]" />,
      },
    ],
  },
  {
    groupTitle: 'Compras',
    items: [
      {
        id: 'compras-lista',
        line1: 'Lista de',
        line2: 'Compras',
        icon: <ShoppingCart className="w-7 h-7 text-emerald-600 stroke-[2.2]" />,
      },
      {
        id: 'compra-nueva',
        line1: 'Nueva',
        line2: 'Compra',
        icon: <Plus className="w-7 h-7 text-sky-600 stroke-[3.2]" />,
      },
      {
        id: 'cuentas-pagar',
        line1: 'Cuentas',
        line2: 'Por Pagar',
        icon: (
          <div className="relative flex items-center justify-center w-8 h-8">
            <User className="w-6 h-6 text-rose-600 fill-rose-600/20" />
            <span className="absolute -right-0.5 bottom-0 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center">
              $
            </span>
          </div>
        ),
      },
    ],
  },
  {
    groupTitle: 'Cotizacio..',
    items: [
      {
        id: 'cotizaciones',
        line1: 'Lista de',
        line2: 'Cotizaciones',
        icon: <FileCheck className="w-7 h-7 text-sky-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Traslado',
    items: [
      {
        id: 'traslados',
        line1: 'Traslado de',
        line2: 'Productos',
        icon: <Truck className="w-7 h-7 text-emerald-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Pedi..',
    items: [
      {
        id: 'pedidos',
        line1: 'Lista de',
        line2: 'Pedidos',
        icon: <Truck className="w-7 h-7 text-sky-500 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Clientes & Proveed..',
    items: [
      {
        id: 'clientes',
        line1: 'Clientes',
        line2: '',
        icon: <Users className="w-7 h-7 text-emerald-600/80 stroke-[2]" />,
      },
      {
        id: 'proveedores',
        line1: 'Proveedores',
        line2: '',
        icon: <Users className="w-7 h-7 text-sky-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Usuarios',
    items: [
      {
        id: 'usuarios-permisos',
        line1: 'Usuarios &',
        line2: 'Permisos',
        icon: <UserCog className="w-7 h-7 text-slate-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Empresa',
    items: [
      {
        id: 'empresa-info',
        line1: 'Información',
        line2: 'de la Empresa',
        icon: <Home className="w-7 h-7 text-emerald-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Respaldos & Configuración',
    items: [
      {
        id: 'respaldos',
        line1: 'Respaldos &',
        line2: 'Restauración',
        icon: <RotateCcw className="w-7 h-7 text-sky-600 stroke-[2.2]" />,
      },
      {
        id: 'empresas-config',
        line1: 'Configurar',
        line2: 'Empresas',
        icon: <Network className="w-7 h-7 text-teal-600 stroke-[2]" />,
      },
      {
        id: 'configuracion-general',
        line1: 'Configuración',
        line2: 'General',
        icon: <Settings className="w-7 h-7 text-sky-700 stroke-[2.2]" />,
      },
    ],
  },
];

const ADMINISTRACION_RIBBON_GROUPS: RibbonGroup[] = [
  {
    groupTitle: 'Cierre de Caja',
    items: [
      {
        id: 'diario-digital',
        line1: 'Diario Digital',
        line2: '(Cierre de Caja)',
        icon: <Calculator className="w-7 h-7 text-emerald-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Control de Gastos',
    items: [
      {
        id: 'gastos-buscar',
        line1: 'Buscar y',
        line2: 'Organizar Gastos',
        icon: <Search className="w-7 h-7 text-amber-600 stroke-[2.2]" />,
      },
      {
        id: 'gastos-admin',
        line1: 'Administrador',
        line2: 'de Gastos',
        icon: <Receipt className="w-7 h-7 text-rose-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Recursos Humanos y Planillas',
    items: [
      {
        id: 'planillas',
        line1: 'Administrador',
        line2: 'de Planillas',
        icon: <ClipboardList className="w-7 h-7 text-sky-600 stroke-[2]" />,
      },
      {
        id: 'empleados',
        line1: 'Lista de',
        line2: 'Empleados',
        icon: <UserCheck className="w-7 h-7 text-indigo-600 stroke-[2]" />,
      },
    ],
  },
  {
    groupTitle: 'Módulos Especiales',
    items: [
      {
        id: 'auditoria',
        line1: 'Auditoría de',
        line2: 'Productos',
        icon: <ClipboardCheck className="w-7 h-7 text-fuchsia-600 stroke-[2]" />,
      },
      {
        id: 'preventas',
        line1: 'PreVentas',
        line2: 'de Piso',
        icon: <ShoppingCart className="w-7 h-7 text-amber-600 stroke-[2]" />,
      },
    ],
  },
];

export const DesktopShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    tabs,
    activeTab,
    openModule,
    closeTab,
    activeCompany,
    companies,
    setActiveCompanyId,
    currentUser,
    users,
    canAccessModule,
    switchActiveRoleUser,
    logout,
    isScreenLocked,
    setIsScreenLocked,
    config,
    toastMessage,
    supabaseConfigured,
  } = usePOS();

  const [ribbonTab, setRibbonTab] = useState<'FACTURACION' | 'ADMINISTRACION'>('FACTURACION');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pendingRoleUser, setPendingRoleUser] = useState<UserRoleAccount | null>(null);
  const [switchPinInput, setSwitchPinInput] = useState('');
  const [switchError, setSwitchError] = useState('');
  const [switchLoading, setSwitchLoading] = useState(false);

  const roleMeta = ROLE_DESCRIPTIONS[currentUser.role] || ROLE_DESCRIPTIONS.ADMINISTRADOR;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === config.general.screenLockPin || pinInput === currentUser.pin) {
      setIsScreenLocked(false);
      setPinInput('');
      setPinError('');
    } else {
      setPinError('PIN incorrecto. Intente con 1234.');
    }
  };

  const handleRoleSwitchLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingRoleUser) return;
    setSwitchError('');
    setSwitchLoading(true);

    try {
      const sb = createPOSClient();
      if (sb) {
        const { data } = await sb
          .from('pos_users')
          .select('*')
          .ilike('username', pendingRoleUser.username)
          .eq('active', true)
          .maybeSingle();

        if (data) {
          if (data.pin !== switchPinInput.trim()) {
            setSwitchError('Contraseña / PIN incorrecto.');
            setSwitchLoading(false);
            return;
          }
          const dbUser: UserRoleAccount = {
            id: data.id,
            username: data.username,
            fullName: data.full_name,
            role: data.role as UserRoleAccount['role'],
            branch: data.branch,
            active: data.active,
            pin: data.pin,
            permissions:
              Array.isArray(data.permissions) && data.permissions.length > 0
                ? data.permissions
                : ROLE_DEFAULT_PERMISSIONS[data.role as UserRoleAccount['role']] || ['ALL'],
          };
          switchActiveRoleUser(dbUser);
          setPendingRoleUser(null);
          setSwitchPinInput('');
          setSwitchLoading(false);
          return;
        }
      }

      if (pendingRoleUser.pin !== switchPinInput.trim()) {
        setSwitchError('Contraseña / PIN incorrecto.');
        setSwitchLoading(false);
        return;
      }

      switchActiveRoleUser(pendingRoleUser);
      setPendingRoleUser(null);
      setSwitchPinInput('');
    } finally {
      setSwitchLoading(false);
    }
  };

  const filteredFacturacionGroups = FACTURACION_RIBBON_GROUPS.map((grp) => ({
    ...grp,
    items: grp.items.filter((item) => canAccessModule(item.id)),
  })).filter((grp) => grp.items.length > 0);

  const filteredAdministracionGroups = ADMINISTRACION_RIBBON_GROUPS.map((grp) => ({
    ...grp,
    items: grp.items.filter((item) => canAccessModule(item.id)),
  })).filter((grp) => grp.items.length > 0);

  const effectiveRibbonTab =
    ribbonTab === 'ADMINISTRACION' && filteredAdministracionGroups.length === 0
      ? 'FACTURACION'
      : ribbonTab;

  const activeGroups =
    effectiveRibbonTab === 'FACTURACION' ? filteredFacturacionGroups : filteredAdministracionGroups;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#d5dce6] text-slate-800 select-none">
      {/* 1. RIBBON MENU TABS ROW (Facturación | Administración + Right Status Icons) */}
      <div className="bg-[#cfdbe8] px-2 pt-1 flex items-end justify-between border-b border-[#b8c6d8]">
        {/* Left Ribbon Tabs */}
        <div className="flex items-end gap-0.5 text-xs">
          {filteredFacturacionGroups.length > 0 && (
            <button
              onClick={() => {
                setRibbonTab('FACTURACION');
                setRibbonCollapsed(false);
              }}
              className={`px-4 py-1 rounded-t border-t border-x text-[11px] transition ${
                effectiveRibbonTab === 'FACTURACION'
                  ? 'bg-[#dde7f2] border-[#a5b6ca] font-semibold text-slate-900 -mb-px z-10'
                  : 'bg-transparent border-transparent text-slate-700 hover:bg-[#d6e2ef]'
              }`}
            >
              Facturación
            </button>
          )}
          {filteredAdministracionGroups.length > 0 && (
            <button
              onClick={() => {
                setRibbonTab('ADMINISTRACION');
                setRibbonCollapsed(false);
              }}
              className={`px-4 py-1 rounded-t border-t border-x text-[11px] transition ${
                effectiveRibbonTab === 'ADMINISTRACION'
                  ? 'bg-[#dde7f2] border-[#a5b6ca] font-semibold text-slate-900 -mb-px z-10'
                  : 'bg-transparent border-transparent text-slate-700 hover:bg-[#d6e2ef]'
              }`}
            >
              Administración
            </button>
          )}
        </div>

        {/* Right Quick Status Strip (Padlock, Company, User, Key, YouTube, Download, Info) */}
        <div className="flex items-center gap-3 pb-1 pr-1 text-[11px] text-slate-700">
          {/* Red Lock Icon */}
          <button
            onClick={() => setIsScreenLocked(true)}
            className="text-rose-700 hover:text-rose-600 transition"
            title="Bloquear Pantalla (PIN)"
          >
            <Lock className="w-3.5 h-3.5 fill-rose-700/20" />
          </button>

          {/* Active Branch / Company */}
          <div className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-sky-700" />
            <select
              value={activeCompany.id}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="bg-transparent font-medium text-slate-800 uppercase text-[11px] focus:outline-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.commercialName}
                </option>
              ))}
            </select>
          </div>

          {/* Active User & Role Switcher */}
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded-[2px] border text-[9.5px] font-extrabold tracking-wide uppercase ${roleMeta.badgeColor}`}
              title={roleMeta.summary}
            >
              ROL: {currentUser.role}
            </span>
            <User className="w-3.5 h-3.5 text-sky-700 fill-sky-700/20" />
            <select
              value={currentUser.id}
              onChange={(e) => {
                const found = users.find((u) => u.id === e.target.value);
                if (found && found.id !== currentUser.id) {
                  setPendingRoleUser(found);
                  setSwitchPinInput('');
                  setSwitchError('');
                }
              }}
              className="bg-transparent font-bold text-slate-800 uppercase text-[11px] focus:outline-none cursor-pointer"
              title="Cambiar usuario / rol activo (requiere iniciar sesión)"
            >
              {users
                .filter((u) => u.active)
                .map((u) => (
                  <option key={u.id} value={u.id} className="text-slate-900">
                    {u.username.toUpperCase()} — [{u.role}]
                  </option>
                ))}
            </select>
          </div>

          {/* Key / Supabase Connection */}
          <button
            onClick={() => openModule('respaldos')}
            className="flex items-center gap-0.5 text-slate-600 hover:text-blue-700"
            title={supabaseConfigured ? 'Supabase Conectado (Click para abrir sincronización)' : 'Conectar Supabase'}
          >
            <KeyRound className={`w-3.5 h-3.5 ${supabaseConfigured ? 'text-emerald-700' : 'text-slate-600'}`} />
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {/* Blue Download / Backup Icon */}
          <button
            onClick={() => openModule('respaldos')}
            className="text-sky-600 hover:text-sky-700"
            title="Respaldos y Descarga de Datos"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Green Info Icon */}
          <button
            onClick={() => openModule('empresa-info')}
            className="text-emerald-600 hover:text-emerald-700"
            title="Información de la Empresa"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* Logout / Cerrar Sesión Button */}
          <button
            onClick={logout}
            className="ml-1 px-2 py-0.5 rounded-[2px] bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition"
            title="Cerrar sesión de usuario"
          >
            <LogOut className="w-3 h-3" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>

      {/* 3. RIBBON TOOLBAR */}
      {!ribbonCollapsed && (
        <div className="bg-gradient-to-b from-[#e3ecf5] to-[#d5e1ee] border-b border-[#9fb2c7] px-1.5 py-1 flex items-stretch justify-between overflow-x-auto shrink-0">
          <div className="flex items-stretch">
            {activeGroups.map((grp, gIdx) => (
              <div
                key={gIdx}
                className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8] last:border-r-0"
              >
                {/* Buttons row */}
                <div className="flex items-start gap-0.5">
                  {grp.items.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => openModule(item.id)}
                        className={`flex flex-col items-center justify-start px-2 py-1 rounded min-w-[58px] h-[64px] transition ${
                          isActive
                            ? 'bg-[#c4d8ee] border border-[#7da2ce] shadow-inner'
                            : 'hover:bg-[#d0e0f0] border border-transparent hover:border-[#a3bde0]'
                        }`}
                      >
                        <div className="h-8 flex items-center justify-center mb-0.5">{item.icon}</div>
                        <div className="text-[10.5px] leading-[11px] text-slate-800 text-center font-normal">
                          <div>{item.line1}</div>
                          {item.line2 && <div>{item.line2}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Group bottom title */}
                <div className="text-[10px] text-slate-600 text-center pt-0.5 truncate">
                  {grp.groupTitle}
                </div>
              </div>
            ))}
          </div>

          {/* Collapse Ribbon Up Arrow on Far Right */}
          <div className="flex items-end pb-0.5 pl-2">
            <button
              onClick={() => setRibbonCollapsed(true)}
              className="p-0.5 rounded hover:bg-slate-300/60 text-slate-600"
              title="Ocultar cinta de opciones"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. DARK NAVY TAB BAR (#1c2b42) WITH YELLOW ACTIVE TAB */}
      <div className="bg-[#1c2b42] px-1 pt-1 flex items-center justify-between border-b border-[#0f1928] shrink-0">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <div
                key={tab.id}
                onClick={() => openModule(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-1 text-xs cursor-pointer transition select-none shrink-0 ${
                  active
                    ? 'bg-[#fff3a1] text-slate-900 font-bold border-t border-x border-[#e0c55a]'
                    : 'bg-[#283b57] text-slate-200 hover:bg-[#334969]'
                }`}
              >
                <span>{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tab.id === 'control-center' && tabs.length === 1) return;
                    closeTab(tab.id);
                  }}
                  className={`text-[11px] leading-none ${
                    active ? 'text-slate-600 hover:text-rose-700' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Cerrar pestaña"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <div className="pr-2 text-slate-300">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 5. MAIN WORKSPACE AREA */}
      <main className="flex-1 overflow-y-auto bg-[#d5dce6] relative">{children}</main>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl border border-blue-500/40 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ROLE SWITCH LOGIN MODAL */}
      {pendingRoleUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-[410px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden">
            {/* Title Bar */}
            <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                <span className="text-[11px] font-semibold text-slate-800">
                  Iniciar Sesión — Cambio de Rol
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPendingRoleUser(null);
                  setSwitchPinInput('');
                  setSwitchError('');
                }}
                className="text-slate-600 hover:text-rose-600 font-bold text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* Subheader */}
            <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white text-[11px]">
              <span className="font-bold text-[#fff3a1]">ROL: {pendingRoleUser.role}</span>
              <span className="text-[10px] text-slate-300">{pendingRoleUser.branch}</span>
            </div>

            <form onSubmit={handleRoleSwitchLogin} className="p-4 space-y-3 text-xs">
              <div className="p-2 bg-[#e6ecf4] border border-[#b8c4d4] text-[10px] text-slate-700 leading-tight">
                <strong className="text-slate-900">
                  {(ROLE_DESCRIPTIONS[pendingRoleUser.role] || ROLE_DESCRIPTIONS.ADMINISTRADOR).label}:
                </strong>{' '}
                {(ROLE_DESCRIPTIONS[pendingRoleUser.role] || ROLE_DESCRIPTIONS.ADMINISTRADOR).summary}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                  USUARIO SELECCIONADO
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                  <input
                    type="text"
                    readOnly
                    value={`${pendingRoleUser.username} — ${pendingRoleUser.fullName}`}
                    className="w-full h-6 pl-7 pr-2 bg-[#eef2f7] border border-[#a5aebc] text-[11px] font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">
                  CONTRASEÑA / PIN
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-1.5" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={switchPinInput}
                    onChange={(e) => setSwitchPinInput(e.target.value)}
                    placeholder="Ingrese su PIN (por defecto: 1234)"
                    className="w-full h-6 pl-7 pr-2 bg-white border border-[#a5aebc] text-[11px] font-mono text-slate-800"
                  />
                </div>
              </div>

              {switchError && (
                <div className="p-1.5 bg-red-100 border border-red-400 text-red-800 text-[10px] font-semibold">
                  {switchError}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-[#b8c0cc] gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingRoleUser(null);
                    logout();
                  }}
                  className="px-2.5 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[10px] font-semibold text-slate-700"
                >
                  Ir al Login Principal
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingRoleUser(null);
                      setSwitchPinInput('');
                      setSwitchError('');
                    }}
                    className="px-3 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] font-semibold text-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={switchLoading}
                    className="px-4 h-7 bg-[#1c2b42] hover:bg-[#263a59] text-[#fff3a1] font-bold text-[11px] border border-[#0f172a] flex items-center gap-1.5 shadow"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {switchLoading ? 'VERIFICANDO...' : 'Iniciar Sesión'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCREEN LOCK OVERLAY */}
      {isScreenLocked && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-sm w-full p-6 text-center">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 mx-auto mb-3 object-contain" />
            <h2 className="text-base font-bold text-slate-800">Smart Punto de Venta Bloqueado</h2>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Operador: <strong>{currentUser.fullName}</strong>. Ingrese su PIN para desbloquear.
            </p>
            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="PIN (ej. 1234)"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {pinError && <p className="text-xs text-rose-600 font-medium">{pinError}</p>}
              <button
                type="submit"
                className="w-full bg-[#1c2b42] hover:bg-slate-800 text-white font-semibold py-2 rounded-lg text-xs transition"
              >
                Desbloquear Terminal
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
