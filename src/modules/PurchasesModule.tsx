import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Purchase, Product } from '../types/pos';
import { printPurchaseDocument } from '../utils/printService';
import {
  Plus,
  Pencil,
  Copy,
  Eye,
  X,
  RefreshCw,
  CheckCircle2,
  Tags,
  Info,
  Printer,
  FileSearch,
  Settings,
  FileSpreadsheet,
  BarChart3,
  Save,
  ShoppingCart,
  ArrowDownAZ,
  Users,
  UserPlus,
  Flag,
  Eraser,
  Search,
} from 'lucide-react';

interface PurchasesModuleProps {
  initialView: 'LISTA' | 'NUEVA';
}

interface PurchaseLineRow {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  previousCost: number;
  newCost: number;
  taxRate: number;
  total: number;
}

export const PurchasesModule: React.FC<PurchasesModuleProps> = ({ initialView }) => {
  const {
    purchases,
    setPurchases,
    suppliers,
    setSuppliers,
    products,
    setProducts,
    finalizePurchase,
    companies,
    pullAllFromCloud,
    exportToExcelCSV,
    openModule,
    notify,
  } = usePOS();

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('01/01/2025');
  const [endDate, setEndDate] = useState('31/12/2026');
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string>(purchases[0]?.id || '');
  const [activeView, setActiveView] = useState<'LISTA' | 'NUEVA'>(initialView);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [previewPurchase, setPreviewPurchase] = useState<Purchase | null>(null);

  React.useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  // State for NUEVA / EDITAR COMPRA view (starts empty — connected to real DB)
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [termsLabel, setTermsLabel] = useState('CONTADO');
  const [selectedSupplierName, setSelectedSupplierName] = useState(suppliers[0]?.name || '');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toLocaleDateString('es-NI'));
  const [creditDate, setCreditDate] = useState(() => new Date().toLocaleDateString('es-NI'));
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [lineItems, setLineItems] = useState<PurchaseLineRow[]>([]);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number>(0);
  const [quickCode, setQuickCode] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(
      (p) =>
        !searchQuery.trim() ||
        p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supplierInvoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.documentNumber.includes(searchQuery)
    );
  }, [purchases, searchQuery]);

  const sinRecibirList = filteredPurchases.filter((p) => p.status === 'BORRADOR');
  const recibidaList = filteredPurchases.filter((p) => p.status !== 'BORRADOR');

  const totalsList = useMemo(() => {
    const total = filteredPurchases.reduce((acc, p) => acc + p.total, 0);
    const saldo = filteredPurchases.reduce((acc, p) => acc + p.balanceDue, 0);
    const pago = total - saldo;
    return { total, saldo, pago };
  }, [filteredPurchases]);

  const editTotals = useMemo(() => {
    const rawSum = lineItems.reduce((acc, r) => acc + r.total, 0);
    const subtotal = taxIncluded ? Number((rawSum / 1.15).toFixed(2)) : Number(rawSum.toFixed(2));
    const impuesto = Number((subtotal * 0.15).toFixed(2));
    const grandTotal = taxIncluded ? Number(rawSum.toFixed(2)) : Number((subtotal + impuesto).toFixed(2));
    return { subtotal, impuesto, grandTotal };
  }, [lineItems, taxIncluded]);

  const handleAddProductToPurchase = (prod: Product) => {
    setLineItems((prev) => [
      ...prev,
      {
        code: prod.code,
        name: prod.name,
        quantity: 1,
        unit: prod.unit || 'UNIDAD',
        previousCost: prod.cost,
        newCost: prod.cost,
        taxRate: prod.taxRate,
        total: Number((1 * prod.cost).toFixed(2)),
      },
    ]);
  };

  const loadPurchaseIntoEditor = (pur?: Purchase) => {
    const target = pur || purchases.find((p) => p.id === selectedPurchaseId) || purchases[0];
    if (!target) {
      openModule('compra-nueva');
      return;
    }
    setEditingPurchaseId(target.id);
    setSupplierInvoice(target.supplierInvoice);
    setTermsLabel(target.paymentType === 'CONTADO' ? 'CONTADO' : target.notes || '15 DIAS');
    setSelectedSupplierName(target.supplierName);
    setPurchaseNotes(target.notes || '');
    setInvoiceDate(target.date);
    setCreditDate(target.dueDate || target.date);
    setLineItems(
      target.items.map((it) => ({
        code: it.code,
        name: it.name,
        quantity: it.quantity,
        unit: 'UNIDAD',
        previousCost: it.previousCost,
        newCost: it.unitCost,
        taxRate: 15,
        total: it.total,
      }))
    );
    setActiveView('NUEVA');
  };

  const handleSavePurchase = () => {
    if (lineItems.length === 0) {
      notify('Agregue al menos un producto a la compra.');
      return;
    }
    const sup = suppliers.find((s) => s.name === selectedSupplierName) || suppliers[0];
    const supId = sup?.id || '';
    const supName = sup?.name || selectedSupplierName || 'PROVEEDOR GENERAL';
    const maxDocNum = purchases.reduce((max, p) => {
      const parsed = parseInt(p.documentNumber, 10);
      return !isNaN(parsed) && parsed > max ? parsed : max;
    }, 0);
    const existingPur = editingPurchaseId ? purchases.find((p) => p.id === editingPurchaseId) : undefined;
    const docNum = existingPur?.documentNumber || String(maxDocNum + 1);

    const newPur: Purchase = {
      id: editingPurchaseId || `pur-${Date.now()}`,
      documentNumber: docNum,
      supplierInvoice: supplierInvoice || docNum,
      date: new Date().toISOString().slice(0, 10),
      supplierId: supId,
      supplierName: supName,
      paymentType: termsLabel === 'CONTADO' ? 'CONTADO' : 'CREDITO',
      status: 'FINALIZADA',
      dueDate: creditDate,
      subtotal: editTotals.subtotal,
      taxTotal: editTotals.impuesto,
      total: editTotals.grandTotal,
      balanceDue: termsLabel === 'CONTADO' ? 0 : editTotals.grandTotal,
      notes: purchaseNotes || termsLabel,
      items: lineItems.map((l) => {
        const matchedProd = products.find((p) => p.code === l.code);
        return {
          productId: matchedProd?.id || `p-${l.code}`,
          code: l.code,
          name: l.name,
          quantity: l.quantity,
          unitCost: l.newCost,
          previousCost: l.previousCost,
          suggestedSalePrice: Number((l.newCost * 1.4).toFixed(2)),
          currentSalePrice: Number((l.newCost * 1.4).toFixed(2)),
          total: l.total,
        };
      }),
    };

    if (editingPurchaseId) {
      setPurchases((prev) => prev.map((p) => (p.id === editingPurchaseId ? newPur : p)));
      setEditingPurchaseId(null);
    } else {
      setPurchases((prev) => [newPur, ...prev]);
    }

    // Update stock and cost in Supabase `products` (applying delta if editing)
    const wasFinalized = existingPur ? existingPur.status !== 'BORRADOR' : false;
    setProducts((prev) =>
      prev.map((prod) => {
        const oldQty =
          wasFinalized && existingPur
            ? existingPur.items
                .filter((it) => it.productId === prod.id || it.code === prod.code)
                .reduce((sum, it) => sum + it.quantity, 0)
            : 0;
        const matchingNew = lineItems.filter((l) => l.code === prod.code);
        const newQty = matchingNew.reduce((sum, l) => sum + l.quantity, 0);
        if (oldQty === 0 && newQty === 0) return prod;
        const lastNew = matchingNew[matchingNew.length - 1];
        return {
          ...prod,
          stock: Math.max(0, Number((prod.stock - oldQty + newQty).toFixed(4))),
          cost: lastNew ? lastNew.newCost : prod.cost,
        };
      })
    );

    if (!editingPurchaseId && termsLabel !== 'CONTADO' && supId) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === supId
            ? { ...s, currentBalance: Number((s.currentBalance + editTotals.grandTotal).toFixed(2)) }
            : s
        )
      );
    } else if (existingPur) {
      const oldBal = wasFinalized && existingPur.paymentType === 'CREDITO' ? existingPur.balanceDue : 0;
      const newBal = newPur.paymentType === 'CREDITO' ? newPur.balanceDue : 0;
      if (oldBal !== 0 || newBal !== 0) {
        setSuppliers((prev) =>
          prev.map((s) => {
            let nextBal = s.currentBalance;
            if (s.id === existingPur.supplierId) nextBal -= oldBal;
            if (s.id === supId) nextBal += newBal;
            if (nextBal === s.currentBalance) return s;
            return { ...s, currentBalance: Math.max(0, Number(nextBal.toFixed(2))) };
          })
        );
      }
    }

    setLineItems([]);
    notify(`Compra #${docNum} guardada en Supabase (C$${editTotals.grandTotal.toFixed(2)}).`);
    setActiveView('LISTA');
    openModule('compras-lista');
  };

  // ============================================================================
  // VIEW 1: LISTA DE COMPRAS – INGRESO DE MERCADERÍA (Screenshot 14)
  // ============================================================================
  if (activeView === 'LISTA') {
    const selectedPurchase =
      filteredPurchases.find((p) => p.id === selectedPurchaseId) || filteredPurchases[0];

    return (
      <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
        {/* CONTEXTUAL RIBBON: Compras (Screenshot 14) */}
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
          {/* Group: Compras */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  setEditingPurchaseId(null);
                  setLineItems([]);
                  setSupplierInvoice('');
                  setActiveView('NUEVA');
                  openModule('compra-nueva');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Plus className="w-6 h-6 text-[#2563eb] stroke-[2.4]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Nueva
                  <br />
                  Compra
                </span>
              </button>
              <button
                onClick={() => loadPurchaseIntoEditor()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Editar
                  <br />
                  Compra
                </span>
              </button>
              <button
                onClick={() => {
                  if (selectedPurchase) {
                    const dup: Purchase = {
                      ...selectedPurchase,
                      id: `pur-${Date.now()}`,
                      documentNumber: String(purchases.length + 1),
                    };
                    setPurchases((prev) => [dup, ...prev]);
                    notify(`Compra #${selectedPurchase.documentNumber} duplicada.`);
                  } else {
                    notify('Seleccione una compra para duplicar.', 'warning');
                  }
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Copy className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Duplicar
                  <br />
                  Compra
                </span>
              </button>
              <button
                onClick={() => {
                  if (selectedPurchase) setPreviewPurchase(selectedPurchase);
                  else notify('Seleccione una compra para ver su detalle.', 'warning');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Eye className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Ver Compra
                </span>
              </button>
              <button
                onClick={() => {
                  setPurchases((prev) => prev.filter((p) => p.id !== selectedPurchaseId));
                  notify('Compra eliminada del registro.');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Eliminar
                  <br />
                  Compra
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Compras</div>
          </div>

          {/* Group: Filtro Fecha */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-2 pt-1">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-slate-600">Inicio</span>
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-24 h-5 bg-white border border-slate-300 px-1.5 text-[10px]"
                  />
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-slate-600">Final</span>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-24 h-5 bg-white border border-slate-300 px-1.5 text-[10px]"
                  />
                </div>
              </div>
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
            <div className="text-[9px] text-slate-500 text-center font-medium">Filtro Fecha</div>
          </div>

          {/* Group: Compras Acciones */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  if (selectedPurchase) finalizePurchase(selectedPurchase.id, false);
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <CheckCircle2 className="w-6 h-6 text-slate-400 stroke-[1.8]" />
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5 text-center">
                  Finalizar
                  <br />
                  Compra
                </span>
              </button>
              <button
                onClick={() => {
                  if (selectedPurchase) finalizePurchase(selectedPurchase.id, true);
                  else notify('Precios de venta actualizados según el último costo de compra.');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Tags className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Actualizar
                  <br />
                  Precios de Venta
                </span>
              </button>
              <button
                onClick={() => loadPurchaseIntoEditor()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Info className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Editar
                  <br />
                  Información
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Compras</div>
          </div>

          {/* Group: Imprimir */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  const activeCompany = companies.find((c) => c.isPrimary) || companies[0];
                  if (!selectedPurchase) {
                    notify('Seleccione una compra para imprimir.');
                    return;
                  }
                  printPurchaseDocument(selectedPurchase, { company: activeCompany });
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir
                  <br />
                  Compra
                </span>
              </button>
              <button
                onClick={() => {
                  const activeCompany = companies.find((c) => c.isPrimary) || companies[0];
                  if (!selectedPurchase) {
                    notify('Seleccione una compra para imprimir.');
                    return;
                  }
                  printPurchaseDocument(selectedPurchase, { company: activeCompany });
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#0284c7] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir Precio
                  <br />
                  de Venta
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Imprimir</div>
          </div>

          {/* Vista Previa / Configuración / Exportar Excel / Reportes */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                if (selectedPurchase) setPreviewPurchase(selectedPurchase);
                else notify('Seleccione una compra para su vista previa.', 'warning');
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <FileSearch className="w-6 h-6 text-[#0284c7] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Vista Previa
                <br />
                Compra
              </span>
            </button>
            <button
              onClick={() => openModule('configuracion-general')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Settings className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Configuración
              </span>
            </button>
            <button
              onClick={() =>
                exportToExcelCSV(
                  'Compras',
                  filteredPurchases.map((p) => ({
                    Fecha: p.date,
                    Compra: p.documentNumber,
                    Factura: p.supplierInvoice,
                    Proveedor: p.supplierName,
                    Total: p.total,
                    Saldo: p.balanceDue,
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
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Reportes
              </span>
            </button>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-[#e8ecf2] px-3 py-2 flex items-center gap-4 border-b border-[#c6cbd2] shrink-0">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-700 uppercase">
              BUSCAR COMPRA POR NOMBRE O CÓDIGO
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
              <div className="w-10 h-5 bg-white border border-slate-400 flex items-center p-0.5">
                <div className="w-4 h-3.5 bg-[#5c6b7e]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700">AVANZADO</span>
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

        {/* GROUP CHIP BAR (`[ Estado ▼ ]` as in Screenshot 14) */}
        <div className="bg-[#f0f2f5] border-b border-[#c6cbd2] px-2 py-1 flex items-center justify-between text-[11px] shrink-0">
          <div className="px-2.5 py-0.5 bg-white border border-[#b8c0cc] text-slate-700 text-[10.5px] flex items-center gap-2 shadow-xs">
            <span>Estado</span>
            <span className="text-[8px] text-slate-500">▲</span>
          </div>
          <Search className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* GROUPED DEVEXPRESS DATA GRID */}
        <div className="flex-1 bg-white overflow-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#f5f6f8] z-10">
              <tr className="border-b border-[#d0d5dd] text-slate-700 font-semibold">
                <th className="w-5 border-r border-[#d0d5dd]" />
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Fecha</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Nº Compra ▼</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-36">Nº Factura</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Proveedor</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Términos</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Total Factura</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-28">Fecha Máxima</th>
                <th className="text-left px-2 py-1 w-28">Factura Estado</th>
              </tr>
              <tr className="border-b border-[#d0d5dd] bg-white text-[10px] text-slate-500">
                <td className="border-r border-[#d0d5dd] text-center">▼</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5">=</td>
              </tr>
            </thead>
            <tbody>
              {/* Group 1: Estado: SIN RECIBIR */}
              <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
                <td className="border-r border-[#d0d5dd]" />
                <td colSpan={8} className="px-2 py-1">
                  ◢ Estado: SIN RECIBIR
                </td>
              </tr>
              {sinRecibirList.map((p) => {
                const isSelected = p.id === selectedPurchaseId;
                const formattedDate = p.date.includes('-') ? p.date.split('-').reverse().join('/') : p.date;
                const facturaEstado = p.balanceDue > 0 ? 'CRÉDITO' : 'PAGADA';
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPurchaseId(p.id)}
                    onDoubleClick={() => loadPurchaseIntoEditor(p)}
                    className={`border-b border-[#e5e7eb] cursor-pointer ${
                      isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                      {isSelected ? '▶' : ''}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{formattedDate}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-center">{p.documentNumber}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.supplierInvoice}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.supplierName}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.notes || '15 DIAS'}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                      C${p.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.dueDate}</td>
                    <td className="px-2 py-0.5">{facturaEstado}</td>
                  </tr>
                );
              })}

              {/* Group 2: Estado: RECIBIDA */}
              <tr className="bg-[#eceff4] border-b border-[#d0d5dd] font-bold text-slate-800">
                <td className="border-r border-[#d0d5dd]" />
                <td colSpan={8} className="px-2 py-1">
                  ◢ Estado: RECIBIDA
                </td>
              </tr>
              {recibidaList.map((p) => {
                const isSelected = p.id === selectedPurchaseId;
                const formattedDate = p.date.includes('-') ? p.date.split('-').reverse().join('/') : p.date;
                const facturaEstado = p.balanceDue > 0 ? 'CRÉDITO' : 'PAGADA';
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPurchaseId(p.id)}
                    onDoubleClick={() => loadPurchaseIntoEditor(p)}
                    className={`border-b border-[#e5e7eb] cursor-pointer ${
                      isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                      {isSelected ? '▶' : ''}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{formattedDate}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-center">{p.documentNumber}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.supplierInvoice}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.supplierName}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">
                      {p.paymentType === 'CONTADO' ? 'CONTADO' : p.notes || '15 DIAS'}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                      C${p.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{p.dueDate}</td>
                    <td className="px-2 py-0.5">{facturaEstado}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM DARK NAVY BAR (Screenshot 14) */}
        <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0 text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold">Nº</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
              {filteredPurchases.length}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">TOTAL</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
                C${totalsList.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">RECARGO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[65px] text-center">
                C$0.00
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">PAGO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
                C${totalsList.pago.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">SALDO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
                C${totalsList.saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* PURCHASE PREVIEW MODAL */}
        {previewPurchase && (
          <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
            <div className="w-[640px] bg-white border-2 border-[#7e93ab] shadow-2xl p-6 text-xs text-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
                  <div>
                    <div className="text-sm font-black">COMPROBANTE DE COMPRA #{previewPurchase.documentNumber}</div>
                    <div className="text-[11px] text-slate-600">
                      PROVEEDOR: <span className="font-bold">{previewPurchase.supplierName}</span> | FACTURA:{' '}
                      <span className="font-bold">{previewPurchase.supplierInvoice}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewPurchase(null)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 font-bold"
                >
                  ✕
                </button>
              </div>

              <table className="w-full border-collapse text-[11px] border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="text-left p-1.5 border-r">Código</th>
                    <th className="text-left p-1.5 border-r">Descripción</th>
                    <th className="text-right p-1.5 border-r">Cantidad</th>
                    <th className="text-right p-1.5 border-r">Costo Unit.</th>
                    <th className="text-right p-1.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewPurchase.items.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 border-r">{it.code}</td>
                      <td className="p-1.5 border-r">{it.name}</td>
                      <td className="p-1.5 border-r text-right">{it.quantity.toFixed(2)}</td>
                      <td className="p-1.5 border-r text-right">C${it.unitCost.toFixed(2)}</td>
                      <td className="p-1.5 text-right font-bold">C${it.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t-2 border-slate-800 pt-3">
                <div className="text-[11px] space-y-0.5">
                  <div>FECHA: {previewPurchase.date}</div>
                  <div>TÉRMINOS: {previewPurchase.paymentType}</div>
                  <div>SALDO PENDIENTE: C${previewPurchase.balanceDue.toFixed(2)}</div>
                </div>
                <div className="text-right space-y-0.5 font-bold">
                  <div>SUBTOTAL: C${previewPurchase.subtotal.toFixed(2)}</div>
                  <div>ISV 15%: C${previewPurchase.taxTotal.toFixed(2)}</div>
                  <div className="text-sm font-black">TOTAL COMPRA: C${previewPurchase.total.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const target = previewPurchase;
                    setPreviewPurchase(null);
                    loadPurchaseIntoEditor(target);
                  }}
                  className="px-3 py-1.5 bg-[#e2e6ec] border border-[#a5aebc] font-bold"
                >
                  Editar Compra
                </button>
                <button
                  onClick={() => {
                    const activeCompany = companies.find((c) => c.isPrimary) || companies[0];
                    printPurchaseDocument(previewPurchase, { company: activeCompany });
                  }}
                  className="px-4 py-1.5 bg-[#1c2b42] text-white font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Imprimir Comprobante
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: MÓDULO NUEVA COMPRA / EDITAR COMPRA (Screenshot 15)
  // ============================================================================
  return (
    <div className="h-full flex flex-col bg-[#d8dfe8] select-none overflow-hidden">
      {/* CONTEXTUAL RIBBON: Compra (Screenshot 15) */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        {/* Guardar */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={handleSavePurchase}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Save className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F5 Guardar
              <br />
              Compra
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Guardar...</div>
        </div>

        {/* Productos */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setProductPickerOpen(true)}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ShoppingCart className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F4 Buscar
                <br />
                Productos
              </span>
            </button>
            <button
              onClick={() => openModule('productos')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Plus className="w-6 h-6 text-[#2563eb] stroke-[2.4]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F3 Nuevo
                <br />
                Producto
              </span>
            </button>
            <button
              onClick={() => openModule('productos')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Editar
                <br />
                Producto
              </span>
            </button>
            <button
              onClick={() => setProductPickerOpen(true)}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ArrowDownAZ className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Productos Por
                <br />
                Proveedor
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Productos</div>
        </div>

        {/* Proveedores */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openModule('proveedores')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Users className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F2 Buscar
                <br />
                Proveedor
              </span>
            </button>
            <button
              onClick={() => openModule('proveedores')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <UserPlus className="w-6 h-6 text-[#2563eb] stroke-[2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F6 Nuevo
                <br />
                Proveedor
              </span>
            </button>
            <button
              onClick={() => openModule('proveedores')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Editar
                <br />
                Proveedor
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Proveedores</div>
        </div>

        {/* Filas */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setProductPickerOpen(true)}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Plus className="w-6 h-6 text-[#2563eb] stroke-[2.4]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F9 Insertar
                <br />
                Fila
              </span>
            </button>
            <button
              onClick={() => {
                setLineItems((prev) => prev.filter((_, i) => i !== selectedRowIdx));
                setSelectedRowIdx((prev) => Math.max(0, prev - 1));
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F10 Eliminar
                <br />
                Fila
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Filas</div>
        </div>

        {/* Método de Factura & Limpiar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setTaxIncluded((v) => !v)}
            className="flex flex-col items-center justify-center px-3 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Flag className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Precio de los Productos
              <br />
              ya con el ISV Incluido
            </span>
          </button>
          <button
            onClick={() => openModule('compras-lista')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Eraser className="w-6 h-6 text-[#f97316] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F11 Limpiar
              <br />y Salir
            </span>
          </button>
        </div>
      </div>

      {/* TOP PURCHASE HEADER (Screenshot 15) */}
      <div className="bg-[#d8dfe8] px-3 py-2 flex items-start justify-between gap-4 border-b border-[#b8c0cc] shrink-0 text-[10px]">
        {/* Left: NÚMERO DE FACTURA & TÉRMINOS */}
        <div className="w-36 space-y-1.5">
          <div>
            <label className="font-bold text-slate-700 block">NÚMERO DE FACTURA</label>
            <input
              type="text"
              value={supplierInvoice}
              onChange={(e) => setSupplierInvoice(e.target.value)}
              className="w-full h-6 bg-white border border-[#a5aebc] px-1.5 text-center font-semibold"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 block">TÉRMINOS</label>
            <select
              value={termsLabel}
              onChange={(e) => setTermsLabel(e.target.value)}
              className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
            >
              <option value="15 DIAS">15 DIAS</option>
              <option value="30 DIAS">30 DIAS</option>
              <option value="CONTADO">CONTADO</option>
            </select>
          </div>
        </div>

        {/* Supplier & Notes */}
        <div className="w-[430px] space-y-1">
          <select
            value={selectedSupplierName}
            onChange={(e) => setSelectedSupplierName(e.target.value)}
            className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
          >
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-6 space-y-1">
              <div className="h-5 bg-[#dce2ec] border border-[#a5aebc] px-1.5" />
              <div className="h-5 bg-[#dce2ec] border border-[#a5aebc] px-1.5" />
              <div className="h-5 bg-[#dce2ec] border border-[#a5aebc] px-1.5" />
            </div>
            <div className="col-span-6">
              <textarea
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="INGRESAR NOTAS EN LA COMPRA"
                className="w-full h-[68px] bg-white border border-[#a5aebc] p-1.5 text-[10px] resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right: TOTAL & FECHAS */}
        <div className="flex flex-col items-end justify-between ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">TOTAL</span>
            <div className="bg-[#dce2ec] border border-[#a5aebc] px-4 py-0.5 min-w-[140px] text-right">
              <div className="text-sm font-black text-slate-900">
                {editTotals.grandTotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="text-xs font-semibold text-slate-700 border-t border-slate-300">
                {editTotals.grandTotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div>
              <label className="font-bold text-slate-700 block">FECHA FACTURA</label>
              <input
                type="text"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-24 h-6 bg-white border border-[#a5aebc] px-1.5 text-center"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block">FECHA CRÉDITO</label>
              <input
                type="text"
                value={creditDate}
                onChange={(e) => setCreditDate(e.target.value)}
                className="w-24 h-6 bg-white border border-[#a5aebc] px-1.5 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* LINE ITEMS TABLE (Screenshot 15) */}
      <div className="flex-1 bg-white overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f5f6f8] z-10 border-b border-[#d0d5dd]">
            <tr className="text-slate-700 font-semibold">
              <th className="w-5 border-r border-[#d0d5dd]" />
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-28">CodProducto</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Descripción</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Cantidad</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Unidad</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Precio Anterior</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Precio Nuevo</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Impuesto %</th>
              <th className="text-right px-2 py-1 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Top Quick-Add Yellow Row */}
            <tr className="border-b border-[#d0d5dd] bg-[#fff5c0]">
              <td className="border-r border-[#d0d5dd] text-center text-[9px] text-slate-600">✎</td>
              <td className="px-1 py-0.5 border-r border-[#d0d5dd] bg-white">
                <input
                  type="text"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickCode.trim()) {
                      const prod = products.find((p) => p.code === quickCode.trim());
                      if (prod) {
                        handleAddProductToPurchase(prod);
                        setQuickCode('');
                      }
                    }
                  }}
                  className="w-full text-[11px] focus:outline-none"
                />
              </td>
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td />
            </tr>

            {lineItems.map((row, idx) => {
              const active = idx === selectedRowIdx;
              return (
                <tr
                  key={`${row.code}-${idx}`}
                  onClick={() => setSelectedRowIdx(idx)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    active ? 'bg-[#e8f0fe] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {active ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{row.code}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{row.name}</td>
                  <td className="px-1 py-0.5 border-r border-[#e5e7eb] text-right">
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      value={row.quantity}
                      onChange={(e) => {
                        const qty = Math.max(0.01, Number(e.target.value) || 0);
                        setLineItems((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  quantity: qty,
                                  total: Number((qty * item.newCost).toFixed(2)),
                                }
                              : item
                          )
                        );
                      }}
                      className="w-20 text-right bg-transparent border border-transparent focus:border-blue-500 focus:bg-white px-1"
                    />
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{row.unit}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    {row.previousCost.toFixed(4)}
                  </td>
                  <td className="px-1 py-0.5 border-r border-[#e5e7eb] text-right">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.newCost}
                      onChange={(e) => {
                        const costVal = Math.max(0, Number(e.target.value) || 0);
                        setLineItems((prev) =>
                          prev.map((item, i) =>
                            i === idx
                              ? {
                                  ...item,
                                  newCost: costVal,
                                  total: Number((item.quantity * costVal).toFixed(2)),
                                }
                              : item
                          )
                        );
                      }}
                      className="w-24 text-right bg-transparent border border-transparent focus:border-blue-500 focus:bg-white px-1"
                    />
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    {row.taxRate.toFixed(2)} %
                  </td>
                  <td className="px-2 py-0.5 text-right">
                    {row.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM DARK NAVY BAR (Screenshot 15) */}
      <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0 text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">Nº</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[48px] text-center">
              {lineItems.length}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">PAGO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              0.00
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">SALDO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
              {editTotals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">SUB TOTAL</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
              {editTotals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPORTE EXENTO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              0.00
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPORTE GRAVADO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
              {editTotals.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPUESTO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              {editTotals.impuesto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {productPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <div className="w-[520px] bg-[#e8ecf2] border-2 border-[#a0a8b4] shadow-2xl">
            <div className="h-7 bg-[#dbe1ea] px-3 flex items-center justify-between border-b border-[#b8c0cc] text-xs font-bold">
              <span>Agregar Producto a la Compra</span>
              <button onClick={() => setProductPickerOpen(false)}>✕</button>
            </div>
            <div className="p-3 max-h-[340px] overflow-auto bg-white">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f5f6f8] border-b">
                    <th className="text-left p-1.5">Código</th>
                    <th className="text-left p-1.5">Descripción</th>
                    <th className="text-right p-1.5">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        handleAddProductToPurchase(p);
                        setProductPickerOpen(false);
                      }}
                      className="border-b hover:bg-[#fff5c0] cursor-pointer"
                    >
                      <td className="p-1.5 font-bold">{p.code}</td>
                      <td className="p-1.5">{p.name}</td>
                      <td className="p-1.5 text-right font-bold">C${p.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
