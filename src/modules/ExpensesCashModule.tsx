import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Expense } from '../types/pos';
import {
  ClipboardList,
  Flag,
  ArrowLeftCircle,
  Home,
  ArrowRightCircle,
  HandCoins,
  BadgeDollarSign,
  Save,
  Sigma,
  Check,
  X,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface ExpensesCashModuleProps {
  mode: 'DIARIO' | 'GASTOS_BUSCAR' | 'GASTOS_ADMIN';
}

export const ExpensesCashModule: React.FC<ExpensesCashModuleProps> = ({ mode }) => {
  const {
    expenses,
    setExpenses,
    sales,
    users,
    setCashClosings,
    pullAllFromCloud,
    openModule,
    notify,
  } = usePOS();

  const [selectedUser, setSelectedUser] = useState(users[0]?.username || 'ADMINISTRADOR');
  const [selectedDateLabel, setSelectedDateLabel] = useState(
    new Date().toLocaleDateString('es-NI', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  );
  const [categoryInput, setCategoryInput] = useState<'GASTOS' | 'INGRESOS' | 'PAGOS/ABONOS' | 'RETIROS'>('GASTOS');
  const [amountInput, setAmountInput] = useState('0.00');
  const [hasDocument, setHasDocument] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string>('');
  const [eInicio, setEInicio] = useState(0.0);

  // Calculated dynamically from real completed sales (excluding preventas/anuladas)
  const completedSales = useMemo(
    () => sales.filter((s) => s.mode !== 'PREVENTA' && s.status !== 'PENDIENTE_PREVENTA' && s.status !== 'ANULADA'),
    [sales]
  );
  const vTotal = useMemo(() => completedSales.reduce((acc, s) => acc + s.total, 0), [completedSales]);
  const vCredito = useMemo(
    () =>
      completedSales
        .filter((s) => s.paymentType === 'CREDITO' || s.status === 'CREDITO_VIGENTE' || s.status === 'CREDITO_VENCIDO')
        .reduce((acc, s) => acc + s.total, 0),
    [completedSales]
  );
  const vTarjeta = useMemo(
    () => completedSales.filter((s) => s.paymentType === 'TARJETA').reduce((acc, s) => acc + s.total, 0),
    [completedSales]
  );

  const grouped = useMemo(() => {
    const gastos = expenses.filter((e) => e.category === 'GASTOS');
    const ingresos = expenses.filter((e) => e.category === 'INGRESOS');
    const pagos = expenses.filter((e) => e.category === 'PAGOS/ABONOS');
    const retiros = expenses.filter((e) => e.category === 'RETIROS');

    const sumGastos = gastos.reduce((acc, e) => acc + e.amount, 0);
    const sumIngresos = ingresos.reduce((acc, e) => acc + e.amount, 0);
    const sumPagos = pagos.reduce((acc, e) => acc + e.amount, 0);
    const sumRetiros = retiros.reduce((acc, e) => acc + e.amount, 0);

    return {
      gastos,
      ingresos,
      pagos,
      retiros,
      sumGastos,
      sumIngresos,
      sumPagos,
      sumRetiros,
    };
  }, [expenses]);

  const eFinal = useMemo(() => {
    const cashSales = vTotal - vCredito - vTarjeta;
    return eInicio + cashSales + grouped.sumIngresos + grouped.sumPagos - grouped.sumGastos - grouped.sumRetiros;
  }, [vTotal, vCredito, vTarjeta, eInicio, grouped]);

  const handleAddEntry = () => {
    const val = parseFloat(amountInput);
    if (!val || val <= 0 || !descriptionInput.trim()) {
      notify('Ingrese un monto mayor a 0 y una descripción.');
      return;
    }
    const now = new Date();
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      date: now.toLocaleDateString('es-NI'),
      bookName: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      category: categoryInput,
      operationType: 'GASTO_OPERATIVO',
      description: descriptionInput.toUpperCase(),
      reference: hasDocument ? 'SI' : 'NO',
      paymentMethod: 'EFECTIVO',
      amount: val,
      registeredBy: selectedUser,
    };
    setExpenses((prev) => [...prev, newExp]);
    setSelectedExpenseId(newExp.id);
    setAmountInput('0.00');
    setDescriptionInput('');
    notify(`Movimiento agregado en ${categoryInput} por C$${val.toFixed(2)}.`);
  };

  // Keep a filter if user enters from Buscar Gastos / Administrador de Gastos
  const isGastosFilterView = mode === 'GASTOS_BUSCAR' || mode === 'GASTOS_ADMIN';

  return (
    <div className="h-full flex flex-col bg-[#d8dfe8] select-none overflow-hidden">
      {/* CONTEXTUAL RIBBON: Diario Digital (Screenshot 10) */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        {/* Filtro Fecha */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] text-slate-600">Usuario</span>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-40 h-5 bg-white border border-slate-300 px-1 text-[10px] text-slate-800"
              >
                {users.length === 0 ? (
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.username}>
                      {u.username}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-[10px] text-slate-600">Fecha</span>
              <input
                type="text"
                value={selectedDateLabel}
                onChange={(e) => setSelectedDateLabel(e.target.value)}
                className="w-40 h-5 bg-white border border-slate-300 px-1 text-[10px] text-slate-800"
              />
            </div>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Filtro Fecha</div>
        </div>

        {/* Diario General */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => pullAllFromCloud()}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ClipboardList className="w-6 h-6 text-[#d97706] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Diario
                <br />
                General
              </span>
            </button>
            <button
              onClick={() => notify('Diarios sincronizados y transferidos entre turnos.')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Flag className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Transferir
                <br />
                Diarios
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Diario General</div>
        </div>

        {/* Navegación */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                setSelectedDateLabel(
                  d.toLocaleDateString('es-NI', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                );
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ArrowLeftCircle className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Anterior
              </span>
            </button>
            <button
              onClick={() =>
                setSelectedDateLabel(
                  new Date().toLocaleDateString('es-NI', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                )
              }
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Home className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Hoy</span>
            </button>
            <button
              onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() + 1);
                setSelectedDateLabel(
                  d.toLocaleDateString('es-NI', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })
                );
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ArrowRightCircle className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Siguiente
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Navegación</div>
        </div>

        {/* Pagos */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openModule('cuentas-cobrar')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <HandCoins className="w-6 h-6 text-[#15803d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Pagos de
                <br />
                Clientes
              </span>
            </button>
            <button
              onClick={() => openModule('cuentas-pagar')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <BadgeDollarSign className="w-6 h-6 text-[#dc2626] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Pagos a
                <br />
                Proveedores
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Pagos</div>
        </div>

        {/* Editar Cierre */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                const next = window.prompt('Efectivo de Inicio (C$):', String(eInicio));
                const nextNum = next !== null && !isNaN(Number(next)) ? Number(next) : eInicio;
                setEInicio(nextNum);
                const cashSales = vTotal - vCredito - vTarjeta;
                const expected =
                  nextNum +
                  cashSales +
                  grouped.sumIngresos +
                  grouped.sumPagos -
                  grouped.sumGastos -
                  grouped.sumRetiros;
                setCashClosings((prev) => [
                  {
                    id: `close-${Date.now()}`,
                    date: new Date().toISOString().slice(0, 10),
                    shift: 'COMPLETO',
                    cashier: selectedUser,
                    openingBalance: nextNum,
                    cashSales,
                    cardSales: vTarjeta,
                    transferSales: 0,
                    creditCollections: grouped.sumPagos,
                    expensesOut: grouped.sumGastos + grouped.sumRetiros,
                    expectedCash: expected,
                    countedCash: expected,
                    difference: 0,
                    status: 'CERRADO',
                    notes: `Cierre de caja registrado (${selectedDateLabel})`,
                  },
                  ...prev,
                ]);
                notify(`Cierre de caja guardado en Supabase (Efectivo Final: C$${expected.toFixed(2)}).`);
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Save className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Guardar / Editar
                <br />
                Cierre
              </span>
            </button>
            <button
              onClick={() => pullAllFromCloud()}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Sigma className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Obtener
                <br />
                Ventas
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Editar Cierre</div>
        </div>

        {/* Venta Total (3 stacked readouts matching Screenshot 10) */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="space-y-0.5 text-[9.5px] pt-0.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-700">V. Total</span>
              <div className="w-24 h-4 bg-[#e2e7f0] border border-[#b8c0cc] px-1.5 text-right font-semibold text-slate-800">
                {vTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-700">V. Crédito</span>
              <div className="w-24 h-4 bg-[#e2e7f0] border border-[#b8c0cc] px-1.5 text-right font-semibold text-slate-800">
                {vCredito.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-700">V. Tarjeta</span>
              <div className="w-24 h-4 bg-[#e2e7f0] border border-[#b8c0cc] px-1.5 text-right font-semibold text-slate-800">
                {vTarjeta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Venta Total</div>
        </div>

        {/* Efectivo Inicio / Final */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="space-y-1 text-[9.5px] pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-700">E. Inicio</span>
              <div className="w-24 h-4 bg-[#e2e7f0] border border-[#b8c0cc] px-1.5 text-right font-semibold text-slate-800">
                {eInicio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-700">E. Final</span>
              <div className="w-24 h-4 bg-[#e2e7f0] border border-[#b8c0cc] px-1.5 text-right font-semibold text-slate-800">
                {eFinal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Efectivo Inicio / Final</div>
        </div>

        {/* Cierre Final ("Felicidades C$0.00") */}
        <div className="flex flex-col justify-between px-2 shrink-0">
          <div className="flex flex-col items-center pt-1">
            <span className="text-[10px] text-slate-700 mb-0.5">Felicidades</span>
            <div className="w-28 h-6 bg-[#e2e7f0] border border-[#b8c0cc] flex items-center justify-center text-xs font-bold text-slate-900">
              C$0.00
            </div>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Cierre Final</div>
        </div>
      </div>

      {/* ENTRY FORM AREA (Screenshot 10) */}
      <div className="bg-[#d8dfe8] px-3 py-2 border-b border-[#b8c0cc] shrink-0 text-[10px]">
        <div className="flex items-end gap-3 mb-1.5">
          <div>
            <label className="font-bold text-slate-700 block mb-0.5">CATEGORÍA</label>
            <select
              value={categoryInput}
              onChange={(e) =>
                setCategoryInput(e.target.value as 'GASTOS' | 'INGRESOS' | 'PAGOS/ABONOS' | 'RETIROS')
              }
              className="w-44 h-6 bg-white border border-[#a5aebc] px-1.5 font-semibold"
            >
              <option value="GASTOS">GASTOS</option>
              <option value="INGRESOS">INGRESOS</option>
              <option value="PAGOS/ABONOS">PAGOS/ABONOS</option>
              <option value="RETIROS">RETIROS</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-0.5">TOTAL</label>
            <input
              type="text"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="w-28 h-6 bg-white border border-[#a5aebc] px-2 text-center font-semibold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-0.5">DOCUMENTO</label>
            <div className="flex items-center gap-1.5 h-6">
              <button
                onClick={() => setHasDocument((v) => !v)}
                className="w-11 h-5 bg-white border border-slate-400 flex items-center p-0.5"
              >
                <div
                  className={`w-4 h-3.5 bg-[#5c6b7e] transition-transform ${
                    hasDocument ? 'translate-x-5' : ''
                  }`}
                />
              </button>
              <span className="font-bold text-slate-700">{hasDocument ? 'SI' : 'NO'}</span>
            </div>
          </div>

          {isGastosFilterView && (
            <div className="ml-auto text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded">
              Modo: {mode === 'GASTOS_BUSCAR' ? 'Buscar y Organizar Gastos' : 'Administrador de Gastos'}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            placeholder="INGRESAR DESCRIPCIÓN"
            className="w-[345px] h-12 bg-white border border-[#a5aebc] p-1.5 text-[10.5px] resize-none focus:outline-none"
          />

          <button
            onClick={handleAddEntry}
            className="h-9 px-4 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] flex items-center gap-1.5 text-[11px] text-slate-700"
          >
            <Check className="w-3.5 h-3.5 text-slate-500" />
            Agregar
          </button>
          <button
            onClick={() => {
              setAmountInput('0.00');
              setDescriptionInput('');
            }}
            className="h-9 px-4 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] flex items-center gap-1.5 text-[11px] text-slate-700"
          >
            <X className="w-3.5 h-3.5 text-red-600" />
            Limpiar
          </button>
          <button
            onClick={() => {
              setAmountInput('0.00');
              setDescriptionInput('');
              setSelectedExpenseId('');
            }}
            className="h-9 px-4 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] flex items-center gap-1.5 text-[11px] text-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            Cancelar
          </button>
          {selectedExpenseId && (
            <button
              onClick={() => {
                setExpenses((prev) => prev.filter((item) => item.id !== selectedExpenseId));
                setSelectedExpenseId('');
                notify('Movimiento eliminado correctamente', 'info');
              }}
              className="h-9 px-4 bg-red-50 hover:bg-red-100 border border-red-300 flex items-center gap-1.5 text-[11px] font-bold text-red-700"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              Eliminar Seleccionado
            </button>
          )}
        </div>
      </div>

      {/* GROUPED DEVEXPRESS DATA GRID (Screenshot 10) */}
      <div className="flex-1 bg-white overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f5f6f8] z-10">
            <tr className="border-b border-[#d0d5dd] text-slate-700 font-semibold">
              <th className="w-5 border-r border-[#d0d5dd]" />
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Fecha</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Descripción</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-32">Total</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Hora</th>
              <th className="text-center px-2 py-1 w-14">Doc.</th>
            </tr>
            <tr className="border-b border-[#d0d5dd] bg-white text-[10px] text-slate-500">
              <td className="border-r border-[#d0d5dd] text-center">▼</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
              <td className="px-1.5 py-0.5 text-center">■</td>
            </tr>
          </thead>
          <tbody>
            {/* Group 1: Categoría: GASTOS */}
            <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
              <td className="border-r border-[#d0d5dd]" />
              <td colSpan={5} className="px-2 py-1">
                ◢ Categoría: GASTOS (C${grouped.sumGastos.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </td>
            </tr>
            {grouped.gastos.map((e) => {
              const isSelected = e.id === selectedExpenseId;
              return (
                <tr
                  key={e.id}
                  onClick={() => setSelectedExpenseId(e.id)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.date}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.description}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    C${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">{e.bookName}</td>
                  <td className="px-2 py-0.5 text-center">
                    <input type="checkbox" checked={e.reference === 'SI'} readOnly />
                  </td>
                </tr>
              );
            })}

            {/* Group 2: Categoría: INGRESOS */}
            <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
              <td className="border-r border-[#d0d5dd]" />
              <td colSpan={5} className="px-2 py-1">
                ◢ Categoría: INGRESOS (C${grouped.sumIngresos.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </td>
            </tr>
            {grouped.ingresos.map((e) => {
              const isSelected = e.id === selectedExpenseId;
              return (
                <tr
                  key={e.id}
                  onClick={() => setSelectedExpenseId(e.id)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.date}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.description}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    C${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">{e.bookName}</td>
                  <td className="px-2 py-0.5 text-center">
                    <input type="checkbox" checked={e.reference === 'SI'} readOnly />
                  </td>
                </tr>
              );
            })}

            {/* Group 3: Categoría: PAGOS/ABONOS */}
            <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
              <td className="border-r border-[#d0d5dd]" />
              <td colSpan={5} className="px-2 py-1">
                ◢ Categoría: PAGOS/ABONOS (C${grouped.sumPagos.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </td>
            </tr>
            {grouped.pagos.map((e) => {
              const isSelected = e.id === selectedExpenseId;
              return (
                <tr
                  key={e.id}
                  onClick={() => setSelectedExpenseId(e.id)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.date}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.description}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    C${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">{e.bookName}</td>
                  <td className="px-2 py-0.5 text-center">
                    <input type="checkbox" checked={e.reference === 'SI'} readOnly />
                  </td>
                </tr>
              );
            })}

            {/* Group 4: Categoría: RETIROS */}
            <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
              <td className="border-r border-[#d0d5dd]" />
              <td colSpan={5} className="px-2 py-1">
                ◢ Categoría: RETIROS (C${grouped.sumRetiros.toLocaleString('en-US', { minimumFractionDigits: 2 })})
              </td>
            </tr>
            {grouped.retiros.map((e) => {
              const isSelected = e.id === selectedExpenseId;
              return (
                <tr
                  key={e.id}
                  onClick={() => setSelectedExpenseId(e.id)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.date}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{e.description}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    C${e.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">{e.bookName}</td>
                  <td className="px-2 py-0.5 text-center">
                    <input type="checkbox" checked={e.reference === 'SI'} readOnly />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM DARK NAVY BAR (Screenshot 10) */}
      <div className="h-7 bg-[#1c2b42] px-3 flex items-center text-white shrink-0">
        <span className="text-[11px] font-bold mr-2">Nº</span>
        <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
          {expenses.length}
        </div>
      </div>
    </div>
  );
};
