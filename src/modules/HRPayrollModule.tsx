import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Edit3,
  Trash2,
  EyeOff,
  ArrowUpDown,
  FileSpreadsheet,
  PlusCircle,
  BarChart2,
  Users,
  ClipboardList,
} from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { Employee, PayrollMovement } from '../types/pos';

interface HRPayrollProps {
  initialView: 'EMPLEADOS' | 'PLANILLAS';
}

export const HRPayrollModule: React.FC<HRPayrollProps> = ({ initialView }) => {
  const { employees, setEmployees, payroll, setPayroll, exportToExcelCSV, notify } = usePOS();
  const [view, setView] = useState<'EMPLEADOS' | 'PLANILLAS' | 'REPORTES'>(initialView);
  const [showDisabled, setShowDisabled] = useState(false);
  const [sortBy, setSortBy] = useState<'ORDEN' | 'NOMBRE' | 'SALARIO'>('ORDEN');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(employees[0] || null);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [movModalOpen, setMovModalOpen] = useState(false);

  const [empForm, setEmpForm] = useState({
    code: '',
    fullName: '',
    documentId: '',
    position: 'Cajero',
    department: 'Ventas y Facturación',
    baseSalary: 500,
    hireDate: '2026-01-15',
    phone: '',
    email: '',
  });

  const [movForm, setMovForm] = useState({
    employeeId: employees[0]?.id || '',
    period: 'Noviembre 2026 - Quincena 1',
    type: 'HORAS_EXTRA' as PayrollMovement['type'],
    concept: 'Horas extra fin de semana',
    amount: 45,
    isDeduction: false,
  });

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const sortedEmployees = [...employees]
    .filter((e) => (showDisabled ? true : e.enabled))
    .sort((a, b) => {
      if (sortBy === 'NOMBRE') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'SALARIO') return b.baseSalary - a.baseSalary;
      return a.sortOrder - b.sortOrder;
    });

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      setEmployees((prev) => prev.map((x) => (x.id === editingEmp.id ? { ...x, ...empForm } : x)));
      notify(`Empleado ${empForm.fullName} actualizado.`);
    } else {
      const created: Employee = {
        id: `emp-${Date.now()}`,
        ...empForm,
        enabled: true,
        sortOrder: employees.length + 1,
      };
      setEmployees((prev) => [...prev, created]);
      setSelectedEmp(created);
      notify(`Empleado ${created.fullName} registrado.`);
    }
    setEmpModalOpen(false);
  };

  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((x) => x.id === movForm.employeeId) || employees[0];
    if (!emp) {
      notify('Registre al menos un empleado antes de crear un movimiento de planilla.');
      return;
    }
    const created: PayrollMovement = {
      id: `pay-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      period: movForm.period,
      date: new Date().toISOString().slice(0, 10),
      type: movForm.type,
      concept: movForm.concept,
      amount: movForm.amount,
      isDeduction: movForm.type === 'DEDUCCION_SEGURO' || movForm.type === 'ADELANTO' || movForm.isDeduction,
    };
    setPayroll((prev) => [created, ...prev]);
    setMovModalOpen(false);
    notify(`Movimiento de planilla registrado para ${emp.fullName}.`);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setView('PLANILLAS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
              view === 'PLANILLAS' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Administrador de Planillas</span>
          </button>
          <button
            onClick={() => setView('EMPLEADOS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold ${
              view === 'EMPLEADOS' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Lista de Empleados</span>
          </button>

          <div className="h-5 w-px bg-slate-300 mx-1" />

          {view === 'EMPLEADOS' && (
            <>
              <button
                onClick={() => {
                  setEditingEmp(null);
                  setEmpForm({
                    code: `EMP-00${employees.length + 1}`,
                    fullName: '',
                    documentId: '',
                    position: 'Ejecutivo de Ventas',
                    department: 'Ventas',
                    baseSalary: 550,
                    hireDate: new Date().toISOString().slice(0, 10),
                    phone: '',
                    email: '',
                  });
                  setEmpModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Crear Empleado</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedEmp) return;
                  setEditingEmp(selectedEmp);
                  setEmpForm({
                    code: selectedEmp.code,
                    fullName: selectedEmp.fullName,
                    documentId: selectedEmp.documentId,
                    position: selectedEmp.position,
                    department: selectedEmp.department,
                    baseSalary: selectedEmp.baseSalary,
                    hireDate: selectedEmp.hireDate,
                    phone: selectedEmp.phone,
                    email: selectedEmp.email,
                  });
                  setEmpModalOpen(true);
                }}
                disabled={!selectedEmp}
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => {
                  if (!selectedEmp) return;
                  setEmployees((prev) =>
                    prev.map((e) => (e.id === selectedEmp.id ? { ...e, enabled: !e.enabled } : e))
                  );
                  notify('Estado del empleado actualizado.');
                }}
                disabled={!selectedEmp}
                className="flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-lg font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar / Deshabilitar</span>
              </button>
              <button
                onClick={() => setShowDisabled(!showDisabled)}
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mostrar Deshabilitados</span>
              </button>
              <button
                onClick={() =>
                  setSortBy(sortBy === 'ORDEN' ? 'NOMBRE' : sortBy === 'NOMBRE' ? 'SALARIO' : 'ORDEN')
                }
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ordenar ({sortBy})</span>
              </button>
            </>
          )}

          {view === 'PLANILLAS' && (
            <button
              onClick={() => setMovModalOpen(true)}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-bold"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Crear / Editar Movimiento de Planilla</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setView('REPORTES')}
            className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg font-semibold"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Reportes</span>
          </button>
          <button
            onClick={() =>
              exportToExcelCSV(
                view === 'EMPLEADOS' ? 'Empleados' : 'Planilla_Movimientos',
                view === 'EMPLEADOS'
                  ? employees.map((e) => ({
                      Codigo: e.code,
                      Nombre: e.fullName,
                      Cargo: e.position,
                      SalarioBase: e.baseSalary,
                      Activo: e.enabled ? 'SI' : 'NO',
                    }))
                  : payroll.map((p) => ({
                      Periodo: p.period,
                      Empleado: p.employeeName,
                      Tipo: p.type,
                      Concepto: p.concept,
                      Monto: p.amount,
                    }))
              )
            }
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* LISTA DE EMPLEADOS */}
      {view === 'EMPLEADOS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
                <th className="py-2.5 px-3">Código</th>
                <th className="py-2.5 px-3">Nombre Completo</th>
                <th className="py-2.5 px-3">Cédula / ID</th>
                <th className="py-2.5 px-3">Cargo</th>
                <th className="py-2.5 px-3">Departamento</th>
                <th className="py-2.5 px-3 text-right">Salario Base</th>
                <th className="py-2.5 px-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmp(emp)}
                  className={`cursor-pointer ${
                    selectedEmp?.id === emp.id ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{emp.code}</td>
                  <td className="py-2.5 px-3 font-semibold">{emp.fullName}</td>
                  <td className="py-2.5 px-3 font-mono">{emp.documentId}</td>
                  <td className="py-2.5 px-3">{emp.position}</td>
                  <td className="py-2.5 px-3">{emp.department}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">${emp.baseSalary.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        emp.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {emp.enabled ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADMINISTRADOR DE PLANILLAS */}
      {view === 'PLANILLAS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 border-b border-slate-200 uppercase text-[11px]">
                <th className="py-2.5 px-3">Fecha</th>
                <th className="py-2.5 px-3">Período de Nómina</th>
                <th className="py-2.5 px-3">Empleado</th>
                <th className="py-2.5 px-3">Tipo de Movimiento</th>
                <th className="py-2.5 px-3">Concepto</th>
                <th className="py-2.5 px-3 text-right">Devengado (+)</th>
                <th className="py-2.5 px-3 text-right">Deducción (-)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {payroll.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono">{m.date}</td>
                  <td className="py-2.5 px-3">{m.period}</td>
                  <td className="py-2.5 px-3 font-semibold">{m.employeeName}</td>
                  <td className="py-2.5 px-3 font-bold">{m.type}</td>
                  <td className="py-2.5 px-3 text-slate-600">{m.concept}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                    {!m.isDeduction ? `$${m.amount.toFixed(2)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                    {m.isDeduction ? `-$${m.amount.toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORTES DE PLANILLA */}
      {view === 'REPORTES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">Total Ingresos Brutos Planilla</div>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              ${payroll.filter((p) => !p.isDeduction).reduce((a, b) => a + b.amount, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">Total Deducciones / Retenciones</div>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              ${payroll.filter((p) => p.isDeduction).reduce((a, b) => a + b.amount, 0).toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500">Neto a Pagar en Nómina</div>
            <div className="text-2xl font-bold text-indigo-700 mt-1">
              $
              {payroll
                .reduce((a, b) => a + (b.isDeduction ? -b.amount : b.amount), 0)
                .toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* MODAL EMPLEADO */}
      {empModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <h3 className="text-sm font-bold border-b pb-2 mb-3">
              {editingEmp ? 'Editar Empleado' : 'Crear Nuevo Empleado'}
            </h3>
            <form onSubmit={handleSaveEmployee} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo</label>
                <input
                  required
                  value={empForm.fullName}
                  onChange={(e) => setEmpForm({ ...empForm, fullName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Cargo</label>
                  <input
                    required
                    value={empForm.position}
                    onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Salario Base ($)</label>
                  <input
                    type="number"
                    required
                    value={empForm.baseSalary}
                    onChange={(e) => setEmpForm({ ...empForm, baseSalary: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded bg-blue-600 text-white font-bold">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MOVIMIENTO PLANILLA */}
      {movModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 text-xs">
            <h3 className="text-sm font-bold border-b pb-2 mb-3">Crear Movimiento de Planilla</h3>
            <form onSubmit={handleSaveMovement} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Empleado</label>
                <select
                  value={movForm.employeeId}
                  onChange={(e) => setMovForm({ ...movForm, employeeId: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Tipo</label>
                  <select
                    value={movForm.type}
                    onChange={(e) =>
                      setMovForm({ ...movForm, type: e.target.value as PayrollMovement['type'] })
                    }
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="SALARIO_BASE">SALARIO_BASE</option>
                    <option value="HORAS_EXTRA">HORAS_EXTRA</option>
                    <option value="BONIFICACION">BONIFICACION</option>
                    <option value="COMISION">COMISION</option>
                    <option value="DEDUCCION_SEGURO">DEDUCCION_SEGURO</option>
                    <option value="ADELANTO">ADELANTO</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Monto ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movForm.amount}
                    onChange={(e) => setMovForm({ ...movForm, amount: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Concepto / Detalle</label>
                <input
                  required
                  value={movForm.concept}
                  onChange={(e) => setMovForm({ ...movForm, concept: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-1.5 rounded bg-indigo-600 text-white font-bold">
                  Registrar en Nómina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

