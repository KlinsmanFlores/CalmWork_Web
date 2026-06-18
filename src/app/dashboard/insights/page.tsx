"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, BrainCircuit, Activity, Download, MessageCircle, BarChart2, Flame } from "lucide-react";
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts";
import * as XLSX from "xlsx";

export default function InsightsOverview() {
  const [insightsList, setInsightsList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [urgencyTrendData, setUrgencyTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        const deptSentiment: Record<string, { sum: number, count: number }> = {};
        const urgencyMonthly: Record<string, { urgentes: number, normales: number }> = {};

        list.forEach(i => {
          totalSent += i.sentiment;
          if (i.urgency === 'critical' || i.urgency === 'high') criticalCases++;
          topicCounts[i.topic] = (topicCounts[i.topic] || 0) + 1;

          // Heatmap Data (Sentiment by Dept)
          const dept = i.department;
          if (dept && dept !== 'Sin asignar') {
            if (!deptSentiment[dept]) deptSentiment[dept] = { sum: 0, count: 0 };
            deptSentiment[dept].sum += i.sentiment;
            deptSentiment[dept].count++;
          }

          // Urgency Trend Data
          if (!urgencyMonthly[i.monthKey]) urgencyMonthly[i.monthKey] = { urgentes: 0, normales: 0 };
          if (i.urgency === 'critical' || i.urgency === 'high') {
            urgencyMonthly[i.monthKey].urgentes++;
          } else {
            urgencyMonthly[i.monthKey].normales++;
          }
        });

        // Pareto Chart Data
        const sortedTopics = Object.keys(topicCounts).map(t => ({
          name: t,
          count: topicCounts[t]
        })).sort((a, b) => b.count - a.count);

        let cumulative = 0;
        const totalTopicsCount = sortedTopics.reduce((acc, curr) => acc + curr.count, 0);
        const paretoData = sortedTopics.map(t => {
          cumulative += t.count;
          return {
            ...t,
            cumulativePercentage: Math.round((cumulative / totalTopicsCount) * 100)
          };
        }).slice(0, 7);

        // Heatmap Processing
        const hmData = Object.keys(deptSentiment).map(d => ({
          department: d,
          avgSentiment: Math.round((deptSentiment[d].sum / deptSentiment[d].count) * 10) / 10
        }));
        setHeatmapData(hmData);

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
          totalCases: list.length,
          paretoData
        });

        setInsightsList(list);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

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

  // Heatmap Color Generator (1-10 scale. Lower = Redder, Higher = Greener)
  const getHeatmapBg = (score: number) => {
    if (score <= 3) return 'bg-rose-500';
    if (score <= 4) return 'bg-rose-400';
    if (score <= 5) return 'bg-orange-400';
    if (score <= 6) return 'bg-amber-300';
    if (score <= 7) return 'bg-lime-400';
    if (score <= 8) return 'bg-emerald-400';
    return 'bg-emerald-600';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Alertas Predictivas IA</h2>
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
          {/* Top Row: KPIs and Pareto */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center group">
                  <div className="bg-slate-700 p-4 rounded text-white mr-5 shadow-sm"><MessageCircle size={24} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Evaluaciones IA</p>
                    <h4 className="text-3xl font-extrabold text-slate-800">{analytics.totalCases}</h4>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center group">
                  <div className="bg-rose-500 p-4 rounded text-white mr-5 shadow-sm"><AlertTriangle size={24} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Casos Urgentes</p>
                    <h4 className="text-3xl font-extrabold text-rose-600">{analytics.criticalCases}</h4>
                  </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center group">
                  <div className="bg-amber-500 p-4 rounded text-white mr-5 shadow-sm"><Activity size={24} /></div>
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Sentimiento Global</p>
                    <h4 className="text-3xl font-extrabold text-slate-800">{analytics.avgSentiment} <span className="text-sm text-slate-400 font-medium">/ 10</span></h4>
                  </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#246672]"></div>
              <div className="flex items-center mb-4">
                  <BarChart2 className="h-5 w-5 text-[#246672] mr-2" />
                  <h3 className="text-lg font-bold text-slate-800">Top Problemas Detectados (Pareto)</h3>
              </div>
              <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={analytics.paretoData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} angle={-15} textAnchor="end" />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} domain={[0, 100]} />
                      <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                      <Legend wrapperStyle={{paddingTop: '20px'}} />
                      <Bar yAxisId="left" dataKey="count" name="Frecuencia" fill="#6AB2BB" radius={[4, 4, 0, 0]} barSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" name="% Acumulado" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b'}} />
                    </ComposedChart>
                  </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row: Heatmap & Stacked Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <Flame className="h-5 w-5 text-amber-500 mr-2" />
                    Heatmap de Sentimiento (Por Área)
                  </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {heatmapData.map((d, idx) => (
                  <div key={idx} className={`${getHeatmapBg(d.avgSentiment)} p-4 rounded-lg flex flex-col justify-center items-center text-white shadow-sm transition-transform hover:scale-105`}>
                    <span className="text-2xl font-extrabold">{d.avgSentiment}</span>
                    <span className="text-xs font-medium uppercase tracking-wider mt-1 text-center bg-black/10 px-2 py-1 rounded w-full truncate" title={d.department}>{d.department}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Rojo: Negativo (0-4)</span>
                <span>Amarillo: Neutro (5-6)</span>
                <span>Verde: Positivo (7-10)</span>
              </div>
            </div>

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
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2 text-[#6AB2BB]" />
            Bandeja Detallada de Alertas
          </h3>
          <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-medium">
            {insightsList.length} Alertas detectadas
          </span>
        </div>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6AB2BB]"></div>
          </div>
        ) : insightsList.length > 0 ? (
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto p-2">
            {insightsList.map((i, idx) => (
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
