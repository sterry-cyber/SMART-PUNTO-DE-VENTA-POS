import React, { useState, useRef } from 'react';
import { usePOS } from '../context/POSContext';
import { Client, Supplier } from '../types/pos';
import { uploadImageToSupabaseStorage } from '../lib/supabase';
import {
  Plus,
  Pencil,
  X,
  RefreshCw,
  Check,
  Database,
  Image as ImageIcon,
  Eraser,
  Search,
  Users,
  Save,
  RotateCcw,
} from 'lucide-react';

// ============================================================================
// CLIENTS MODULE (Screenshots 12 & 13)
// ============================================================================
export const ClientsModule: React.FC = () => {
  const { clients, setClients, pullAllFromCloud, exportToExcelCSV, notify } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('cli-0');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientPhotoUrl, setClientPhotoUrl] = useState<string>('');
  const clientPhotoInputRef = useRef<HTMLInputElement>(null);

  // Dialog form fields ("Cómo registrar un cliente")
  const [formCode, setFormCode] = useState('1');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formTerms, setFormTerms] = useState('CONTADO');
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRtn, setFormRtn] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formCountry, setFormCountry] = useState('NICARAGUA');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formPostalCode, setFormPostalCode] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formMaxCredit, setFormMaxCredit] = useState('C$0.00');
  const [formNote, setFormNote] = useState('');
  const [priceWithIva, setPriceWithIva] = useState(false);
  const [priceWithoutIva, setPriceWithoutIva] = useState(true);
  const [priceTierSelect, setPriceTierSelect] = useState('PRECIO DE VENTA 1');

  const filteredClients = clients.filter((c) => {
    if (!showDisabled && !c.enabled) return false;
    if (
      searchQuery.trim() &&
      !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.code.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const openClientDialog = (cli?: Client) => {
    const target = cli || clients.find((c) => c.id === selectedClientId) || clients[0];
    if (target) {
      setEditingClient(target);
      setFormCode(target.code);
      setFormEnabled(target.enabled);
      setFormTerms(target.creditDays === 30 ? '30 DIAS' : target.creditDays === 15 ? '15 DIAS' : 'CONTADO');
      setFormName(target.name);
      setFormAddress(target.address);
      setFormPhone(target.phone);
      setFormRtn(target.taxId);
      setFormEmail(target.email);
      setFormMaxCredit(`C${target.creditLimit.toFixed(2)}`);
      setPriceTierSelect(target.priceTier === 'MAYORISTA' ? 'PRECIO DE VENTA 3' : 'PRECIO DE VENTA 1');
      setClientPhotoUrl(target.imageUrl || '');
    }
    setModalOpen(true);
  };

  const handleSaveClient = (closeAfter: boolean) => {
    if (!formName.trim()) {
      notify('Ingrese el nombre del cliente.');
      return;
    }
    const creditDays =
      formTerms === '60 DIAS'
        ? 60
        : formTerms === '30 DIAS'
        ? 30
        : formTerms === '15 DIAS'
        ? 15
        : 0;
    const numericCredit = parseFloat(formMaxCredit.replace(/[^0-9.]/g, '')) || 0;
    const priceTier: Client['priceTier'] =
      priceTierSelect === 'PRECIO DE VENTA 3' ? 'MAYORISTA' : 'DETALLE';

    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                code: formCode,
                name: formName.toUpperCase(),
                address: formAddress,
                phone: formPhone,
                taxId: formRtn,
                email: formEmail,
                creditDays,
                creditLimit: numericCredit,
                priceTier,
                enabled: formEnabled,
                imageUrl: clientPhotoUrl || undefined,
              }
            : c
        )
      );
      notify(`Cliente "${formName.toUpperCase()}" guardado correctamente.`);
    } else {
      const created: Client = {
        id: `cli-${Date.now()}`,
        code: formCode || String(clients.length + 1),
        name: formName.toUpperCase(),
        taxId: formRtn,
        phone: formPhone,
        email: formEmail,
        address: formAddress,
        creditLimit: numericCredit,
        currentBalance: 0,
        creditDays,
        priceTier,
        enabled: formEnabled,
        avatarOptimized: true,
        imageUrl: clientPhotoUrl || undefined,
      };
      setClients((prev) => [...prev, created]);
      setSelectedClientId(created.id);
      notify(`Cliente "${created.name}" registrado.`);
    }

    if (closeAfter) {
      setModalOpen(false);
    } else {
      setEditingClient(null);
      setFormCode(String(clients.length + 1));
      setFormName('');
      setFormAddress('');
      setFormPhone('');
      setFormRtn('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden relative">
      <input
        ref={clientPhotoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const res = await uploadImageToSupabaseStorage('clientes', file, `cli-${formCode || 'avatar'}`);
            setClientPhotoUrl(res.url);
            notify(
              res.fromStorage
                ? 'Fotografía subida al bucket "clientes" de Supabase Storage.'
                : 'Fotografía del cliente cargada.'
            );
          }
        }}
      />

      {/* CONTEXTUAL RIBBON: Clientes (Screenshot 12) */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        {/* Group: Clientes */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => {
                setEditingClient(null);
                setFormCode(String(clients.length));
                setFormName('');
                setFormAddress('');
                setFormPhone('');
                setFormRtn('');
                setClientPhotoUrl('');
                setModalOpen(true);
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Plus className="w-6 h-6 text-[#2563eb] stroke-[2.4]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Nuevo
                <br />
                Cliente
              </span>
            </button>
            <button
              onClick={() => openClientDialog()}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Editar
                <br />
                Cliente
              </span>
            </button>
            <button
              onClick={() => {
                if (selectedClientId === 'cli-0') {
                  notify('El cliente CONSUMIDOR FINAL no puede ser eliminado.', 'warning');
                  return;
                }
                setClients((prev) => prev.filter((c) => c.id !== selectedClientId));
                notify('Cliente eliminado.');
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Eliminar
                <br />
                Cliente
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Clientes</div>
        </div>

        {/* Actualizar */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
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
          <div className="text-[9px] text-slate-500 text-center font-medium">Actualizar</div>
        </div>

        {/* Mostrar Deshabilitados */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() => setShowDisabled((v) => !v)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded ${
              showDisabled ? 'bg-[#fff3a1] border border-[#e2c94c]' : 'hover:bg-[#dce6f4]'
            }`}
          >
            <div className="w-6 h-6 bg-[#64748b] rounded-sm flex items-center justify-center">
              <Check className="w-4 h-4 text-white stroke-[2.8]" />
            </div>
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Mostrar Clientes
              <br />
              Deshabilitados
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Mostrar Desh...</div>
        </div>

        {/* Importar & Exportar */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() =>
              exportToExcelCSV(
                'Clientes',
                filteredClients.map((c) => ({
                  Codigo: c.code,
                  Cliente: c.name,
                  Telefono: c.phone,
                  Terminos: c.creditDays > 0 ? `${c.creditDays} DIAS` : 'CONTADO',
                  Saldo: c.currentBalance,
                }))
              )
            }
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <RefreshCw className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Importar &amp;
              <br />
              Exportar Clientes
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Importar &amp; E...</div>
        </div>

        {/* Transferencia */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() => notify('Transferencia de clientes entre sucursales completada.')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Database className="w-6 h-6 text-[#eab308] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Transferencia
              <br />
              de Clientes
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Transfere...</div>
        </div>

        {/* Optimizar Imágenes */}
        <div className="flex flex-col justify-between pr-2 shrink-0">
          <button
            onClick={() => {
              setClients((prev) => prev.map((c) => ({ ...c, avatarOptimized: true })));
              notify('Imágenes de clientes optimizadas correctamente.');
            }}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <ImageIcon className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Optimizar
              <br />
              Imágenes
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Optimiza...</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-[#e8ecf2] px-3 py-2 flex items-center gap-4 border-b border-[#c6cbd2] shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-700 uppercase">
            BUSCAR CLIENTE POR NOMBRE O CÓDIGO
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

      {/* GROUP BY BAR */}
      <div className="bg-[#f0f2f5] border-b border-[#c6cbd2] px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span>Arrastre una columna aquí para agrupar por dicha columna</span>
        <Search className="w-3.5 h-3.5 text-slate-500" />
      </div>

      {/* DEVEXPRESS DATA GRID (Screenshot 12) */}
      <div className="flex-1 bg-white overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f5f6f8] z-10">
            <tr className="border-b border-[#d0d5dd] text-slate-700 font-semibold">
              <th className="w-5 border-r border-[#d0d5dd]" />
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-20">CodCliente</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Cliente</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-32">Teléfono</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-40">Contacto</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-32">Tel Contacto</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">Términos</th>
              <th className="text-right px-2 py-1 w-28">Saldo Pendiente</th>
            </tr>
            <tr className="border-b border-[#d0d5dd] bg-white text-[10px] text-slate-500">
              <td className="border-r border-[#d0d5dd] text-center">▼</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd] text-emerald-700 font-bold">⊕</td>
              <td className="px-1.5 py-0.5 border-r border-[#d0d5dd]">=</td>
              <td className="px-1.5 py-0.5">=</td>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((c) => {
              const isSelected = c.id === selectedClientId;
              const terms =
                c.creditDays === 60
                  ? '60 DIAS'
                  : c.creditDays === 30
                  ? '30 DIAS'
                  : c.creditDays === 15
                  ? '15 DIAS'
                  : 'CONTADO';
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  onDoubleClick={() => openClientDialog(c)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-center">{c.code}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{c.name}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{c.phone}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]" />
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]" />
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{terms}</td>
                  <td className="px-2 py-0.5 text-right">
                    C${c.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTTOM DARK NAVY BAR */}
      <div className="h-7 bg-[#1c2b42] px-3 flex items-center justify-between text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold">Nº</span>
          <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
            {filteredClients.length}
          </div>
        </div>
      </div>

      {/* FLOATING WINDOW: Cliente ("Cómo registrar un cliente" - Screenshot 13) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4">
          <div className="w-[620px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden">
            {/* Title bar */}
            <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                <span className="text-[11px] font-semibold text-slate-800">Cliente</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-600 hover:text-red-600 font-bold text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-3 bg-[#d8dfe8] flex gap-3 text-[10px]">
              {/* Left Fields */}
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="font-bold text-slate-700">CÓDIGO</label>
                      <label className="flex items-center gap-1 font-bold text-slate-700">
                        HABILITADO
                        <input
                          type="checkbox"
                          checked={formEnabled}
                          onChange={(e) => setFormEnabled(e.target.checked)}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-full h-6 bg-[#d0d7e2] border border-[#a5aebc] px-2 text-center font-bold"
                    />
                  </div>
                  <div className="col-span-7">
                    <label className="font-bold text-slate-700 block mb-0.5">TÉRMINOS</label>
                    <div className="flex gap-1">
                      <select
                        value={formTerms}
                        onChange={(e) => setFormTerms(e.target.value)}
                        className="flex-1 h-6 bg-white border border-[#a5aebc] px-1"
                      >
                        <option value="CONTADO">CONTADO</option>
                        <option value="15 DIAS">15 DIAS</option>
                        <option value="30 DIAS">30 DIAS</option>
                        <option value="60 DIAS">60 DIAS</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const next =
                            formTerms === 'CONTADO'
                              ? '15 DIAS'
                              : formTerms === '15 DIAS'
                              ? '30 DIAS'
                              : formTerms === '30 DIAS'
                              ? '60 DIAS'
                              : 'CONTADO';
                          setFormTerms(next);
                          notify(`Términos cambiados a ${next}.`);
                        }}
                        className="px-2 h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-slate-700"
                      >
                        Términos
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">NOMBRE</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">DIRECCIÓN</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">TELÉFONO</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">RTN</label>
                    <input
                      type="text"
                      value={formRtn}
                      onChange={(e) => setFormRtn(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5">CORREO</label>
                    <input
                      type="text"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <label className="font-bold text-slate-700 block mb-0.5">NOMBRE DEL CONTACTO</label>
                    <input
                      type="text"
                      value={formContactName}
                      onChange={(e) => setFormContactName(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="font-bold text-slate-700 block mb-0.5">CIUDAD</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="font-bold text-slate-700 block mb-0.5">PAÍS</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-6">
                    <label className="font-bold text-slate-700 block mb-0.5">TELÉFONO DEL CONTACTO</label>
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="font-bold text-slate-700 block mb-0.5">DEPARTAMENTO</label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="font-bold text-slate-700 block mb-0.5">CÓDIGO POSTAL</label>
                    <input
                      type="text"
                      value={formPostalCode}
                      onChange={(e) => setFormPostalCode(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-9">
                    <label className="font-bold text-slate-700 block mb-0.5">CORREO DEL CONTACTO</label>
                    <input
                      type="text"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="font-bold text-slate-700 block mb-0.5">CRÉDITO MÁXIMO</label>
                    <input
                      type="text"
                      value={formMaxCredit}
                      onChange={(e) => setFormMaxCredit(e.target.value)}
                      className="w-full h-6 bg-white border border-[#a5aebc] px-2 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">NOTA</label>
                  <textarea
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    className="w-full h-14 bg-white border border-[#a5aebc] p-1.5 resize-none"
                  />
                </div>
              </div>

              {/* Right Column: FOTO + MÉTODO DE FACTURACIÓN */}
              <div className="w-[180px] flex flex-col justify-between">
                <div className="border border-[#b8c0cc] p-2">
                  <div className="text-center font-bold text-slate-700 mb-1">FOTO</div>
                  <div className="h-[150px] bg-[#cfd8e3] flex items-center justify-center overflow-hidden">
                    {clientPhotoUrl ? (
                      <img
                        src={clientPhotoUrl}
                        alt={formName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-24 h-24 text-white stroke-[1.5]" />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-1 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setClientPhotoUrl('');
                        notify('Foto del cliente eliminada.');
                      }}
                      className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = clientPhotoUrl || '/logo.png';
                        a.download = `Cliente_${formCode}.png`;
                        a.click();
                        notify('Foto del cliente exportada.');
                      }}
                      className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                    >
                      Exportar
                    </button>
                    <button
                      type="button"
                      onClick={() => clientPhotoInputRef.current?.click()}
                      className="h-6 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[9.5px]"
                    >
                      Imagen
                    </button>
                  </div>
                </div>

                <div className="border border-[#b8c0cc] p-2 space-y-1.5">
                  <div className="font-bold text-slate-700">MÉTODO DE FACTURACIÓN</div>
                  <label className="flex items-center gap-1.5 text-[9.5px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={priceWithIva}
                      onChange={(e) => {
                        setPriceWithIva(e.target.checked);
                        setPriceWithoutIva(!e.target.checked);
                      }}
                    />
                    PRECIO CON IVA INCLUIDO
                  </label>
                  <label className="flex items-center gap-1.5 text-[9.5px] text-slate-700">
                    <input
                      type="checkbox"
                      checked={priceWithoutIva}
                      onChange={(e) => {
                        setPriceWithoutIva(e.target.checked);
                        setPriceWithIva(!e.target.checked);
                      }}
                    />
                    PRECIO SIN IVA INCLUIDO
                  </label>
                  <select
                    value={priceTierSelect}
                    onChange={(e) => setPriceTierSelect(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-1 text-[9.5px]"
                  >
                    <option value="PRECIO DE VENTA 1">PRECIO DE VENTA 1</option>
                    <option value="PRECIO DE VENTA 2">PRECIO DE VENTA 2</option>
                    <option value="PRECIO DE VENTA 3">PRECIO DE VENTA 3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-3 py-2 bg-[#d8dfe8] border-t border-[#b8c0cc] flex items-center justify-between">
              <button
                onClick={() => {
                  setFormName('');
                  setFormAddress('');
                  setFormPhone('');
                  setFormRtn('');
                }}
                className="px-4 h-7 bg-[#e2e6ec] border border-[#a5aebc] text-[11px] text-slate-600 flex items-center gap-1.5"
              >
                <Eraser className="w-3.5 h-3.5 text-pink-500" />
                Limpiar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveClient(false)}
                  className="px-3 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-800 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                  Guardar y Nuevo
                </button>
                <button
                  onClick={() => handleSaveClient(true)}
                  className="px-3 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-800 font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-indigo-700" />
                  Guardar y Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUPPLIERS MODULE (Matching Smart Punto de Venta v1.9.8 style)
// ============================================================================
export const SuppliersModule: React.FC = () => {
  const { suppliers, setSuppliers, pullAllFromCloud, exportToExcelCSV, notify } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDisabled, setShowDisabled] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formCode, setFormCode] = useState('1');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formRtn, setFormRtn] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('NICARAGUA');
  const [formCreditDays, setFormCreditDays] = useState(15);
  const [formCreditLimit, setFormCreditLimit] = useState(100000);

  const filteredSuppliers = suppliers.filter((s) => {
    if (!showDisabled && !s.enabled) return false;
    if (
      searchQuery.trim() &&
      !s.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !s.code.includes(searchQuery)
    ) {
      return false;
    }
    return true;
  });

  const openNewSupplierDialog = () => {
    setEditingSupplier(null);
    setFormCode(String(suppliers.length + 1));
    setFormEnabled(true);
    setFormName('');
    setFormPhone('');
    setFormContact('');
    setFormRtn('');
    setFormEmail('');
    setFormAddress('NICARAGUA');
    setFormCreditDays(15);
    setFormCreditLimit(100000);
    setModalOpen(true);
  };

  const openEditSupplierDialog = (sup?: Supplier) => {
    const target = sup || suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0];
    if (!target) {
      openNewSupplierDialog();
      return;
    }
    setEditingSupplier(target);
    setFormCode(target.code);
    setFormEnabled(target.enabled);
    setFormName(target.name);
    setFormPhone(target.phone);
    setFormContact(target.contactName);
    setFormRtn(target.taxId);
    setFormEmail(target.email);
    setFormAddress(target.address);
    setFormCreditDays(target.creditDays);
    setFormCreditLimit(target.creditLimit);
    setModalOpen(true);
  };

  const handleSaveSupplier = (closeAfter = true) => {
    if (!formName.trim()) {
      notify('Ingrese el nombre del proveedor.', 'warning');
      return;
    }
    if (editingSupplier) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === editingSupplier.id
            ? {
                ...s,
                code: formCode,
                name: formName.toUpperCase(),
                contactName: formContact.toUpperCase(),
                taxId: formRtn,
                phone: formPhone,
                email: formEmail,
                address: formAddress.toUpperCase(),
                creditDays: formCreditDays,
                creditLimit: formCreditLimit,
                enabled: formEnabled,
              }
            : s
        )
      );
      notify(`Proveedor "${formName.toUpperCase()}" actualizado.`);
    } else {
      const newSup: Supplier = {
        id: `sup-${Date.now()}`,
        code: formCode || String(suppliers.length + 1),
        name: formName.toUpperCase(),
        contactName: formContact.toUpperCase(),
        taxId: formRtn || '08019000112233',
        phone: formPhone,
        email: formEmail,
        address: formAddress.toUpperCase() || 'NICARAGUA',
        creditLimit: formCreditLimit,
        currentBalance: 0,
        creditDays: formCreditDays,
        enabled: formEnabled,
        logoOptimized: true,
      };
      setSuppliers((prev) => [...prev, newSup]);
      setSelectedSupplierId(newSup.id);
      notify(`Proveedor "${newSup.name}" guardado.`);
    }

    if (closeAfter) {
      setModalOpen(false);
    } else {
      openNewSupplierDialog();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#e8ecf2] select-none overflow-hidden">
      {/* Contextual Ribbon */}
      <div className="bg-[#f5f6f7] border-b border-[#c6cbd2] px-2 py-1 flex items-stretch gap-1 h-[78px] shrink-0 overflow-x-auto">
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <button
              onClick={openNewSupplierDialog}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Plus className="w-6 h-6 text-[#2563eb] stroke-[2.4]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Nuevo
                <br />
                Proveedor
              </span>
            </button>
            <button
              onClick={() => openEditSupplierDialog()}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <Pencil className="w-6 h-6 text-[#3b82f6] stroke-[1.8]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Editar
                <br />
                Proveedor
              </span>
            </button>
            <button
              onClick={() => {
                if (!selectedSupplierId) {
                  notify('Seleccione un proveedor para eliminar.', 'warning');
                  return;
                }
                setSuppliers((prev) => prev.filter((s) => s.id !== selectedSupplierId));
                notify('Proveedor eliminado.');
              }}
              className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
            >
              <X className="w-6 h-6 text-[#ef4444] stroke-[2.2]" />
              <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
                Eliminar
                <br />
                Proveedor
              </span>
            </button>
          </div>
          <div className="text-[9px] text-slate-500 text-center font-medium">Proveedores</div>
        </div>

        {/* Actualizar */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
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
          <div className="text-[9px] text-slate-500 text-center font-medium">Actualizar</div>
        </div>

        {/* Mostrar Deshabilitados */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() => setShowDisabled((v) => !v)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded ${
              showDisabled ? 'bg-[#fff3a1] border border-[#e2c94c]' : 'hover:bg-[#dce6f4]'
            }`}
          >
            <div className="w-6 h-6 bg-[#64748b] rounded-sm flex items-center justify-center">
              <Check className="w-4 h-4 text-white stroke-[2.8]" />
            </div>
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Mostrar Proveedores
              <br />
              Deshabilitados
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Mostrar Desh...</div>
        </div>

        {/* Importar & Exportar */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() =>
              exportToExcelCSV(
                'Proveedores',
                filteredSuppliers.map((s) => ({
                  Codigo: s.code,
                  Proveedor: s.name,
                  RTN: s.taxId,
                  Contacto: s.contactName,
                  Telefono: s.phone,
                  Terminos: `${s.creditDays} DIAS`,
                  Saldo: s.currentBalance,
                }))
              )
            }
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <RefreshCw className="w-6 h-6 text-[#2563eb] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Importar &amp;
              <br />
              Exportar
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Importar &amp; E...</div>
        </div>

        {/* Transferencia */}
        <div className="flex flex-col justify-between border-r border-[#d0d5dd] pr-2 mr-1 shrink-0">
          <button
            onClick={() => notify('Transferencia de catálogo de proveedores entre sucursales completada.')}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <Database className="w-6 h-6 text-[#eab308] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Transferencia
              <br />
              de Proveedores
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Transfere...</div>
        </div>

        {/* Optimizar Imágenes */}
        <div className="flex flex-col justify-between pr-2 shrink-0">
          <button
            onClick={() => {
              setSuppliers((prev) => prev.map((s) => ({ ...s, logoOptimized: true })));
              notify('Logotipos de proveedores optimizados correctamente.');
            }}
            className="flex flex-col items-center justify-center px-2 py-1 rounded hover:bg-[#dce6f4]"
          >
            <ImageIcon className="w-6 h-6 text-[#16a34a] stroke-[1.8]" />
            <span className="text-[10px] text-slate-700 leading-tight mt-0.5 text-center">
              Optimizar
              <br />
              Imágenes
            </span>
          </button>
          <div className="text-[9px] text-slate-500 text-center font-medium">Optimiza...</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#e8ecf2] px-3 py-2 flex items-center gap-4 border-b border-[#c6cbd2] shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-700 uppercase">
            BUSCAR PROVEEDOR POR NOMBRE O CÓDIGO
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[260px] h-6 bg-white border border-[#b0b8c4] px-2 text-xs text-slate-800 focus:outline-none mt-0.5"
          />
        </div>
        <button
          onClick={() => setSearchQuery('')}
          className="px-4 h-6 mt-3.5 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] text-[11px] text-slate-700 flex items-center gap-1 rounded-[2px]"
        >
          <Eraser className="w-3 h-3 text-pink-600" />
          Limpiar
        </button>
      </div>

      {/* Data Grid */}
      <div className="flex-1 bg-white overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="sticky top-0 bg-[#f5f6f8] z-10 border-b border-[#d0d5dd]">
            <tr className="text-slate-700 font-semibold">
              <th className="w-5 border-r border-[#d0d5dd]" />
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-24">CodProveedor</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd]">Proveedor</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-36">Teléfono</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-44">Contacto</th>
              <th className="text-left px-2 py-1 border-r border-[#d0d5dd] w-28">Términos</th>
              <th className="text-right px-2 py-1 w-32">Saldo Pendiente</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((s) => {
              const isSelected = s.id === selectedSupplierId;
              return (
                <tr
                  key={s.id}
                  onClick={() => setSelectedSupplierId(s.id)}
                  onDoubleClick={() => openEditSupplierDialog(s)}
                  className={`border-b border-[#e5e7eb] cursor-pointer ${
                    isSelected ? 'bg-[#fff5c0] font-semibold' : 'hover:bg-[#f2f6fc]'
                  }`}
                >
                  <td className="border-r border-[#e5e7eb] text-center text-[9px]">
                    {isSelected ? '▶' : ''}
                  </td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb] text-center">{s.code}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{s.name}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{s.phone}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">{s.contactName}</td>
                  <td className="px-2 py-0.5 border-r border-[#e5e7eb]">
                    {s.creditDays > 0 ? `${s.creditDays} DIAS` : 'CONTADO'}
                  </td>
                  <td className="px-2 py-0.5 text-right">
                    C${s.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="h-7 bg-[#1c2b42] px-3 flex items-center text-white shrink-0">
        <span className="text-[11px] font-bold mr-2">Nº</span>
        <div className="bg-[#d8dde6] text-slate-900 font-bold text-[11px] px-4 py-0.5 min-w-[54px] text-center">
          {filteredSuppliers.length}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-[500px] bg-[#d8dfe8] border-2 border-[#8c96a5] shadow-2xl rounded-[3px] overflow-hidden text-[10.5px]">
            <div className="h-7 bg-gradient-to-b from-[#e6ebf2] to-[#d2d9e4] border-b border-[#b0b8c4] px-2.5 flex items-center justify-between font-bold text-slate-800">
              <div className="flex items-center gap-1.5">
                <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain" />
                <span>
                  {editingSupplier ? `Editar Proveedor – ${editingSupplier.name}` : 'Nuevo Proveedor'}
                </span>
              </div>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="p-3.5 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">CÓDIGO</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full h-6 bg-[#d0d7e2] border border-[#a5aebc] px-2 text-center font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">DÍAS DE CRÉDITO</label>
                  <select
                    value={formCreditDays}
                    onChange={(e) => setFormCreditDays(Number(e.target.value))}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-1 font-semibold"
                  >
                    <option value={0}>CONTADO (0 DÍAS)</option>
                    <option value={15}>15 DÍAS</option>
                    <option value={30}>30 DÍAS</option>
                    <option value={60}>60 DÍAS</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEnabled}
                      onChange={(e) => setFormEnabled(e.target.checked)}
                    />
                    PROVEEDOR ACTIVO
                  </label>
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-0.5">NOMBRE DEL PROVEEDOR</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full h-6 bg-white border border-[#a5aebc] px-2 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">RTN DEL PROVEEDOR</label>
                  <input
                    type="text"
                    value={formRtn}
                    onChange={(e) => setFormRtn(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">TELÉFONO</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">NOMBRE DEL CONTACTO</label>
                  <input
                    type="text"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">CORREO ELECTRÓNICO</label>
                  <input
                    type="text"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-0.5">DIRECCIÓN</label>
                  <input
                    type="text"
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-0.5">LÍMITE DE CRÉDITO</label>
                  <input
                    type="number"
                    value={formCreditLimit}
                    onChange={(e) => setFormCreditLimit(Number(e.target.value))}
                    className="w-full h-6 bg-white border border-[#a5aebc] px-2 text-right"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#b8c0cc]">
                <button
                  onClick={openNewSupplierDialog}
                  className="px-3 h-7 bg-[#e2e6ec] border border-[#a5aebc] font-semibold flex items-center gap-1"
                >
                  <Eraser className="w-3.5 h-3.5 text-pink-600" /> Limpiar
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveSupplier(false)}
                    className="px-3 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" /> Guardar y Nuevo
                  </button>
                  <button
                    onClick={() => handleSaveSupplier(true)}
                    className="px-3 h-7 bg-[#e2e6ec] hover:bg-[#d5dbe3] border border-[#a5aebc] font-bold flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5 text-indigo-700" /> Guardar y Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
