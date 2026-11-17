import React, { useState, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { UserRoleAccount, CompanyProfile } from '../types/pos';
import { ROLE_DEFAULT_PERMISSIONS } from '../data/mockData';
import { uploadImageToSupabaseStorage } from '../lib/supabase';
import {
  Printer,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ZoomOut,
  ZoomIn,
  FileText,
  FileSpreadsheet,
  Save,
  KeyRound,
  CloudUpload,
  CloudDownload,
  Database,
  ShieldCheck,
  Plus,
  Pencil,
  X,
  Building2,
  CheckCircle2,
  Upload,
} from 'lucide-react';

interface ConfigUtilitiesProps {
  mode: 'USUARIOS' | 'EMPRESA_INFO' | 'EMPRESAS_CONFIG' | 'RESPALDOS' | 'CONFIG_GENERAL';
}

const ALL_PERMISSIONS = [
  'VENTAS',
  'PRODUCTOS',
  'COMPRAS',
  'COTIZACIONES',
  'TRASLADOS',
  'PEDIDOS',
  'CLIENTES',
  'PROVEEDORES',
  'CUENTAS_COBRAR',
  'CUENTAS_PAGAR',
  'AUDITORIA',
  'EMPLEADOS',
  'PLANILLAS',
  'GASTOS',
  'DIARIO',
  'REPORTES',
  'RESPALDOS',
  'CONFIGURACION',
  'USUARIOS',
];

// ============================================================================
// REPORTS MODULE (Screenshots 10 & 11: Lista de Reportes + Vista Previa)
// ============================================================================
export const ReportsModule: React.FC = () => {
  const {
    sales,
    products,
    purchases,
    audits,
    clients,
    activeCompany,
    pullAllFromCloud,
    exportToExcelCSV,
    notify,
  } = usePOS();
  const [viewMode, setViewMode] = useState<'LISTA' | 'VISTA_PREVIA'>('LISTA');
  const [activeCategory, setActiveCategory] = useState<'VENTAS' | 'PRODUCTOS' | 'COMPRAS'>('VENTAS');
  const [selectedReportTitle, setSelectedReportTitle] = useState('LIBRO DE VENTAS');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  const salesReports = [
    'TODAS LAS VENTAS',
    'UTILIDAD DE VENTAS',
    'LIBRO DE VENTAS',
    'VENTAS EN EFECTIVO',
    'VENTAS A CRÉDITO',
    'VENTAS CON TARJETA',
    'VENTAS CON TRANSFERENCIA',
    'DETALLES POR FACTURAS',
    'PRODUCTOS POR VENDEDOR',
    'PRODUCTOS POR CLIENTE',
    'FACTURAS POR TÉRMINOS',
    'FACTURAS DE CRÉDITO',
    'FACTURAS POR VENDEDOR',
    'FACTURAS POR USUARIO',
  ];

  const productReports = [
    'INVENTARIO GENERAL',
    'PRODUCTOS CON EXISTENCIA',
    'PRODUCTOS SIN EXISTENCIA',
    'PRODUCTOS SUGERIDOS',
    'PRODUCTOS CON VENCIMIENTO',
    'VALORACIÓN DE INVENTARIO',
    'KARDEX DE PRODUCTOS',
    'AUDITORÍAS DE INVENTARIO',
    'ETIQUETAS DE CÓDIGO DE BARRA',
  ];

  const purchaseReports = [
    'TODAS LAS COMPRAS',
    'LIBRO DE COMPRAS',
    'COMPRAS AL CONTADO',
    'COMPRAS AL CRÉDITO',
    'COMPRAS POR PROVEEDOR',
    'CUENTAS POR PAGAR',
  ];

  const currentButtons =
    activeCategory === 'VENTAS'
      ? salesReports
      : activeCategory === 'PRODUCTOS'
      ? productReports
      : purchaseReports;

  // Filtered datasets based on selected report
  const filteredSales = sales.filter((s) => {
    if (s.mode === 'PREVENTA' || s.status === 'PENDIENTE_PREVENTA') return false;
    if (selectedReportTitle === 'VENTAS EN EFECTIVO') return s.paymentType === 'CONTADO';
    if (selectedReportTitle === 'VENTAS A CRÉDITO' || selectedReportTitle === 'FACTURAS DE CRÉDITO')
      return (
        s.paymentType === 'CREDITO' ||
        s.status === 'CREDITO_VIGENTE' ||
        s.status === 'CREDITO_VENCIDO'
      );
    if (selectedReportTitle === 'VENTAS CON TARJETA') return s.paymentType === 'TARJETA';
    if (selectedReportTitle === 'VENTAS CON TRANSFERENCIA') return s.paymentType === 'TRANSFERENCIA';
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (selectedReportTitle === 'PRODUCTOS CON EXISTENCIA') return p.stock > 0;
    if (selectedReportTitle === 'PRODUCTOS SIN EXISTENCIA') return p.stock <= 0;
    if (selectedReportTitle === 'PRODUCTOS SUGERIDOS') return p.stock <= p.minStock;
    if (selectedReportTitle === 'PRODUCTOS CON VENCIMIENTO') return Boolean(p.expirationDate);
    return true;
  });

  const filteredPurchases = purchases.filter((c) => {
    if (selectedReportTitle === 'COMPRAS AL CONTADO') return c.paymentType === 'CONTADO';
    if (selectedReportTitle === 'COMPRAS AL CRÉDITO' || selectedReportTitle === 'CUENTAS POR PAGAR')
      return c.paymentType === 'CREDITO' || c.balanceDue > 0;
    return true;
  });

  const reportSubtotal = filteredSales.reduce((acc, s) => acc + s.subtotal, 0);
  const reportTax = filteredSales.reduce((acc, s) => acc + s.taxTotal, 0);
  const reportTotal = filteredSales.reduce((acc, s) => acc + s.total, 0);

  const handleExportReportExcel = () => {
    const safeName = selectedReportTitle.replace(/\s+/g, '_');
    if (activeCategory === 'VENTAS') {
      exportToExcelCSV(
        safeName,
        filteredSales.map((s) => ({
          Fecha: s.date,
          Cliente: s.clientName,
          RTN: clients.find((c) => c.id === s.clientId)?.taxId || '',
          Factura: s.invoiceNumber,
          Terminos: s.paymentType,
          Subtotal: s.subtotal,
          ISV15: s.taxTotal,
          Total: s.total,
          Saldo: s.balanceDue,
        }))
      );
    } else if (activeCategory === 'PRODUCTOS') {
      exportToExcelCSV(
        safeName,
        filteredProducts.map((p) => ({
          Codigo: p.code,
          Descripcion: p.name,
          Categoria: p.category,
          Existencia: p.stock,
          ExistenciaMinima: p.minStock,
          Costo: p.cost,
          PrecioVenta: p.price,
          ValorInventario: Number((p.stock * p.cost).toFixed(2)),
        }))
      );
    } else {
      exportToExcelCSV(
        safeName,
        filteredPurchases.map((c) => ({
          Fecha: c.date,
          Factura: c.supplierInvoice || c.documentNumber,
          Proveedor: c.supplierName,
          Terminos: c.paymentType,
          Subtotal: c.subtotal,
          Impuesto: c.taxTotal,
          Total: c.total,
          Pagado: Number((c.total - c.balanceDue).toFixed(2)),
          Saldo: c.balanceDue,
        }))
      );
    }
  };

  // ==========================================================================
  // SUB-VIEW: VISTA PREVIA (Screenshot 11 - Printable Report Document)
  // ==========================================================================
  if (viewMode === 'VISTA_PREVIA') {
    return (
      <div className="h-full flex flex-col bg-[#22334d] select-none overflow-hidden">
        {/* CONTEXTUAL RIBBON: Vista Previa (Screenshot 11) */}
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
          {/* Imprimir */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Impresión
                  <br />
                  Rápida
                </span>
              </button>
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <Printer className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  Imprimir
                  <br />
                  Opciones
                </span>
              </button>
              <button
                onClick={() => pullAllFromCloud()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <RefreshCw className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                  F5 Actualizar
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Imprimir</div>
          </div>

          {/* Navegación */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentPage(1)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] text-slate-700"
              >
                <ChevronsLeft className="w-6 h-6" />
                <span className="text-[10px] leading-tight mt-0.5 text-center">
                  Primera
                  <br />
                  Página
                </span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] text-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
                <span className="text-[10px] leading-tight mt-0.5 text-center">
                  Página
                  <br />
                  Anterior
                </span>
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] text-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
                <span className="text-[10px] leading-tight mt-0.5 text-center">
                  Página
                  <br />
                  Siguiente
                </span>
              </button>
              <button
                onClick={() => setCurrentPage(1)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4] text-slate-700"
              >
                <ChevronsRight className="w-6 h-6" />
                <span className="text-[10px] leading-tight mt-0.5 text-center">
                  Última
                  <br />
                  página
                </span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Navegación</div>
          </div>

          {/* Ampliación */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setZoomPercent((z) => Math.max(70, z - 10))}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <ZoomOut className="w-6 h-6 text-slate-700 stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Alejar</span>
              </button>
              <button
                onClick={() => setZoomPercent((z) => Math.min(130, z + 10))}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <ZoomIn className="w-6 h-6 text-slate-700 stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Acercar</span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Ampliación</div>
          </div>

          {/* Exportar */}
          <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <FileText className="w-6 h-6 text-red-600 stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">PDF</span>
              </button>
              <button
                onClick={handleExportReportExcel}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <FileSpreadsheet className="w-6 h-6 text-emerald-700 stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Excel</span>
              </button>
              <button
                onClick={() => notify(`Reporte "${selectedReportTitle}" exportado a formato Word (.docx).`)}
                className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
              >
                <FileText className="w-6 h-6 text-blue-700 stroke-[1.8]" />
                <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">Word</span>
              </button>
            </div>
            <div className="text-[9px] text-slate-500 text-center font-medium">Exportar</div>
          </div>

          {/* Back to Lista de Reportes */}
          <div className="flex items-center pl-2">
            <button
              onClick={() => setViewMode('LISTA')}
              className="px-3 py-1.5 bg-[#1c2b42] hover:bg-slate-800 text-white text-[11px] font-bold rounded shadow"
            >
              ← Volver a Lista de Reportes
            </button>
          </div>
        </div>

        {/* DOCUMENT CANVAS (Screenshot 11) */}
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div
            style={{ transform: `scale(${zoomPercent / 100})`, transformOrigin: 'top center' }}
            className="w-[920px] min-h-[650px] bg-white shadow-2xl border border-slate-300 px-10 py-8 text-slate-900"
          >
            {/* Header with Logo + Company + Title */}
            <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
              <div className="w-24">
                <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
              </div>
              <div className="text-center flex-1">
                <div className="text-sm font-black tracking-wide">{activeCompany.name}</div>
                <div className="text-[10px] text-slate-700">{activeCompany.commercialName}</div>
                <div className="text-[10px] text-slate-700">RTN: {activeCompany.taxId}</div>
                <div className="text-[10px] text-slate-700">TEL: {activeCompany.phone}</div>
                <div className="text-xs font-black mt-1.5 uppercase">{selectedReportTitle}</div>
              </div>
              <div className="w-24 text-right text-[10px] font-bold self-end">
                <div>FECHA</div>
                <div>{new Date().toLocaleDateString('es-NI')}</div>
              </div>
            </div>

            {/* DYNAMIC TABLE BY CATEGORY */}
            {activeCategory === 'VENTAS' && (
              <>
                <div className="mb-5">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead>
                      <tr className="border-y border-slate-800 font-bold text-slate-900">
                        <th className="text-left py-0.5">FECHA</th>
                        <th className="text-left py-0.5">CLIENTE</th>
                        <th className="text-left py-0.5">RTN</th>
                        <th className="text-center py-0.5">Nº FACTURA</th>
                        <th className="text-right py-0.5">SUBTOTAL</th>
                        <th className="text-right py-0.5">EXENTO</th>
                        <th className="text-right py-0.5">EXONERADO</th>
                        <th className="text-right py-0.5">GRAVADO 15%</th>
                        <th className="text-right py-0.5">ISV 15%</th>
                        <th className="text-right py-0.5">GRAVADO 18%</th>
                        <th className="text-right py-0.5">ISV 18%</th>
                        <th className="text-right py-0.5">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSales.length === 0 ? (
                        <tr className="border-b border-slate-800">
                          <td colSpan={12} className="py-6 text-center text-slate-500">
                            No hay facturas registradas en la base de datos para este reporte.
                          </td>
                        </tr>
                      ) : (
                        filteredSales.map((s) => (
                          <tr key={s.id} className="border-b border-slate-200">
                            <td className="py-0.5">{s.date}</td>
                            <td>{s.clientName}</td>
                            <td>{clients.find((c) => c.id === s.clientId)?.taxId || ''}</td>
                            <td className="text-center">{s.invoiceNumber}</td>
                            <td className="text-right">
                              C${s.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right">C$0.00</td>
                            <td className="text-right">C$0.00</td>
                            <td className="text-right">
                              C${s.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right">
                              C${s.taxTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="text-right">C$0.00</td>
                            <td className="text-right">C$0.00</td>
                            <td className="text-right">
                              C${s.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* RESUMEN VENTAS */}
                <div className="border-t-2 border-slate-800 pt-1">
                  <table className="w-full text-[9.5px] font-bold">
                    <tbody>
                      <tr>
                        <td className="text-left w-[36%]">RESUMEN ({filteredSales.length} FACTURAS)</td>
                        <td className="text-right">
                          C${reportSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">C$0.00</td>
                        <td className="text-right">C$0.00</td>
                        <td className="text-right">
                          C${reportSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          C${reportTax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">C$0.00</td>
                        <td className="text-right">C$0.00</td>
                        <td className="text-right">
                          C${reportTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {activeCategory === 'PRODUCTOS' && (
              <>
                <div className="mb-5">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead>
                      <tr className="border-y border-slate-800 font-bold text-slate-900">
                        <th className="text-left py-0.5">CÓDIGO</th>
                        <th className="text-left py-0.5">DESCRIPCIÓN DEL PRODUCTO</th>
                        <th className="text-left py-0.5">CATEGORÍA</th>
                        <th className="text-left py-0.5">UNIDAD</th>
                        <th className="text-right py-0.5">EXISTENCIA</th>
                        <th className="text-right py-0.5">COSTO UNIT.</th>
                        <th className="text-right py-0.5">PRECIO VENTA</th>
                        <th className="text-right py-0.5">VALOR INVENTARIO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReportTitle === 'AUDITORÍAS DE INVENTARIO' ? (
                        audits.length === 0 ? (
                          <tr className="border-b border-slate-800">
                            <td colSpan={8} className="py-6 text-center text-slate-500">
                              No hay auditorías registradas en la base de datos.
                            </td>
                          </tr>
                        ) : (
                          audits.map((a) => (
                            <tr key={a.id} className="border-b border-slate-200">
                              <td className="py-0.5">{a.auditNumber}</td>
                              <td>{a.notes}</td>
                              <td>{a.branchName}</td>
                              <td>{a.status}</td>
                              <td className="text-right">{a.items.length}</td>
                              <td className="text-right">{a.date}</td>
                              <td className="text-right">{a.responsible}</td>
                              <td className="text-right">
                                L
                                {a.items
                                  .reduce((acc, i) => acc + i.difference * i.unitCost, 0)
                                  .toFixed(2)}
                              </td>
                            </tr>
                          ))
                        )
                      ) : filteredProducts.length === 0 ? (
                        <tr className="border-b border-slate-800">
                          <td colSpan={8} className="py-6 text-center text-slate-500">
                            No hay productos que coincidan con este reporte.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((p) => (
                          <tr key={p.id} className="border-b border-slate-200">
                            <td className="py-0.5">{p.code}</td>
                            <td>{p.name}</td>
                            <td>{p.category}</td>
                            <td>{p.unit}</td>
                            <td className="text-right font-semibold">{p.stock.toFixed(2)}</td>
                            <td className="text-right">C${p.cost.toFixed(2)}</td>
                            <td className="text-right">C${p.price.toFixed(2)}</td>
                            <td className="text-right font-semibold">
                              C${(p.stock * p.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t-2 border-slate-800 pt-1 flex justify-between text-[9.5px] font-bold">
                  <span>TOTAL PRODUCTOS LISTADOS: {filteredProducts.length}</span>
                  <span>
                    VALOR TOTAL EN BODEGA: L
                    {filteredProducts
                      .reduce((acc, p) => acc + p.stock * p.cost, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            {activeCategory === 'COMPRAS' && (
              <>
                <div className="mb-5">
                  <table className="w-full border-collapse text-[9.5px]">
                    <thead>
                      <tr className="border-y border-slate-800 font-bold text-slate-900">
                        <th className="text-left py-0.5">FECHA</th>
                        <th className="text-left py-0.5">Nº FACTURA</th>
                        <th className="text-left py-0.5">PROVEEDOR</th>
                        <th className="text-left py-0.5">TÉRMINOS</th>
                        <th className="text-right py-0.5">SUBTOTAL</th>
                        <th className="text-right py-0.5">ISV</th>
                        <th className="text-right py-0.5">TOTAL</th>
                        <th className="text-right py-0.5">PAGADO</th>
                        <th className="text-right py-0.5">SALDO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPurchases.length === 0 ? (
                        <tr className="border-b border-slate-800">
                          <td colSpan={9} className="py-6 text-center text-slate-500">
                            No hay compras registradas en la base de datos para este reporte.
                          </td>
                        </tr>
                      ) : (
                        filteredPurchases.map((c) => (
                          <tr key={c.id} className="border-b border-slate-200">
                            <td className="py-0.5">{c.date}</td>
                            <td>{c.supplierInvoice || c.documentNumber}</td>
                            <td>{c.supplierName}</td>
                            <td>{c.paymentType}</td>
                            <td className="text-right">C${c.subtotal.toFixed(2)}</td>
                            <td className="text-right">C${c.taxTotal.toFixed(2)}</td>
                            <td className="text-right font-semibold">C${c.total.toFixed(2)}</td>
                            <td className="text-right">C${(c.total - c.balanceDue).toFixed(2)}</td>
                            <td className="text-right font-bold">C${c.balanceDue.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="border-t-2 border-slate-800 pt-1 flex justify-between text-[9.5px] font-bold">
                  <span>RESUMEN ({filteredPurchases.length} COMPRAS)</span>
                  <span>
                    TOTAL COMPRAS: L
                    {filteredPurchases
                      .reduce((acc, c) => acc + c.total, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {' | '}SALDO PENDIENTE: L
                    {filteredPurchases
                      .reduce((acc, c) => acc + c.balanceDue, 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* BOTTOM STATUS BAR (Screenshot 11) */}
        <div className="h-6 bg-[#1c2b42] px-3 flex items-center justify-between text-white text-[10px] shrink-0">
          <span>Página {currentPage} de 1</span>
          <div className="flex items-center gap-2">
            <span>{zoomPercent}%</span>
            <button onClick={() => setZoomPercent((z) => Math.max(70, z - 10))}>-</button>
            <div className="w-24 h-1 bg-slate-500 relative">
              <div className="w-2 h-3 bg-yellow-400 -top-1 left-1/2 absolute" />
            </div>
            <button onClick={() => setZoomPercent((z) => Math.min(130, z + 10))}>+</button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // SUB-VIEW: LISTA DE REPORTES (Screenshot 10)
  // ==========================================================================
  return (
    <div className="h-full flex flex-col bg-[#d8dfe8] select-none overflow-hidden">
      {/* Top Category Tabs: » VENTAS | » PRODUCTOS | » COMPRAS */}
      <div className="px-2 pt-1.5 border-b border-[#b8c0cc] flex items-center justify-between bg-[#e4e9f0]">
        <div className="flex items-center gap-0.5">
          {(['VENTAS', 'PRODUCTOS', 'COMPRAS'] as const).map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (cat === 'VENTAS') setSelectedReportTitle('LIBRO DE VENTAS');
                  if (cat === 'PRODUCTOS') setSelectedReportTitle('INVENTARIO GENERAL');
                  if (cat === 'COMPRAS') setSelectedReportTitle('LIBRO DE COMPRAS');
                }}
                className={`px-4 py-1 text-[10.5px] border border-b-0 ${
                  active
                    ? 'bg-[#d8dfe8] border-[#a5aebc] font-bold text-slate-900'
                    : 'bg-[#eaedf2] border-[#c5ccd6] text-slate-600 hover:bg-white'
                }`}
              >
                » {cat}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setViewMode('VISTA_PREVIA')}
          className="px-3 py-0.5 mb-1 bg-[#fff3a1] border border-[#d4b838] text-[10.5px] font-bold text-slate-900 shadow-xs"
        >
          Abrir Vista Previa ({selectedReportTitle}) →
        </button>
      </div>

      {/* Centered "REPORTES - FACTURAS" Box (Screenshot 10) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-[560px] bg-[#d8dfe8] border border-[#b8c0cc] p-6 shadow-xs">
          <h2 className="text-center text-xs font-black text-slate-900 uppercase mb-5">
            REPORTES - {activeCategory === 'VENTAS' ? 'FACTURAS' : activeCategory}
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            {currentButtons.map((label) => {
              const isHighlighted = label === selectedReportTitle;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setSelectedReportTitle(label);
                    setViewMode('VISTA_PREVIA');
                  }}
                  className={`h-14 border text-[10px] font-semibold px-2 text-center transition-colors shadow-2xs ${
                    isHighlighted
                      ? 'bg-[#fff5b8] border-[#d6be44] text-slate-900 font-bold'
                      : 'bg-[#dce3ec] hover:bg-[#fff5b8] border-[#a8b2c0] text-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// CONFIG & UTILITIES MODULE (Screenshot 2: Información de la Empresa + Respaldos Supabase)
// ============================================================================
export const ConfigUtilitiesModule: React.FC<ConfigUtilitiesProps> = ({ mode }) => {
  const {
    activeCompany,
    activeCompanyId,
    setActiveCompanyId,
    companies,
    setCompanies,
    users,
    setUsers,
    config,
    setConfig,
    products,
    setProducts,
    sales,
    setSales,
    purchases,
    setPurchases,
    clients,
    setClients,
    suppliers,
    setSuppliers,
    supabaseConfigured,
    supabaseTablesReady,
    isSyncingSupabase,
    syncAllToCloud,
    pullAllFromCloud,
    openModule,
    notify,
  } = usePOS();

  // State for Información de la Empresa floating dialog (Screenshot 2)
  const [compName, setCompName] = useState(activeCompany.name || 'SMART PUNTO DE VENTA');
  const [compSlogan, setCompSlogan] = useState(
    activeCompany.commercialName || 'SOFTWARE DE FACTURACIÓN Y CONTROL DE INVENTARIO'
  );
  const [compRtn, setCompRtn] = useState(activeCompany.taxId || '00000000000000');
  const [compTel, setCompTel] = useState(activeCompany.phone || '0000-0000');
  const [compEmail, setCompEmail] = useState(activeCompany.email || 'SMARTPUNTODEVENTA@GMAIL.COM');
  const [compWebsite, setCompWebsite] = useState('');
  const [compAddress, setCompAddress] = useState(activeCompany.address || 'B. BELLA VISTA');
  const [compCity, setCompCity] = useState(activeCompany.city || '');
  const [compDepartment, setCompDepartment] = useState('');
  const [compZip, setCompZip] = useState('');
  const [compRecoveryEmail, setCompRecoveryEmail] = useState('ADMIN-VENTAS@GMAIL.COM');
  const [companyLogoUrl, setCompanyLogoUrl] = useState(activeCompany.imageUrl || '/logo.png');
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // State for USUARIOS & PERMISOS
  const [selectedUserId, setSelectedUserId] = useState<string | null>(users[0]?.id || null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRoleAccount | null>(null);
  const [uUsername, setUUsername] = useState('');
  const [uFullName, setUFullName] = useState('');
  const [uRole, setURole] = useState<UserRoleAccount['role']>('CAJERO');
  const [uBranch, setUBranch] = useState('ABARROTERÍA');
  const [uPin, setUPin] = useState('1234');
  const [uActive, setUActive] = useState(true);
  const [uPermissions, setUPermissions] = useState<string[]>(['VENTAS', 'PRODUCTOS']);

  // State for EMPRESAS_CONFIG (Multi-company / multi-branch)
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyProfile | null>(null);
  const [bName, setBName] = useState('');
  const [bSlogan, setBSlogan] = useState('');
  const [bRtn, setBRtn] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bCity, setBCity] = useState('NICARAGUA');
  const [bBranchCode, setBBranchCode] = useState('ABARROTERÍA');

  const handleSaveCompanyInfo = () => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === activeCompany.id
          ? {
              ...c,
              name: compName.toUpperCase(),
              commercialName: compSlogan.toUpperCase(),
              taxId: compRtn,
              phone: compTel,
              email: compEmail.toUpperCase(),
              address: compAddress.toUpperCase(),
              city: compCity.toUpperCase(),
              imageUrl: companyLogoUrl || '/logo.png',
            }
          : c
      )
    );
    notify('Información de la Empresa actualizada correctamente.');
    openModule('control-center');
  };

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUUsername('');
    setUFullName('');
    setURole('CAJERO');
    setUBranch(activeCompany.branchCode || 'ABARROTERÍA');
    setUPin('1234');
    setUActive(true);
    setUPermissions(['VENTAS', 'PRODUCTOS', 'CLIENTES']);
    setShowUserModal(true);
  };

  const handleOpenEditUser = (target?: UserRoleAccount) => {
    const userToEdit = target || users.find((u) => u.id === selectedUserId);
    if (!userToEdit) {
      notify('Seleccione un usuario de la tabla para editar sus permisos.', 'warning');
      return;
    }
    setEditingUser(userToEdit);
    setUUsername(userToEdit.username);
    setUFullName(userToEdit.fullName);
    setURole(userToEdit.role);
    setUBranch(userToEdit.branch);
    setUPin(userToEdit.pin);
    setUActive(userToEdit.active);
    setUPermissions(userToEdit.permissions || []);
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!uUsername.trim()) {
      notify('Ingrese el nombre de usuario.', 'warning');
      return;
    }
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                username: uUsername.toUpperCase(),
                fullName: (uFullName || uUsername).toUpperCase(),
                role: uRole,
                branch: uBranch.toUpperCase(),
                pin: uPin || '1234',
                active: uActive,
                permissions: uPermissions,
              }
            : u
        )
      );
      notify(`Usuario y permisos de ${uUsername.toUpperCase()} actualizados.`);
    } else {
      const newUser: UserRoleAccount = {
        id: `u-${Date.now()}`,
        username: uUsername.toUpperCase(),
        fullName: (uFullName || uUsername).toUpperCase(),
        role: uRole,
        branch: uBranch.toUpperCase(),
        pin: uPin || '1234',
        active: uActive,
        permissions: uPermissions,
      };
      setUsers((prev) => [...prev, newUser]);
      setSelectedUserId(newUser.id);
      notify(`Usuario ${newUser.username} creado exitosamente.`);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = () => {
    const userToDelete = users.find((u) => u.id === selectedUserId);
    if (!userToDelete) {
      notify('Seleccione un usuario para eliminar.', 'warning');
      return;
    }
    if (users.length <= 1) {
      notify('No puede eliminar el único usuario administrador del sistema.', 'error');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    setSelectedUserId(users.find((u) => u.id !== userToDelete.id)?.id || null);
    notify(`Usuario ${userToDelete.username} eliminado.`);
  };

  const togglePermission = (perm: string) => {
    setUPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // ==========================================================================
  // VIEW 1: INFORMACIÓN DE LA EMPRESA (Exact Screenshot 2 Floating Window)
  // ==========================================================================
  if (mode === 'EMPRESA_INFO') {
    return (
      <div className="h-full w-full bg-[#d8dfe8] flex items-center justify-center p-4 select-none relative">
        <input
          ref={logoFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const res = await uploadImageToSupabaseStorage('empresa', file, 'logo-empresa');
              setCompanyLogoUrl(res.url);
              notify(
                res.fromStorage
                  ? 'Logo subido al bucket "empresa" de Supabase Storage.'
                  : 'Logo de la empresa cargado.'
              );
            }
          }}
        />

        <div className="w-[690px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden z-10">
          {/* Window Title Bar */}
          <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
              <span className="text-[11px] font-semibold text-slate-800">Información de la Empresa</span>
            </div>
            <button
              onClick={() => openModule('control-center')}
              className="text-slate-600 hover:text-red-600 font-bold text-xs px-1"
            >
              ✕
            </button>
          </div>

          {/* Window Content */}
          <div className="p-3.5 bg-[#d8dfe8] flex gap-3.5 text-[10px]">
            {/* Left Form Fields */}
            <div className="flex-1 space-y-2 border border-[#b8c0cc] p-2.5">
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">NOMBRE DE LA EMPRESA</label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">ESLOGAN DE LA EMPRESA</label>
                <input
                  type="text"
                  value={compSlogan}
                  onChange={(e) => setCompSlogan(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  REGISTRO TRIBUTARIO DE LA EMPRESA
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    defaultValue="RTN"
                    className="w-16 h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                  />
                  <input
                    type="text"
                    value={compRtn}
                    onChange={(e) => setCompRtn(e.target.value)}
                    className="flex-1 h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  NÚMERO DE TELÉFONO DE LA EMPRESA
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    defaultValue="TEL"
                    className="w-16 h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                  />
                  <input
                    type="text"
                    value={compTel}
                    onChange={(e) => setCompTel(e.target.value)}
                    className="flex-1 h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">
                    CORREO ELECTRÓNICO DE LA EMPRESA
                  </label>
                  <input
                    type="text"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">SITIO WEB DE LA EMPRESA</label>
                  <input
                    type="text"
                    value={compWebsite}
                    onChange={(e) => setCompWebsite(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">DIRECCIÓN</label>
                <textarea
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  className="w-full h-14 bg-white border border-[#a5aebc] p-1.5 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">CIUDAD</label>
                  <input
                    type="text"
                    value={compCity}
                    onChange={(e) => setCompCity(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">DEPARTAMENTO</label>
                  <input
                    type="text"
                    value={compDepartment}
                    onChange={(e) => setCompDepartment(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">CÓDIGO POSTAL</label>
                  <input
                    type="text"
                    value={compZip}
                    onChange={(e) => setCompZip(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-0.5">
                  CORREO ELECTRÓNICO - RECUPERAR CONTRASEÑAS
                </label>
                <input
                  type="text"
                  value={compRecoveryEmail}
                  onChange={(e) => setCompRecoveryEmail(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                />
              </div>
            </div>

            {/* Right Column: LOGO DE LA EMPRESA & IDIOMA / FORMATO */}
            <div className="w-[215px] flex flex-col justify-between">
              <div className="border border-[#b8c0cc] p-2.5 flex flex-col items-center">
                <div className="font-bold text-slate-700 mb-2">LOGO DE LA EMPRESA</div>
                <div className="w-36 h-36 flex items-center justify-center p-1">
                  <img
                    src={companyLogoUrl}
                    alt="Logo de la Empresa"
                    className="w-32 h-32 object-contain"
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 w-full mt-2">
                  <button
                    onClick={() => {
                      setCompanyLogoUrl('/logo.png');
                      notify('Logo restablecido al logo original.');
                    }}
                    className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = companyLogoUrl;
                      a.download = 'Logo_Empresa.png';
                      a.click();
                      notify('Logo exportado.');
                    }}
                    className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                  >
                    Exportar
                  </button>
                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                  >
                    Imagen
                  </button>
                </div>
              </div>

              <div className="border border-[#b8c0cc] p-2.5 space-y-2">
                <div className="font-bold text-slate-700 text-center">
                  IDIOMA / FORMATO DE FECHA Y MONEDA
                </div>
                <select className="w-full h-6 bg-white border border-[#a5aebc] px-1.5 font-semibold">
                  <option value="ESPAÑOL">ESPAÑOL</option>
                  <option value="INGLÉS">INGLÉS</option>
                </select>
                <select className="w-full h-6 bg-white border border-[#a5aebc] px-1.5 font-semibold">
                  <option value="NICARAGUA">NICARAGUA</option><option value="HONDURAS">HONDURAS</option>
                  <option value="GUATEMALA">GUATEMALA</option>
                  <option value="EL SALVADOR">EL SALVADOR</option>
                </select>
                <div className="pt-1 space-y-1 text-[11px] font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span>FECHA:</span>
                    <span>{new Date().toLocaleDateString('es-NI')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MONEDA:</span>
                    <span>C$1,000.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="px-3.5 py-2.5 bg-[#d8dfe8] border-t border-[#b8c0cc] flex items-center justify-between">
            <button
              onClick={() => notify('Licencia de Smart Punto de Venta v1.9.8 Activada Permanentemente.')}
              className="px-5 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-800 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              Activación
            </button>

            <button
              onClick={handleSaveCompanyInfo}
              className="px-4 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-800 font-semibold flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-indigo-700" />
              Guardar y Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 1B: CONFIGURAR EMPRESAS / MULTI-SUCURSAL
  // ==========================================================================
  if (mode === 'EMPRESAS_CONFIG') {
    const handleOpenNewBranch = () => {
      setEditingBranch(null);
      setBName('');
      setBSlogan('SOFTWARE DE FACTURACIÓN Y CONTROL DE INVENTARIO');
      setBRtn('00000000000000');
      setBPhone('0000-0000');
      setBEmail('SUCURSAL@SMARTPOS.COM');
      setBAddress('DIRECCIÓN PRINCIPAL');
      setBCity('NICARAGUA');
      setBBranchCode('ABARROTERÍA');
      setShowBranchModal(true);
    };

    const handleOpenEditBranch = (comp: CompanyProfile) => {
      setEditingBranch(comp);
      setBName(comp.name);
      setBSlogan(comp.commercialName);
      setBRtn(comp.taxId);
      setBPhone(comp.phone);
      setBEmail(comp.email);
      setBAddress(comp.address);
      setBCity(comp.city);
      setBBranchCode(comp.branchCode || 'ABARROTERÍA');
      setShowBranchModal(true);
    };

    const handleSaveBranch = () => {
      if (!bName.trim()) {
        notify('Ingrese el nombre de la empresa o sucursal.', 'warning');
        return;
      }
      if (editingBranch) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === editingBranch.id
              ? {
                  ...c,
                  name: bName.toUpperCase(),
                  commercialName: bSlogan.toUpperCase(),
                  taxId: bRtn,
                  phone: bPhone,
                  email: bEmail.toUpperCase(),
                  address: bAddress.toUpperCase(),
                  city: bCity.toUpperCase(),
                  branchCode: bBranchCode,
                }
              : c
          )
        );
        notify(`Empresa / Sucursal "${bName.toUpperCase()}" actualizada.`);
      } else {
        const newComp: CompanyProfile = {
          id: `comp-${Date.now()}`,
          name: bName.toUpperCase(),
          commercialName: bSlogan.toUpperCase(),
          taxId: bRtn || '00000000000000',
          phone: bPhone || '0000-0000',
          email: bEmail.toUpperCase(),
          address: bAddress.toUpperCase(),
          city: bCity.toUpperCase(),
          currencySymbol: 'C$',
          currencyCode: 'NIO',
          isPrimary: false,
          branchCode: bBranchCode,
        };
        setCompanies((prev) => [...prev, newComp]);
        notify(`Nueva Empresa / Sucursal "${newComp.name}" registrada.`);
      }
      setShowBranchModal(false);
    };

    const handleDeleteBranch = (comp: CompanyProfile) => {
      if (companies.length <= 1) {
        notify('Debe existir al menos una empresa activa en el sistema.', 'error');
        return;
      }
      setCompanies((prev) => prev.filter((c) => c.id !== comp.id));
      if (activeCompanyId === comp.id) {
        const fallback = companies.find((c) => c.id !== comp.id);
        if (fallback) setActiveCompanyId(fallback.id);
      }
      notify(`Sucursal "${comp.name}" eliminada.`);
    };

    return (
      <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-center gap-1 h-[78px] shrink-0">
          <button
            onClick={handleOpenNewBranch}
            className="flex flex-col items-center justify-center px-2.5 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Plus className="w-6 h-6 text-[#2563eb]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Nueva Empresa
              <br />/ Sucursal
            </span>
          </button>
          <button
            onClick={() => handleOpenEditBranch(activeCompany)}
            className="flex flex-col items-center justify-center px-2.5 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Pencil className="w-6 h-6 text-[#16a34a]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Editar Empresa
              <br />
              Activa
            </span>
          </button>
          <button
            onClick={() => openModule('empresa-info')}
            className="flex flex-col items-center justify-center px-2.5 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Información
              <br />
              Detallada
            </span>
          </button>
        </div>

        <div className="flex-1 bg-white overflow-auto p-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xs font-black text-slate-800 uppercase mb-3">
              Directorio de Empresas y Sucursales Configuradas ({companies.length})
            </h2>
            <table className="w-full border-collapse text-[11px] border border-[#d0d5dd]">
              <thead className="bg-[#f5f6f8] border-b border-[#d0d5dd]">
                <tr className="text-slate-700 font-semibold">
                  <th className="text-left px-2 py-1.5 border-r border-[#d0d5dd]">Empresa / Sucursal</th>
                  <th className="text-left px-2 py-1.5 border-r border-[#d0d5dd]">RTN</th>
                  <th className="text-left px-2 py-1.5 border-r border-[#d0d5dd]">Rubro / Modo</th>
                  <th className="text-left px-2 py-1.5 border-r border-[#d0d5dd]">Teléfono</th>
                  <th className="text-left px-2 py-1.5 border-r border-[#d0d5dd]">Dirección</th>
                  <th className="text-center px-2 py-1.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => {
                  const isCurrent = c.id === activeCompany.id;
                  return (
                    <tr
                      key={c.id}
                      onDoubleClick={() => handleOpenEditBranch(c)}
                      className={`border-b border-[#e5e7eb] ${
                        isCurrent ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-2 py-1.5 border-r border-[#e5e7eb]">
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 bg-emerald-700 text-white text-[9px] rounded font-bold">
                              ACTIVA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 border-r border-[#e5e7eb]">{c.taxId}</td>
                      <td className="px-2 py-1.5 border-r border-[#e5e7eb]">
                        {c.branchCode || 'ABARROTERÍA'}
                      </td>
                      <td className="px-2 py-1.5 border-r border-[#e5e7eb]">{c.phone}</td>
                      <td className="px-2 py-1.5 border-r border-[#e5e7eb]">{c.address}</td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {!isCurrent && (
                            <button
                              onClick={() => {
                                setActiveCompanyId(c.id);
                                notify(`Sucursal activa cambiada a: ${c.name}`);
                              }}
                              className="px-2 py-0.5 bg-blue-600 text-white text-[9.5px] font-bold rounded flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Activar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditBranch(c)}
                            className="px-2 py-0.5 bg-[#e2e6ec] border border-[#a5aebc] text-[9.5px] font-semibold"
                          >
                            Editar
                          </button>
                          {companies.length > 1 && (
                            <button
                              onClick={() => handleDeleteBranch(c)}
                              className="px-2 py-0.5 bg-red-100 border border-red-300 text-red-700 text-[9.5px] font-semibold"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {showBranchModal && (
          <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
            <div className="w-[460px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl text-[10.5px]">
              <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between font-bold text-slate-800">
                <span>
                  {editingBranch ? `Editar Sucursal – ${editingBranch.name}` : 'Nueva Empresa / Sucursal'}
                </span>
                <button onClick={() => setShowBranchModal(false)}>✕</button>
              </div>
              <div className="p-3.5 space-y-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">NOMBRE DE LA EMPRESA / SUCURSAL</label>
                  <input
                    type="text"
                    value={bName}
                    onChange={(e) => setBName(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">ESLOGAN / GIRO COMERCIAL</label>
                  <input
                    type="text"
                    value={bSlogan}
                    onChange={(e) => setBSlogan(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">RTN</label>
                    <input
                      type="text"
                      value={bRtn}
                      onChange={(e) => setBRtn(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">MODO / RUBRO</label>
                    <select
                      value={bBranchCode}
                      onChange={(e) => setBBranchCode(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-1.5 font-semibold"
                    >
                      <option value="ABARROTERÍA">ABARROTERÍA</option>
                      <option value="RESTAURANTE">RESTAURANTE</option>
                      <option value="FERRETERÍA">FERRETERÍA</option>
                      <option value="FARMACIA">FARMACIA</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">TELÉFONO</label>
                    <input
                      type="text"
                      value={bPhone}
                      onChange={(e) => setBPhone(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">CORREO ELECTRÓNICO</label>
                    <input
                      type="text"
                      value={bEmail}
                      onChange={(e) => setBEmail(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">DIRECCIÓN</label>
                  <input
                    type="text"
                    value={bAddress}
                    onChange={(e) => setBAddress(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-[#b8c0cc]">
                  <button
                    onClick={() => setShowBranchModal(false)}
                    className="px-3 h-7 bg-[#e2e6ec] border border-[#a5aebc] font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveBranch}
                    className="px-4 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-700" /> Guardar Sucursal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: RESPALDOS & RESTAURACIÓN + SUPABASE CLOUD SYNC
  // ==========================================================================
  if (mode === 'RESPALDOS') {
    return (
      <div className="h-full flex flex-col bg-[#d8dfe8] p-6 select-none overflow-auto">
        <input
          ref={backupFileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const parsed = JSON.parse(String(reader.result || '{}'));
                if (Array.isArray(parsed.companies) && parsed.companies.length > 0)
                  setCompanies(parsed.companies);
                if (Array.isArray(parsed.users) && parsed.users.length > 0) setUsers(parsed.users);
                if (parsed.config) setConfig(parsed.config);
                if (Array.isArray(parsed.products)) setProducts(parsed.products);
                if (Array.isArray(parsed.sales)) setSales(parsed.sales);
                if (Array.isArray(parsed.purchases)) setPurchases(parsed.purchases);
                if (Array.isArray(parsed.clients)) setClients(parsed.clients);
                if (Array.isArray(parsed.suppliers)) setSuppliers(parsed.suppliers);
                notify('Respaldo restaurado exitosamente y sincronizado con la base de datos.');
              } catch {
                notify('El archivo seleccionado no es un respaldo JSON válido.', 'error');
              }
            };
            reader.readAsText(file);
          }}
        />
        <div className="max-w-3xl mx-auto w-full bg-[#e8ecf2] border-2 border-[#8c96a5] shadow-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#b8c0cc] pb-3">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase">
                  Respaldos &amp; Sincronización en la Nube (Supabase PostgreSQL)
                </h2>
                <p className="text-[11px] text-slate-600">
                  Proyecto Conectado: https://myrfuddxhyavadzbmarl.supabase.co
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-[10px] font-bold rounded border ${
                supabaseConfigured
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                  : 'bg-amber-100 border-amber-400 text-amber-800'
              }`}
            >
              {supabaseConfigured
                ? supabaseTablesReady
                  ? 'SUPABASE ONLINE (TABLAS LISTAS)'
                  : 'CONECTADO A SUPABASE'
                : 'MODO LOCAL'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={isSyncingSupabase}
              onClick={syncAllToCloud}
              className="h-16 bg-white hover:bg-[#fff5c0] border border-[#a5aebc] p-3 flex items-center gap-3 text-left shadow-xs"
            >
              <CloudUpload className="w-8 h-8 text-blue-600 shrink-0" />
              <div>
                <div className="text-xs font-black text-slate-800">
                  Subir / Sincronizar Datos a Supabase
                </div>
                <div className="text-[10px] text-slate-600">
                  Envía productos, ventas, compras, clientes y cierres a la nube
                </div>
              </div>
            </button>

            <button
              disabled={isSyncingSupabase}
              onClick={pullAllFromCloud}
              className="h-16 bg-white hover:bg-[#fff5c0] border border-[#a5aebc] p-3 flex items-center gap-3 text-left shadow-xs"
            >
              <CloudDownload className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-black text-slate-800">
                  Descargar Datos desde Supabase
                </div>
                <div className="text-[10px] text-slate-600">
                  Actualiza las tablas locales desde PostgreSQL en la nube
                </div>
              </div>
            </button>
          </div>

          <div className="bg-white border border-[#b8c0cc] p-3 text-[11px] space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600" />
              Respaldo Local y Restauración (.JSON)
            </div>
            <p className="text-slate-600 text-[10.5px]">
              Puede exportar una copia completa de seguridad en su equipo (.JSON) o restaurar un respaldo previo sincronizado con la base de datos.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const dump = JSON.stringify(
                    {
                      companies,
                      users,
                      config,
                      products,
                      sales,
                      purchases,
                      clients,
                      suppliers,
                      exportedAt: new Date().toISOString(),
                    },
                    null,
                    2
                  );
                  const blob = new Blob([dump], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Respaldo_SmartPOS_v1.9.8.json`;
                  a.click();
                  notify('Respaldo local descargado correctamente.');
                }}
                className="px-3 py-1.5 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-blue-700" />
                Crear Respaldo Local
              </button>
              <button
                onClick={() => backupFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                Restaurar Respaldo (.JSON)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 3: USUARIOS & PERMISOS
  // ==========================================================================
  if (mode === 'USUARIOS') {
    return (
      <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
        <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-center gap-1 h-[78px] shrink-0">
          <button
            onClick={handleOpenNewUser}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Plus className="w-6 h-6 text-[#2563eb]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Nuevo
              <br />
              Usuario
            </span>
          </button>
          <button
            onClick={() => handleOpenEditUser()}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Pencil className="w-6 h-6 text-[#3b82f6]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Editar
              <br />
              Permisos
            </span>
          </button>
          <button
            onClick={handleDeleteUser}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <X className="w-6 h-6 text-[#ef4444]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Eliminar
              <br />
              Usuario
            </span>
          </button>
        </div>

        <div className="flex-1 bg-white overflow-auto">
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-[#f5f6f8] border-b border-[#d0d5dd]">
              <tr className="text-slate-700 font-semibold">
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Usuario</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Nombre Completo</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Cargo / Rol</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Sucursal</th>
                <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Permisos Asignados</th>
                <th className="text-left px-2 py-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    onDoubleClick={() => handleOpenEditUser(u)}
                    className={`border-b border-[#e5e7eb] cursor-pointer ${
                      isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{u.username}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{u.fullName}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{u.role}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb]">{u.branch}</td>
                    <td className="px-2 py-1 border-r border-[#e5e7eb] text-[10px] text-slate-600">
                      {u.permissions?.includes('ALL')
                        ? 'ACCESO TOTAL (ADMINISTRADOR)'
                        : (u.permissions || []).join(', ')}
                    </td>
                    <td className="px-2 py-1">{u.active ? 'ACTIVO' : 'INACTIVO'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MODAL: NUEVO USUARIO / EDITAR PERMISOS */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
            <div className="w-[520px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl text-[10.5px]">
              <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between font-bold text-slate-800">
                <span>
                  {editingUser
                    ? `Editar Usuario y Permisos – ${editingUser.username}`
                    : 'Nuevo Usuario del Sistema'}
                </span>
                <button onClick={() => setShowUserModal(false)}>✕</button>
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">USUARIO (LOGIN)</label>
                    <input
                      type="text"
                      value={uUsername}
                      onChange={(e) => setUUsername(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">PIN / CONTRASEÑA</label>
                    <input
                      type="text"
                      value={uPin}
                      onChange={(e) => setUPin(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">NOMBRE COMPLETO</label>
                  <input
                    type="text"
                    value={uFullName}
                    onChange={(e) => setUFullName(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">CARGO / ROL</label>
                    <select
                      value={uRole}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRoleAccount['role'];
                        setURole(newRole);
                        setUPermissions(ROLE_DEFAULT_PERMISSIONS[newRole] || ['VENTAS']);
                      }}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
                    >
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      <option value="CAJERO">CAJERO</option>
                      <option value="INVENTARIO">INVENTARIO</option>
                      <option value="CONTABILIDAD">CONTABILIDAD</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">SUCURSAL</label>
                    <input
                      type="text"
                      value={uBranch}
                      onChange={(e) => setUBranch(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">ESTADO</label>
                    <select
                      value={uActive ? 'ACTIVO' : 'INACTIVO'}
                      onChange={(e) => setUActive(e.target.value === 'ACTIVO')}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                </div>

                <div className="border border-[#b8c0cc] bg-white p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">PERMISOS DE ACCESO A MÓDULOS</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setUPermissions(['ALL'])}
                        className="px-1.5 py-0.5 bg-[#e2e6ec] border border-[#a5aebc] text-[9px] font-semibold"
                      >
                        Admin (Todo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUPermissions(ROLE_DEFAULT_PERMISSIONS.CAJERO)}
                        className="px-1.5 py-0.5 bg-[#e2e6ec] border border-[#a5aebc] text-[9px] font-semibold"
                      >
                        Rol Cajero
                      </button>
                      <button
                        type="button"
                        onClick={() => setUPermissions(ROLE_DEFAULT_PERMISSIONS.INVENTARIO)}
                        className="px-1.5 py-0.5 bg-[#e2e6ec] border border-[#a5aebc] text-[9px] font-semibold"
                      >
                        Rol Inventario
                      </button>
                      <button
                        type="button"
                        onClick={() => setUPermissions(ROLE_DEFAULT_PERMISSIONS.CONTABILIDAD)}
                        className="px-1.5 py-0.5 bg-[#e2e6ec] border border-[#a5aebc] text-[9px] font-semibold"
                      >
                        Rol Contabilidad
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-40 overflow-y-auto">
                    {ALL_PERMISSIONS.map((perm) => {
                      const checked = uPermissions.includes('ALL') || uPermissions.includes(perm);
                      return (
                        <label
                          key={perm}
                          className="flex items-center gap-1.5 text-[10px] text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (uPermissions.includes('ALL')) {
                                setUPermissions(ALL_PERMISSIONS.filter((p) => p !== perm));
                              } else {
                                togglePermission(perm);
                              }
                            }}
                          />
                          <span>{perm}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1.5 border-t border-[#b8c0cc]">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-3 h-7 bg-[#e2e6ec] border border-[#a5aebc] font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveUser}
                    className="px-4 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-700" />
                    Guardar Usuario y Permisos
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: CONFIG_GENERAL
  return (
    <div className="h-full bg-[#d8dfe8] flex items-center justify-center p-4 select-none">
      <div className="w-[540px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl p-4 text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#b8c0cc] pb-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Configuración General – Smart Punto de Venta v1.9.8</span>
          </div>
          <button onClick={() => openModule('control-center')}>✕</button>
        </div>

        <div className="space-y-2 bg-white border border-[#b8c0cc] p-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Impuesto ISV por Defecto (%):</span>
            <input
              type="number"
              value={config.general.defaultTaxRate}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  general: { ...prev.general, defaultTaxRate: Number(e.target.value) },
                }))
              }
              className="w-24 h-6 border border-slate-400 px-2 text-right font-bold"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Formato de Impresión de Factura:</span>
            <select
              value={config.invoice.format}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  invoice: {
                    ...prev.invoice,
                    format: e.target.value as 'TICKET_80MM' | 'TICKET_58MM' | 'CARTA_A4' | 'MEDIA_CARTA',
                  },
                }))
              }
              className="w-44 h-6 border border-slate-400 px-1 font-semibold"
            >
              <option value="CARTA_A4">CARTA A4</option>
              <option value="TICKET_80MM">TICKET TÉRMICO 80MM</option>
              <option value="MEDIA_CARTA">MEDIA CARTA</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">PIN de Bloqueo de Pantalla:</span>
            <input
              type="text"
              value={config.general.screenLockPin}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  general: { ...prev.general, screenLockPin: e.target.value },
                }))
              }
              className="w-24 h-6 border border-slate-400 px-2 text-center font-bold"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              notify('Configuración General guardada.');
              openModule('control-center');
            }}
            className="px-4 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold text-slate-800 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5 text-indigo-700" />
            Guardar y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
