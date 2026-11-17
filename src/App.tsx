import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { DesktopShell } from './components/DesktopShell';
import { LoginScreen } from './components/LoginScreen';
import { ControlCenterModule } from './modules/ControlCenterModule';
import { ProductsModule } from './modules/ProductsModule';
import { SalesModule } from './modules/SalesModule';
import { PurchasesModule } from './modules/PurchasesModule';
import { QuotesModule, TransfersModule, OrdersModule } from './modules/OperationsModule';
import { ClientsModule, SuppliersModule } from './modules/DirectoriesModule';
import { AccountsModule } from './modules/AccountsModule';
import { AuditModule } from './modules/AuditModule';
import { HRPayrollModule } from './modules/HRPayrollModule';
import { ExpensesCashModule } from './modules/ExpensesCashModule';
import { ConfigUtilitiesModule, ReportsModule } from './modules/ConfigUtilitiesModule';

const ActiveModuleRouter: React.FC = () => {
  const { activeTab, canAccessModule, currentUser, openModule } = usePOS();

  if (!canAccessModule(activeTab)) {
    return (
      <div className="h-full w-full bg-[#d5dce6] flex items-center justify-center p-6 select-none">
        <div className="max-w-md w-full bg-white border-2 border-[#8c96a5] p-6 shadow-xl text-center space-y-3">
          <div className="text-sm font-black text-rose-700 uppercase">
            Módulo Restringido por Rol ({currentUser.role})
          </div>
          <p className="text-xs text-slate-600">
            El usuario actual <strong>{currentUser.username}</strong> con rol{' '}
            <strong>{currentUser.role}</strong> no tiene permisos asignados para acceder a esta sección.
          </p>
          <button
            onClick={() => openModule('control-center')}
            className="px-4 py-1.5 bg-[#1c2b42] text-[#fff3a1] text-xs font-bold border border-[#0f172a]"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  switch (activeTab) {
    case 'control-center':
      return <ControlCenterModule />;
    case 'productos':
      return <ProductsModule />;
    case 'ventas-lista':
      return <SalesModule key="ventas-lista" initialView="LISTA" />;
    case 'venta-estandar':
      return <SalesModule key="venta-estandar" initialView="ESTANDAR" />;
    case 'venta-tactil':
      return <SalesModule key="venta-tactil" initialView="TACTIL" />;
    case 'preventas':
      return <SalesModule key="preventas" initialView="PREVENTAS" />;
    case 'compras-lista':
      return <PurchasesModule key="compras-lista" initialView="LISTA" />;
    case 'compra-nueva':
      return <PurchasesModule key="compra-nueva" initialView="NUEVA" />;
    case 'cotizaciones':
      return <QuotesModule />;
    case 'traslados':
      return <TransfersModule />;
    case 'pedidos':
      return <OrdersModule />;
    case 'clientes':
      return <ClientsModule />;
    case 'proveedores':
      return <SuppliersModule />;
    case 'cuentas-cobrar':
      return <AccountsModule accountType="COBRAR" />;
    case 'cuentas-pagar':
      return <AccountsModule accountType="PAGAR" />;
    case 'auditoria':
      return <AuditModule />;
    case 'empleados':
      return <HRPayrollModule initialView="EMPLEADOS" />;
    case 'planillas':
      return <HRPayrollModule initialView="PLANILLAS" />;
    case 'diario-digital':
      return <ExpensesCashModule mode="DIARIO" />;
    case 'gastos-buscar':
      return <ExpensesCashModule mode="GASTOS_BUSCAR" />;
    case 'gastos-admin':
      return <ExpensesCashModule mode="GASTOS_ADMIN" />;
    case 'configuracion-general':
      return <ConfigUtilitiesModule mode="CONFIG_GENERAL" />;
    case 'empresa-info':
      return <ConfigUtilitiesModule mode="EMPRESA_INFO" />;
    case 'empresas-config':
      return <ConfigUtilitiesModule mode="EMPRESAS_CONFIG" />;
    case 'usuarios-permisos':
      return <ConfigUtilitiesModule mode="USUARIOS" />;
    case 'respaldos':
      return <ConfigUtilitiesModule mode="RESPALDOS" />;
    case 'reportes':
      return <ReportsModule />;
    default:
      return <ControlCenterModule />;
  }
};

const MainGate: React.FC = () => {
  const { isAuthenticated } = usePOS();
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  return (
    <DesktopShell>
      <ActiveModuleRouter />
    </DesktopShell>
  );
};

export function App() {
  return (
    <POSProvider>
      <MainGate />
    </POSProvider>
  );
}

export default App;
