"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, BrainCircuit, Activity, Download, MessageCircle, BarChart2, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts";
import * as XLSX from "xlsx";

export default function InsightsOverview() {
  const [insightsList, setInsightsList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [urgencyTrendData, setUrgencyTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filter States
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: insights } = await supabase
        .from('chatbot_insights')
        .select('*, chatbot_sessions(department)')
        .order('created_at', { ascending: false });
      
      if (insights) {
        const list = insights.map(i => ({
          id: i.id,
          date: new Date(i.created_at).toLocaleDateString(),
          monthKey: `${new Date(i.created_at).getFullYear()}-${String(new Date(i.created_at).getMonth() + 1).padStart(2, '0')}`,
          department: i.chatbot_sessions?.department || 'Sin asignar',
          topic: i.topic_detected || 'Tema desconocido',
          summary: i.ai_summary || 'Sin resumen',
          sentiment: i.sentiment_score || 0,
          urgency: i.urgency_level || 'low',
          status: i.status || 'unread',
          recommendations: Array.isArray(i.recommendations) ? i.recommendations : []
        }));
        
        // Calculate Analytics
        let totalSent = 0;
        let criticalCases = 0;
        const topicCounts: Record<string, number> = {};
        const sentimentDist = { negativo: 0, neutro: 0, positivo: 0 };
        const urgencyMonthly: Record<string, { urgentes: number, normales: number }> = {};

        list.forEach(i => {
          totalSent += i.sentiment;
          if (i.urgency === 'critical' || i.urgency === 'high') criticalCases++;
          topicCounts[i.topic] = (topicCounts[i.topic] || 0) + 1;

          // Sentiment Distribution
          if (i.sentiment <= 3) sentimentDist.negativo++;
          else if (i.sentiment <= 6) sentimentDist.neutro++;
          else sentimentDist.positivo++;

          // Urgency Trend Data
          if (!urgencyMonthly[i.monthKey]) urgencyMonthly[i.monthKey] = { urgentes: 0, normales: 0 };
          if (i.urgency === 'critical' || i.urgency === 'high') {
            urgencyMonthly[i.monthKey].urgentes++;
          } else {
            urgencyMonthly[i.monthKey].normales++;
          }
        });





        // Urgency Monthly Processing
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const utData = Object.keys(urgencyMonthly).sort().map(k => {
          const [y, m] = k.split('-');
          return {
            name: `${months[parseInt(m)-1]} ${y}`,
            Urgentes: urgencyMonthly[k].urgentes,
            Normales: urgencyMonthly[k].normales
          };
        });
        setUrgencyTrendData(utData);

        setAnalytics({
          avgSentiment: list.length > 0 ? (totalSent / list.length).toFixed(1) : 0,
          criticalCases,
          totalCases: list.length
        });

        setInsightsList(list);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const filteredList = insightsList.filter(i => urgencyFilter === 'all' || i.urgency === urgencyFilter);
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUrgencyFilter(e.target.value);
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    if (insightsList.length === 0) return;
    const exportData = insightsList.map(i => ({
      "Fecha": i.date,
      "Departamento": i.department,
      "Tema Principal": i.topic,
      "Nivel de Urgencia": i.urgency === 'critical' ? 'Crítica' : i.urgency === 'high' ? 'Alta' : i.urgency === 'medium' ? 'Media' : 'Baja',
      "Puntaje Sentimiento (1-10)": i.sentiment,
      "Resumen IA": i.summary
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Alertas_IA");
    XLSX.writeFile(workbook, "Alertas_IA_CalmWORK.xlsx");
  };

  const getUrgencyColor = (level: string) => {
    if (level === 'critical') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (level === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'medium') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getSentimentColor = (score: number) => {
    if (score <= 3) return 'text-rose-600 font-bold';
    if (score <= 6) return 'text-amber-600 font-semibold';
    return 'text-emerald-600 font-semibold';
  };



  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Análisis Organizacional</h2>
        </div>
        <button
          onClick={exportToExcel}
          disabled={insightsList.length === 0}
          className="flex items-center bg-[#6AB2BB] hover:bg-[#246672] disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar a Excel
        </button>
      </div>

      {/* KPI & Analytics */}
      {!loading && analytics && (
        <>


          {/* Bottom Row: Stacked Bars */}
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-rose-500"></div>
              <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Activity className="h-5 w-5 text-rose-500 mr-2" />
                    Casos Urgentes vs Normales (Tendencia)
                  </h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={urgencyTrendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                    <Legend wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="Normales" stackId="a" fill="#6AB2BB" radius={[0, 0, 0, 0]} barSize={40} />
                    <Bar dataKey="Urgentes" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tabla Original */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2 text-[#6AB2BB]" />
            <h3 className="text-lg font-bold text-slate-800">
              Bandeja Detallada de Alertas
            </h3>
            <span className="ml-3 text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">
              {filteredList.length} {filteredList.length === 1 ? 'Alerta' : 'Alertas'} detectadas
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select 
              value={urgencyFilter}
              onChange={handleFilterChange}
              className="text-sm border border-slate-300 rounded-md py-1.5 px-3 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6AB2BB] focus:border-transparent cursor-pointer"
            >
              <option value="all">Todas las urgencias</option>
              <option value="critical">Crítica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6AB2BB]"></div>
          </div>
        ) : filteredList.length > 0 ? (
          <>
            <div className="divide-y divide-slate-100 p-2">
              {paginatedList.map((i, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50 transition-colors rounded-xl m-2 border border-transparent hover:border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border shadow-sm ${getUrgencyColor(i.urgency)} uppercase tracking-wider`}>
                      {i.urgency === 'critical' ? 'Crítica' : i.urgency === 'high' ? 'Alta' : i.urgency === 'medium' ? 'Media' : 'Baja'}
                    </span>
                    <span className="text-sm text-slate-500 font-medium">{i.date}</span>
                    <span className="text-sm bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">{i.department}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Sentimiento</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Activity className={`h-4 w-4 ${getSentimentColor(i.sentiment)}`} />
                      <span className={`text-lg leading-none ${getSentimentColor(i.sentiment)}`}>{i.sentiment}/10</span>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold text-slate-800 mb-2">{i.topic}</h4>
                <p className="text-slate-600 text-sm leading-relaxed mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="font-semibold block mb-1 text-slate-700">Resumen IA:</span>
                  {i.summary}
                </p>

                {i.recommendations.length > 0 && (
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 block">Recomendaciones sugeridas</span>
                    <ul className="flex flex-wrap gap-2">
                      {i.recommendations.map((rec: string, rIdx: number) => (
                        <li key={rIdx} className="text-xs bg-[#EAF5F7] text-[#246672] px-3 py-1.5 rounded-md font-medium border border-[#CBEAF1]">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm text-slate-500">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredList.length)} de {filteredList.length} alertas
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-medium text-slate-700 px-2">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
           <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <BrainCircuit className="h-12 w-12 mb-4 opacity-30 text-[#6AB2BB]" />
            <p className="font-medium text-slate-500">No hay alertas generadas por el Asistente IA.</p>
          </div>
        )}
      </div>
    </div>
  );
}
