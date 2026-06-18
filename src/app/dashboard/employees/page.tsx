"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, CheckCircle2, XCircle, X, Search, Filter } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchName, setSearchName] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterSurvey, setFilterSurvey] = useState("");
  const [filterDate, setFilterDate] = useState("");

  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState("");
  
  // Results modal state
  const [selectedResults, setSelectedResults] = useState<any | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('employees')
      .select(`
        *,
        initial_survey_results (*)
      `)
      .order('created_at', { ascending: false });
    if (data) {
      setEmployees(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    if (searchName) {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      if (!fullName.includes(searchName.toLowerCase())) return false;
    }
    if (filterDepartment && emp.department !== filterDepartment) return false;
    if (filterSurvey === "completed" && !emp.has_completed_initial_survey) return false;
    if (filterSurvey === "pending" && emp.has_completed_initial_survey) return false;
    if (filterDate) {
      if (!emp.created_at.startsWith(filterDate)) return false;
    }
    return true;
  });

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setModalError("");

    try {
      const res = await fetch('/api/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          first_name: newFirstName,
          last_name: newLastName,
          department: newDepartment
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al crear trabajador');
      }

      // Éxito
      setIsModalOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewFirstName("");
      setNewLastName("");
      setNewDepartment("");
      fetchEmployees(); // Recargar la tabla
      alert("Trabajador creado exitosamente.");

    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Gestión de Trabajadores</h2>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-sm"
        >
          <Users className="w-4 h-4 mr-2" />
          Crear Trabajador
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Buscar por Nombre</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input 
              type="text"
              placeholder="Ej: Juan Pérez"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-9 w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-slate-50"
            />
          </div>
        </div>
        
        <div className="w-full lg:w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Departamento</label>
          <select 
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-slate-50"
          >
            <option value="">Todos</option>
            <option value="Operaciones">Operaciones</option>
            <option value="Ventas">Ventas</option>
            <option value="Tecnología (TI)">Tecnología (TI)</option>
            <option value="Recursos Humanos">Recursos Humanos</option>
            <option value="Marketing">Marketing</option>
            <option value="Finanzas">Finanzas</option>
            <option value="Administración">Administración</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        <div className="w-full lg:w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Encuesta Inicial</label>
          <select 
            value={filterSurvey}
            onChange={(e) => setFilterSurvey(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-slate-50"
          >
            <option value="">Todos</option>
            <option value="completed">Completado</option>
            <option value="pending">Pendiente</option>
          </select>
        </div>

        <div className="w-full lg:w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha de Registro</label>
          <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-slate-50"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="px-6 py-4 font-medium">Trabajador</th>
                <th className="px-6 py-4 font-medium">Departamento</th>
                <th className="px-6 py-4 font-medium">Encuesta Inicial</th>
                <th className="px-6 py-4 font-medium">Fecha de Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    <div className="animate-pulse flex justify-center"><div className="h-6 w-6 border-b-2 border-teal-600 rounded-full animate-spin"></div></div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No se encontraron trabajadores con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      <div className="flex flex-col">
                        <span>{emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : 'Sin nombre'}</span>
                        <span className="text-xs text-slate-500 font-normal">{emp.email || 'Sin correo registrado'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {emp.department || 'Sin asignar'}
                    </td>
                    <td className="px-6 py-4">
                      {emp.has_completed_initial_survey ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Completado
                          </span>
                          {emp.initial_survey_results && emp.initial_survey_results.length > 0 && (
                            <button
                              onClick={() => setSelectedResults(emp.initial_survey_results[0])}
                              className="text-xs text-teal-600 hover:text-teal-700 font-medium underline"
                            >
                              Ver Resultados
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          <XCircle className="w-3 h-3 mr-1" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CREAR TRABAJADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Crear Nuevo Trabajador</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                  {modalError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombres</label>
                <input 
                  type="text" 
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  placeholder="Ej: Juan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos</label>
                <input 
                  type="text" 
                  required
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  placeholder="Ej: Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  placeholder="ejemplo@empresa.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña Inicial</label>
                <input 
                  type="text" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow"
                  placeholder="Contraseña segura (mín. 6 caracteres)"
                  minLength={6}
                />
                <p className="text-xs text-slate-500 mt-1">El trabajador usará esta clave para entrar a la App Móvil.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Departamento (Opcional)</label>
                <select 
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-shadow bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  <option value="Operaciones">Operaciones</option>
                  <option value="Ventas">Ventas</option>
                  <option value="Tecnología (TI)">Tecnología (TI)</option>
                  <option value="Seguridad">Seguridad</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Finanzas">Finanzas</option>
                  <option value="Administración">Administración</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  {isCreating ? 'Creando...' : 'Guardar y Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VER RESULTADOS */}
      {selectedResults && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Resultados de la Encuesta</h3>
              <button onClick={() => setSelectedResults(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">1. Exigencias</span>
                <span className="font-bold text-teal-600">{selectedResults.dim1_score} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">2. Trabajo Activo</span>
                <span className="font-bold text-teal-600">{selectedResults.dim2_score} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">3. Inseguridad</span>
                <span className="font-bold text-teal-600">{selectedResults.dim3_score} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">4. Apoyo Social</span>
                <span className="font-bold text-teal-600">{selectedResults.dim4_score} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">5. Doble Presencia</span>
                <span className="font-bold text-teal-600">{selectedResults.dim5_score} pts</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-medium text-slate-700">6. Estima</span>
                <span className="font-bold text-teal-600">{selectedResults.dim6_score} pts</span>
              </div>
              <div className="pt-4 flex justify-end">
                <button 
                  onClick={() => setSelectedResults(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
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
