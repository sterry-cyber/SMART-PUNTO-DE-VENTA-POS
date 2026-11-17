import React, { useState, useMemo } from 'react';
import { usePOS } from '../context/POSContext';
import { Sale, SaleItem, Product } from '../types/pos';
import { printSaleDocument, buildSaleDocumentHtml, PrintFormat } from '../utils/printService';
import {
  FileSpreadsheet,
  LayoutGrid,
  Pencil,
  Copy,
  Eye,
  X,
  RefreshCw,
  Check,
  Printer,
  ClipboardList,
  FileSearch,
  Settings,
  BarChart3,
  Save,
  ShoppingCart,
  Plus,
  Home,
  Users,
  UserPlus,
  UserCheck,
  StickyNote,
  BadgePercent,
  Eraser,
  Search,
} from 'lucide-react';

interface SalesModuleProps {
  initialView: 'LISTA' | 'ESTANDAR' | 'TACTIL' | 'PREVENTAS';
}

// Product illustration helper for Touch POS cards
const renderProductCardArtwork = (code: string, name: string) => {
  const upper = name.toUpperCase();
  if (code === '38' || upper.includes('NESTUM')) {
    return (
      <div className="w-12 h-14 bg-gradient-to-b from-yellow-200 to-yellow-400 border border-yellow-600 rounded flex flex-col items-center justify-center p-1 shadow-sm">
        <span className="text-[8px] font-black text-blue-900 bg-white/80 px-1 rounded">NESTUM</span>
        <span className="text-[7px] font-bold text-amber-900 mt-1">ARROZ</span>
      </div>
    );
  }
  if (code === '39' || upper.includes('NIDO')) {
    return (
      <div className="w-12 h-14 bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-red-600 rounded-md flex flex-col items-center justify-center p-1 shadow-sm">
        <span className="text-[10px] font-black text-red-700 bg-white px-1 rounded">NIDO</span>
        <span className="text-[7px] font-bold text-green-900 mt-0.5">1500g</span>
      </div>
    );
  }
  if (code === '10' || upper.includes('SABA')) {
    return (
      <div className="w-14 h-12 bg-gradient-to-r from-pink-500 to-rose-600 border border-pink-700 rounded-md flex flex-col items-center justify-center p-1 shadow-sm">
        <span className="text-[9px] font-black text-white italic">Saba</span>
        <span className="text-[7px] text-pink-100">Buenas Noches</span>
      </div>
    );
  }
  if (code === '40' || upper.includes('PASTE')) {
    return (
      <div className="w-14 h-12 bg-gradient-to-br from-amber-200 to-yellow-600 border border-amber-700 rounded-md flex items-center justify-center p-1 shadow-sm">
        <span className="text-[8px] font-black text-amber-950">PASTE</span>
      </div>
    );
  }
  if (code === '44' || upper.includes('PROTEX')) {
    return (
      <div className="w-14 h-10 bg-gradient-to-r from-slate-100 to-blue-100 border border-blue-400 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[9px] font-black text-blue-800">Protex</span>
        <span className="text-[7px] text-amber-700 font-bold">Avena</span>
      </div>
    );
  }
  if (code === '37' || upper.includes('FROOT')) {
    return (
      <div className="w-11 h-14 bg-gradient-to-b from-red-600 to-red-700 border border-red-900 rounded flex flex-col items-center justify-center p-0.5 shadow-sm">
        <span className="text-[7px] font-black text-yellow-300 leading-tight text-center">FROOT LOOPS</span>
      </div>
    );
  }
  if (code === '36' || upper.includes('CORN FLAKES')) {
    return (
      <div className="w-11 h-14 bg-white border border-slate-300 rounded flex flex-col items-center justify-center p-0.5 shadow-sm">
        <span className="text-[7px] font-black text-red-600">Kellogg&apos;s</span>
        <span className="text-[7px] font-black text-slate-800 text-center leading-tight">CORN FLAKES</span>
      </div>
    );
  }
  if (code === '41' || upper.includes('MAZOLA')) {
    return (
      <div className="w-14 h-12 bg-gradient-to-b from-yellow-300 to-yellow-500 border border-green-700 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[9px] font-black text-red-700">Mazola</span>
        <span className="text-[7px] font-bold text-blue-900">Margarina</span>
      </div>
    );
  }
  if (code === '14' || upper.includes('SAL')) {
    return (
      <div className="w-11 h-14 bg-gradient-to-b from-sky-100 to-white border border-sky-400 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[8px] font-black text-blue-900">CRIS-SAL</span>
      </div>
    );
  }
  if (code === '9' || upper.includes('ESCOBA')) {
    return (
      <div className="w-12 h-14 flex items-center justify-center">
        <div className="w-1 h-12 bg-slate-700 rotate-45 relative">
          <div className="w-5 h-3 bg-emerald-600 -left-2 top-9 absolute rounded-b" />
        </div>
      </div>
    );
  }
  if (code === '22' || upper.includes('MAX')) {
    return (
      <div className="w-14 h-11 bg-gradient-to-r from-sky-500 via-emerald-400 to-red-500 border border-slate-400 rounded-md flex flex-col items-center justify-center shadow-sm">
        <span className="text-[11px] font-black text-white italic drop-shadow">MAX</span>
      </div>
    );
  }
  if (code === '45' || upper.includes('MASECA')) {
    return (
      <div className="w-11 h-14 bg-gradient-to-b from-amber-100 to-yellow-200 border border-amber-500 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[8px] font-black text-green-900">MASECA</span>
      </div>
    );
  }
  if (code === '1' || upper.includes('NATURAS')) {
    return (
      <div className="w-11 h-14 bg-gradient-to-b from-yellow-300 to-red-500 border border-amber-600 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[8px] font-black text-green-950 bg-white/80 px-0.5 rounded">Naturas</span>
      </div>
    );
  }
  if (code === '16' || upper.includes('ZAMBO')) {
    return (
      <div className="w-11 h-14 bg-gradient-to-b from-red-600 to-amber-500 border border-red-700 rounded flex flex-col items-center justify-center shadow-sm">
        <span className="text-[8px] font-black text-yellow-200">ZAMBO</span>
      </div>
    );
  }
  if (code === '43' || upper.includes('SUAVITEL')) {
    return (
      <div className="w-8 h-14 bg-gradient-to-b from-sky-400 to-sky-600 border border-sky-700 rounded-t-lg rounded-b flex flex-col items-center justify-center shadow-sm">
        <span className="text-[6px] font-black text-yellow-200">Suavitel</span>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 border border-amber-700 rounded flex flex-col items-center justify-center p-1 shadow-sm">
      <span className="text-[7px] font-black text-white text-center leading-tight">{name.slice(0, 10)}</span>
    </div>
  );
};

export const SalesModule: React.FC<SalesModuleProps> = ({ initialView }) => {
  const { sales, setSales, products, setProducts, clients, setClients, companies, config, currentUser, recordSale, pullAllFromCloud, openModule, notify } = usePOS();
  const activeCompany = companies.find((c) => c.isPrimary) || companies[0];
  const [printFormat, setPrintFormat] = useState<PrintFormat>(config.invoice.format || 'TICKET_80MM');

  // For LISTA / PREVENTAS view
  const [activeView, setActiveView] = useState<SalesModuleProps['initialView']>(initialView);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [listMode, setListMode] = useState<'VENTAS' | 'PREVENTAS'>(
    initialView === 'PREVENTAS' ? 'PREVENTAS' : 'VENTAS'
  );

  React.useEffect(() => {
    setActiveView(initialView);
    if (initialView === 'PREVENTAS') setListMode('PREVENTAS');
    else if (initialView === 'LISTA') setListMode('VENTAS');
  }, [initialView]);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('01/01/2025');
  const [endDate, setEndDate] = useState('31/12/2026');
  const [selectedSaleId, setSelectedSaleId] = useState<string>('');
  const [previewSale, setPreviewSale] = useState<Sale | null>(null);

  // For TACTIL / ESTANDAR cart (starts empty — connected to real DB)
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [selectedCartIndex, setSelectedCartIndex] = useState<number>(0);
  const [clientId, setClientId] = useState<string>('cli-0');
  const [paymentType, setPaymentType] = useState<'CONTADO' | 'CREDITO' | 'TARJETA'>('CONTADO');
  const [priceTierLabel, setPriceTierLabel] = useState('PRECIO DE VENTA 1');
  const [sellerLabel, setSellerLabel] = useState('GENERAL');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [isExonerated, setIsExonerated] = useState(false);

  // TACTIL filters
  const [touchSearch, setTouchSearch] = useState('');
  const [touchCategory, setTouchCategory] = useState('TODOS');
  const [barcodeInput, setBarcodeInput] = useState('');

  // ESTANDAR quick add row
  const [quickCode, setQuickCode] = useState('');
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0] || {
    id: 'cli-0',
    code: '0',
    name: 'CONSUMIDOR FINAL',
    taxId: '',
    phone: '',
    address: '',
  };

  // Add product to cart
  const handleAddProduct = (prod: Product) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((i) => i.code === prod.code);
      if (idx >= 0) {
        const updated = [...prev];
        const nextQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: nextQty,
          total: Number((nextQty * updated[idx].unitPrice - updated[idx].discount).toFixed(2)),
        };
        setSelectedCartIndex(idx);
        return updated;
      }
      const newItem: SaleItem = {
        productId: prod.id,
        code: prod.code,
        name: prod.name,
        quantity: 1,
        unitPrice: prod.price,
        discount: 0,
        taxRate: prod.taxRate,
        total: prod.price,
      };
      setSelectedCartIndex(prev.length);
      return [...prev, newItem];
    });
  };

  const handleRemoveSelectedRow = () => {
    if (cartItems.length === 0) return;
    setCartItems((prev) => prev.filter((_, idx) => idx !== selectedCartIndex));
    setSelectedCartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedCartIndex(0);
    notify('Formulario de venta limpiado.');
  };

  const cartTotals = useMemo(() => {
    const total = cartItems.reduce((acc, i) => acc + i.total, 0);
    const discountTotal = cartItems.reduce((acc, i) => acc + i.discount, 0);
    let gravado = 0;
    let exento = 0;
    let impuesto = 0;
    if (isExonerated) {
      exento = Number(total.toFixed(2));
    } else {
      cartItems.forEach((item) => {
        const rate = typeof item.taxRate === 'number' ? item.taxRate : 15;
        if (rate <= 0) {
          exento += item.total;
        } else {
          const base = item.total / (1 + rate / 100);
          gravado += base;
          impuesto += item.total - base;
        }
      });
      gravado = Number(gravado.toFixed(2));
      exento = Number(exento.toFixed(2));
      impuesto = Number(impuesto.toFixed(2));
    }
    const unitsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
    return {
      total: Number(total.toFixed(2)),
      discountTotal: Number(discountTotal.toFixed(2)),
      gravado,
      exento,
      impuesto,
      unitsCount,
    };
  }, [cartItems, isExonerated]);

  const handleChangePriceTier = (tierLabel: string) => {
    setPriceTierLabel(tierLabel);
    setCartItems((prev) =>
      prev.map((item) => {
        const prod = products.find((p) => p.code === item.code || p.id === item.productId);
        if (!prod) return item;
        const nextPrice =
          tierLabel === 'PRECIO DE VENTA 3'
            ? prod.wholesalePrice
            : tierLabel === 'PRECIO DE VENTA 2'
            ? Number((prod.price * 0.95).toFixed(2))
            : prod.price;
        return {
          ...item,
          unitPrice: nextPrice,
          total: Number((item.quantity * nextPrice - item.discount).toFixed(2)),
        };
      })
    );
  };

  const loadSaleIntoCart = (sale?: Sale, targetView: 'ESTANDAR' | 'TACTIL' = 'ESTANDAR') => {
    const found = sale || sales.find((s) => s.id === selectedSaleId) || sales[0];
    if (!found) {
      openModule(targetView === 'TACTIL' ? 'venta-tactil' : 'venta-estandar');
      return;
    }
    setEditingSaleId(found.id);
    setClientId(found.clientId || 'cli-0');
    setPaymentType(
      found.paymentType === 'CREDITO' || found.paymentType === 'TARJETA'
        ? found.paymentType
        : 'CONTADO'
    );
    setInvoiceNotes(found.notes || '');
    setCartItems(found.items || []);
    setActiveView(targetView);
  };

  const handleSaveSale = (asPreventa = false): Sale | null => {
    if (cartItems.length === 0) {
      notify('Agregue al menos un producto a la factura.');
      return null;
    }
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    if (editingSaleId) {
      const existing = sales.find((s) => s.id === editingSaleId);
      const updatedSale: Sale = {
        id: editingSaleId,
        invoiceNumber: existing?.invoiceNumber || String(sales.length + 1),
        date: nowStr,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        sellerName: currentUser.username || 'ADMINISTRADOR',
        mode: asPreventa ? 'PREVENTA' : activeView === 'TACTIL' ? 'TACTIL' : 'ESTANDAR',
        paymentType,
        status: asPreventa
          ? 'PENDIENTE_PREVENTA'
          : paymentType === 'CREDITO'
          ? 'CREDITO_VIGENTE'
          : 'COMPLETADA',
        subtotal: cartTotals.gravado,
        discountTotal: cartTotals.discountTotal,
        taxTotal: cartTotals.impuesto,
        total: cartTotals.total,
        balanceDue: paymentType === 'CREDITO' || asPreventa ? cartTotals.total : 0,
        notes: invoiceNotes,
        items: cartItems,
      };

      const wasPreventa =
        existing ? existing.mode === 'PREVENTA' || existing.status === 'PENDIENTE_PREVENTA' : true;

      setProducts((prev) =>
        prev.map((prod) => {
          const oldQty =
            !wasPreventa && existing
              ? existing.items
                  .filter((i) => i.productId === prod.id || i.code === prod.code)
                  .reduce((sum, i) => sum + i.quantity, 0)
              : 0;
          const newQty = !asPreventa
            ? updatedSale.items
                .filter((i) => i.productId === prod.id || i.code === prod.code)
                .reduce((sum, i) => sum + i.quantity, 0)
            : 0;
          const delta = oldQty - newQty;
          if (delta === 0) return prod;
          return { ...prod, stock: Math.max(0, Number((prod.stock + delta).toFixed(4))) };
        })
      );

      if (existing || !asPreventa) {
        const oldBal = !wasPreventa && existing?.paymentType === 'CREDITO' ? existing.balanceDue : 0;
        const newBal = !asPreventa && updatedSale.paymentType === 'CREDITO' ? updatedSale.balanceDue : 0;
        if (oldBal !== 0 || newBal !== 0) {
          setClients((prev) =>
            prev.map((cli) => {
              let nextBal = cli.currentBalance;
              if (existing && cli.id === existing.clientId) nextBal -= oldBal;
              if (cli.id === updatedSale.clientId) nextBal += newBal;
              if (nextBal === cli.currentBalance) return cli;
              return { ...cli, currentBalance: Math.max(0, Number(nextBal.toFixed(2))) };
            })
          );
        }
      }

      setSales((prev) => prev.map((s) => (s.id === editingSaleId ? updatedSale : s)));
      setEditingSaleId(null);
      setCartItems([]);
      setPreviewSale(updatedSale);
      notify(`Factura #${updatedSale.invoiceNumber} actualizada correctamente.`);
      return updatedSale;
    }

    const created = recordSale({
      date: nowStr,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      sellerName: currentUser.username || 'ADMINISTRADOR',
      mode: asPreventa ? 'PREVENTA' : activeView === 'TACTIL' ? 'TACTIL' : 'ESTANDAR',
      paymentType,
      status: asPreventa
        ? 'PENDIENTE_PREVENTA'
        : paymentType === 'CREDITO'
        ? 'CREDITO_VIGENTE'
        : 'COMPLETADA',
      subtotal: cartTotals.gravado,
      discountTotal: cartTotals.discountTotal,
      taxTotal: cartTotals.impuesto,
      total: cartTotals.total,
      balanceDue: paymentType === 'CREDITO' || asPreventa ? cartTotals.total : 0,
      notes: invoiceNotes,
      items: cartItems,
    });
    setCartItems([]);
    setPreviewSale(created);
    return created;
  };

  // ============================================================================
  // VIEW 1: LISTA DE VENTAS & LISTA DE PREVENTAS
  // ============================================================================
  if (activeView === 'LISTA' || activeView === 'PREVENTAS') {
    const sourceList =
      listMode === 'PREVENTAS'
        ? sales.filter((s) => s.mode === 'PREVENTA' || s.status === 'PENDIENTE_PREVENTA')
        : sales.filter((s) => s.mode !== 'PREVENTA');

    const displayedSales = sourceList.filter(
      (s) =>
        !searchQuery.trim() ||
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sumTotal = displayedSales.reduce((acc, s) => acc + s.total, 0);
    const sumSaldo = displayedSales.reduce((acc, s) => acc + s.balanceDue, 0);
    const sumPago = sumTotal - sumSaldo;

    return (
      <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
        {/* CONTEXTUAL RIBBON: Ventas */}
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
          {/* Group: Facturas */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  setEditingSaleId(null);
                  setCartItems([]);
                  setActiveView('ESTANDAR');
                  openModule('venta-estandar');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[60px]"
              >
                <FileSpreadsheet className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Nueva Venta
                  <br />
                  Estándar
                </span>
              </button>
              <button
                onClick={() => {
                  setEditingSaleId(null);
                  setCartItems([]);
                  setActiveView('TACTIL');
                  openModule('venta-tactil');
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[60px]"
              >
                <LayoutGrid className="w-6 h-6 text-[#f59e0b] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Nueva Venta
                  <br />
                  Táctil
                </span>
              </button>
              <button
                onClick={() => loadSaleIntoCart(undefined, listMode === 'PREVENTAS' ? 'TACTIL' : 'ESTANDAR')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[46px]"
              >
                <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Editar
                  <br />
                  Venta
                </span>
              </button>
              <button
                onClick={() => {
                  const found = displayedSales.find((s) => s.id === selectedSaleId);
                  if (found) {
                    recordSale({
                      ...found,
                      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                    });
                  } else {
                    notify('Seleccione una venta para duplicar.', 'warning');
                  }
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[48px]"
              >
                <Copy className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Duplicar
                  <br />
                  Venta
                </span>
              </button>
              <button
                onClick={() => {
                  const found = displayedSales.find((s) => s.id === selectedSaleId) || displayedSales[0];
                  if (found) setPreviewSale(found);
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[44px]"
              >
                <Eye className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Ver Venta
                </span>
              </button>
              <button
                onClick={() => {
                  const target = sales.find((s) => s.id === selectedSaleId);
                  if (!target) {
                    notify('Seleccione una venta de la lista para eliminar.');
                    return;
                  }
                  const wasPreventa = target.mode === 'PREVENTA' || target.status === 'PENDIENTE_PREVENTA';
                  if (!wasPreventa) {
                    setProducts((prev) =>
                      prev.map((prod) => {
                        const restoredQty = target.items
                          .filter((i) => i.productId === prod.id || i.code === prod.code)
                          .reduce((sum, i) => sum + i.quantity, 0);
                        if (restoredQty <= 0) return prod;
                        return { ...prod, stock: Number((prod.stock + restoredQty).toFixed(4)) };
                      })
                    );
                    if (target.paymentType === 'CREDITO' && target.balanceDue > 0) {
                      setClients((prev) =>
                        prev.map((cli) =>
                          cli.id === target.clientId
                            ? {
                                ...cli,
                                currentBalance: Math.max(
                                  0,
                                  Number((cli.currentBalance - target.balanceDue).toFixed(2))
                                ),
                              }
                            : cli
                        )
                      );
                    }
                  }
                  setSales((prev) => prev.filter((s) => s.id !== target.id));
                  setSelectedSaleId('');
                  notify(`Venta #${target.invoiceNumber} eliminada y stock revertido.`);
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] min-w-[46px]"
              >
                <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Eliminar
                  <br />
                  Venta
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Facturas</div>
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
                    className="w-24 h-5 bg-white border border-slate-300 px-1.5 text-[10px] text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-[10px] text-slate-600">Final</span>
                  <input
                    type="text"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-24 h-5 bg-white border border-slate-300 px-1.5 text-[10px] text-slate-800"
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

          {/* Group: Tipo de Venta (Yellow highlight toggle matching Screenshots 5 & 8) */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setListMode('VENTAS')}
                className={`flex flex-col items-center justify-center px-2.5 py-1 rounded border ${
                  listMode === 'VENTAS'
                    ? 'bg-[#fff3a1] border-[#e2c94c] shadow-inner'
                    : 'border-transparent hover:bg-[#dce6f4]'
                }`}
              >
                <Check className="w-6 h-6 text-slate-600 stroke-[2]" />
                <span className="text-[10px] text-slate-800 leading-tight mt-0.5 text-center font-medium">
                  Lista de
                  <br />
                  Ventas
                </span>
              </button>
              <button
                onClick={() => setListMode('PREVENTAS')}
                className={`flex flex-col items-center justify-center px-2.5 py-1 rounded border ${
                  listMode === 'PREVENTAS'
                    ? 'bg-[#fff3a1] border-[#e2c94c] shadow-inner'
                    : 'border-transparent hover:bg-[#dce6f4]'
                }`}
              >
                <Check className="w-6 h-6 text-slate-600 stroke-[2]" />
                <span className="text-[10px] text-slate-800 leading-tight mt-0.5 text-center font-medium">
                  Lista de
                  <br />
                  PreVentas
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Tipo de Venta</div>
          </div>

          {/* Group: Imprimir */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => {
                  const found = displayedSales.find((s) => s.id === selectedSaleId) || displayedSales[0];
                  if (!found) {
                    notify('No hay venta seleccionada para imprimir.');
                    return;
                  }
                  printSaleDocument(found, {
                    company: activeCompany,
                    invoiceConfig: config.invoice,
                    formatOverride: 'TICKET_80MM',
                  });
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir
                  <br />
                  Recibo
                </span>
              </button>
              <button
                onClick={() => {
                  const found = displayedSales.find((s) => s.id === selectedSaleId) || displayedSales[0];
                  if (!found) {
                    notify('No hay venta seleccionada para imprimir.');
                    return;
                  }
                  printSaleDocument(found, {
                    company: activeCompany,
                    invoiceConfig: config.invoice,
                    formatOverride: 'CARTA_A4',
                  });
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir
                  <br />
                  Factura
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Imprimir</div>
          </div>

          {/* Group: Diario / Vista Previa / Configuración / Reportes */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => openModule('diario-digital')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ClipboardList className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Diario
                <br />
                Digital
              </span>
            </button>
            <button
              onClick={() => {
                const found = displayedSales.find((s) => s.id === selectedSaleId) || displayedSales[0];
                if (found) setPreviewSale(found);
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <FileSearch className="w-6 h-6 text-[#0284c7] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Vista Previa
                <br />
                Factura
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
              BUSCAR VENTA POR NOMBRE O CÓDIGO
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[260px] h-6 bg-white border border-[#b0b8c4] px-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 mt-0.5"
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

        {/* GROUP BY HEADER BAR */}
        <div className="bg-[#f0f2f5] border-b border-[#c6cbd2] px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>Arrastre una columna aquí para agrupar por dicha columna</span>
          <Search className="w-3.5 h-3.5 text-slate-500" />
        </div>

        {/* DEVEXPRESS-STYLE DATA GRID */}
        <div className="flex-1 bg-white overflow-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#f5f6f8] z-10">
              <tr className="border-b border-[#d0d5dd] text-slate-700 font-semibold">
                <th className="w-5 border-r border-[#d0d5dd]" />
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Fecha</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Nº Factura</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Cliente</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-32">Usuario</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Términos</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-20">Utilidad</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Total</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Pago</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Saldo</th>
                <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Hora</th>
                <th className="text-left px-2 py-1 w-24">Estado</th>
              </tr>
              {/* Filter Row */}
              <tr className="border-b border-[#d0d5dd] bg-white text-[10px] text-slate-500">
                <td className="border-r border-[#d0d5dd] text-center">▼</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
                <td className="px-1.5 py-0.5">=</td>
              </tr>
            </thead>
            <tbody>
              {displayedSales.map((s) => {
                const isSelected = s.id === selectedSaleId;
                const [datePart, timePart] = s.date.split(' ');
                const formattedDate = datePart.includes('-')
                  ? datePart.split('-').reverse().join('/')
                  : datePart;
                const paidAmount = s.total - s.balanceDue;
                const termsLabel =
                  s.paymentType === 'CONTADO'
                    ? 'CONTADO'
                    : s.paymentType === 'TARJETA'
                    ? 'TARJETA'
                    : s.notes || '15 DIAS';
                const statusLabel = s.balanceDue > 0 || listMode === 'PREVENTAS' ? 'CRÉDITO' : 'PAGADA';

                return (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedSaleId(s.id)}
                    onDoubleClick={() => {
                      if (listMode === 'PREVENTAS') {
                        loadSaleIntoCart(s, 'TACTIL');
                      } else {
                        setPreviewSale(s);
                      }
                    }}
                    className={`border-b border-[#e5e7eb] cursor-pointer ${
                      isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                    }`}
                  >
                    <td className="border-r border-[#e5e7eb] text-center text-[9px] text-slate-600">
                      {isSelected ? '▶' : ''}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-800">{formattedDate}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-800">{s.invoiceNumber}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-900">{s.clientName}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-700">{s.sellerName}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-700">{termsLabel}</td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-700" />
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-900">
                      C${s.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-900">
                      C${paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-900">
                      C${s.balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-700">
                      {timePart || '12:35'} P.M.
                    </td>
                    <td className="px-2 py-0.5 text-slate-800">{statusLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BOTTOM DARK NAVY SUMMARY BAR (Screenshot 5 & 8) */}
        <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold">Nº</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
              {displayedSales.length}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">TOTAL</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
                C${sumTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">EXTRA</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[65px] text-center">
                C$0.00
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
                C${sumPago.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">SALDO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[85px] text-center">
                C${sumSaldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING PREVIEW MODAL: LIVE TICKET / BOLETA / FACTURA */}
        {previewSale && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="w-[820px] max-w-[96vw] h-[88vh] bg-[#f1f5f9] border-2 border-[#1c2b42] shadow-2xl flex flex-col overflow-hidden rounded">
              {/* Modal Header + Document Type Switcher */}
              <div className="bg-[#1c2b42] text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-amber-300" />
                  <div>
                    <div className="font-bold text-xs tracking-wide">
                      VISTA PREVIA DE IMPRESIÓN — {previewSale.mode === 'PREVENTA' ? 'PREVENTA' : 'VENTA'} Nº{' '}
                      {config.invoice.prefix}
                      {previewSale.invoiceNumber}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Cliente: {previewSale.clientName} • Total: C${previewSale.total.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'TICKET_80MM', label: 'Ticket 80mm' },
                      { id: 'TICKET_58MM', label: 'Ticket 58mm' },
                      { id: 'MEDIA_CARTA', label: 'Boleta (1/2 Carta)' },
                      { id: 'CARTA_A4', label: 'Factura (Carta)' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPrintFormat(opt.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        printFormat === opt.id
                          ? 'bg-amber-400 text-slate-900 shadow-sm'
                          : 'bg-slate-700/80 text-slate-200 hover:bg-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setPreviewSale(null)}
                    className="ml-2 px-2 py-1 bg-slate-700 hover:bg-red-600 text-white rounded text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Live Document Preview Area */}
              <div className="flex-1 overflow-auto bg-[#cbd5e1] p-4 flex justify-center items-start">
                <div
                  className="bg-white shadow-xl border border-slate-300 overflow-hidden transition-all"
                  style={{
                    width:
                      printFormat === 'TICKET_58MM'
                        ? '240px'
                        : printFormat === 'TICKET_80MM'
                        ? '320px'
                        : printFormat === 'MEDIA_CARTA'
                        ? '520px'
                        : '740px',
                    height: '100%',
                    minHeight: '480px',
                  }}
                >
                  <iframe
                    title="Vista previa del documento"
                    srcDoc={buildSaleDocumentHtml(previewSale, {
                      company: activeCompany,
                      invoiceConfig: config.invoice,
                      formatOverride: printFormat,
                    })}
                    className="w-full h-full border-0 bg-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-slate-300 px-4 py-2.5 flex items-center justify-between shrink-0">
                <span className="text-[11px] text-slate-500">
                  Diseño activo:{' '}
                  <strong className="text-slate-800">
                    {printFormat === 'TICKET_80MM'
                      ? 'Ticket Térmico 80mm'
                      : printFormat === 'TICKET_58MM'
                      ? 'Ticket Térmico 58mm'
                      : printFormat === 'MEDIA_CARTA'
                      ? 'Boleta de Venta (Media Carta)'
                      : 'Factura Formal (Carta / A4)'}
                  </strong>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      printSaleDocument(previewSale, {
                        company: activeCompany,
                        invoiceConfig: config.invoice,
                        formatOverride: printFormat,
                      })
                    }
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Imprimir Documento
                  </button>
                  <button
                    onClick={() => setPreviewSale(null)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: NUEVA VENTA TÁCTIL (Screenshots 6 & 9)
  // ============================================================================
  if (activeView === 'TACTIL') {
    const categories = [
      'GENERAL',
      'LIMPIEZA',
      'HIGIENE PERSONAL',
      'ALIMENTOS PREPA...',
      'GRANOS BASICOS',
      'HARINAS',
      'PASTAS',
      'PRODUCTOS ENLA...',
      'BEBIDAS',
    ];

    const filteredTouchProducts = products.filter((p) => {
      const matchSearch =
        !touchSearch.trim() ||
        p.name.toLowerCase().includes(touchSearch.toLowerCase()) ||
        p.code.includes(touchSearch);
      const matchCat =
        touchCategory === 'TODOS' ||
        p.category.toUpperCase().startsWith(touchCategory.replace('...', ''));
      return matchSearch && matchCat;
    });

    return (
      <div className="h-full flex flex-col bg-[#d8dfe8] select-none overflow-hidden">
        {/* CONTEXTUAL RIBBON: Venta (Screenshot 6) */}
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
          {/* Guardar Venta Final */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleSaveSale(false)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Save className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  F5 Guardar
                  <br />
                  Venta
                </span>
              </button>
              <button
                onClick={() => {
                  const saved = handleSaveSale(false);
                  if (saved) {
                    printSaleDocument(saved, {
                      company: activeCompany,
                      invoiceConfig: config.invoice,
                      formatOverride: printFormat,
                    });
                  }
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  F8 Imprimir
                  <br />
                  Venta
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Guardar Venta Final</div>
          </div>

          {/* Guardar PreVenta */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => handleSaveSale(true)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Save className="w-6 h-6 text-[#6366f1] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Guardar
                  <br />
                  PreVenta
                </span>
              </button>
              <button
                onClick={() => {
                  const saved = handleSaveSale(true);
                  if (saved) {
                    printSaleDocument(saved, {
                      company: activeCompany,
                      invoiceConfig: config.invoice,
                      formatOverride: printFormat,
                    });
                  }
                }}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir
                  <br />
                  PreVenta
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Guardar PreVenta</div>
          </div>

          {/* Productos */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => openModule('productos')}
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
                onClick={() => openModule('productos')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Home className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Buscar en
                  <br />
                  Sucursales
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Productos</div>
          </div>

          {/* Clientes */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => openModule('clientes')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Users className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  F2 Buscar
                  <br />
                  Clientes
                </span>
              </button>
              <button
                onClick={() => openModule('clientes')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <UserPlus className="w-6 h-6 text-[#2563eb] stroke-[2]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  F6 Nuevo
                  <br />
                  Cliente
                </span>
              </button>
              <button
                onClick={() => openModule('clientes')}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Editar
                  <br />
                  Cliente
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Clientes</div>
          </div>

          {/* Vendedor / Diario / Notas / Exonerada / Filas / Limpiar */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => openModule('empleados')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <UserCheck className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F7 Buscar
                <br />
                Vendedores
              </span>
            </button>
            <button
              onClick={() => openModule('diario-digital')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <ClipboardList className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F1 Diario
                <br />
                Digital
              </span>
            </button>
            <button
              onClick={() => {
                const note = window.prompt('Notas de la Factura:', invoiceNotes);
                if (note !== null) setInvoiceNotes(note);
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <StickyNote className="w-6 h-6 text-[#eab308] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Notas</span>
            </button>
            <button
              onClick={() => {
                setIsExonerated((v) => !v);
                notify(!isExonerated ? 'Venta marcada como Exonerada de ISV.' : 'Venta con ISV 15% normal.');
              }}
              className={`flex flex-col items-center justify-center px-2 py-1 rounded ${
                isExonerated ? 'bg-[#fff3a1] border border-[#e2c94c]' : 'hover:bg-[#dce6f4]'
              }`}
            >
              <BadgePercent className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Venta
                <br />
                Exonerada
              </span>
            </button>
            <button
              onClick={handleRemoveSelectedRow}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F10 Eliminar
                <br />
                Fila
              </span>
            </button>
            <button
              onClick={handleClearCart}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Eraser className="w-6 h-6 text-[#f97316] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F11 Limpiar
              </span>
            </button>
          </div>
        </div>

        {/* MAIN SPLIT BODY (Left: Product Cards, Right: Invoice Line Items) */}
        <div className="flex-1 flex gap-2 p-2 overflow-hidden">
          {/* LEFT PANEL: Search + Categories + 4x4 Product Grid */}
          <div className="w-[58%] flex flex-col gap-1.5 overflow-hidden">
            {/* Search row */}
            <div className="flex items-center justify-center gap-2 py-0.5">
              <div className="relative w-[290px]">
                <input
                  type="text"
                  value={touchSearch}
                  onChange={(e) => setTouchSearch(e.target.value)}
                  placeholder="BUSCAR PRODUCTO"
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-2 text-[11px] text-center font-semibold text-slate-700 focus:outline-none"
                />
              </div>
              <div className="w-9 h-5 bg-white border border-slate-400 flex items-center p-0.5">
                <div className="w-4 h-3.5 bg-[#5c6b7e]" />
              </div>
              <span className="text-[10px] font-bold text-slate-700">DESCRIPCIÓN</span>
            </div>

            {/* Category Buttons (2 rows as in Screenshot 6) */}
            <div className="grid grid-cols-6 gap-1 shrink-0">
              {categories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTouchCategory((prev) => (prev === cat ? 'TODOS' : cat))}
                  className={`h-7 border text-[10px] font-semibold transition-colors ${
                    touchCategory === cat
                      ? 'bg-[#fff3a1] border-[#d2b436] text-slate-900'
                      : 'bg-[#f4f6f9] hover:bg-white border-[#b8c0cc] text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-6 gap-1 shrink-0">
              {categories.slice(6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setTouchCategory((prev) => (prev === cat ? 'TODOS' : cat))}
                  className={`h-7 border text-[10px] font-semibold transition-colors ${
                    touchCategory === cat
                      ? 'bg-[#fff3a1] border-[#d2b436] text-slate-900'
                      : 'bg-[#f4f6f9] hover:bg-white border-[#b8c0cc] text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 4x4 Product Visual Cards Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-2">
                {filteredTouchProducts.map((prod) => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddProduct(prod)}
                    className="group h-[132px] bg-white border border-[#bfc8d4] hover:border-[#2563eb] hover:shadow-md rounded-[3px] p-1.5 flex flex-col justify-between text-left transition-all active:scale-[0.98]"
                  >
                    {/* Top Row: Code + Stock Badge */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[9.5px] font-bold text-slate-600 bg-[#eef2f7] px-1.5 py-0.5 rounded-[2px] border border-[#d6dee8]">
                        #{prod.code}
                      </span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-[2px] border ${
                          prod.stock <= 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : prod.stock <= prod.minStock
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                        title="Existencia disponible"
                      >
                        {prod.stock.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} disp.
                      </span>
                    </div>

                    {/* Center: Product Image */}
                    <div className="flex-1 w-full flex items-center justify-center overflow-hidden my-1 bg-[#f8fafc] rounded-[2px] border border-[#edf1f5] p-1">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        renderProductCardArtwork(prod.code, prod.name)
                      )}
                    </div>

                    {/* Bottom Row: Name + Highlighted Price */}
                    <div className="w-full flex items-center justify-between gap-1.5 pt-0.5 border-t border-[#eef2f6]">
                      <span className="text-[10px] font-bold text-slate-800 leading-tight truncate flex-1">
                        {prod.name}
                      </span>
                      <span className="text-[11px] font-black text-[#1c2b42] bg-[#fff3a1] px-1.5 py-0.5 rounded-[2px] border border-[#e0c55a] shrink-0">
                        C${prod.price.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Client Info + Invoice Line Items + Total */}
          <div className="w-[42%] flex flex-col gap-1.5 overflow-hidden">
            {/* Client & Terms Top Box */}
            <div className="grid grid-cols-12 gap-1 text-[10px] shrink-0">
              <div className="col-span-3">
                <select
                  value={selectedClient.code}
                  onChange={(e) => {
                    const c = clients.find((cl) => cl.code === e.target.value);
                    if (c) setClientId(c.id);
                  }}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 text-center font-semibold"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-9">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1.5 font-semibold text-slate-800"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* RTN + Payment Type */}
              <div className="col-span-8 flex items-center bg-white border border-[#b0b8c4] h-6 px-1.5">
                <span className="font-bold text-slate-600 mr-1">RTN:</span>
                <span className="text-slate-800 truncate">{selectedClient.taxId}</span>
              </div>
              <div className="col-span-4">
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO' | 'TARJETA')}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 font-semibold"
                >
                  <option value="CONTADO">CONTADO</option>
                  <option value="CREDITO">CRÉDITO</option>
                  <option value="TARJETA">TARJETA</option>
                </select>
              </div>

              {/* DIR + Seller */}
              <div className="col-span-8 flex items-center bg-white border border-[#b0b8c4] h-6 px-1.5">
                <span className="font-bold text-slate-600 mr-1">DIR:</span>
                <span className="text-slate-800 truncate">{selectedClient.address}</span>
              </div>
              <div className="col-span-4">
                <select
                  value={sellerLabel}
                  onChange={(e) => setSellerLabel(e.target.value)}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 font-semibold"
                >
                  <option value="GENERAL">GENERAL</option>
                  <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                </select>
              </div>

              {/* TEL + Price Tier */}
              <div className="col-span-8 flex items-center bg-white border border-[#b0b8c4] h-6 px-1.5">
                <span className="font-bold text-slate-600 mr-1">TEL:</span>
                <span className="text-slate-800 truncate">{selectedClient.phone}</span>
              </div>
              <div className="col-span-4">
                <select
                  value={priceTierLabel}
                  onChange={(e) => handleChangePriceTier(e.target.value)}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 font-semibold"
                >
                  <option value="PRECIO DE VENTA 1">PRECIO DE VENTA 1</option>
                  <option value="PRECIO DE VENTA 2">PRECIO DE VENTA 2</option>
                  <option value="PRECIO DE VENTA 3">PRECIO DE VENTA 3</option>
                </select>
              </div>

              {/* CÓDIGO DEL PRODUCTO + Dates */}
              <div className="col-span-8">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && barcodeInput.trim()) {
                      const found = products.find(
                        (p) =>
                          p.code === barcodeInput.trim() ||
                          p.barcode === barcodeInput.trim() ||
                          p.name.toLowerCase().includes(barcodeInput.toLowerCase())
                      );
                      if (found) {
                        handleAddProduct(found);
                        setBarcodeInput('');
                      }
                    }
                  }}
                  placeholder="CÓDIGO DEL PRODUCTO"
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-2 text-center font-semibold"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  defaultValue={new Date().toLocaleDateString('es-NI')}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 text-[9.5px] text-center"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  defaultValue={new Date().toLocaleDateString('es-NI')}
                  className="w-full h-6 bg-white border border-[#b0b8c4] px-1 text-[9.5px] text-center"
                />
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="flex-1 bg-white border border-[#b0b8c4] overflow-auto">
              <table className="w-full border-collapse text-[10.5px]">
                <thead className="sticky top-0 bg-[#f5f6f8] border-b border-[#d0d5dd]">
                  <tr className="text-slate-700 font-semibold">
                    <th className="text-left px-1.5 py-1 border-r border-[#d0d5dd]">Descripción</th>
                    <th className="text-right px-1.5 py-1 border-r border-[#d0d5dd] w-14">Cantidad</th>
                    <th className="text-right px-1.5 py-1 border-r border-[#d0d5dd] w-14">Desc. %</th>
                    <th className="text-right px-1.5 py-1 border-r border-[#d0d5dd] w-16">Precio Venta</th>
                    <th className="text-right px-1.5 py-1 w-16">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, idx) => {
                    const active = idx === selectedCartIndex;
                    return (
                      <tr
                        key={`${item.code}-${idx}`}
                        onClick={() => setSelectedCartIndex(idx)}
                        className={`border-b border-[#e5e7eb] cursor-pointer ${
                          active ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                        }`}
                      >
                        <td className="px-1.5 py-0.5 border-r border-[#e5e7eb] truncate max-w-[165px]">
                          {item.name}
                        </td>
                        <td className="px-1.5 py-0.5 border-r border-[#e5e7eb] text-right">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const q = Math.max(1, Number(e.target.value) || 1);
                              setCartItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? { ...it, quantity: q, total: Number((q * it.unitPrice).toFixed(2)) }
                                    : it
                                )
                              );
                            }}
                            className="w-12 text-right bg-transparent focus:outline-none"
                          />
                        </td>
                        <td className="px-1.5 py-0.5 border-r border-[#e5e7eb] text-right">0.00 %</td>
                        <td className="px-1.5 py-0.5 border-r border-[#e5e7eb] text-right">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="px-1.5 py-0.5 text-right">
                          {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Action & Large Total Box */}
            <div className="flex items-center justify-between pt-0.5 shrink-0">
              <button
                onClick={handleRemoveSelectedRow}
                className="h-9 px-4 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] flex items-center gap-2 text-xs font-semibold text-slate-800 shadow-sm"
              >
                <X className="w-5 h-5 text-red-600 stroke-[2.5]" />
                Quitar Producto
              </button>

              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-800">TOTAL</span>
                <div className="bg-[#dce2ec] border border-[#a5aebc] px-4 py-1 min-w-[140px] text-right text-2xl font-bold text-slate-900">
                  {cartTotals.total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM DARK NAVY BAR (Screenshot 6) */}
        <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold">Nº</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
              {cartTotals.unitsCount}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold">IMPORTE EXENTO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
                {cartTotals.exento.toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">IMPORTE GRAVADO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
                {cartTotals.gravado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">IMPUESTO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
                {cartTotals.impuesto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold">DESCUENTO</span>
              <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
                {cartTotals.discountTotal.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: NUEVA VENTA ESTÁNDAR (Screenshot 7)
  // ============================================================================
  return (
    <div className="h-full flex flex-col bg-[#d8dfe8] select-none overflow-hidden">
      {/* CONTEXTUAL RIBBON: Venta Estándar (Screenshot 7) */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleSaveSale(false)}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Save className="w-6 h-6 text-[#4f46e5] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F5 Guardar
                <br />
                Venta
              </span>
            </button>
            <button
              onClick={() => {
                const saved = handleSaveSale(false);
                if (saved) {
                  printSaleDocument(saved, {
                    company: activeCompany,
                    invoiceConfig: config.invoice,
                    formatOverride: printFormat,
                  });
                }
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Printer className="w-6 h-6 text-[#ea580c] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F8 Imprimir
                <br />
                Venta
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Guardar Venta Final</div>
        </div>

        {/* Productos */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setQuickModalOpen(true)}
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
              onClick={() => openModule('productos')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Home className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Buscar en
                <br />
                Sucursales
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Productos</div>
        </div>

        {/* Clientes */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => openModule('clientes')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Users className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F2 Buscar
                <br />
                Clientes
              </span>
            </button>
            <button
              onClick={() => openModule('clientes')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <UserPlus className="w-6 h-6 text-[#2563eb] stroke-[2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                F6 Nuevo
                <br />
                Cliente
              </span>
            </button>
            <button
              onClick={() => openModule('clientes')}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Editar
                <br />
                Cliente
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Clientes</div>
        </div>

        {/* Vendedor / Diario / Detalles / Exonerada / Filas / Limpiar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => openModule('empleados')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <UserCheck className="w-6 h-6 text-[#65a30d] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F7 Buscar
              <br />
              Vendedores
            </span>
          </button>
          <button
            onClick={() => openModule('diario-digital')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <ClipboardList className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F1 Diario
              <br />
              Digital
            </span>
          </button>
          <button
            onClick={() => setIsExonerated((v) => !v)}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <BadgePercent className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Venta
              <br />
              Exonerada
            </span>
          </button>
          <button
            onClick={() => setQuickModalOpen(true)}
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
            onClick={handleRemoveSelectedRow}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F10 Eliminar
              <br />
              Fila
            </span>
          </button>
          <button
            onClick={handleClearCart}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Eraser className="w-6 h-6 text-[#f97316] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              F11 Limpiar
            </span>
          </button>
        </div>
      </div>

      {/* TOP INVOICE HEADER (Screenshot 7) */}
      <div className="bg-[#d8dfe8] px-3 py-2 flex items-start justify-between gap-4 border-b border-[#b8c0cc] shrink-0 text-[10px]">
        {/* Left column: Nº FACTURA & TÉRMINOS DE VENTA */}
        <div className="w-32 space-y-1.5">
          <div>
            <label className="font-bold text-slate-700 block">Nº FACTURA</label>
            <div className="h-6 bg-[#d0d7e2] border border-[#a5aebc] flex items-center justify-center font-bold text-slate-800">
              {editingSaleId
                ? sales.find((s) => s.id === editingSaleId)?.invoiceNumber || sales.length + 1
                : sales.length + 1}
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 block">TÉRMINOS DE VENTA</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'CONTADO' | 'CREDITO' | 'TARJETA')}
              className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
            >
              <option value="CONTADO">CONTADO</option>
              <option value="CREDITO">CRÉDITO</option>
              <option value="TARJETA">TARJETA</option>
            </select>
          </div>
        </div>

        {/* Client & Notes Block */}
        <div className="w-[430px] space-y-1">
          <div className="flex gap-1">
            <select
              value={selectedClient.code}
              onChange={(e) => {
                const c = clients.find((cl) => cl.code === e.target.value);
                if (c) setClientId(c.id);
              }}
              className="w-20 h-6 bg-white border border-[#a5aebc] px-1 text-center font-semibold"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="flex-1 h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-12 gap-1">
            <div className="col-span-6 space-y-1">
              <div className="h-5 bg-white border border-[#a5aebc] px-1.5 flex items-center">
                <span className="font-bold text-slate-600 mr-1">DIR:</span>
                <span className="truncate">{selectedClient.address}</span>
              </div>
              <div className="h-5 bg-white border border-[#a5aebc] px-1.5 flex items-center">
                <span className="font-bold text-slate-600 mr-1">TEL:</span>
                <span className="truncate">{selectedClient.phone}</span>
              </div>
              <div className="h-5 bg-white border border-[#a5aebc] px-1.5 flex items-center">
                <span className="font-bold text-slate-600 mr-1">RTN:</span>
                <span className="truncate">{selectedClient.taxId}</span>
              </div>
            </div>
            <div className="col-span-6">
              <textarea
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="INGRESAR NOTAS EN LA FACTURA"
                className="w-full h-[68px] bg-white border border-[#a5aebc] p-1.5 text-[10px] resize-none focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Middle: PRECIO DE VENTA & VENDEDOR */}
        <div className="w-44 space-y-1.5">
          <div>
            <label className="font-bold text-slate-700 block">PRECIO DE VENTA</label>
            <select
              value={priceTierLabel}
              onChange={(e) => handleChangePriceTier(e.target.value)}
              className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
            >
              <option value="PRECIO DE VENTA 1">PRECIO DE VENTA 1</option>
              <option value="PRECIO DE VENTA 2">PRECIO DE VENTA 2</option>
              <option value="PRECIO DE VENTA 3">PRECIO DE VENTA 3</option>
            </select>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <label className="font-bold text-slate-700">VENDEDOR</label>
              <input
                type="text"
                defaultValue="0"
                className="w-12 h-5 bg-white border border-[#a5aebc] text-center"
              />
            </div>
            <select
              value={sellerLabel}
              onChange={(e) => setSellerLabel(e.target.value)}
              className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
            >
              <option value="GENERAL">GENERAL</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
            </select>
          </div>
        </div>

        {/* Right: TOTAL & FECHAS */}
        <div className="flex flex-col items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-slate-800">TOTAL</span>
            <div className="bg-[#dce2ec] border border-[#a5aebc] px-4 py-1 min-w-[140px] text-right text-2xl font-bold text-slate-900">
              {cartTotals.total.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div>
              <label className="font-bold text-slate-700 block">FECHA</label>
              <input
                type="text"
                defaultValue={new Date().toLocaleDateString('es-NI')}
                className="w-24 h-6 bg-white border border-[#a5aebc] px-1.5 text-center"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block">FECHA MÁXIMA</label>
              <input
                type="text"
                defaultValue={new Date().toLocaleDateString('es-NI')}
                className="w-24 h-6 bg-white border border-[#a5aebc] px-1.5 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH DEVEXPRESS LINE ITEMS GRID (Screenshot 7) */}
      <div className="flex-1 bg-white overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f5f6f8] z-10 border-b border-[#d0d5dd]">
            <tr className="text-slate-700 font-semibold">
              <th className="w-5 border-r border-[#d0d5dd]" />
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-28">CodProducto</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Descripción</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Cantidad</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Unidad</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-28">Precio de Venta</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Descuento %</th>
              <th className="text-right px-2 py-1 border-r border-[#d0d5dd] w-24">Impuesto %</th>
              <th className="text-right px-2 py-1 w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Top Quick-Entry Row (Yellow highlighted row in Screenshot 7) */}
            <tr className="border-b border-[#d0d5dd] bg-[#fff5c0]">
              <td className="border-r border-[#d0d5dd] text-center text-[9px] text-slate-600">✎</td>
              <td className="px-1 py-0.5 border-r border-[#d0d5dd] bg-white">
                <input
                  type="text"
                  value={quickCode}
                  onChange={(e) => setQuickCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && quickCode.trim()) {
                      const prod = products.find(
                        (p) =>
                          p.code === quickCode.trim() ||
                          p.name.toLowerCase().includes(quickCode.toLowerCase())
                      );
                      if (prod) {
                        handleAddProduct(prod);
                        setQuickCode('');
                      }
                    }
                  }}
                  placeholder="Código + Enter"
                  className="w-full text-[11px] focus:outline-none"
                />
              </td>
              <td className="px-2 py-0.5 border-r border-[#d0d5dd] text-slate-500 italic">
                Escriba un código y presione Enter o haga clic en F4 Buscar Productos...
              </td>
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td className="border-r border-[#d0d5dd]" />
              <td />
            </tr>

            {cartItems.map((item, idx) => {
              const active = idx === selectedCartIndex;
              return (
                <tr
                  key={`${item.code}-${idx}`}
                  onClick={() => setSelectedCartIndex(idx)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    active ? 'bg-[#e8f0fe] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px] text-slate-500">
                    {active ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-800">{item.code}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-900">{item.name}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const q = Math.max(1, Number(e.target.value) || 1);
                        setCartItems((prev) =>
                          prev.map((it, i) =>
                            i === idx
                              ? { ...it, quantity: q, total: Number((q * it.unitPrice).toFixed(2)) }
                              : it
                          )
                        );
                      }}
                      className="w-16 text-right bg-transparent focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-slate-700">UNIDAD</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-800">
                    {item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-700">0.00 %</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-right text-slate-700">
                    {item.taxRate.toFixed(2)} %
                  </td>
                  <td className="px-2 py-0.5 text-right text-slate-900">
                    {item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM DARK NAVY BAR (Screenshot 7) */}
      <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0 text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">Nº</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[48px] text-center">
              {cartTotals.unitsCount.toFixed(2)}
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
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              0.00
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPORTE EXENTO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
              {cartTotals.exento.toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPORTE GRAVADO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[75px] text-center">
              {cartTotals.gravado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">IMPUESTO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              {cartTotals.impuesto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold">DESCUENTO</span>
            <div className="bg-[#d8dde6] text-slate-900 font-bold px-3 py-0.5 min-w-[70px] text-center">
              {cartTotals.discountTotal.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Product Picker Modal when F4 / F9 clicked */}
      {quickModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <div className="w-[560px] bg-[#e8ecf2] border-2 border-[#a0a8b4] shadow-2xl">
            <div className="h-7 bg-[#dbe1ea] px-3 flex items-center justify-between border-b border-[#b8c0cc] text-xs font-bold">
              <span>Seleccionar Producto (F4)</span>
              <button onClick={() => setQuickModalOpen(false)}>✕</button>
            </div>
            <div className="p-3 max-h-[360px] overflow-auto bg-white">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="bg-[#f5f6f8] border-b">
                    <th className="text-left p-1.5">Código</th>
                    <th className="text-left p-1.5">Descripción</th>
                    <th className="text-right p-1.5">Existencia</th>
                    <th className="text-right p-1.5">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => {
                        handleAddProduct(p);
                        setQuickModalOpen(false);
                      }}
                      className="border-b hover:bg-[#fff5c0] cursor-pointer"
                    >
                      <td className="p-1.5 font-bold">{p.code}</td>
                      <td className="p-1.5">{p.name}</td>
                      <td className="p-1.5 text-right">{p.stock.toFixed(2)}</td>
                      <td className="p-1.5 text-right font-bold">C${p.price.toFixed(2)}</td>
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
