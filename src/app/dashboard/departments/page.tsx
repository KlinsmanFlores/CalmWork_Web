"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area 
} from "recharts";
import { Users, AlertTriangle, Download, Building, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import * as XLSX from "xlsx";

const COLORS = ["#246672", "#6AB2BB", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981", "#3b82f6"];

export default function DepartmentsAnalysis() {
  const [statsData, setStatsData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [areaEvolutionData, setAreaEvolutionData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({ topReports: '', topStress: '' });
  const [loading, setLoading] = useState(true);
  
  const [filterStress, setFilterStress] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: reports } = await supabase.from('reports').select('department, created_at');
      const { data: insights } = await supabase.from('chatbot_insights').select('*, chatbot_sessions(department)');

      if (reports && insights) {
        const stats: Record<string, { reportes: number, alertas: number, criticas: number, sentimentSum: number }> = {};
        const evolutionCounts: Record<string, Record<string, number>> = {};
        const allDepts = new Set<string>();
        
        // Process Reports
        reports.forEach(r => {
          const d = r.department;
          if (!d || d.toLowerCase() === 'sin asignar') return;
          
          allDepts.add(d);
          if (!stats[d]) stats[d] = { reportes: 0, alertas: 0, criticas: 0, sentimentSum: 0 };
          stats[d].reportes += 1;

          const dateObj = new Date(r.created_at);
          const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (!evolutionCounts[monthKey]) evolutionCounts[monthKey] = {};
          evolutionCounts[monthKey][d] = (evolutionCounts[monthKey][d] || 0) + 1;
        });

        // Process Insights
        insights.forEach(i => {
          const d = i.chatbot_sessions?.department;
          if (!d || d.toLowerCase() === 'sin asignar') return;

          allDepts.add(d);
          if (!stats[d]) stats[d] = { reportes: 0, alertas: 0, criticas: 0, sentimentSum: 0 };
          stats[d].alertas += 1;
          if (i.urgency_level === 'high' || i.urgency_level === 'critical') {
            stats[d].criticas += 1;
          }
          stats[d].sentimentSum += i.sentiment_score || 0;

          const dateObj = new Date(i.created_at);
          const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
          if (!evolutionCounts[monthKey]) evolutionCounts[monthKey] = {};
          evolutionCounts[monthKey][d] = (evolutionCounts[monthKey][d] || 0) + 1;
        });

        const arrayData = Object.keys(stats).map(d => {
          const s = stats[d];
          // Estrés = Invert of sentiment + factor of critical alerts
          const avgSent = s.alertas > 0 ? (s.sentimentSum / s.alertas) : 5;
          let stressLevel = (10 - avgSent) * 10; // 0 to 100
          stressLevel += (s.criticas * 5); // penalty
          if (stressLevel > 100) stressLevel = 100;

          return {
            department: d,
            reportes: s.reportes,
            alertas: s.alertas,
            criticas: s.criticas,
            estres: Math.round(stressLevel)
          };
        });

        // Chart Data
        const bChart = [...arrayData].sort((a, b) => b.reportes - a.reportes);
        
        const rChart = arrayData.map(d => ({
          subject: d.department,
          Reportes: d.reportes * 10, // Escalar para radar
          Estrés: d.estres
        }));

        // Area Evolution Chart
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const evoData = Object.keys(evolutionCounts).sort().map(k => {
          const [y, m] = k.split('-');
          const obj: any = { name: `${months[parseInt(m)-1]} ${y}` };
          Array.from(allDepts).forEach(dept => {
            obj[dept] = evolutionCounts[k][dept] || 0;
          });
          return obj;
        });

        setAreaEvolutionData(evoData);
        setStatsData(bChart);
        setRadarData(rChart);

        if (bChart.length > 0) {
          const maxRep = bChart[0].department;
          const maxStress = [...arrayData].sort((a, b) => b.estres - a.estres)[0].department;
          setKpis({ topReports: maxRep, topStress: maxStress });
        }
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  const exportToExcel = () => {
    if (statsData.length === 0) return;
    const worksheet = XLSX.utils.json_to_sheet(statsData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Areas");
    XLSX.writeFile(workbook, "Analisis_Areas_CalmWORK.xlsx");
  };

  const filteredStats = statsData.filter(row => {
    if (filterStress === 'all') return true;
    if (filterStress === 'high') return row.estres > 60;
    if (filterStress === 'medium') return row.estres > 30 && row.estres <= 60;
    if (filterStress === 'low') return row.estres <= 30;
    return true;
  });

  const totalPages = Math.ceil(filteredStats.length / itemsPerPage);
  const paginatedStats = filteredStats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStress]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Análisis Organizacional</h2>
        </div>
        <button
          onClick={exportToExcel}
          disabled={statsData.length === 0}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar Excel
        </button>
      </div>

      {!loading && statsData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-lg border border-rose-200 shadow-sm flex items-center bg-gradient-to-r from-rose-50 to-white">
              <div className="bg-rose-500 p-4 rounded-full text-white mr-5 shadow-sm"><AlertTriangle size={24} /></div>
              <div>
                <p className="text-sm font-bold text-rose-600 mb-1 uppercase tracking-wider">Área con Más Estrés</p>
                <h4 className="text-2xl font-extrabold text-slate-800">{kpis.topStress}</h4>
              </div>
           </div>
           <div className="bg-white p-6 rounded-lg border border-amber-200 shadow-sm flex items-center bg-gradient-to-r from-amber-50 to-white">
              <div className="bg-amber-500 p-4 rounded-full text-white mr-5 shadow-sm"><Users size={24} /></div>
              <div>
                <p className="text-sm font-bold text-amber-600 mb-1 uppercase tracking-wider">Área con Más Reportes</p>
                <h4 className="text-2xl font-extrabold text-slate-800">{kpis.topReports}</h4>
              </div>
           </div>
        </div>
      )}

      {/* Evolution Area Chart */}
      {!loading && areaEvolutionData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Evolución de Incidencias por Área (Áreas Apiladas)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaEvolutionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                <Legend wrapperStyle={{paddingTop: '20px'}} />
                {Object.keys(areaEvolutionData[0] || {}).filter(k => k !== 'name').map((dept, idx) => (
                  <Area key={idx} type="monotone" dataKey={dept} stackId="1" stroke={COLORS[idx % COLORS.length]} fill={COLORS[idx % COLORS.length]} fillOpacity={0.6} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#6AB2BB]"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Departamentos con Más Reportes</h3>
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6AB2BB]"></div></div>
          ) : statsData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} width={120} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="reportes" name="Reportes" fill="#6AB2BB" radius={[0, 4, 4, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Building className="h-10 w-10 mb-3 opacity-30 text-[#6AB2BB]" />
              <p className="text-sm">No hay datos suficientes.</p>
            </div>
          )}
        </div>

        {/* Gráfico 2 */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#246672]"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-6">Comparación Multidimensional (Reportes vs Estrés)</h3>
          {loading ? (
             <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#246672]"></div></div>
          ) : radarData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontSize: 11}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#94a3b8', fontSize: 10}} />
                  <Radar name="Nivel de Estrés" dataKey="Estrés" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                  <Radar name="Volumen Reportes" dataKey="Reportes" stroke="#6AB2BB" fill="#6AB2BB" fillOpacity={0.5} />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend wrapperStyle={{paddingTop: '10px'}} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Building className="h-10 w-10 mb-3 opacity-30 text-[#246672]" />
              <p className="text-sm">No hay datos suficientes.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
          <h3 className="text-lg font-bold text-slate-800">Desglose por Departamento</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={filterStress}
              onChange={(e) => setFilterStress(e.target.value)}
              className="text-sm border border-slate-300 rounded-md py-1.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6AB2BB] cursor-pointer"
            >
              <option value="all">Todos los niveles</option>
              <option value="high">Estrés Alto (&gt; 60%)</option>
              <option value="medium">Estrés Medio (31% - 60%)</option>
              <option value="low">Estrés Bajo (0% - 30%)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Departamento</th>
                <th className="px-6 py-4 font-bold">N° Reportes Anónimos</th>
                <th className="px-6 py-4 font-bold">Alertas de IA (Chatbot)</th>
                <th className="px-6 py-4 font-bold">Alertas Críticas</th>
                <th className="px-6 py-4 font-bold">Nivel de Estrés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedStats.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">{row.department}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.reportes}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.alertas}</td>
                  <td className="px-6 py-4 text-sm text-rose-600 font-bold">{row.criticas}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 mr-3">
                        <div className={`h-2.5 rounded-full ${row.estres > 60 ? 'bg-rose-500' : row.estres > 30 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${row.estres}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-slate-700">{row.estres}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No hay departamentos que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredStats.length)} de {filteredStats.length} departamentos
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
