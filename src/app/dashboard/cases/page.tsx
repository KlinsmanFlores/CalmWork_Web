"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shield, Download, FileText, CheckCircle2, Clock, Inbox, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

export default function CasesOverview() {
  const [casesList, setCasesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    
    // Fetch Modules for names
    const { data: modules } = await supabase.from('modules').select('id, title');
    const moduleMap: Record<string, string> = {};
    if (modules) {
      modules.forEach(m => {
        moduleMap[m.id] = m.title;
      });
    }

    const { data: reports } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reports) {
      const list = reports.map(r => ({
        id: r.id,
        date: new Date(r.created_at).toLocaleDateString(),
        module: moduleMap[r.module_id] || 'Desconocido',
        department: r.department || 'Sin asignar',
        status: r.status || 'new',
        preview: 'Reporte confidencial generado en el sistema.'
      }));
      setCasesList(list);
    }
    setLoading(false);
  }

  const exportToExcel = () => {
    if (casesList.length === 0) return;
    const exportData = casesList.map(r => ({
      "ID Caso": r.id,
      "Fecha": r.date,
      "Departamento": r.department,
      "Tipo": r.module,
      "Estado": r.status === 'new' ? 'Nuevo' : r.status === 'in_progress' ? 'En Proceso' : 'Resuelto',
      "Descripción Inicial": r.preview
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gestion_Casos");
    XLSX.writeFile(workbook, "Gestion_Casos_CalmWORK.xlsx");
  };

  const filteredCases = casesList.filter(c => filter === 'all' ? true : c.status === filter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Seguimiento de Casos</h2>
        </div>
        <button
          onClick={exportToExcel}
          disabled={casesList.length === 0}
          className="flex items-center bg-[#246672] hover:bg-[#1b4e57] disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Casos
        </button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#246672]"></div>
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2 bg-slate-50">
          <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} icon={Inbox} label="Todos los casos" count={casesList.length} color="text-slate-600" />
          <FilterButton active={filter === 'new'} onClick={() => setFilter('new')} icon={AlertTriangle} label="Nuevos" count={casesList.filter(c => c.status === 'new').length} color="text-blue-600" />
          <FilterButton active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} icon={Clock} label="En Seguimiento" count={casesList.filter(c => c.status === 'in_progress').length} color="text-amber-600" />
          <FilterButton active={filter === 'resolved'} onClick={() => setFilter('resolved')} icon={CheckCircle2} label="Resueltos" count={casesList.filter(c => c.status === 'resolved').length} color="text-emerald-600" />
        </div>

        {/* Table */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#246672]"></div>
          </div>
        ) : filteredCases.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white border-b border-slate-200">
                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Caso / Tipo</th>
                  <th className="px-6 py-4 font-semibold">Departamento</th>
                  <th className="px-6 py-4 font-semibold">Fecha</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                  <th className="px-6 py-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{c.module}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{c.preview}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{c.department}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{c.date}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${
                        c.status === 'new' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        c.status === 'in_progress' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {c.status === 'new' ? 'NUEVO' : c.status === 'in_progress' ? 'EN PROCESO' : 'RESUELTO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#6AB2BB] hover:text-[#246672] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Detalles &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <Shield className="h-12 w-12 mb-4 opacity-30 text-[#246672]" />
            <p className="font-medium text-slate-500">No hay casos que coincidan con este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterButton({ active, onClick, icon: Icon, label, count, color }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active 
          ? 'bg-white shadow-sm border border-slate-200 text-slate-800' 
          : 'text-slate-500 hover:bg-slate-100 border border-transparent'
      }`}
    >
      <Icon className={`h-4 w-4 mr-2 ${active ? color : 'opacity-70'}`} />
      {label}
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${active ? 'bg-slate-100 text-slate-600' : 'bg-slate-200 text-slate-500'}`}>
        {count}
      </span>
    </button>
  );
}
