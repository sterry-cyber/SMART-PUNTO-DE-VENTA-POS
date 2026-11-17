import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Printer,
  StickyNote,
  BarChart2,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { ProductAudit } from '../types/pos';

/* ============================================================================
 * AUDITORÍA: Lista de Auditorías, Nueva Auditoría, Editar, Eliminar, Finalizar, Imprimir, Notas, Reporte
 * ============================================================================ */
export const AuditModule: React.FC = () => {
  const { audits, setAudits, products, setProducts, activeCompany, currentUser, notify } = usePOS();
  const [selectedAudit, setSelectedAudit] = useState<ProductAudit | null>(audits[0] || null);
  const [showReport, setShowReport] = useState(false);
  const [notesInput, setNotesInput] = useState(selectedAudit?.notes || '');

  const handleCreateAudit = () => {
    const created: ProductAudit = {
      id: `aud-${Date.now()}`,
      auditNumber: `AUD-${String(audits.length + 13).padStart(5, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      branchName: activeCompany.branchCode,
      responsible: currentUser.fullName,
      status: 'EN_PROCESO',
      notes: 'Auditoría general de existencias físicas vs sistema',
      items: products.slice(0, 5).map((p) => ({
        productId: p.id,
        code: p.code,
        name: p.name,
        systemStock: p.stock,
        physicalCount: p.stock,
        difference: 0,
        unitCost: p.cost,
      })),
    };
    setAudits((prev) => [created, ...prev]);
    setSelectedAudit(created);
    setNotesInput(created.notes);
    notify(`Nueva Auditoría ${created.auditNumber} iniciada.`);
  };

  const handleUpdatePhysicalCount = (productId: string, physicalCount: number) => {
    if (!selectedAudit || selectedAudit.status === 'FINALIZADA') return;
    const updated: ProductAudit = {
      ...selectedAudit,
      items: selectedAudit.items.map((item) =>
        item.productId === productId
          ? { ...item, physicalCount, difference: physicalCount - item.systemStock }
          : item
      ),
    };
    setSelectedAudit(updated);
    setAudits((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const handleFinalizeAudit = () => {
    if (!selectedAudit || selectedAudit.status === 'FINALIZADA') return;
    setAudits((prev) => prev.map((a) => (a.id === selectedAudit.id ? { ...a, status: 'FINALIZADA' } : a)));
    setProducts((prev) =>
      prev.map((p) => {
        const line = selectedAudit.items.find((i) => i.productId === p.id);
        if (!line) return p;
        return { ...p, stock: line.physicalCount };
      })
    );
    setSelectedAudit({ ...selectedAudit, status: 'FINALIZADA' });
    notify(`Auditoría ${selectedAudit.auditNumber} finalizada y existencias ajustadas.`);
  };

  const handleSaveNote = () => {
    if (!selectedAudit) return;
    setAudits((prev) => prev.map((a) => (a.id === selectedAudit.id ? { ...a, notes: notesInput } : a)));
    notify('Notas de auditoría actualizadas.');
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleCreateAudit}
            className="flex items-center gap-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1.5 rounded-lg font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Auditoría</span>
          </button>
          <button
            onClick={handleFinalizeAudit}
            disabled={!selectedAudit || selectedAudit.status === 'FINALIZADA'}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalizar y Ajustar Stock</span>
          </button>
          <button
            onClick={handleSaveNote}
            disabled={!selectedAudit}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
          >
            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
            <span>Guardar Notas</span>
          </button>
          <button
            onClick={() => {
              if (!selectedAudit) return;
              setAudits((prev) => prev.filter((a) => a.id !== selectedAudit.id));
              setSelectedAudit(null);
              notify('Auditoría eliminada.');
            }}
            disabled={!selectedAudit}
            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowReport(!showReport)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
          >
            <BarChart2 className="w-3.5 h-3.5 text-fuchsia-600" />
            <span>Reporte de Diferencias</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {showReport && selectedAudit && (
        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-4 text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-fuchsia-900">
              Reporte Valorizado de Diferencias — {selectedAudit.auditNumber}
            </div>
            <div className="text-fuchsia-700">
              Impacto financiero neto por sobrantes/faltantes:{' '}
              <strong className="font-mono">
                $
                {selectedAudit.items
                  .reduce((acc, i) => acc + i.difference * i.unitCost, 0)
                  .toFixed(2)}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de Auditorías */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-2 text-xs">
          <h3 className="font-bold text-slate-800 border-b pb-2">Lista de Auditorías</h3>
          {audits.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                setSelectedAudit(a);
                setNotesInput(a.notes);
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition ${
                selectedAudit?.id === a.id
                  ? 'border-fuchsia-500 bg-fuchsia-50/60'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between font-bold">
                <span className="font-mono text-fuchsia-700">{a.auditNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${
                    a.status === 'FINALIZADA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <div className="text-slate-600 mt-1">
                {a.date} • {a.branchName}
              </div>
              <div className="text-[11px] text-slate-500">{a.responsible}</div>
            </div>
          ))}
        </div>

        {/* Detalle y Conteo Físico */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 text-xs">
          {selectedAudit ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                     Hoja de Conteo Físico — {selectedAudit.auditNumber} ({selectedAudit.status})
                  </h3>
                </div>
                <input
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Notas de auditoría..."
                  className="border border-slate-300 rounded px-2.5 py-1 w-72"
                />
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
                    <th className="py-2 px-2.5">Código</th>
                    <th className="py-2 px-2.5">Producto</th>
                    <th className="py-2 px-2.5 text-center">Stock Sistema</th>
                    <th className="py-2 px-2.5 text-center">Conteo Físico</th>
                    <th className="py-2 px-2.5 text-center">Diferencia</th>
                    <th className="py-2 px-2.5 text-right">Impacto ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedAudit.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="py-2 px-2.5 font-mono font-bold">{item.code}</td>
                      <td className="py-2 px-2.5">{item.name}</td>
                      <td className="py-2 px-2.5 text-center font-mono">{item.systemStock}</td>
                      <td className="py-2 px-2.5 text-center">
                        <input
                          type="number"
                          disabled={selectedAudit.status === 'FINALIZADA'}
                          value={item.physicalCount}
                          onChange={(e) =>
                            handleUpdatePhysicalCount(item.productId, Number(e.target.value))
                          }
                          className="w-16 text-center border border-slate-300 rounded py-1 font-bold"
                        />
                      </td>
                      <td
                        className={`py-2 px-2.5 text-center font-mono font-bold ${
                          item.difference < 0
                            ? 'text-rose-600'
                            : item.difference > 0
                            ? 'text-emerald-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono">
                        ${(item.difference * item.unitCost).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">Seleccione una auditoría</div>
          )}
        </div>
      </div>
    </div>
  );
};

