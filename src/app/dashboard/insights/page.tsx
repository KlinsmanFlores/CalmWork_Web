"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertCircle, MessageSquareWarning, Clock, CheckCircle } from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      const { data } = await supabase
        .from('chatbot_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setInsights(data);
      setLoading(false);
    }
    fetchInsights();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getUrgencyLabel = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'CRÍTICO';
      case 'high': return 'ALTO';
      case 'medium': return 'MEDIO';
      default: return 'BAJO';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Alertas de IA (Chatbot)</h2>
        <p className="text-slate-500">Resúmenes generados automáticamente por la IA a partir de las conversaciones anónimas.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
            <MessageSquareWarning className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No hay alertas de IA por el momento.</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              {/* Urgency Sidebar */}
              <div className={`w-full md:w-32 flex flex-row md:flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-100 ${
                insight.urgency_level === 'critical' || insight.urgency_level === 'high' ? 'bg-slate-50' : ''
              }`}>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getUrgencyColor(insight.urgency_level)}`}>
                  {getUrgencyLabel(insight.urgency_level)}
                </span>
                <div className="ml-4 md:ml-0 md:mt-4 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Puntaje</p>
                  <p className="text-2xl font-black text-slate-800">{insight.sentiment_score}/10</p>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-800">{insight.topic_detected || 'Tema Desconocido'}</h3>
                  <div className="flex items-center text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(insight.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  {insight.ai_summary}
                </p>
                
                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <span className={`flex items-center text-sm font-medium ${insight.status === 'unread' ? 'text-blue-600' : 'text-slate-400'}`}>
                    {insight.status === 'unread' ? (
                      <><AlertCircle className="w-4 h-4 mr-1.5" /> No Leído</>
                    ) : (
                      <><CheckCircle className="w-4 h-4 mr-1.5" /> Revisado</>
                    )}
                  </span>
                  {insight.status === 'unread' && (
                    <button className="text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
                      Marcar como revisado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
