"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { AlertTriangle, Download, FileText, Filter } from "lucide-react";
import * as XLSX from "xlsx";

const COLORS = ["#246672", "#6AB2BB", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

export default function ReportsOverview() {
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: reports } = await supabase.from('reports').select('*');
      const { data: modules } = await supabase.from('modules').select('*');

      if (reports && modules) {
        // Build dicts
        const moduleMap: Record<string, string> = {};
        modules.forEach(m => { moduleMap[m.id] = m.title; });

        const moduleCounts: Record<string, number> = {};
        const monthCounts: Record<string, number> = {};
        const areaStats: Record<string, Record<string, number>> = {};

        reports.forEach(r => {
          const mName = moduleMap[r.module_id] || 'Desconocido';
          const dept = r.department;
          const dateObj = new Date(r.created_at);
          const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

          // Module count
          moduleCounts[mName] = (moduleCounts[mName] || 0) + 1;
          
          // Month count
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

          // Area vs Module (Filter null departments)
          if (dept && dept.toLowerCase() !== 'sin asignar' && dept.trim() !== '') {
            if (!areaStats[dept]) areaStats[dept] = {};
            areaStats[dept][mName] = (areaStats[dept][mName] || 0) + 1;
          }
        });

        // Chart 1: Pie/Dona (Reportes por módulo)
        const chart1 = Object.keys(moduleCounts).map(k => ({
          name: k,
          value: moduleCounts[k]
        })).sort((a, b) => b.value - a.value);
        setReportsData(chart1);

        // Chart 2: LineChart (Reportes por mes)
        const chart2 = Object.keys(monthCounts).sort().map(k => {
          const [y, m] = k.split('-');
          const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
          return { name: `${months[parseInt(m)-1]} ${y}`, total: monthCounts[k] };
        });
        setTrendData(chart2);

        // Chart 3: Area vs Module
        const c3Data = Object.keys(areaStats).map(dept => {
          const obj: any = { department: dept };
          Object.keys(areaStats[dept]).forEach(m => {
            obj[m] = areaStats[dept][m];
          });
          return obj;
        });
        setAreaData(c3Data);

        // Prepare list
        const processedList = reports.map(r => ({
          id: r.id,
          module: moduleMap[r.module_id] || 'Desconocido',
          department: r.department || 'Desconocido',
          date: new Date(r.created_at).toLocaleDateString(),
          status: r.status || 'in_progress',
          priority: r.priority_level || 'medium'
        }));
        
        setReportsList(processedList.reverse());
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const exportToExcel = () => {
    if (reportsList.length === 0) return;
    const exportData = reportsList.map(r => ({
      "ID Reporte": r.id,
      "Fecha": r.date,
      "Departamento": r.department,
      "Tipo de Riesgo (Módulo)": r.module,
      "Estado": r.status === 'resolved' ? 'Resuelto' : 'En Seguimiento',
      "Prioridad": r.priority === 'high' ? 'Alta' : r.priority === 'medium' ? 'Media' : 'Baja'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reportes");
    XLSX.writeFile(workbook, "Listado_Reportes_CalmWORK.xlsx");
  };

  const filteredList = reportsList.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Gestión de Incidencias</h2>
        </div>
        <button
          onClick={exportToExcel}
          disabled={reportsList.length === 0}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Dona (Reportes por Módulo) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Distribución por Tipo de Riesgo</h3>
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>
          ) : reportsData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {reportsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value: any) => [`${value} reportes`, 'Cantidad']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-30 text-amber-500" />
              <p className="text-sm">No hay reportes.</p>
            </div>
          )}
        </div>

        {/* Gráfico 2: Líneas (Reportes por Mes) */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Tendencia Mensual</h3>
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>
          ) : trendData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                  <RechartsTooltip cursor={{stroke: '#e2e8f0', strokeWidth: 2}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Line type="monotone" dataKey="total" name="Reportes" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: '#6366f1'}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <AlertTriangle className="h-10 w-10 mb-3 opacity-30 text-indigo-500" />
              <p className="text-sm">No hay datos de evolución.</p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico 3: Matriz Área vs Riesgo */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-teal-500"></div>
        <h3 className="text-lg font-bold text-slate-800 mb-6">Matriz de Riesgos por Departamento</h3>
        {loading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div></div>
        ) : areaData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                {Object.keys(areaData[0] || {}).filter(k => k !== 'department').map((modName, idx) => (
                  <Bar key={idx} dataKey={modName} stackId="a" fill={COLORS[idx % COLORS.length]} radius={idx === 0 ? [0,0,0,0] : [0,0,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
            <div className="h-80 flex flex-col items-center justify-center text-slate-400">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-30 text-teal-500" />
            <p className="text-sm">No hay suficientes datos cruzados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
