"use client";

import { useState, useEffect } from "react";
import { Inbox, AlertTriangle, BrainCircuit, CheckCircle2, ChevronRight, Activity, Users } from "lucide-react";

import { supabase } from "@/lib/supabase";

export default function AlertsInboxPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    async function fetchAlerts() {
      setLoadingAlerts(true);
      const { data: reports } = await supabase.from('reports').select('*');
      const { data: insights } = await supabase.from('chatbot_insights').select('*, chatbot_sessions(department)');
      const { data: surveys } = await supabase.from('initial_survey_results').select('*, employees(department)');

      const generatedAlerts: any[] = [];
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // 1. Pico de Exigencias Psicológicas
      if (surveys) {
        const deptScores: Record<string, { total: number, rojo: number }> = {};
        surveys.forEach(s => {
          const dept = s.employees?.department;
          if (!dept || dept === 'Sin asignar') return;
          if (!deptScores[dept]) deptScores[dept] = { total: 0, rojo: 0 };
          deptScores[dept].total++;
          if (s.dim1_score >= 12) { // Approximate threshold for high psychological demands
            deptScores[dept].rojo++;
          }
        });

        Object.keys(deptScores).forEach(dept => {
          const stats = deptScores[dept];
          if (stats.total >= 1 && (stats.rojo / stats.total) >= 0.4) {
            generatedAlerts.push({
              id: `alrt-dim1-${dept}`,
              title: `Pico de Exigencias Psicológicas`,
              department: dept,
              description: `El ${Math.round((stats.rojo/stats.total)*100)}% del equipo evaluado de ${dept} ha reportado 'Exigencias Psicológicas' en nivel crítico.`,
              urgency: "critical",
              date: new Date().toLocaleDateString(),
              metrics: { affected: stats.rojo, total: stats.total }
            });
          }
        });
      }

      // 2. Acumulación de Incidencias
      if (reports) {
        const deptReports: Record<string, number> = {};
        let totalRecent = 0;
        reports.forEach(r => {
          const dept = r.department;
          if (!dept || dept === 'Sin asignar') return;
          if (r.status === 'resolved') return; // Excluir reportes ya resueltos
          if (new Date(r.created_at) >= last7Days) {
            deptReports[dept] = (deptReports[dept] || 0) + 1;
            totalRecent++;
          }
        });

        Object.keys(deptReports).forEach(dept => {
          if (deptReports[dept] >= 2) {
            generatedAlerts.push({
              id: `alrt-rep-${dept}`,
              title: `Acumulación de Incidencias Múltiples`,
              department: dept,
              description: `Se han registrado ${deptReports[dept]} reportes en este departamento en los últimos 7 días.`,
              urgency: "high",
              date: new Date().toLocaleDateString(),
              metrics: { affected: deptReports[dept], total: totalRecent }
            });
          }
        });
      }

      // 3. Alertas críticas IA
      if (insights) {
        const deptInsights: Record<string, number> = {};
        let totalInsights = 0;
        insights.forEach(i => {
          const dept = i.chatbot_sessions?.department;
          if (!dept || dept === 'Sin asignar') return;
          if (i.status === 'resolved') return; // Excluir alertas de IA resueltas
          if ((i.urgency_level === 'critical' || i.urgency_level === 'high') && new Date(i.created_at) >= last7Days) {
            deptInsights[dept] = (deptInsights[dept] || 0) + 1;
            totalInsights++;
          }
        });

        Object.keys(deptInsights).forEach(dept => {
          if (deptInsights[dept] >= 1) {
            generatedAlerts.push({
              id: `alrt-ia-${dept}`,
              title: `Alerta Temprana: Sentimiento Crítico`,
              department: dept,
              description: `El chatbot de IA ha detectado ${deptInsights[dept]} conversaciones con nivel de urgencia crítica o alta recientemente.`,
              urgency: "medium",
              date: new Date().toLocaleDateString(),
              metrics: { affected: deptInsights[dept], total: totalInsights }
            });
          }
        });
      }

      setAlerts(generatedAlerts);
      setLoadingAlerts(false);
    }

    fetchAlerts();
  }, []);
  const [aiPlans, setAiPlans] = useState<Record<string, any>>({});

  const handleGeneratePlan = async (alert: any) => {
    if (aiPlans[alert.id]) return; // Ya generado

    setLoadingAI(alert.id);
    try {
      const response = await fetch('/api/generate-action-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertContext: alert })
      });

      const data = await response.json();
      
      if (data.success) {
        setAiPlans(prev => ({ ...prev, [alert.id]: data.plan }));
      }
    } catch (error) {
      console.error("Error generating AI plan:", error);
    } finally {
      setLoadingAI(null);
    }
  };

  const getUrgencyColors = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'medium': return 'bg-amber-50 border-amber-200 text-amber-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'critical': return <span className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold uppercase rounded shadow-sm">Crítica</span>;
      case 'high': return <span className="px-2 py-1 bg-orange-500 text-white text-[10px] font-bold uppercase rounded shadow-sm">Alta</span>;
      case 'medium': return <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase rounded shadow-sm">Media</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight flex items-center">
            <Inbox className="w-8 h-8 mr-3 text-teal-600" />
            Buzón de Análisis y Alertas
          </h2>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            Este buzón monitorea continuamente todas las métricas, encuestas e incidencias de la empresa usando reglas de negocio. 
            <strong> La IA solo se activa bajo demanda</strong> cuando se detecta una emergencia, para generar un plan de acción sugerido y ahorrar costos operativos.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 px-4 py-2 rounded-xl border border-teal-100">
          <Activity className="w-5 h-5 text-teal-600 animate-pulse" />
          <span className="text-sm font-bold text-teal-800">Motor de Reglas: Activo</span>
        </div>
      </div>

      <div className="space-y-4">
        {loadingAlerts ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-4"></div>
            <p>Calculando alertas mediante reglas lógicas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <CheckCircle2 className="h-12 w-12 mb-4 opacity-30 text-teal-600" />
            <p className="font-medium text-slate-500">Todo en orden. No hay alertas críticas detectadas en el sistema.</p>
          </div>
        ) : alerts.map((alert) => {
          const isGenerating = loadingAI === alert.id;
          const hasPlan = !!aiPlans[alert.id];
          const plan = aiPlans[alert.id];

          return (
            <div key={alert.id} className={`rounded-2xl border transition-all duration-300 shadow-sm ${hasPlan ? 'bg-white border-slate-200' : getUrgencyColors(alert.urgency)}`}>
              
              {/* Tarjeta de Alerta (Header) */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {getUrgencyBadge(alert.urgency)}
                    <span className="text-xs font-semibold text-slate-500 bg-white/60 px-2 py-1 rounded border border-slate-200/50">
                      {alert.date}
                    </span>
                    <span className="text-xs font-bold text-[#246672] bg-[#246672]/10 px-2 py-1 rounded flex items-center">
                      <Users className="w-3 h-3 mr-1" /> {alert.department}
                    </span>
                  </div>
                  {hasPlan && (
                    <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Plan Generado
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold mb-2 flex items-center">
                  {!hasPlan && <AlertTriangle className="w-5 h-5 mr-2 opacity-70" />}
                  {alert.title}
                </h3>
                
                <p className="text-sm font-medium opacity-80 mb-6 max-w-3xl leading-relaxed">
                  {alert.description}
                  <br/>
                  <span className="inline-block mt-2 font-bold text-xs bg-black/5 px-2 py-1 rounded">
                    Afectación: {alert.metrics.affected} de {alert.metrics.total} trabajadores.
                  </span>
                </p>

                {/* Botón Trigger IA */}
                {!hasPlan && (
                  <button
                    onClick={() => handleGeneratePlan(alert)}
                    disabled={isGenerating}
                    className="flex items-center bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all group"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white mr-2"></div>
                        Analizando contexto con IA...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-5 h-5 mr-2 text-teal-400 group-hover:animate-pulse" />
                        Generar Plan de Acción con IA
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Sección del Plan de Acción IA */}
              {hasPlan && (
                <div className="border-t border-slate-100 bg-slate-50 p-6 rounded-b-2xl">
                  <div className="flex items-center mb-4 text-[#246672]">
                    <BrainCircuit className="w-6 h-6 mr-2" />
                    <h4 className="text-lg font-extrabold">Plan de Intervención Sugerido (IA)</h4>
                  </div>
                  
                  <div className="space-y-4">
                    {plan.map((step: any, index: number) => (
                      <div key={index} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-start">
                        <div className="bg-teal-100 text-teal-700 font-black rounded-lg w-8 h-8 flex items-center justify-center shrink-0 mr-4">
                          {step.step}
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 mb-1">{step.action}</h5>
                          <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center">
                      Asignar este plan a Seguridad <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          );
        })}
      </div>
    </div>
  );
}
