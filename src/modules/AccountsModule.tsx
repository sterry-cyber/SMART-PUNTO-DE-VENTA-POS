import React, { useState } from 'react';
import {
  HandCoins,
  PlusCircle,
  FileCheck2,
  FileSpreadsheet,
  BarChart3,
  Eye,
  Pencil,
  RefreshCw,
  Check,
  Eraser,
  Search,
  Printer,
  Save,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface AccountsModuleProps {
  accountType: 'COBRAR' | 'PAGAR';
}

export const AccountsModule: React.FC<AccountsModuleProps> = ({ accountType }) => {
  const {
    clients,
    suppliers,
    sales,
    purchases,
    accountMovements,
    registerAccountMovement,
    pullAllFromCloud,
    openModule,
    exportToExcelCSV,
    notify,
  } = usePOS();

  const [subTab, setSubTab] = useState<'FACTURAS' | 'RESUMEN' | 'DETALLE' | 'CHEQUES'>('FACTURAS');
  const [invoiceFilter, setInvoiceFilter] = useState<'TODAS' | 'CREDITO' | 'VENCIDAS'>('CREDITO');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [modalMode, setModalMode] = useState<'ABONO' | 'RECARGO' | 'CHEQUE' | null>(null);

  const isReceivable = accountType === 'COBRAR';
  const entities = isReceivable ? clients : suppliers;

  const [entityId, setEntityId] = useState(entities[1]?.id || entities[0]?.id || '');
  const [amount, setAmount] = useState(500);
  const [reference, setReference] = useState('ABONO-001');
  const [checkNumber, setCheckNumber] = useState('CHK-8820');
  const [bankName, setBankName] = useState('BANCO ATLÁNTIDA');
  const [notes, setNotes] = useState('');

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const ent = entities.find((x) => x.id === entityId) || entities[0];
    if (!ent || !modalMode) return;
    if (!amount || amount <= 0) {
      notify('El monto del movimiento debe ser mayor a 0.');
      return;
    }

    registerAccountMovement({
      accountType,
      entityId: ent.id,
      entityName: ent.name,
      documentId: '',
      documentNumber: reference,
      date: new Date().toISOString().slice(0, 10),
      movementType: modalMode,
      paymentMethod: modalMode === 'CHEQUE' ? 'CHEQUE' : modalMode === 'RECARGO' ? 'RECARGO_MORA' : 'EFECTIVO',
      checkNumber: modalMode === 'CHEQUE' ? checkNumber : undefined,
      bankName: modalMode === 'CHEQUE' ? bankName : undefined,
      checkStatus: modalMode === 'CHEQUE' ? 'PENDIENTE' : undefined,
      amount,
      reference,
      notes,
    });
    setModalMode(null);
  };

  const docs = isReceivable
    ? sales
        .filter((s) => {
          if (invoiceFilter === 'CREDITO') return s.balanceDue > 0;
          if (invoiceFilter === 'VENCIDAS') return s.balanceDue > 0 && s.notes === '30 DIAS';
          return true;
        })
        .map((s) => ({
          id: s.id,
          date: s.date.split(' ')[0].split('-').reverse().join('/'),
          number: s.invoiceNumber,
          entityName: s.clientName,
          terms: s.notes || '15 DIAS',
          total: s.total,
          paid: s.total - s.balanceDue,
          balance: s.balanceDue,
          status: s.balanceDue > 0 ? 'CRÉDITO' : 'PAGADA',
        }))
    : purchases
        .filter((p) => (invoiceFilter === 'CREDITO' ? p.balanceDue > 0 : true))
        .map((p) => ({
          id: p.id,
          date: p.date.split('-').reverse().join('/'),
          number: p.supplierInvoice,
          entityName: p.supplierName,
          terms: p.notes || '15 DIAS',
          total: p.total,
          paid: p.total - p.balanceDue,
          balance: p.balanceDue,
          status: p.balanceDue > 0 ? 'CRÉDITO' : 'PAGADA',
        }));

  const filteredDocs = docs.filter(
    (d) =>
      !searchQuery.trim() ||
      d.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sumTotal = filteredDocs.reduce((acc, d) => acc + d.total, 0);
  const sumPaid = filteredDocs.reduce((acc, d) => acc + d.paid, 0);
  const sumBalance = filteredDocs.reduce((acc, d) => acc + d.balance, 0);

  return (
    <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
      {/* CONTEXTUAL RIBBON: Cuentas Por Cobrar / Pagar */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        {/* Group: Movimientos */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setModalMode('ABONO')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <HandCoins className="w-6 h-6 text-[#15803d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Nuevo Pago
                <br />/ Abono
              </span>
            </button>
            <button
              onClick={() => setModalMode('RECARGO')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <PlusCircle className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Nuevo
                <br />
                Recargo
              </span>
            </button>
            <button
              onClick={() => setModalMode('CHEQUE')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <FileCheck2 className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Cheques
              </span>
            </button>
            <button
              onClick={() => pullAllFromCloud()}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <RefreshCw className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F5 Actualizar
                <br />
                Lista
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Pagos &amp; Abonos</div>
        </div>

        {/* Group: Vista */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            {(['FACTURAS', 'RESUMEN', 'DETALLE', 'CHEQUES'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSubTab(tab)}
                className={`flex flex-col items-center justify-center px-2.5 py-1 rounded border ${
                  subTab === tab
                    ? 'bg-[#fff3a1] border-[#e2c94c]'
                    : 'border-transparent hover:bg-[#dce6f4]'
                }`}
              >
                <Check className="w-6 h-6 text-slate-600 stroke-[2]" />
                <span className="text-[10px] text-slate-800 leading-tight mt-0.5 text-center font-medium">
                  {tab === 'FACTURAS'
                    ? 'Facturas'
                    : tab === 'RESUMEN'
                    ? 'Resumen'
                    : tab === 'DETALLE'
                    ? 'Detalle'
                    : 'Cheques'}
                </span>
              </button>
            ))}
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Vista</div>
        </div>

        {/* Group: Filtro de Facturas */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            {(['TODAS', 'CREDITO', 'VENCIDAS'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={`flex flex-col items-center justify-center px-2 py-1 rounded border ${
                  invoiceFilter === f
                    ? 'bg-[#fff3a1] border-[#e2c94c]'
                    : 'border-transparent hover:bg-[#dce6f4]'
                }`}
              >
                <Check className="w-6 h-6 text-slate-600 stroke-[2]" />
                <span className="text-[10px] text-slate-800 leading-tight mt-0.5 text-center">
                  Facturas
                  <br />
                  {f === 'TODAS' ? 'Todas' : f === 'CREDITO' ? 'Crédito' : 'Vencidas'}
                </span>
              </button>
            ))}
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Filtro Facturas</div>
        </div>

        {/* Group: Acciones */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => openModule(isReceivable ? 'clientes' : 'proveedores')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Editar
              <br />
              {isReceivable ? 'Cliente' : 'Proveedor'}
            </span>
          </button>
          <button
            onClick={() => openModule(isReceivable ? 'ventas-lista' : 'compras-lista')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Eye className="w-6 h-6 text-[#0284c7] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Ver
              <br />
              {isReceivable ? 'Venta' : 'Compra'}
            </span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Printer className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Imprimir
              <br />
              Estado
            </span>
          </button>
          <button
            onClick={() =>
              exportToExcelCSV(
                `Cuentas_Por_${accountType}`,
                filteredDocs.map((d) => ({
                  Fecha: d.date,
                  Factura: d.number,
                  Nombre: d.entityName,
                  Total: d.total,
                  Abonado: d.paid,
                  Saldo: d.balance,
                }))
              )
            }
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <FileSpreadsheet className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Exportar
              <br />
              Excel
            </span>
          </button>
          <button
            onClick={() => openModule('reportes')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <BarChart3 className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Reportes</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#e8ecf2] px-3 py-2 flex items-center gap-4 border-b border-[#c6cbd2] shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-700 uppercase">
            BUSCAR POR NOMBRE O Nº FACTURA
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[260px] h-6 bg-white border border-[#b0b8c4] px-2 text-xs text-slate-800 focus:outline-none mt-0.5"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-700 uppercase">FILTRO</label>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-700 flex items-center gap-1 rounded-[2px]"
            >
              <Eraser className="w-3 h-3 text-pink-600" />
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#f0f2f5] border-b border-[#c6cbd2] px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span>Arrastre una columna aquí para agrupar por dicha columna</span>
        <Search className="w-3.5 h-3.5 text-slate-500" />
      </div>

      {/* DEVEXPRESS DATA GRID */}
      <div className="flex-1 bg-white overflow-auto">
        {subTab === 'FACTURAS' && (
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#f5f6f8] z-10 border-b border-[#d0d5dd]">
              <tr className="text-slate-700 font-semibold">
                <th className="w-5 border-r border-[#d0d5dd]" />
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Fecha</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-32">Nº Factura</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">
                  {isReceivable ? 'Cliente' : 'Proveedor'}
                </th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-28">Términos</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Total</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Pago / Abono</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Saldo Pendiente</th>
                <th className="text-left px-2 py-1 w-24">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.map((d, idx) => {
                const isSelected = selectedId ? d.id === selectedId : idx === 0;
                return (
                  <tr
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    className={`border-b border-[#e5e7eb] cursor-pointer ${
                      isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                      {isSelected ? '▶' : ''}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{d.date}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{d.number}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{d.entityName}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{d.terms}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                      C${d.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                      C${d.paid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                      C${d.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5">{d.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {subTab !== 'FACTURAS' && (
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#f5f6f8] z-10 border-b border-[#d0d5dd]">
              <tr className="text-slate-700 font-semibold">
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Fecha</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Documento</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Entidad</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Tipo</th>
                <th className="text-right px-2 py-1">Monto</th>
              </tr>
            </thead>
            <tbody>
              {accountMovements
                .filter((m) => m.accountType === accountType)
                .map((m) => (
                  <tr key={m.id} className="border-b border-[#e5e7eb] hover:bg-[#f2f6fc]">
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{m.date}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{m.documentNumber}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{m.entityName}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{m.movementType}</td>
                    <td className="px-2 py-1 text-right font-bold">
                      C${m.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* BOTTOM DARK NAVY BAR */}
      <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold">Nº</span>
          <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
            {filteredDocs.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">TOTAL</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
              C${sumTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">PAGO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
              C${sumPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">SALDO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
              C${sumBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING DIALOG FOR ABONO / RECARGO / CHEQUE */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-[420px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden">
            <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between text-xs font-bold">
              <span>Registrar {modalMode}</span>
              <button onClick={() => setModalMode(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmitMovement} className="p-3 space-y-2.5 text-[10.5px]">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  {isReceivable ? 'CLIENTE' : 'PROVEEDOR'}
                </label>
                <select
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-1.5 font-semibold"
                >
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} (Saldo: C${e.currentBalance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">MONTO (C$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2 text-right font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">DOCUMENTO / REF</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>
              {modalMode === 'CHEQUE' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">Nº CHEQUE</label>
                    <input
                      type="text"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">BANCO</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">DESCRIPCIÓN / NOTAS</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#b8c0cc]">
                <button
                  type="submit"
                  className="px-4 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  Guardar y Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
