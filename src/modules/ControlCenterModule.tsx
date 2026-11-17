import React, { useState } from 'react';
import { LayoutGrid, Eye } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ROLE_DESCRIPTIONS } from '../data/mockData';
import { FACTURACION_MENU_ITEMS, ADMINISTRACION_MENU_ITEMS } from '../components/DesktopShell';

export const ControlCenterModule: React.FC = () => {
  const { activeCompany, currentUser, canAccessModule, openModule, sales, clients, suppliers, products } = usePOS();
  const [showDashboardGrid, setShowDashboardGrid] = useState(false);
  const roleInfo = ROLE_DESCRIPTIONS[currentUser.role] || ROLE_DESCRIPTIONS.ADMINISTRADOR;

  const totalSalesAmount = sales
    .filter((s) => s.status !== 'ANULADA' && s.status !== 'PENDIENTE_PREVENTA')
    .reduce((acc, s) => acc + s.total, 0);
  const totalReceivable = clients.reduce((acc, c) => acc + c.currentBalance, 0);
  const totalPayable = suppliers.reduce((acc, s) => acc + s.currentBalance, 0);

  if (!showDashboardGrid) {
    return (
      <div className="h-full w-full bg-[#d5dce6] flex items-center justify-center p-6 relative select-none">
        {/* Classic Centered Smart Punto de Venta Card matching reference image */}
        <div className="w-full max-w-[650px] min-h-[290px] bg-[#d8e0eb] border border-[#b8c3d1] px-8 py-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          {/* Left Company Details */}
          <div className="space-y-4 text-[#12263f] text-left flex-1">
            <h1 className="text-[20px] font-extrabold tracking-tight underline decoration-2 underline-offset-4 uppercase">
              {activeCompany.name || 'SMART PUNTO DE VENTA'}
            </h1>

            <div className="space-y-3.5 text-[11px] font-medium tracking-wide uppercase text-[#1e334d]">
              <div>SOFTWARE DE FACTURACIÓN Y CONTROL DE INVENTARIO</div>
              <div>{activeCompany.address || 'B. BELLA VISTA'}</div>
              <div>RTN {activeCompany.taxId || '00000000000000'}</div>
              <div>TEL {activeCompany.phone || '0000-0000'}</div>
              <div>{activeCompany.email || 'SMARTPUNTODEVENTA@GMAIL.COM'}</div>
            </div>

            <div className="pt-2 border-t border-[#b8c3d1]">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#1c2b42] text-[#fff3a1] text-[10px] font-bold">
                <span>PERFIL ACTIVO: {roleInfo.label}</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-1">{roleInfo.summary}</div>
            </div>
          </div>

          {/* Right Circular Chart Logo */}
          <div className="shrink-0 flex items-center justify-center">
            <img
              src={activeCompany.imageUrl || '/logo.png'}
              alt="Smart Punto de Venta Logo"
              className="w-48 h-48 object-contain rounded-full drop-shadow-sm"
            />
          </div>
        </div>

        {/* Subtle toggle in bottom right corner if user wants to see KPI summary */}
        <button
          onClick={() => setShowDashboardGrid(true)}
          className="fixed bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#c5d1e0] hover:bg-[#b5c4d6] text-[#1c2b42] text-[10px] font-semibold border border-[#a3b4c9] transition"
          title="Cambiar a vista de indicadores y accesos directos"
        >
          <LayoutGrid className="w-3 h-3" />
          <span>Ver Indicadores Rápidos</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-slate-300">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          <span className="text-xs font-bold text-slate-800">
            Resumen Operativo — {activeCompany.commercialName}
          </span>
        </div>
        <button
          onClick={() => setShowDashboardGrid(false)}
          className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#1c2b42] text-white text-xs font-semibold"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Volver a Pantalla Clásica de Inicio</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-slate-300">
          <div className="text-slate-500">Total Ventas</div>
          <div className="text-lg font-bold text-emerald-700 mt-0.5">${totalSalesAmount.toFixed(2)}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-300">
          <div className="text-slate-500">Cuentas por Cobrar</div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">${totalReceivable.toFixed(2)}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-300">
          <div className="text-slate-500">Cuentas por Pagar</div>
          <div className="text-lg font-bold text-rose-700 mt-0.5">${totalPayable.toFixed(2)}</div>
        </div>
        <div className="bg-white p-3.5 rounded-lg border border-slate-300">
          <div className="text-slate-500">Productos en Catálogo</div>
          <div className="text-lg font-bold text-blue-700 mt-0.5">{products.length} ítems</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <h3 className="text-xs font-bold uppercase text-slate-600 mb-2">A. Menú Facturación</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FACTURACION_MENU_ITEMS.filter((item) => canAccessModule(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => openModule(item.id)}
                className="flex items-center gap-2 p-2 rounded border border-slate-200 hover:bg-blue-50 text-left text-xs font-medium"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-300">
          <h3 className="text-xs font-bold uppercase text-slate-600 mb-2">B. Menú Administración</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ADMINISTRACION_MENU_ITEMS.filter((item) => canAccessModule(item.id)).map((item) => (
              <button
                key={item.id}
                onClick={() => openModule(item.id)}
                className="flex items-center gap-2 p-2.5 rounded border border-slate-200 hover:bg-emerald-50 text-left text-xs font-medium"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
