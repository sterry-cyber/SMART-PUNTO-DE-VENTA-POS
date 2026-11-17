import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  Printer,
  ShoppingCart,
  FileSpreadsheet,
  ArrowLeftRight,
  Building2,
  Eye,
  Upload,
  RefreshCw,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Quote, Transfer, Order } from '../types/pos';

/* ============================================================================
 * 1. COTIZACIONES: Lista, Nueva, Editar, Duplicar, Eliminar, Imprimir, Convertir en Venta, Exportar Excel
 * ============================================================================ */
export const QuotesModule: React.FC = () => {
  const { quotes, setQuotes, clients, products, convertQuoteToSale, exportToExcelCSV, notify } = usePOS();
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(quotes[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);

  const handleOpenNew = () => {
    setEditingQuote(null);
    setClientId(clients[0]?.id || '');
    setSelectedProductId(products[0]?.id || '');
    setNotes('Precios sujetos a disponibilidad de inventario.');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Quote) => {
    setEditingQuote(q);
    setClientId(q.clientId);
    setValidUntil(q.validUntil);
    setNotes(q.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const cli = clients.find((c) => c.id === clientId) || clients[0];
    const prod = products.find((p) => p.id === selectedProductId) || products[0];
    if (!cli || !prod) {
      notify('Registre al menos un producto y un cliente antes de crear una cotización.');
      return;
    }
    const sub = Number((qty * prod.price).toFixed(2));
    const tax = Number((sub * (prod.taxRate / 100)).toFixed(2));
    const tot = Number((sub + tax).toFixed(2));

    if (editingQuote) {
      setQuotes((prev) =>
        prev.map((q) =>
          q.id === editingQuote.id
            ? {
                ...q,
                clientId: cli.id,
                clientName: cli.name,
                validUntil,
                notes,
              }
            : q
        )
      );
      notify(`Cotización ${editingQuote.quoteNumber} actualizada.`);
    } else {
      const created: Quote = {
        id: `quo-${Date.now()}`,
        quoteNumber: `COT-${String(quotes.length + 47).padStart(5, '0')}`,
        date: new Date().toISOString().slice(0, 10),
        validUntil,
        clientId: cli.id,
        clientName: cli.name,
        status: 'ACTIVA',
        subtotal: sub,
        taxTotal: tax,
        total: tot,
        notes,
        items: [
          {
            productId: prod.id,
            code: prod.code,
            name: prod.name,
            quantity: qty,
            unitPrice: prod.price,
            discount: 0,
            taxRate: prod.taxRate,
            total: tot,
          },
        ],
      };
      setQuotes((prev) => [created, ...prev]);
      setSelectedQuote(created);
      notify(`Cotización ${created.quoteNumber} creada.`);
    }
    setIsModalOpen(false);
  };

  const handleDuplicate = (q: Quote) => {
    const copy: Quote = {
      ...q,
      id: `quo-${Date.now()}`,
      quoteNumber: `COT-${String(quotes.length + 48).padStart(5, '0')}`,
      status: 'ACTIVA',
    };
    setQuotes((prev) => [copy, ...prev]);
    notify(`Cotización duplicada como ${copy.quoteNumber}.`);
  };

  const handleDelete = (q: Quote) => {
    setQuotes((prev) => prev.filter((item) => item.id !== q.id));
    if (selectedQuote?.id === q.id) setSelectedQuote(null);
    notify(`Cotización ${q.quoteNumber} eliminada.`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-lg font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cotización</span>
          </button>
          <button
            onClick={() => selectedQuote && handleOpenEdit(selectedQuote)}
            disabled={!selectedQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Editar</span>
          </button>
          <button
            onClick={() => selectedQuote && handleDuplicate(selectedQuote)}
            disabled={!selectedQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <span>Duplicar</span>
          </button>
          <button
            onClick={() => selectedQuote && convertQuoteToSale(selectedQuote.id)}
            disabled={!selectedQuote || selectedQuote.status === 'CONVERTIDA'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Convertir en Venta</span>
          </button>
          <button
            onClick={() => selectedQuote && handleDelete(selectedQuote)}
            disabled={!selectedQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            onClick={() =>
              exportToExcelCSV(
                'Cotizaciones',
                quotes.map((q) => ({
                  Numero: q.quoteNumber,
                  Fecha: q.date,
                  Vigencia: q.validUntil,
                  Cliente: q.clientName,
                  Estado: q.status,
                  Total: q.total,
                }))
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
              <th className="py-2.5 px-3">Nº Cotización</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Válida Hasta</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3 text-right">Subtotal</th>
              <th className="py-2.5 px-3 text-right">IVA</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3">Observaciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {quotes.map((q) => (
              <tr
                key={q.id}
                onClick={() => setSelectedQuote(q)}
                className={`cursor-pointer ${
                  selectedQuote?.id === q.id ? 'bg-cyan-50 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-cyan-700">{q.quoteNumber}</td>
                <td className="py-2.5 px-3 font-mono">{q.date}</td>
                <td className="py-2.5 px-3 font-mono">{q.validUntil}</td>
                <td className="py-2.5 px-3 font-semibold text-slate-800">{q.clientName}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      q.status === 'CONVERTIDA' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {q.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono">${q.subtotal.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">${q.taxTotal.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">${q.total.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{q.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <h3 className="text-sm font-bold border-b pb-2 mb-3">
              {editingQuote ? `Editar ${editingQuote.quoteNumber}` : 'Nueva Cotización'}
            </h3>
            <form onSubmit={handleSaveQuote} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Cliente</label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {!editingQuote && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold mb-1">Producto Principal</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full border border-slate-300 rounded px-2 py-1.5"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (${p.price})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded px-2 py-1.5"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block font-semibold mb-1">Válida Hasta</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Notas</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-3.5 py-1.5 rounded bg-cyan-600 text-white font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. TRASLADOS: Lista, Nuevo Traslado, Editar, Ver, Eliminar, Imprimir, Exportar/Importar Traslado, Sucursales
 * ============================================================================ */
export const TransfersModule: React.FC = () => {
  const { transfers, setTransfers, companies, products, exportToExcelCSV, notify } = usePOS();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(transfers[0] || null);
  const [showBranchesPanel, setShowBranchesPanel] = useState(false);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [origin, setOrigin] = useState(companies[0]?.branchCode || 'ABARROTERÍA');
  const [destination, setDestination] = useState(companies[1]?.branchCode || 'SUCURSAL 2');
  const [prodId, setProdId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === prodId) || products[0];
    if (!prod) {
      notify('Registre al menos un producto en inventario antes de crear un traslado.');
      return;
    }
    const created: Transfer = {
      id: `trf-${Date.now()}`,
      transferNumber: `TRS-${String(transfers.length + 21).padStart(5, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      originBranch: origin,
      destinationBranch: destination,
      status: 'EN_TRANSITO',
      createdBy: 'Administrador',
      notes: 'Traslado registrado entre bodegas',
      items: [{ productId: prod.id, code: prod.code, name: prod.name, quantity: qty }],
    };
    setTransfers((prev) => [created, ...prev]);
    setSelectedTransfer(created);
    setIsNewOpen(false);
    notify(`Traslado ${created.transferNumber} generado con éxito.`);
  };

  const handleImportTransfer = () => {
    const prod = products[0];
    if (!prod) {
      notify('No hay productos registrados para asociar al traslado.');
      return;
    }
    const imp: Transfer = {
      id: `trf-imp-${Date.now()}`,
      transferNumber: `TRS-IMP-${transfers.length + 1}`,
      date: new Date().toISOString().slice(0, 10),
      originBranch: 'SUCURSAL EXTERNA',
      destinationBranch: companies[0]?.branchCode || 'ABARROTERÍA',
      status: 'RECIBIDO',
      createdBy: 'ADMINISTRADOR',
      notes: 'Traslado importado',
      items: [{ productId: prod.id, code: prod.code, name: prod.name, quantity: 1 }],
    };
    setTransfers((prev) => [imp, ...prev]);
    notify('Archivo de traslado importado y recibido en inventario.');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setIsNewOpen(true)}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Traslado</span>
          </button>
          <button
            onClick={() => {
              if (!selectedTransfer) return;
              setTransfers((prev) =>
                prev.map((t) =>
                  t.id === selectedTransfer.id
                    ? { ...t, status: t.status === 'EN_TRANSITO' ? 'RECIBIDO' : 'EN_TRANSITO' }
                    : t
                )
              );
              notify(`Estado de traslado ${selectedTransfer.transferNumber} actualizado.`);
            }}
            disabled={!selectedTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Editar / Recibir</span>
          </button>
          <button
            onClick={() =>
              selectedTransfer &&
              notify(
                `Detalle ${selectedTransfer.transferNumber}: ${selectedTransfer.items
                  .map((i) => `${i.quantity}x ${i.name}`)
                  .join(', ')}`
              )
            }
            disabled={!selectedTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>Ver</span>
          </button>
          <button
            onClick={() => {
              if (!selectedTransfer) return;
              setTransfers((prev) => prev.filter((t) => t.id !== selectedTransfer.id));
              setSelectedTransfer(null);
              notify('Traslado eliminado.');
            }}
            disabled={!selectedTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
          <button
            onClick={() => setShowBranchesPanel(!showBranchesPanel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Sucursales ({companies.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleImportTransfer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Traslado</span>
          </button>
          <button
            onClick={() =>
              exportToExcelCSV(
                'Traslados_Sucursales',
                transfers.map((t) => ({
                  Numero: t.transferNumber,
                  Fecha: t.date,
                  Origen: t.originBranch,
                  Destino: t.destinationBranch,
                  Estado: t.status,
                  Responsable: t.createdBy,
                }))
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Traslado</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {showBranchesPanel && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {companies.map((c) => (
            <div key={c.id} className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-sm text-xs">
              <div className="font-bold text-blue-700">{c.branchCode}</div>
              <div className="font-semibold text-slate-800 mt-0.5">{c.commercialName}</div>
              <div className="text-slate-500 mt-1">{c.address}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
              <th className="py-2.5 px-3">Nº Traslado</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Sucursal Origen</th>
              <th className="py-2.5 px-3">Sucursal Destino</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3">Artículos</th>
              <th className="py-2.5 px-3">Creado Por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {transfers.map((t) => (
              <tr
                key={t.id}
                onClick={() => setSelectedTransfer(t)}
                className={`cursor-pointer ${
                  selectedTransfer?.id === t.id ? 'bg-orange-50 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-orange-700">{t.transferNumber}</td>
                <td className="py-2.5 px-3 font-mono">{t.date}</td>
                <td className="py-2.5 px-3">{t.originBranch}</td>
                <td className="py-2.5 px-3 font-semibold">{t.destinationBranch}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      t.status === 'RECIBIDO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {t.status}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  {t.items.map((i) => `${i.quantity}x ${i.code}`).join(', ')}
                </td>
                <td className="py-2.5 px-3 text-slate-600">{t.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isNewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <h3 className="text-sm font-bold border-b pb-2 mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-orange-600" />
              <span>Registrar Nuevo Traslado entre Sucursales</span>
            </h3>
            <form onSubmit={handleCreateTransfer} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Sucursal Origen</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.branchCode}>
                      {c.branchCode}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Sucursal Destino</label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.branchCode}>
                      {c.branchCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Producto</label>
                  <select
                    value={prodId}
                    onChange={(e) => setProdId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-3.5 py-1.5 rounded bg-orange-600 text-white font-bold">
                  Enviar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. PEDIDOS: Lista, Nuevo Pedido, Editar, Duplicar, Eliminar, Cambiar Estado, Convertir en Compra
 * ============================================================================ */
export const OrdersModule: React.FC = () => {
  const { orders, setOrders, suppliers, products, convertOrderToPurchase, notify } = usePOS();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [prodId, setProdId] = useState(products[0]?.id || '');
  const [qty, setQty] = useState(1);

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    const prod = products.find((p) => p.id === prodId) || products[0];
    if (!sup || !prod) {
      notify('Registre al menos un proveedor y un producto antes de crear un pedido.');
      return;
    }
    const created: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `PED-${String(orders.length + 33).padStart(5, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      supplierId: sup.id,
      supplierName: sup.name,
      status: 'PENDIENTE',
      totalEstimated: Number((qty * prod.cost).toFixed(2)),
      notes: 'Orden de abastecimiento',
      items: [{ productId: prod.id, code: prod.code, name: prod.name, quantity: qty, estimatedCost: prod.cost }],
    };
    setOrders((prev) => [created, ...prev]);
    setSelectedOrder(created);
    setIsModalOpen(false);
    notify(`Pedido ${created.orderNumber} creado.`);
  };

  const handleCycleStatus = (ord: Order) => {
    const states: Order['status'][] = ['PENDIENTE', 'ENVIADO', 'RECIBIDO_PARCIAL', 'CANCELADO'];
    const next = states[(states.indexOf(ord.status) + 1) % states.length];
    setOrders((prev) => prev.map((o) => (o.id === ord.id ? { ...o, status: next } : o)));
    notify(`Estado del pedido ${ord.orderNumber} cambiado a ${next}.`);
  };

  const handleDuplicate = (ord: Order) => {
    const copy: Order = {
      ...ord,
      id: `ord-${Date.now()}`,
      orderNumber: `PED-${String(orders.length + 34).padStart(5, '0')}`,
      status: 'PENDIENTE',
    };
    setOrders((prev) => [copy, ...prev]);
    notify(`Pedido duplicado como ${copy.orderNumber}.`);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido</span>
          </button>
          <button
            onClick={() => selectedOrder && handleCycleStatus(selectedOrder)}
            disabled={!selectedOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Cambiar Estado</span>
          </button>
          <button
            onClick={() => selectedOrder && handleDuplicate(selectedOrder)}
            disabled={!selectedOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 font-semibold disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" />
            <span>Duplicar</span>
          </button>
          <button
            onClick={() => selectedOrder && convertOrderToPurchase(selectedOrder.id)}
            disabled={!selectedOrder || selectedOrder.status === 'CONVERTIDO_COMPRA'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Convertir en Compra</span>
          </button>
          <button
            onClick={() => {
              if (!selectedOrder) return;
              setOrders((prev) => prev.filter((o) => o.id !== selectedOrder.id));
              setSelectedOrder(null);
              notify('Pedido eliminado.');
            }}
            disabled={!selectedOrder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
              <th className="py-2.5 px-3">Nº Pedido</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Entrega Esperada</th>
              <th className="py-2.5 px-3">Proveedor</th>
              <th className="py-2.5 px-3">Estado</th>
              <th className="py-2.5 px-3 text-right">Total Estimado</th>
              <th className="py-2.5 px-3">Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((o) => (
              <tr
                key={o.id}
                onClick={() => setSelectedOrder(o)}
                className={`cursor-pointer ${
                  selectedOrder?.id === o.id ? 'bg-violet-50 font-medium' : 'hover:bg-slate-50'
                }`}
              >
                <td className="py-2.5 px-3 font-mono font-bold text-violet-700">{o.orderNumber}</td>
                <td className="py-2.5 px-3 font-mono">{o.date}</td>
                <td className="py-2.5 px-3 font-mono">{o.expectedDate}</td>
                <td className="py-2.5 px-3 font-semibold">{o.supplierName}</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-violet-100 text-violet-800">
                    {o.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold">${o.totalEstimated.toFixed(2)}</td>
                <td className="py-2.5 px-3 text-slate-500">{o.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <h3 className="text-sm font-bold border-b pb-2 mb-3">Nuevo Pedido a Proveedor</h3>
            <form onSubmit={handleCreateOrder} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Proveedor</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1">Producto</label>
                  <select
                    value={prodId}
                    onChange={(e) => setProdId(e.target.value)}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cantidad</label>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-3.5 py-1.5 rounded bg-violet-600 text-white font-bold">
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

