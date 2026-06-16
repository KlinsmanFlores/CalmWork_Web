"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from "recharts";
import { Users, FileText, AlertTriangle, TrendingUp } from "lucide-react";

// Colores del semáforo
const COLORS = {
  verde: "#10b981", // Emerald 500
  amarillo: "#f59e0b", // Amber 500
  rojo: "#ef4444", // Red 500
};

// Utilidad para clasificar el puntaje de cada dimensión
function getRiskColor(dim: number, score: number) {
  if (dim === 1) {
    if (score <= 7) return "verde";
    if (score <= 11) return "amarillo";
    return "rojo";
  }
  if (dim === 2) {
    if (score >= 26) return "verde";
    if (score >= 19) return "amarillo";
    return "rojo";
  }
  if (dim === 3) {
    if (score <= 4) return "verde";
    if (score <= 9) return "amarillo";
    return "rojo";
  }
  if (dim === 4) {
    if (score >= 32) return "verde";
    if (score >= 25) return "amarillo";
    return "rojo";
  }
  if (dim === 5) {
    if (score <= 2) return "verde";
    if (score <= 6) return "amarillo";
    return "rojo";
  }
  if (dim === 6) {
    if (score >= 13) return "verde";
    if (score >= 10) return "amarillo";
    return "rojo";
  }
  return "verde";
}

function ScoreBadge({ dim, score }: { dim: number, score: number }) {
  const color = getRiskColor(dim, score);
  let bgClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (color === "amarillo") bgClass = "bg-amber-100 text-amber-800 border-amber-200";
  if (color === "rojo") bgClass = "bg-red-100 text-red-800 border-red-200";

  return (
    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold border ${bgClass} min-w-[36px] shadow-sm`}>
      {score}
    </span>
  );
}

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    surveysCompleted: 0,
    totalReports: 0,
    criticalInsights: 0
  });

  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch KPI Data
      const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true });
      const { count: surveyCount } = await supabase.from('initial_survey_results').select('*', { count: 'exact', head: true });
      const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true });
      const { count: insightCount } = await supabase.from('chatbot_insights').select('*', { count: 'exact', head: true }).eq('urgency_level', 'critical');

      setStats({
        totalEmployees: empCount || 0,
        surveysCompleted: surveyCount || 0,
        totalReports: reportCount || 0,
        criticalInsights: insightCount || 0
      });

      // Fetch Survey Data and Employees to combine
      const { data: empData } = await supabase.from('employees').select('*, initial_survey_results(*)');
      
      if (empData) {
        // Extract results from employees who completed the survey
        const results = empData
          .filter(e => e.initial_survey_results && e.initial_survey_results.length > 0)
          .map(e => ({
            ...e.initial_survey_results[0],
            employee_name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Sin nombre',
            department: e.department || 'Sin asignar'
          }));

        if (results.length > 0) {
          // Agrupar los resultados por color en cada dimensión para el gráfico
          const dimensions = [
            { name: '1. Exigencias', dim: 1, key: 'dim1_score' },
            { name: '2. Trabajo Activo', dim: 2, key: 'dim2_score' },
            { name: '3. Inseguridad', dim: 3, key: 'dim3_score' },
            { name: '4. Apoyo Social', dim: 4, key: 'dim4_score' },
            { name: '5. Doble Presencia', dim: 5, key: 'dim5_score' },
            { name: '6. Estima', dim: 6, key: 'dim6_score' },
          ];

          const chartData = dimensions.map(d => {
            let verde = 0, amarillo = 0, rojo = 0;
            results.forEach(res => {
              const color = getRiskColor(d.dim, res[d.key]);
              if (color === 'verde') verde++;
              else if (color === 'amarillo') amarillo++;
              else rojo++;
            });
            return { name: d.name, Verde: verde, Amarillo: amarillo, Rojo: rojo };
          });

          setSurveyData(chartData);
          setDetailedData(results);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Panel de Control HR</h2>
          <p className="text-slate-500 mt-2 text-sm">Monitoreo general de clima laboral, reportes y métricas de riesgo psicosocial.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Empleados" value={stats.totalEmployees} icon={Users} color="bg-[#00A67E]" />
        <StatCard title="Encuestas Base" value={stats.surveysCompleted} icon={FileText} color="bg-[#008F6A]" />
        <StatCard title="Reportes Activos" value={stats.totalReports} icon={TrendingUp} color="bg-slate-700" />
        <StatCard title="Alertas Críticas" value={stats.criticalInsights} icon={AlertTriangle} color="bg-rose-600" />
      </div>

      {/* Charts Section */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00A67E]"></div>
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Estado Psicosocial de la Organización</h3>
            <p className="text-slate-500 text-sm mt-1">Análisis de la distribución del personal según el nivel de riesgo del test ISTAS-21</p>
          </div>
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('chart')}
              className={`px-5 py-2 text-sm font-semibold rounded transition-all ${viewMode === 'chart' ? 'bg-[#00A67E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Vista Gráfica
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-5 py-2 text-sm font-semibold rounded transition-all ${viewMode === 'table' ? 'bg-[#00A67E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Matriz Detallada
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A67E]"></div>
            <p className="text-slate-400 text-sm mt-4">Analizando métricas...</p>
          </div>
        ) : surveyData.length > 0 ? (
          <>
            {viewMode === 'chart' ? (
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={surveyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13, fontWeight: 500}} angle={-20} textAnchor="end" />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend wrapperStyle={{paddingTop: '20px', fontWeight: 500}} />
                    <Bar dataKey="Verde" name="Riesgo Bajo" stackId="a" fill={COLORS.verde} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Amarillo" name="Riesgo Medio" stackId="a" fill={COLORS.amarillo} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Rojo" name="Riesgo Alto" stackId="a" fill={COLORS.rojo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Colaborador</th>
                      <th className="px-4 py-4 font-semibold text-center" title="1. Exigencias Psicológicas">Exigencias</th>
                      <th className="px-4 py-4 font-semibold text-center" title="2. Trabajo Activo y Desarrollo">Trabajo Activo</th>
                      <th className="px-4 py-4 font-semibold text-center" title="3. Inseguridad sobre el futuro">Inseguridad</th>
                      <th className="px-4 py-4 font-semibold text-center" title="4. Apoyo Social y Calidad Liderazgo">Apoyo Social</th>
                      <th className="px-4 py-4 font-semibold text-center" title="5. Doble Presencia">Doble Presencia</th>
                      <th className="px-4 py-4 font-semibold text-center" title="6. Estima">Estima</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-slate-800">{row.employee_name}</p>
                          <p className="text-xs text-slate-500 mt-1">{row.department}</p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={1} score={row.dim1_score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={2} score={row.dim2_score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={3} score={row.dim3_score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={4} score={row.dim4_score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={5} score={row.dim5_score} />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <ScoreBadge dim={6} score={row.dim6_score} />
                        </td>
                      </tr>
                    ))}
                    {detailedData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                          <FileText className="h-8 w-8 mx-auto mb-3 opacity-30" />
                          <p>No se encontraron resultados detallados en el sistema.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-slate-400">
            <FileText className="h-12 w-12 mb-4 opacity-50 text-[#00A67E]" />
            <p className="font-medium text-slate-500">Aún no hay datos de encuestas disponibles para el análisis.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm flex items-center group hover:border-[#00A67E]/50 transition-colors">
      <div className={`${color} p-4 rounded text-white mr-5 shadow-sm transform group-hover:scale-105 transition-transform`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">{title}</p>
        <h4 className="text-3xl font-extrabold text-slate-800">{value}</h4>
      </div>
    </div>
  );
}
