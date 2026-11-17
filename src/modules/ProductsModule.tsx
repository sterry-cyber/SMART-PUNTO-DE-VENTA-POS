import React, { useState, useRef } from 'react';
import { printProductLabel } from '../utils/printService';
import {
  Plus,
  Pencil,
  X,
  RefreshCw,
  Table2,
  Home,
  FileSpreadsheet,
  ClipboardCheck,
  ArrowUpDown,
  Barcode,
  BarChart3,
  Search,
  Save,
  Sparkles,
  Printer,
  Upload,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Product } from '../types/pos';
import { uploadImageToSupabaseStorage } from '../lib/supabase';

type WarehouseFilter = 'TODOS' | 'CON_EXISTENCIA' | 'SIN_EXISTENCIA' | 'SUGERIDOS' | 'VENCIMIENTO';
type SubModalView = null | 'SUCURSALES' | 'HISTORIAL' | 'ETIQUETAS';

export const ProductsModule: React.FC = () => {
  const {
    products,
    setProducts,
    suppliers,
    purchases,
    companies,
    pullAllFromCloud,
    exportToExcelCSV,
    openModule,
    notify,
  } = usePOS();

  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('TODOS LOS PROVEEDORES');
  const [warehouseFilter, setWarehouseFilter] = useState<WarehouseFilter>('TODOS');
  const [showAdvancedCols, setShowAdvancedCols] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(products[0] || null);

  // Product Form Dialog ("Cómo crear un producto")
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<
    'PRODUCTO' | 'KITS' | 'PRECIOS_COMPRA' | 'NOTAS' | 'CONFIGURACION'
  >('PRODUCTO');
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [subModal, setSubModal] = useState<SubModalView>(null);
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const productImgInputRef = useRef<HTMLInputElement>(null);
  const excelImportInputRef = useRef<HTMLInputElement>(null);

  // Kits & Notes state inside the dialog
  const [kitComponents, setKitComponents] = useState<
    { productId: string; code: string; name: string; quantity: number; unitCost: number }[]
  >([]);
  const [selectedKitComponentId, setSelectedKitComponentId] = useState('');
  const [kitComponentQty, setKitComponentQty] = useState(1);
  const [productNotes, setProductNotes] = useState('');

  const [form, setForm] = useState({
    code: '1',
    barcode: '',
    quickCode: '',
    productType: 'PRODUCTO',
    name: '',
    cost: 0,
    taxRate: 15,
    price1: 0,
    price2: 0,
    price3: 0,
    price4: 0,
    currentStock: 0,
    addStock: 0,
    minStock: 5,
    maxStock: 500,
    expirationDate: '',
    supplierId: suppliers[0]?.id || '',
    active: true,
    unit: 'UNIDAD',
    category: 'GENERAL',
    location: 'GENERAL',
    brand: 'GENERAL',
  });

  const filteredProducts = products.filter((p) => {
    const matchText =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());
    const matchSup =
      supplierFilter === 'TODOS LOS PROVEEDORES' || p.supplierName === supplierFilter;
    if (!matchText || !matchSup) return false;

    if (warehouseFilter === 'CON_EXISTENCIA') return p.stock > 0;
    if (warehouseFilter === 'SIN_EXISTENCIA') return p.stock <= 0;
    if (warehouseFilter === 'SUGERIDOS') return p.stock <= p.minStock;
    if (warehouseFilter === 'VENCIMIENTO') return Boolean(p.expirationDate);
    return true;
  });

  const openNewProductDialog = () => {
    setEditingProd(null);
    setDialogTab('PRODUCTO');
    setProductImageUrl('');
    setKitComponents([]);
    setProductNotes('');
    setForm({
      code: String(products.length + 1),
      barcode: '',
      quickCode: '',
      productType: 'PRODUCTO',
      name: '',
      cost: 0,
      taxRate: 15,
      price1: 0,
      price2: 0,
      price3: 0,
      price4: 0,
      currentStock: 0,
      addStock: 0,
      minStock: 5,
      maxStock: 500,
      expirationDate: '',
      supplierId: suppliers[0]?.id || '',
      active: true,
      unit: 'UNIDAD',
      category: 'GENERAL',
      location: 'GENERAL',
      brand: 'GENERAL',
    });
    setIsDialogOpen(true);
  };

  const openEditProductDialog = (prod: Product) => {
    setEditingProd(prod);
    setDialogTab('PRODUCTO');
    setProductImageUrl(prod.imageUrl || '');
    setKitComponents([]);
    setProductNotes(prod.history?.[0]?.note || '');
    setForm({
      code: prod.code,
      barcode: prod.barcode,
      quickCode: '',
      productType: 'PRODUCTO',
      name: prod.name,
      cost: prod.cost,
      taxRate: prod.taxRate,
      price1: prod.price,
      price2: Number((prod.price * 0.95).toFixed(2)),
      price3: prod.wholesalePrice,
      price4: Number((prod.wholesalePrice * 0.94).toFixed(2)),
      currentStock: prod.stock,
      addStock: 0,
      minStock: prod.minStock,
      maxStock: prod.maxStock || 500,
      expirationDate: prod.expirationDate || '',
      supplierId: prod.supplierId || suppliers[0]?.id || '',
      active: prod.active,
      unit: prod.unit,
      category: prod.category,
      location: prod.location,
      brand: prod.brand,
    });
    setIsDialogOpen(true);
  };

  const saveProduct = (closeAfter: boolean) => {
    const finalStock = form.currentStock + form.addStock;
    const matchedSupplier = suppliers.find((s) => s.id === form.supplierId);
    const supplierName = matchedSupplier?.name || suppliers[0]?.name || 'PROVEEDOR GENERAL';

    if (editingProd) {
      const updatedHistory =
        form.addStock !== 0 || productNotes.trim()
          ? [
              {
                id: `hist-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'AJUSTE' as const,
                documentRef: `EDICIÓN-${form.code}`,
                quantity: form.addStock,
                previousStock: form.currentStock,
                newStock: finalStock,
                user: 'ADMINISTRADOR',
                note: productNotes.trim() || 'Ajuste desde ficha de producto',
              },
              ...(editingProd.history || []),
            ]
          : editingProd.history || [];

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProd.id
            ? {
                ...p,
                code: form.code,
                barcode: form.barcode,
                name: form.name.toUpperCase(),
                cost: form.cost,
                price: form.price1,
                wholesalePrice: form.price3,
                taxRate: form.taxRate,
                stock: finalStock,
                minStock: form.minStock,
                maxStock: form.maxStock,
                expirationDate: form.expirationDate || undefined,
                supplierId: form.supplierId,
                supplierName,
                active: form.active,
                unit: form.unit,
                category: form.category,
                location: form.location,
                brand: form.brand,
                imageUrl: productImageUrl || undefined,
                history: updatedHistory,
              }
            : p
        )
      );
      notify(`Producto "${form.name}" actualizado.`);
    } else {
      const created: Product = {
        id: `prod-${Date.now()}`,
        code: form.code,
        barcode: form.barcode,
        name: (form.name || 'NUEVO PRODUCTO').toUpperCase(),
        category: form.category,
        brand: form.brand,
        unit: form.unit,
        cost: form.cost,
        price: form.price1,
        wholesalePrice: form.price3,
        taxRate: form.taxRate,
        stock: finalStock,
        minStock: form.minStock,
        maxStock: form.maxStock,
        expirationDate: form.expirationDate || undefined,
        supplierId: form.supplierId || 'sup-1',
        supplierName,
        active: form.active,
        location: form.location,
        imageUrl: productImageUrl || undefined,
        branchStocks: companies.map((c, idx) => ({
          branchId: c.id,
          branchName: c.name,
          stock: idx === 0 ? finalStock : 0,
          minStock: form.minStock,
          location: form.location,
        })),
        history: [
          {
            id: `hist-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'AJUSTE',
            documentRef: `ALTA-${form.code}`,
            quantity: finalStock,
            previousStock: 0,
            newStock: finalStock,
            user: 'ADMINISTRADOR',
            note: productNotes.trim() || 'Inventario inicial del producto',
          },
        ],
      };
      setProducts((prev) => [created, ...prev]);
      setSelectedProduct(created);
      notify(`Producto "${created.name}" guardado.`);
    }

    if (closeAfter) {
      setIsDialogOpen(false);
    } else {
      openNewProductDialog();
    }
  };

  const calcUtilityPctNum = (price: number, cost = form.cost, taxRate = form.taxRate): number => {
    if (cost <= 0 || price <= 0) return 0;
    const netPrice = price / (1 + taxRate / 100);
    return ((netPrice - cost) / cost) * 100;
  };

  const calcUtilityAmtNum = (price: number, cost = form.cost, taxRate = form.taxRate): number => {
    if (price <= 0 && cost <= 0) return 0;
    const netPrice = price / (1 + taxRate / 100);
    return netPrice - cost;
  };

  const handleUtilityPctChange = (
    priceKey: 'price1' | 'price2' | 'price3' | 'price4',
    pctValue: number
  ) => {
    const safePct = Number.isFinite(pctValue) ? pctValue : 0;
    const netPrice = form.cost * (1 + safePct / 100);
    const newPrice = Number((netPrice * (1 + form.taxRate / 100)).toFixed(2));
    setForm((prev) => ({ ...prev, [priceKey]: Math.max(0, newPrice) }));
  };

  const handleUtilityAmtChange = (
    priceKey: 'price1' | 'price2' | 'price3' | 'price4',
    amtValue: number
  ) => {
    const safeAmt = Number.isFinite(amtValue) ? amtValue : 0;
    const netPrice = form.cost + safeAmt;
    const newPrice = Number((netPrice * (1 + form.taxRate / 100)).toFixed(2));
    setForm((prev) => ({ ...prev, [priceKey]: Math.max(0, newPrice) }));
  };

  // Purchase history for the active product in PRECIOS_COMPRA tab
  const productPurchaseHistory = purchases.flatMap((pur) =>
    pur.items
      .filter((it) => it.code === form.code || (editingProd && it.productId === editingProd.id))
      .map((it) => ({
        date: pur.date,
        documentNumber: pur.supplierInvoice || pur.documentNumber,
        supplierName: pur.supplierName,
        quantity: it.quantity,
        unitCost: it.unitCost,
        total: it.total,
      }))
  );

  return (
    <div className="flex flex-col h-full bg-[#d5dce6] text-xs select-none">
      {/* Hidden File Input for Excel / CSV Import */}
      <input
        ref={excelImportInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const text = String(reader.result || '');
              if (file.name.endsWith('.json')) {
                const arr = JSON.parse(text);
                if (Array.isArray(arr)) {
                  setProducts((prev) => [...arr, ...prev]);
                  notify(`${arr.length} productos importados correctamente.`);
                }
              } else {
                const lines = text.split(/\r?\n/).filter((l) => l.trim());
                if (lines.length > 1) {
                  const imported: Product[] = lines.slice(1).map((line, idx) => {
                    const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
                    return {
                      id: `prod-imp-${Date.now()}-${idx}`,
                      code: cols[0] || String(products.length + idx + 1),
                      barcode: cols[1] || '',
                      name: (cols[2] || `PRODUCTO IMPORTADO ${idx + 1}`).toUpperCase(),
                      category: cols[3] || 'GENERAL',
                      brand: 'GENERAL',
                      unit: cols[4] || 'UNIDAD',
                      stock: Number(cols[5]) || 0,
                      cost: Number(cols[6]) || 0,
                      price: Number(cols[7]) || 0,
                      wholesalePrice: Number(cols[7]) || 0,
                      taxRate: 15,
                      minStock: 5,
                      maxStock: 500,
                      supplierId: suppliers[0]?.id || 'sup-1',
                      supplierName: suppliers[0]?.name || 'PROVEEDOR GENERAL',
                      active: true,
                      location: 'GENERAL',
                      branchStocks: [],
                      history: [],
                    };
                  });
                  setProducts((prev) => [...imported, ...prev]);
                  notify(`${imported.length} productos importados desde CSV/Excel.`);
                }
              }
            } catch {
              notify('No se pudo procesar el archivo importado.', 'error');
            }
          };
          reader.readAsText(file);
        }}
      />

      {/* CONTEXTUAL RIBBON FOR PRODUCTOS (Matches Screenshot 2) */}
      <div className="bg-gradient-to-b from-[#e3ecf5] to-[#d5e1ee] border-b border-[#9fb2c7] px-1.5 py-1 flex items-stretch overflow-x-auto shrink-0">
        {/* Grupo: Productos */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <div className="flex items-start gap-0.5">
            <button
              onClick={openNewProductDialog}
              className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee] min-w-[54px]"
            >
              <Plus className="w-6 h-6 text-sky-600 stroke-[2.8]" />
              <span className="text-[10px] leading-tight text-center mt-0.5">Nuevo<br />Producto</span>
            </button>
            <button
              onClick={() => {
                if (!selectedProduct) {
                  notify('Seleccione un producto de la lista para editarlo.', 'warning');
                  return;
                }
                openEditProductDialog(selectedProduct);
              }}
              className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee] min-w-[54px]"
            >
              <Pencil className="w-6 h-6 text-sky-700" />
              <span className="text-[10px] leading-tight text-center mt-0.5">Editar<br />Producto</span>
            </button>
            <button
              onClick={() => {
                if (!selectedProduct) {
                  notify('Seleccione un producto para eliminar.', 'warning');
                  return;
                }
                setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
                notify(`Producto ${selectedProduct.name} eliminado.`);
              }}
              className="flex flex-col items-center px-2 py-1 rounded hover:bg-rose-100 min-w-[54px]"
            >
              <X className="w-6 h-6 text-rose-600 stroke-[2.8]" />
              <span className="text-[10px] leading-tight text-center mt-0.5">Eliminar<br />Producto</span>
            </button>
          </div>
          <div className="text-[10px] text-slate-600 text-center">Productos</div>
        </div>

        {/* Grupo: Actualizar */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <button
            onClick={() => {
              setWarehouseFilter('TODOS');
              pullAllFromCloud();
            }}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <RefreshCw className="w-6 h-6 text-sky-600" />
            <span className="text-[10px] leading-tight text-center mt-0.5">F5 Actualizar<br />Lista</span>
          </button>
          <div className="text-[10px] text-slate-600 text-center">Actualizar</div>
        </div>

        {/* Grupo: Existencia */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <button
            onClick={() => {
              if (!selectedProduct) {
                notify('Seleccione un producto para actualizar su existencia.', 'warning');
                return;
              }
              setProducts((prev) =>
                prev.map((p) => (p.id === selectedProduct.id ? { ...p, stock: p.stock + 10 } : p))
              );
              setSelectedProduct((prev) => (prev ? { ...prev, stock: prev.stock + 10 } : null));
              notify(`Existencia de ${selectedProduct.name} incrementada (+10).`);
            }}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <RefreshCw className="w-6 h-6 text-teal-600" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Actualizar Existencia<br />del Producto</span>
          </button>
          <div className="text-[10px] text-slate-600 text-center">Existencia</div>
        </div>

        {/* Grupo: Detalles Avanzados */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <button
            onClick={() => setShowAdvancedCols(!showAdvancedCols)}
            className={`flex flex-col items-center px-2 py-1 rounded ${
              showAdvancedCols ? 'bg-[#fff3a1] border border-amber-400' : 'hover:bg-[#c4d8ee]'
            }`}
          >
            <Table2 className="w-6 h-6 text-sky-700" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Mostrar Detalles<br />Avanzados</span>
          </button>
          <div className="text-[10px] text-slate-600 text-center">Detalles Ava...</div>
        </div>

        {/* Grupo: Sucursales */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <button
            onClick={() => {
              if (!selectedProduct && products[0]) setSelectedProduct(products[0]);
              setSubModal('SUCURSALES');
            }}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <Home className="w-6 h-6 text-emerald-600" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Buscar en<br />Sucursales</span>
          </button>
          <div className="text-[10px] text-slate-600 text-center">Sucurs...</div>
        </div>

        {/* Grupo: Filtro de Almacén */}
        <div className="flex flex-col justify-between px-1.5 border-r border-[#b7c7d8]">
          <div className="flex items-start gap-0.5">
            {(
              [
                { id: 'CON_EXISTENCIA', l1: 'Productos Con', l2: 'Existencia', color: 'text-emerald-600' },
                { id: 'SIN_EXISTENCIA', l1: 'Productos Sin', l2: 'Existencia', color: 'text-sky-600' },
                { id: 'SUGERIDOS', l1: 'Productos', l2: 'Sugeridos', color: 'text-blue-600' },
                { id: 'VENCIMIENTO', l1: 'Productos Con', l2: 'Vencimiento', color: 'text-rose-600' },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                onClick={() => setWarehouseFilter(warehouseFilter === btn.id ? 'TODOS' : btn.id)}
                className={`flex flex-col items-center px-2 py-1 rounded ${
                  warehouseFilter === btn.id ? 'bg-[#fff3a1] border border-amber-400' : 'hover:bg-[#c4d8ee]'
                }`}
              >
                <FileSpreadsheet className={`w-6 h-6 ${btn.color}`} />
                <span className="text-[10px] leading-tight text-center mt-0.5">
                  {btn.l1}
                  <br />
                  {btn.l2}
                </span>
              </button>
            ))}
          </div>
          <div className="text-[10px] text-slate-600 text-center">Filtro de Almacén</div>
        </div>

        {/* Auditoría / Historial / Etiquetas / Excel / Reportes */}
        <div className="flex items-start gap-1 px-1.5">
          <button
            onClick={() => openModule('auditoria')}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <ClipboardCheck className="w-6 h-6 text-amber-600" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Auditoría de<br />Productos</span>
          </button>
          <button
            onClick={() => {
              if (!selectedProduct && products[0]) setSelectedProduct(products[0]);
              setSubModal('HISTORIAL');
            }}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <ArrowUpDown className="w-6 h-6 text-sky-700" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Historial de<br />Productos</span>
          </button>
          <button
            onClick={() => {
              if (!selectedProduct && products[0]) setSelectedProduct(products[0]);
              setSubModal('ETIQUETAS');
            }}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <Barcode className="w-6 h-6 text-slate-700" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Imprimir<br />Etiquetas</span>
          </button>
          <button
            onClick={() =>
              exportToExcelCSV(
                'Catalogo_Productos',
                filteredProducts.map((p) => ({
                  Codigo: p.code,
                  CodigoBarra: p.barcode,
                  Descripcion: p.name,
                  Categoria: p.category,
                  Unidad: p.unit,
                  Existencia: p.stock,
                  Costo: p.cost,
                  PrecioVenta: p.price,
                  Impuesto: p.taxRate,
                }))
              )
            }
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <FileSpreadsheet className="w-6 h-6 text-emerald-700" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Exportar<br />Excel</span>
          </button>
          <button
            onClick={() => excelImportInputRef.current?.click()}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <Upload className="w-6 h-6 text-blue-700" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Importar<br />Excel</span>
          </button>
          <button
            onClick={() => openModule('reportes')}
            className="flex flex-col items-center px-2 py-1 rounded hover:bg-[#c4d8ee]"
          >
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span className="text-[10px] leading-tight text-center mt-0.5">Reportes<br />&nbsp;</span>
          </button>
        </div>
      </div>

      {/* SEARCH & SUPPLIER FILTER BAR */}
      <div className="bg-[#dce5f0] px-3 py-2 border-b border-[#b6c5d6] flex items-center justify-between gap-4 shrink-0">
        <div className="flex flex-col gap-1.5 flex-1 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-slate-700 uppercase mb-0.5">
                BUSCAR PRODUCTO POR NOMBRE
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#a3b4c8] px-2 py-1 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <div className="text-[10px] font-semibold text-slate-700 uppercase mb-0.5">
                FILTRO DE BÚSQUEDA
              </div>
              <div className="flex items-center gap-2">
                <div className="w-11 h-5 bg-white border border-slate-400 flex items-center p-0.5">
                  <div className="w-5 h-3.5 bg-[#4f647d]" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700">BUSCAR POR NOMBRE</span>
                <button
                  onClick={() => {
                    setSearch('');
                    setSupplierFilter('TODOS LOS PROVEEDORES');
                    setWarehouseFilter('TODOS');
                  }}
                  className="px-3 py-1 bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] text-[11px] text-slate-700"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="w-full bg-white border border-[#a3b4c8] px-2 py-1 text-xs"
          >
            <option value="TODOS LOS PROVEEDORES">TODOS LOS PROVEEDORES</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Product Preview Badge (Matches Screenshot 2 "MAX" badge) */}
        <div className="w-16 h-14 bg-white border border-[#a3b4c8] rounded flex flex-col items-center justify-center p-1 shadow-sm shrink-0">
          <div className="text-[11px] font-black italic text-blue-700 bg-gradient-to-r from-amber-300 via-emerald-300 to-rose-400 px-1.5 py-0.5 rounded border border-blue-800">
            MAX
          </div>
          <span className="text-[8px] font-bold text-slate-500 mt-0.5 truncate max-w-full">
            {selectedProduct?.code || '22'}
          </span>
        </div>
      </div>

      {/* GROUP BY HEADER BAR */}
      <div className="bg-[#e7eef6] px-3 py-1 border-b border-[#c0cedd] flex items-center justify-between text-[11px] text-slate-400">
        <span>Arrastre una columna aquí para agrupar por dicha columna</span>
        <Search className="w-3.5 h-3.5 text-slate-500" />
      </div>

      {/* CLASSIC DATA GRID TABLE */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f0f4f9] z-10">
            <tr className="border-b border-[#c5d2e0] text-slate-700 font-normal">
              <th className="w-5 border-r border-[#d5dfe9]" />
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-24">CodProducto</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9]">Descripción</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-24">Unidad</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-24 text-right">Existencia</th>
              {showAdvancedCols && (
                <th className="py-1 px-2 border-r border-[#d5dfe9] w-24 text-right">Costo</th>
              )}
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-28 text-right">Precio de Venta</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-36">Categoría</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-28">Ubicación</th>
              <th className="py-1 px-2 border-r border-[#d5dfe9] w-24">CodRápido</th>
              <th className="py-1 px-2 w-24 text-right">Impuesto %</th>
            </tr>
            {/* Filter Row under headers */}
            <tr className="border-b border-[#c5d2e0] bg-white text-[10px] text-slate-500">
              <td className="border-r border-[#d5dfe9] text-center">▾</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] text-emerald-700 font-bold">⊕</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] text-emerald-700 font-bold">⊕</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              {showAdvancedCols && (
                <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              )}
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] font-mono">=</td>
              <td className="py-0.5 px-1.5 border-r border-[#d5dfe9] text-emerald-700 font-bold">⊕</td>
              <td className="py-0.5 px-1.5 font-mono">=</td>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6ecf2]">
            {filteredProducts.map((p) => {
              const selected = selectedProduct?.id === p.id;
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  onDoubleClick={() => openEditProductDialog(p)}
                  className={`cursor-pointer ${
                    selected ? 'bg-[#fdf0a6] text-slate-900' : 'hover:bg-[#f5f8fc] text-slate-800'
                  }`}
                >
                  <td className="border-r border-[#e6ecf2] text-center text-[9px] text-slate-700">
                    {selected ? '▸' : ''}
                  </td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2]">{p.code}</td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2]">{p.name}</td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2]">{p.unit}</td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2] text-right font-mono">
                    {p.stock.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  {showAdvancedCols && (
                    <td className="py-1 px-2 border-r border-[#e6ecf2] text-right font-mono">
                      C${p.cost.toFixed(2)}
                    </td>
                  )}
                  <td className="py-1 px-2 border-r border-[#e6ecf2] text-right font-mono">
                    C${p.price.toFixed(2)}
                  </td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2] truncate max-w-[140px]">
                    {p.category}
                  </td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2]">{p.location}</td>
                  <td className="py-1 px-2 border-r border-[#e6ecf2]"></td>
                  <td className="py-1 px-2 text-right font-mono">{p.taxRate.toFixed(2)} %</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM DARK NAVY SUMMARY BAR */}
      <div className="bg-[#1c2b42] text-white px-2 py-1 flex items-center justify-between text-[11px] shrink-0">
        <div className="flex items-center gap-1.5">
          <span>Nº</span>
          <span className="bg-[#d8e2ed] text-slate-900 font-semibold px-4 py-0.5 rounded-[2px]">
            {filteredProducts.length}
          </span>
        </div>
        <div className="text-slate-300 text-[10px]">
          Doble clic en cualquier fila para abrir la ventana del producto
        </div>
      </div>

      {/* =====================================================================
       * FLOATING WINDOW: CÓMO CREAR / EDITAR UN PRODUCTO (Matches Screenshot 3)
       * ===================================================================== */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <input
            ref={productImgInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const res = await uploadImageToSupabaseStorage('productos', file, `prod-${form.code || 'item'}`);
                setProductImageUrl(res.url);
                notify(
                  res.fromStorage
                    ? 'Imagen subida al bucket "productos" de Supabase Storage.'
                    : 'Imagen del producto cargada.'
                );
              }
            }}
          />

          <div className="bg-[#d8e2ed] border-2 border-[#7e93ab] shadow-2xl w-full max-w-[780px] text-[11px] text-slate-800">
            {/* Dialog Window Title Bar */}
            <div className="bg-[#cfdbe8] px-2.5 py-1.5 flex items-center justify-between border-b border-[#a5b6ca]">
              <div className="flex items-center gap-1.5 font-normal text-slate-800">
                <img src="/logo.png" alt="" className="w-4 h-4 rounded-full object-contain" />
                <span>PRODUCTO - {form.name || 'NUEVO PRODUCTO'}</span>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-slate-600 hover:text-rose-600 font-bold px-1"
              >
                ✕
              </button>
            </div>

            {/* Dialog Tabs */}
            <div className="px-2 pt-2 flex items-end gap-0.5 border-b border-[#a5b6ca] bg-[#d2deec]">
              {(
                [
                  { id: 'PRODUCTO', label: 'PRODUCTO' },
                  { id: 'KITS', label: 'KITS O PAQUETES' },
                  { id: 'PRECIOS_COMPRA', label: 'PRECIOS DE COMPRA' },
                  { id: 'NOTAS', label: 'NOTAS' },
                  { id: 'CONFIGURACION', label: 'CONFIGURACIÓN' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setDialogTab(t.id)}
                  className={`px-3 py-1 border-t border-x text-[10.5px] ${
                    dialogTab === t.id
                      ? 'bg-[#dce5f0] border-[#96abc0] font-bold text-slate-900 -mb-px'
                      : 'bg-[#c7d5e5] border-transparent text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Dialog Body */}
            <div className="p-3 bg-[#dce5f0] grid grid-cols-12 gap-3">
              {dialogTab === 'PRODUCTO' && (
                <>
                  {/* Left 8 Cols: PRODUCTO, PRECIOS, EXISTENCIA ALMACÉN */}
                  <div className="col-span-12 md:col-span-8 space-y-2.5">
                    {/* Fieldset: PRODUCTO */}
                    <fieldset className="border border-[#b1c0d2] p-2 space-y-2">
                      <legend className="px-1 text-[10px] font-semibold text-slate-700">PRODUCTO</legend>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[9.5px] mb-0.5">CÓDIGO DEL PRODUCTO</label>
                          <input
                            value={form.code}
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">CÓDIGO DE BARRA</label>
                          <input
                            value={form.barcode}
                            onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                            className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">CÓDIGO RÁPIDO</label>
                          <input
                            value={form.quickCode}
                            onChange={(e) => setForm({ ...form, quickCode: e.target.value })}
                            className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5 text-center"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">TIPO DE PRODUCTO</label>
                          <select
                            value={form.productType}
                            onChange={(e) => setForm({ ...form, productType: e.target.value })}
                            className="w-full bg-white border border-[#9eb2c8] px-1 py-0.5"
                          >
                            <option value="PRODUCTO">PRODUCTO</option>
                            <option value="SERVICIO">SERVICIO</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9.5px] mb-0.5">NOMBRE DEL PRODUCTO / SERVICIO</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full bg-white border border-[#9eb2c8] px-2 py-1 font-medium"
                        />
                      </div>
                    </fieldset>

                    {/* Fieldset: PRECIOS (4 Tiers matching Screenshot 3) */}
                    <fieldset className="border border-[#b1c0d2] p-2 space-y-1.5">
                      <legend className="px-1 text-[10px] font-semibold text-slate-700">PRECIOS</legend>
                      <div className="grid grid-cols-12 gap-1 text-[9.5px] text-center font-semibold text-slate-600">
                        <div className="col-span-2">UNIDADES</div>
                        <div className="col-span-2">COSTO</div>
                        <div className="col-span-2">UTILIDAD %</div>
                        <div className="col-span-2">ISV %</div>
                        <div className="col-span-2">PRECIO DE VENTA</div>
                        <div className="col-span-2">UTILIDAD</div>
                      </div>

                      {[
                        { idx: 1, units: 1, priceKey: 'price1' as const },
                        { idx: 2, units: 6, priceKey: 'price2' as const },
                        { idx: 3, units: 12, priceKey: 'price3' as const },
                        { idx: 4, units: 20, priceKey: 'price4' as const },
                      ].map((row) => {
                        const rowPrice = form[row.priceKey];
                        const utilPct = calcUtilityPctNum(rowPrice);
                        const utilAmt = calcUtilityAmtNum(rowPrice);
                        return (
                          <div key={row.idx} className="grid grid-cols-12 gap-1 items-center text-[10.5px]">
                            <div className="col-span-2 flex items-center gap-1">
                              <span className="text-slate-600 w-3">{row.idx}</span>
                              <input
                                readOnly
                                value={row.units}
                                className="w-full bg-[#e6eef7] border border-[#b1c0d2] text-center py-0.5"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.cost}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => setForm({ ...form, cost: Math.max(0, Number(e.target.value) || 0) })}
                                className="w-full bg-white border border-[#9eb2c8] text-center py-0.5"
                                title="Costo unitario del producto"
                              />
                            </div>
                            <div className="col-span-2">
                              <div className="relative flex items-center">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={Number(utilPct.toFixed(2))}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    handleUtilityPctChange(row.priceKey, Number(e.target.value) || 0)
                                  }
                                  className={`w-full bg-white border border-[#9eb2c8] text-center py-0.5 pr-3.5 ${
                                    utilPct < 0 ? 'text-rose-700 font-semibold' : 'text-slate-800'
                                  }`}
                                  title="Escriba el % de utilidad deseado para calcular el Precio de Venta"
                                />
                                <span className="absolute right-1 text-[9px] text-slate-500 pointer-events-none">%</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              {row.idx === 1 ? (
                                <select
                                  value={form.taxRate}
                                  onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                                  className="w-full bg-white border border-[#9eb2c8] text-center py-0.5 font-medium"
                                  title="Seleccionar porcentaje de ISV aplicado al producto"
                                >
                                  <option value={0}>0 %</option>
                                  <option value={15}>15 %</option>
                                  <option value={18}>18 %</option>
                                </select>
                              ) : (
                                <input
                                  readOnly
                                  value={`${form.taxRate.toFixed(2)} %`}
                                  className="w-full bg-[#e6eef7] border border-[#b1c0d2] text-center py-0.5"
                                />
                              )}
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={rowPrice}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  setForm({ ...form, [row.priceKey]: Math.max(0, Number(e.target.value) || 0) })
                                }
                                className="w-full bg-white border border-[#9eb2c8] text-center py-0.5 font-semibold"
                                title="Escriba el Precio de Venta (ISV incluido) para calcular la Utilidad"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                step="0.01"
                                value={Number(utilAmt.toFixed(2))}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  handleUtilityAmtChange(row.priceKey, Number(e.target.value) || 0)
                                }
                                className={`w-full bg-white border border-[#9eb2c8] text-center py-0.5 font-medium ${
                                  utilAmt < 0 ? 'text-rose-700' : 'text-emerald-800'
                                }`}
                                title="Escriba la ganancia neta deseada para calcular el Precio de Venta"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </fieldset>

                    {/* Fieldset: EXISTENCIA ALMACÉN */}
                    <fieldset className="border border-[#b1c0d2] p-2">
                      <legend className="px-1 text-[10px] font-semibold text-slate-700">
                        EXISTENCIA ALMACÉN
                      </legend>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <label className="block text-[9.5px] mb-0.5">EXISTENCIA ACTUAL</label>
                          <input
                            readOnly
                            value={form.currentStock.toFixed(4)}
                            className="w-full bg-[#e6eef7] border border-[#b1c0d2] text-center py-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">EXISTENCIA</label>
                          <input
                            type="number"
                            value={form.addStock}
                            onChange={(e) => setForm({ ...form, addStock: Number(e.target.value) })}
                            className="w-full bg-white border border-[#9eb2c8] text-center py-0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">EXISTENCIA FINAL</label>
                          <input
                            readOnly
                            value={(form.currentStock + form.addStock).toFixed(4)}
                            className="w-full bg-[#e6eef7] border border-[#b1c0d2] text-center py-0.5 font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] mb-0.5">EXISTENCIA MÍNIMA</label>
                          <input
                            type="number"
                            value={form.minStock}
                            onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                            className="w-full bg-white border border-[#9eb2c8] text-center py-0.5"
                          />
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Right 4 Cols: IMAGEN & CATEGORÍAS */}
                  <div className="col-span-12 md:col-span-4 space-y-2.5">
                    <fieldset className="border border-[#b1c0d2] p-2 flex flex-col items-center">
                      <legend className="px-1 text-[10px] font-semibold text-slate-700">IMAGEN</legend>
                      <div className="w-36 h-24 bg-white border border-[#b1c0d2] flex flex-col items-center justify-center p-2 mb-2 overflow-hidden">
                        {productImageUrl ? (
                          <img
                            src={productImageUrl}
                            alt={form.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <>
                            <div className="text-lg font-black italic text-blue-700 bg-gradient-to-r from-amber-300 via-emerald-300 to-rose-400 px-3 py-1 rounded border-2 border-blue-800 shadow">
                              MAX
                            </div>
                            <span className="text-[9px] font-bold text-rose-600 mt-1">PODER XTREME</span>
                          </>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1 w-full text-[9.5px]">
                        <button
                          type="button"
                          onClick={() => {
                            setProductImageUrl('');
                            notify('Imagen del producto eliminada.');
                          }}
                          className="bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] py-0.5"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = productImageUrl || '/logo.png';
                            a.download = `Producto_${form.code}.png`;
                            a.click();
                            notify('Imagen del producto exportada.');
                          }}
                          className="bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] py-0.5"
                        >
                          Exportar
                        </button>
                        <button
                          type="button"
                          onClick={() => productImgInputRef.current?.click()}
                          className="bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] py-0.5"
                        >
                          Buscar
                        </button>
                        <button
                          type="button"
                          onClick={() => productImgInputRef.current?.click()}
                          className="bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] py-0.5"
                        >
                          Imagen
                        </button>
                      </div>
                    </fieldset>

                    <fieldset className="border border-[#b1c0d2] p-2 space-y-1.5">
                      <legend className="px-1 text-[10px] font-semibold text-slate-700">CATEGORÍAS</legend>
                      <div>
                        <label className="block text-[9.5px]">UNIDAD DE MEDIDA</label>
                        <input
                          value={form.unit}
                          onChange={(e) => setForm({ ...form, unit: e.target.value })}
                          className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px]">CATEGORÍA</label>
                        <input
                          value={form.category}
                          onChange={(e) => setForm({ ...form, category: e.target.value })}
                          className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px]">UBICACIÓN EN BODEGA</label>
                        <input
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px]">MARCA DEL PRODUCTO</label>
                        <input
                          value={form.brand}
                          onChange={(e) => setForm({ ...form, brand: e.target.value })}
                          className="w-full bg-white border border-[#9eb2c8] px-1.5 py-0.5"
                        />
                      </div>
                    </fieldset>
                  </div>
                </>
              )}

              {dialogTab === 'KITS' && (
                <div className="col-span-12 space-y-3 min-h-[300px]">
                  <fieldset className="border border-[#b1c0d2] p-3 space-y-2 bg-white">
                    <legend className="px-1 text-[10px] font-bold text-slate-700">
                      ARMADO DE KITS / PAQUETES COMPUESTOS ({form.name || 'NUEVO PRODUCTO'})
                    </legend>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-[9.5px] font-semibold mb-0.5">
                          SELECCIONAR PRODUCTO COMPONENTE
                        </label>
                        <select
                          value={selectedKitComponentId}
                          onChange={(e) => setSelectedKitComponentId(e.target.value)}
                          className="w-full h-7 bg-white border border-[#9eb2c8] px-2"
                        >
                          <option value="">-- Seleccione un producto del inventario --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              [{p.code}] {p.name} (Costo: C${p.cost.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-[9.5px] font-semibold mb-0.5">CANTIDAD</label>
                        <input
                          type="number"
                          min={1}
                          value={kitComponentQty}
                          onChange={(e) => setKitComponentQty(Number(e.target.value) || 1)}
                          className="w-full h-7 bg-white border border-[#9eb2c8] px-2 text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const target = products.find((p) => p.id === selectedKitComponentId);
                          if (!target) {
                            notify('Seleccione un producto para agregar al kit.', 'warning');
                            return;
                          }
                          const updated = [
                            ...kitComponents,
                            {
                              productId: target.id,
                              code: target.code,
                              name: target.name,
                              quantity: kitComponentQty,
                              unitCost: target.cost,
                            },
                          ];
                          setKitComponents(updated);
                          const totalKitCost = updated.reduce(
                            (acc, k) => acc + k.quantity * k.unitCost,
                            0
                          );
                          setForm((prev) => ({ ...prev, cost: Number(totalKitCost.toFixed(2)) }));
                        }}
                        className="h-7 px-3 bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] font-bold"
                      >
                        + Agregar al Kit
                      </button>
                    </div>

                    <table className="w-full border-collapse text-[10.5px] border border-[#c5d2e0] mt-2">
                      <thead className="bg-[#f0f4f9]">
                        <tr>
                          <th className="text-left p-1.5 border-r border-[#c5d2e0]">Código</th>
                          <th className="text-left p-1.5 border-r border-[#c5d2e0]">Producto Componente</th>
                          <th className="text-right p-1.5 border-r border-[#c5d2e0]">Cantidad</th>
                          <th className="text-right p-1.5 border-r border-[#c5d2e0]">Costo Unit.</th>
                          <th className="text-right p-1.5 border-r border-[#c5d2e0]">Subtotal Costo</th>
                          <th className="text-center p-1.5">Quitar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kitComponents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">
                              Este producto no tiene sub-componentes de paquete asignados.
                            </td>
                          </tr>
                        ) : (
                          kitComponents.map((k, idx) => (
                            <tr key={`${k.productId}-${idx}`} className="border-t border-[#e6ecf2]">
                              <td className="p-1.5 border-r border-[#e6ecf2]">{k.code}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2]">{k.name}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2] text-right">{k.quantity}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2] text-right">
                                C${k.unitCost.toFixed(2)}
                              </td>
                              <td className="p-1.5 border-r border-[#e6ecf2] text-right font-bold">
                                C${(k.quantity * k.unitCost).toFixed(2)}
                              </td>
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setKitComponents((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-rose-600 font-bold"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </fieldset>
                </div>
              )}

              {dialogTab === 'PRECIOS_COMPRA' && (
                <div className="col-span-12 space-y-3 min-h-[300px]">
                  <fieldset className="border border-[#b1c0d2] p-3 bg-white space-y-2">
                    <legend className="px-1 text-[10px] font-bold text-slate-700">
                      HISTORIAL DE PRECIOS DE COMPRA Y PROVEEDORES
                    </legend>
                    <div className="grid grid-cols-3 gap-3 bg-[#f0f4f9] p-2 border border-[#c5d2e0]">
                      <div>
                        <span className="text-[9.5px] text-slate-500 block">COSTO ACTUAL REGISTRADO</span>
                        <span className="text-sm font-black text-slate-800">C${form.cost.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 block">PRECIO VENTA 1</span>
                        <span className="text-sm font-black text-emerald-700">C${form.price1.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 block">UTILIDAD NETA ESTIMADA</span>
                        <span className="text-sm font-black text-blue-700">
                          C${calcUtilityAmtNum(form.price1).toFixed(2)} ({calcUtilityPctNum(form.price1).toFixed(2)} %)
                        </span>
                      </div>
                    </div>

                    <table className="w-full border-collapse text-[10.5px] border border-[#c5d2e0]">
                      <thead className="bg-[#f0f4f9]">
                        <tr>
                          <th className="text-left p-1.5 border-r border-[#c5d2e0]">Fecha</th>
                          <th className="text-left p-1.5 border-r border-[#c5d2e0]">Factura Compra</th>
                          <th className="text-left p-1.5 border-r border-[#c5d2e0]">Proveedor</th>
                          <th className="text-right p-1.5 border-r border-[#c5d2e0]">Cantidad</th>
                          <th className="text-right p-1.5 border-r border-[#c5d2e0]">Costo Unitario</th>
                          <th className="text-right p-1.5">Total Línea</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productPurchaseHistory.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-slate-400">
                              No se registran facturas de compra previas para este código de producto.
                            </td>
                          </tr>
                        ) : (
                          productPurchaseHistory.map((row, idx) => (
                            <tr key={idx} className="border-t border-[#e6ecf2]">
                              <td className="p-1.5 border-r border-[#e6ecf2]">{row.date}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2]">{row.documentNumber}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2]">{row.supplierName}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2] text-right">{row.quantity}</td>
                              <td className="p-1.5 border-r border-[#e6ecf2] text-right font-semibold">
                                C${row.unitCost.toFixed(2)}
                              </td>
                              <td className="p-1.5 text-right font-bold">C${row.total.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </fieldset>
                </div>
              )}

              {dialogTab === 'NOTAS' && (
                <div className="col-span-12 space-y-2 min-h-[300px]">
                  <fieldset className="border border-[#b1c0d2] p-3 bg-white space-y-2">
                    <legend className="px-1 text-[10px] font-bold text-slate-700">
                      NOTAS Y OBSERVACIONES DEL PRODUCTO
                    </legend>
                    <textarea
                      value={productNotes}
                      onChange={(e) => setProductNotes(e.target.value)}
                      placeholder="Escriba aquí especificaciones técnicas, observaciones de lote, instrucciones de almacenamiento o notas para los vendedores..."
                      className="w-full h-56 border border-[#9eb2c8] p-2.5 text-xs resize-none focus:outline-none focus:border-blue-600"
                    />
                  </fieldset>
                </div>
              )}

              {dialogTab === 'CONFIGURACION' && (
                <div className="col-span-12 space-y-3 min-h-[300px]">
                  <fieldset className="border border-[#b1c0d2] p-3 bg-white space-y-3">
                    <legend className="px-1 text-[10px] font-bold text-slate-700">
                      PARÁMETROS AVANZADOS Y VENCIMIENTO DEL PRODUCTO
                    </legend>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold mb-0.5">
                          PROVEEDOR PRINCIPAL ASIGNADO
                        </label>
                        <select
                          value={form.supplierId}
                          onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                          className="w-full h-7 bg-white border border-[#9eb2c8] px-2"
                        >
                          {suppliers.length === 0 ? (
                            <option value="sup-1">PROVEEDOR GENERAL</option>
                          ) : (
                            suppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold mb-0.5">
                          FECHA DE VENCIMIENTO (OPCIONAL)
                        </label>
                        <input
                          type="date"
                          value={form.expirationDate}
                          onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                          className="w-full h-7 bg-white border border-[#9eb2c8] px-2"
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold mb-0.5">
                          EXISTENCIA MÁXIMA PERMITIDA
                        </label>
                        <input
                          type="number"
                          value={form.maxStock}
                          onChange={(e) => setForm({ ...form, maxStock: Number(e.target.value) })}
                          className="w-full h-7 bg-white border border-[#9eb2c8] px-2 text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e6ecf2]">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={(e) => setForm({ ...form, active: e.target.checked })}
                        />
                        <span>Producto Activo y Disponible para Facturación</span>
                      </label>
                      <div>
                        <label className="block text-[9.5px] font-bold mb-0.5">TASA DE IMPUESTO ISV (%)</label>
                        <select
                          value={form.taxRate}
                          onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
                          className="w-40 h-7 bg-white border border-[#9eb2c8] px-2 font-semibold"
                        >
                          <option value={0}>0% (EXENTO)</option>
                          <option value={15}>15% (ISV ESTÁNDAR)</option>
                          <option value={18}>18% (ISV ESPECIAL)</option>
                        </select>
                      </div>
                    </div>
                  </fieldset>
                </div>
              )}

              {/* Bottom Dialog Buttons */}
              <div className="col-span-12 flex items-center justify-between pt-1 border-t border-[#b1c0d2]">
                <button
                  type="button"
                  onClick={openNewProductDialog}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] text-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>Limpiar</span>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveProduct(false)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 text-sky-700" />
                    <span>Guardar y Nuevo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => saveProduct(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e4ebf3] hover:bg-[#d5e0ed] border border-[#9eb2c8] font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 text-blue-800" />
                    <span>Guardar y Cerrar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: SUCURSALES / HISTORIAL / ETIQUETAS */}
      {subModal && (
        <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center p-4">
          <div className="bg-[#d8e2ed] border-2 border-[#7e93ab] shadow-2xl w-full max-w-lg p-4 space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[#a5b6ca] pb-2 font-bold">
              <span>
                {subModal === 'SUCURSALES' &&
                  `Existencia en Sucursales — ${selectedProduct?.name || 'Inventario General'}`}
                {subModal === 'HISTORIAL' &&
                  `Historial Kardex — ${selectedProduct?.name || 'Sin producto seleccionado'}`}
                {subModal === 'ETIQUETAS' &&
                  `Impresión de Etiquetas — ${selectedProduct?.name || 'Catálogo'}`}
              </span>
              <button onClick={() => setSubModal(null)} className="px-2 py-0.5 bg-white border">
                ✕
              </button>
            </div>
            {subModal === 'SUCURSALES' && (
              <div className="bg-white p-3 border space-y-2">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="bg-[#f0f4f9] border-b border-[#c5d2e0]">
                    <tr>
                      <th className="text-left p-1.5">Sucursal / Bodega</th>
                      <th className="text-left p-1.5">Ubicación</th>
                      <th className="text-right p-1.5">Existencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, idx) => (
                      <tr key={c.id} className="border-b border-[#e6ecf2]">
                        <td className="p-1.5 font-semibold">{c.name}</td>
                        <td className="p-1.5">{selectedProduct?.location || 'GENERAL'}</td>
                        <td className="p-1.5 text-right font-mono font-bold">
                          {idx === 0 ? (selectedProduct?.stock || 0).toFixed(2) : '0.00'}{' '}
                          {selectedProduct?.unit || 'UND'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {subModal === 'HISTORIAL' && (
              <div className="bg-white p-3 border space-y-2 max-h-64 overflow-y-auto">
                <div className="flex justify-between font-bold text-slate-800 border-b pb-1.5">
                  <span>EXISTENCIA ACTUAL: {selectedProduct?.stock.toFixed(2) || '0.00'} UND</span>
                  <span>COSTO: C${selectedProduct?.cost.toFixed(2) || '0.00'}</span>
                </div>
                {(selectedProduct?.history || []).length === 0 ? (
                  <div className="text-slate-500 py-3 text-center">
                    No hay movimientos históricos adicionales registrados para este producto.
                  </div>
                ) : (
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead className="bg-[#f0f4f9]">
                      <tr>
                        <th className="text-left p-1">Fecha</th>
                        <th className="text-left p-1">Tipo</th>
                        <th className="text-left p-1">Ref</th>
                        <th className="text-right p-1">Cant.</th>
                        <th className="text-right p-1">Nuevo Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct?.history.map((h) => (
                        <tr key={h.id} className="border-t">
                          <td className="p-1">{h.date}</td>
                          <td className="p-1 font-semibold">{h.type}</td>
                          <td className="p-1">{h.documentRef}</td>
                          <td className="p-1 text-right">{h.quantity}</td>
                          <td className="p-1 text-right font-bold">{h.newStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
            {subModal === 'ETIQUETAS' && (
              <div className="bg-white p-4 border text-center space-y-2">
                <div className="font-bold">{selectedProduct?.name || 'PRODUCTO'}</div>
                <div className="font-mono tracking-[4px] bg-black text-white py-1 px-3 inline-block">
                  ||| || |||| ||| ||
                </div>
                <div className="font-mono text-xs">
                  {selectedProduct?.barcode || selectedProduct?.code || '000001'}
                </div>
                <div className="font-bold text-base">
                  C${(selectedProduct?.price || 0).toFixed(2)}
                </div>
                <button
                  onClick={() => {
                    if (!selectedProduct) {
                      notify('Seleccione un producto para imprimir etiqueta.');
                      return;
                    }
                    printProductLabel(selectedProduct);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-[#1c2b42] text-white"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Etiqueta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
