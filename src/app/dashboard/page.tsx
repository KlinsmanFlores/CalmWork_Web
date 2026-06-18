"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell 
} from "recharts";
import { Users, FileText, AlertTriangle, TrendingUp, Activity, BrainCircuit, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    totalReports: 0,
    reportsThisMonth: 0,
    topDept: '',
    topModule: '',
    avgWellbeing: 0,
    urgentCases: 0,
  });
  
  const [alerts, setAlerts] = useState<string[]>([]);
  const [riskIndexData, setRiskIndexData] = useState<any[]>([]);
  const [monthlyEvolution, setMonthlyEvolution] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // 1. Fetch raw data
      const { data: employees } = await supabase.from('employees').select('*');
      const { data: reports } = await supabase.from('reports').select('*');
      const { data: insights } = await supabase.from('chatbot_insights').select('*, chatbot_sessions(department)');
      const { data: surveys } = await supabase.from('initial_survey_results').select('*, employees(department)');

      // Process KPIs
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let reportsThisMonth = 0;
      const deptCounts: Record<string, number> = {};
      const moduleCounts: Record<string, number> = {};
      
      if (reports) {
        reports.forEach(r => {
          const d = new Date(r.created_at);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) reportsThisMonth++;
          
          const dept = r.department;
          if (dept && dept !== 'Sin asignar') deptCounts[dept] = (deptCounts[dept] || 0) + 1;
          
          moduleCounts[r.module_id] = (moduleCounts[r.module_id] || 0) + 1;
        });
      }

      const topDept = Object.keys(deptCounts).sort((a, b) => deptCounts[b] - deptCounts[a])[0] || 'N/A';
      
      // Mock module names mapping
      const modMap: Record<string, string> = {
        '92955f3d-519c-4977-84bc-de4a06d15655': 'Acoso Laboral',
        'c62ed6d5-acde-4c06-9d00-9c1fb8e94146': 'Sobrecarga de Trabajo',
        '43a5c0b0-3375-474c-83b5-31f0e4b85750': 'Problemas Personales',
        'c16cdcf9-22a7-47b2-8c9e-649ea94d03e5': 'Discriminación',
        '271386a0-4ba4-494c-bbea-bb13aec166d4': 'Mejoras y Sugerencias'
      };
      const topModuleId = Object.keys(moduleCounts).sort((a, b) => moduleCounts[b] - moduleCounts[a])[0];
      const topModule = topModuleId ? (modMap[topModuleId] || 'Otros') : 'N/A';

      let urgentCases = 0;
      let totalSentiment = 0;
      if (insights) {
        insights.forEach(i => {
          if (i.urgency_level === 'critical' || i.urgency_level === 'high') urgentCases++;
          totalSentiment += i.sentiment_score || 0;
        });
      }
      const avgSentiment = insights && insights.length > 0 ? (totalSentiment / insights.length) : 0;

      // Surveys average well-being (approx based on dim1 to dim6)
      let totalSurveyScore = 0;
      if (surveys) {
        surveys.forEach(s => {
          totalSurveyScore += ((s.dim1_score + s.dim2_score + s.dim3_score + s.dim4_score + s.dim5_score + s.dim6_score) / 6);
        });
      }
      const avgWellbeing = surveys && surveys.length > 0 ? (totalSurveyScore / surveys.length).toFixed(1) : '0';

      setKpis({
        totalEmployees: employees ? employees.length : 0,
        totalReports: reports ? reports.length : 0,
        reportsThisMonth,
        topDept,
        topModule,
        avgWellbeing: Number(avgWellbeing),
        urgentCases
      });

      // Process Alerts
      const newAlerts: string[] = [];
      if (urgentCases >= 5) newAlerts.push(`Se han detectado ${urgentCases} casos marcados como urgentes o críticos por la IA.`);
      if (avgSentiment > 0 && avgSentiment < 4) newAlerts.push(`El sentimiento promedio organizacional está por debajo del límite (Puntaje: ${avgSentiment.toFixed(1)}/10).`);
      
      const lastWeekReports = reports ? reports.filter(r => (now.getTime() - new Date(r.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000).length : 0;
      if (lastWeekReports >= 10) newAlerts.push(`Se han registrado más de 10 reportes generales en la última semana.`);
      
      setAlerts(newAlerts.length > 0 ? newAlerts : ["El sistema no detecta anomalías urgentes automáticas en este momento."]);

      // Calculate Risk Index per Department
      const deptRisk: Record<string, { reps: number, sents: number, sentsCount: number, surveyScores: number, surveyCount: number }> = {};
      
      if (employees) {
        employees.forEach(e => {
          if (!e.department || e.department === 'Sin asignar') return;
          if (!deptRisk[e.department]) deptRisk[e.department] = { reps: 0, sents: 0, sentsCount: 0, surveyScores: 0, surveyCount: 0 };
        });
      }

      if (reports) {
        reports.forEach(r => {
          if (r.department && deptRisk[r.department]) deptRisk[r.department].reps++;
        });
      }

      if (insights) {
        insights.forEach(i => {
          const dept = i.chatbot_sessions?.department;
          if (dept && deptRisk[dept]) {
            deptRisk[dept].sents += (10 - (i.sentiment_score || 5)); // Invert so high is bad
            deptRisk[dept].sentsCount++;
          }
        });
      }

      if (surveys) {
        surveys.forEach(s => {
          const dept = s.employees?.department;
          if (dept && deptRisk[dept]) {
            // Very simplified risk approximation from scores
            const score = (s.dim1_score + s.dim3_score + s.dim5_score) - (s.dim2_score + s.dim4_score + s.dim6_score);
            deptRisk[dept].surveyScores += score > 0 ? score : 0;
            deptRisk[dept].surveyCount++;
          }
        });
      }

      const riskData = Object.keys(deptRisk).map(dept => {
        const d = deptRisk[dept];
        const repFactor = Math.min(d.reps * 5, 100);
        const sentFactor = d.sentsCount > 0 ? Math.min((d.sents / d.sentsCount) * 10, 100) : 0;
        const survFactor = d.surveyCount > 0 ? Math.min((d.surveyScores / d.surveyCount) * 5, 100) : 0;
        
        // IR (Índice de Riesgo) = 40% Reports + 40% Sentiment + 20% Surveys
        const IR = (repFactor * 0.4) + (sentFactor * 0.4) + (survFactor * 0.2);
        
        return {
          department: dept,
          "Índice Riesgo Psicosocial": Math.round(IR)
        };
      }).sort((a, b) => b["Índice Riesgo Psicosocial"] - a["Índice Riesgo Psicosocial"]);

      setRiskIndexData(riskData.slice(0, 5)); // Top 5

      // Monthly Evolution
      const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const monthlyCounts: Record<string, { reportes: number, alertas: number }> = {};
      
      if (reports) {
        reports.forEach(r => {
          const m = months[new Date(r.created_at).getMonth()];
          if (!monthlyCounts[m]) monthlyCounts[m] = { reportes: 0, alertas: 0 };
          monthlyCounts[m].reportes++;
        });
      }

      if (insights) {
        insights.forEach(i => {
          const m = months[new Date(i.created_at).getMonth()];
          if (!monthlyCounts[m]) monthlyCounts[m] = { reportes: 0, alertas: 0 };
          monthlyCounts[m].alertas++;
        });
      }

      const evoData = Object.keys(monthlyCounts).map(m => ({
        mes: m,
        Reportes: monthlyCounts[m].reportes,
        AlertasIA: monthlyCounts[m].alertas
      }));

      // Sort according to actual months
      evoData.sort((a, b) => months.indexOf(a.mes) - months.indexOf(b.mes));
      setMonthlyEvolution(evoData);
      
      setLoading(false);
    }

    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Resumen Ejecutivo</h2>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246672]"></div>
          <p className="text-slate-400 text-sm mt-4">Procesando índice de riesgo...</p>
        </div>
      ) : (
        <>
          {/* Alertas Automáticas */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-5">
            <h3 className="text-rose-800 font-bold flex items-center mb-3">
              <Bell className="h-5 w-5 mr-2" /> Alertas Automáticas del Sistema
            </h3>
            <ul className="space-y-2">
              {alerts.map((a, idx) => (
                <li key={idx} className="text-rose-700 text-sm flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" /> {a}
                </li>
              ))}
            </ul>
          </div>

          {/* Grid Principal de KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Colaboradores</p>
              <h4 className="text-3xl font-extrabold text-slate-800">{kpis.totalEmployees}</h4>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Reportes</p>
              <h4 className="text-3xl font-extrabold text-slate-800">{kpis.totalReports}</h4>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-[#6AB2BB]">
              <p className="text-xs text-[#246672] font-bold uppercase tracking-wider mb-1">Reportes Este Mes</p>
              <h4 className="text-3xl font-extrabold text-[#246672]">{kpis.reportsThisMonth}</h4>
            </div>
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
              <p className="text-xs text-rose-600 font-bold uppercase tracking-wider mb-1">Casos Urgentes (IA)</p>
              <h4 className="text-3xl font-extrabold text-rose-600">{kpis.urgentCases}</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 shadow-sm text-white">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Dpto. Más Afectado</p>
              <h4 className="text-xl font-bold truncate" title={kpis.topDept}>{kpis.topDept}</h4>
            </div>
            <div className="bg-[#246672] p-5 rounded-lg border border-[#1e545e] shadow-sm text-white">
              <p className="text-xs text-teal-200 font-bold uppercase tracking-wider mb-1">Módulo Más Usado</p>
              <h4 className="text-xl font-bold truncate" title={kpis.topModule}>{kpis.topModule}</h4>
            </div>
            <div className="bg-emerald-600 p-5 rounded-lg border border-emerald-700 shadow-sm text-white">
              <p className="text-xs text-emerald-200 font-bold uppercase tracking-wider mb-1">Nivel Bienestar COPSOQ</p>
              <h4 className="text-xl font-bold">{kpis.avgWellbeing} <span className="text-sm font-normal opacity-70">pts</span></h4>
            </div>
          </div>

          {/* Gráficos de Índice de Riesgo y Evolución */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Índice de Riesgo Psicosocial (IRP)</h3>
                <p className="text-xs text-slate-500 mt-1">Combinación ponderada de: Reportes (40%) + Sentimiento IA (40%) + Encuestas (20%)</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={riskIndexData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="department" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} width={120} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}} 
                      contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}}
                      formatter={(value: any) => [`${value}% Nivel de Riesgo`, 'IRP']}
                    />
                    <Bar dataKey="Índice Riesgo Psicosocial" radius={[0, 4, 4, 0]} barSize={25}>
                      {riskIndexData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry["Índice Riesgo Psicosocial"] > 60 ? '#ef4444' : entry["Índice Riesgo Psicosocial"] > 30 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Evolución Mensual de Problemas</h3>
                <p className="text-xs text-slate-500 mt-1">Comparativa de reportes manuales vs alertas automáticas detectadas por IA.</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyEvolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                    <Line type="monotone" dataKey="Reportes" stroke="#246672" strokeWidth={3} dot={{r: 4, fill: '#246672'}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="AlertasIA" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#ef4444'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
