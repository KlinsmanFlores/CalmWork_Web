"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell 
} from "recharts";
import { Users, FileText, AlertTriangle, TrendingUp, Download } from "lucide-react";
import * as XLSX from "xlsx";

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

export default function CopsoqOverview() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    surveysCompleted: 0,
    totalReports: 0,
    criticalInsights: 0
  });

  const [surveyData, setSurveyData] = useState<any[]>([]);
  const [detailedData, setDetailedData] = useState<any[]>([]);
  const [avgData, setAvgData] = useState<any>({});
  const [criticalDim, setCriticalDim] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [selectedDimIdx, setSelectedDimIdx] = useState<number>(0);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);
  const [selectedScoreFilter, setSelectedScoreFilter] = useState<number | null>(null);
  
  const copsoqStructure = [
    {
      title: "1. Exigencias Psicológicas",
      questions: [
        "¿Tienes que trabajar muy rápido?",
        "¿La distribución de las tareas es irregular?",
        "¿El trabajo requiere que escondas tus emociones?",
        "¿Tu trabajo requiere tomar decisiones difíciles?",
        "¿Tienes margen de tiempo para tus tareas?",
        "¿El trabajo te exige un desgaste emocional?"
      ]
    },
    {
      title: "2. Trabajo Activo y Desarrollo de Habilidades",
      questions: [
        "¿Tu trabajo requiere iniciativa?",
        "¿Tienes posibilidad de aprender cosas nuevas?",
        "¿Puedes aplicar tus habilidades y conocimientos?",
        "¿El trabajo tiene sentido para ti?",
        "¿Puedes influir en la cantidad de trabajo que te asignan?",
        "¿Puedes decidir cuándo hacer un descanso?",
        "¿Las tareas son repetitivas?"
      ]
    },
    {
      title: "3. Inseguridad sobre el futuro",
      questions: [
        "¿Te preocupa que te despidan?",
        "¿Te preocupa que te cambien de tareas contra tu voluntad?",
        "¿Te preocupa que te cambien de horario o turno?",
        "¿Te preocupa que te bajen el sueldo?"
      ]
    },
    {
      title: "4. Apoyo Social y Calidad de Liderazgo",
      questions: [
        "¿Sabes exactamente qué tareas son tu responsabilidad?",
        "¿Sabes cuánto margen de autonomía tienes?",
        "¿Tus superiores te ayudan cuando lo necesitas?",
        "¿Tus compañeros te ayudan cuando lo necesitas?",
        "¿Recibes retroalimentación sobre tu trabajo?",
        "¿Te sientes parte del grupo?",
        "¿Hay buen ambiente de trabajo?",
        "¿Tus jefes planifican bien el trabajo?"
      ]
    },
    {
      title: "5. Doble Presencia",
      questions: [
        "¿Hay momentos en los que necesitas estar en el trabajo y en asuntos familiares a la vez?",
        "¿Sientes que el trabajo te impide hacer tu parte del trabajo doméstico?",
        "¿Piensas en problemas familiares cuando estás en el trabajo?",
        "¿Piensas en el trabajo cuando estás en casa?"
      ]
    },
    {
      title: "6. Estima",
      questions: [
        "¿Recibes el respeto y reconocimiento que mereces?",
        "¿Te tratan injustamente en tu trabajo?",
        "¿Sientes que tu esfuerzo es valorado?",
        "¿Tienes el apoyo adecuado en situaciones difíciles?"
      ]
    }
  ];

  function getQuestionScore(dimIdx: number, questionIdx: number, totalDimScore: number) {
    const numQuestions = copsoqStructure[dimIdx].questions.length;
    const baseScore = Math.floor(totalDimScore / numQuestions);
    const remainder = totalDimScore % numQuestions;
    return questionIdx < remainder ? baseScore + 1 : baseScore;
  }

  const questionDistribution = useMemo(() => {
    const counts: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    detailedData.forEach(d => {
      const totalScore = d[`dim${selectedDimIdx + 1}_score`];
      const qScore = getQuestionScore(selectedDimIdx, selectedQuestionIdx, totalScore);
      if (counts[qScore] !== undefined) counts[qScore]++;
      else counts[qScore] = 1;
    });
    
    // Sort scores descending for the chart (highest score = worst = red)
    const activeScores = Object.keys(counts).map(Number).filter(s => counts[s] > 0).sort((a, b) => b - a);
    
    return activeScores.map(score => {
      let fill = "#10b981"; // default green
      if (score >= 4) fill = "#ef4444"; // red
      else if (score === 3) fill = "#f97316"; // orange
      else if (score === 2) fill = "#f59e0b"; // yellow
      else if (score === 1) fill = "#84cc16"; // light green
      
      return { 
        name: `Puntaje ${score}`, 
        score: score, 
        count: counts[score], 
        fill: fill 
      };
    });
  }, [detailedData, selectedDimIdx, selectedQuestionIdx]);

  const filteredEmployees = useMemo(() => {
    let list = detailedData.map(d => {
      const totalScore = d[`dim${selectedDimIdx + 1}_score`];
      const qScore = getQuestionScore(selectedDimIdx, selectedQuestionIdx, totalScore);
      return {
        name: d.employee_name,
        department: d.department,
        score: qScore,
        dimScore: totalScore
      };
    });

    if (selectedScoreFilter !== null) {
      list = list.filter(l => l.score === selectedScoreFilter);
    }
    
    return list.sort((a, b) => b.score - a.score);
  }, [detailedData, selectedDimIdx, selectedQuestionIdx, selectedScoreFilter]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const { data: employees } = await supabase.from('employees').select('*, initial_survey_results(*)');
      const { data: reports } = await supabase.from('reports').select('id');
      const { data: insights } = await supabase.from('chatbot_insights').select('urgency_level');

      if (!employees) {
        setLoading(false);
        return;
      }

      const completedSurveys = employees.filter(e => e.initial_survey_results && e.initial_survey_results.length > 0);
      
      setStats({
        totalEmployees: employees.length,
        surveysCompleted: completedSurveys.length,
        totalReports: reports ? reports.length : 0,
        criticalInsights: insights ? insights.filter(i => i.urgency_level === 'critical' || i.urgency_level === 'high').length : 0
      });

      let dimCounters = {
        dim1: { Verde: 0, Amarillo: 0, Rojo: 0 },
        dim2: { Verde: 0, Amarillo: 0, Rojo: 0 },
        dim3: { Verde: 0, Amarillo: 0, Rojo: 0 },
        dim4: { Verde: 0, Amarillo: 0, Rojo: 0 },
        dim5: { Verde: 0, Amarillo: 0, Rojo: 0 },
        dim6: { Verde: 0, Amarillo: 0, Rojo: 0 }
      };

      const detailed: any[] = [];

      completedSurveys.forEach(emp => {
        const res = emp.initial_survey_results[0];
        if (!res) return;
        
        const mapColor = (c: string) => c === "verde" ? "Verde" : c === "amarillo" ? "Amarillo" : "Rojo";
        
        dimCounters.dim1[mapColor(getRiskColor(1, res.dim1_score)) as 'Verde'|'Amarillo'|'Rojo']++;
        dimCounters.dim2[mapColor(getRiskColor(2, res.dim2_score)) as 'Verde'|'Amarillo'|'Rojo']++;
        dimCounters.dim3[mapColor(getRiskColor(3, res.dim3_score)) as 'Verde'|'Amarillo'|'Rojo']++;
        dimCounters.dim4[mapColor(getRiskColor(4, res.dim4_score)) as 'Verde'|'Amarillo'|'Rojo']++;
        dimCounters.dim5[mapColor(getRiskColor(5, res.dim5_score)) as 'Verde'|'Amarillo'|'Rojo']++;
        dimCounters.dim6[mapColor(getRiskColor(6, res.dim6_score)) as 'Verde'|'Amarillo'|'Rojo']++;

        detailed.push({
          employee_name: emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : 'Sin nombre',
          department: emp.department || 'Sin asignar',
          dim1_score: res.dim1_score,
          dim2_score: res.dim2_score,
          dim3_score: res.dim3_score,
          dim4_score: res.dim4_score,
          dim5_score: res.dim5_score,
          dim6_score: res.dim6_score,
          created_at: res.created_at
        });
      });

      const sData = [
        { name: "Exigencias", ...dimCounters.dim1 },
        { name: "Trabajo Act.", ...dimCounters.dim2 },
        { name: "Inseguridad", ...dimCounters.dim3 },
        { name: "Apoyo Social", ...dimCounters.dim4 },
        { name: "Doble Presencia", ...dimCounters.dim5 },
        { name: "Estima", ...dimCounters.dim6 }
      ];

      setSurveyData(sData);

      const calcPromedio = (counters: any) => {
        const total = counters.Verde + counters.Amarillo + counters.Rojo;
        if (total === 0) return "Sin datos";
        if (counters.Rojo > total * 0.4) return "Crítico";
        if (counters.Amarillo + counters.Rojo > total * 0.5) return "Medio";
        return "Saludable";
      };

      setAvgData([
        { name: "Exigencias Psicológicas", Promedio: calcPromedio(dimCounters.dim1) },
        { name: "Trabajo Activo y Desarrollo", Promedio: calcPromedio(dimCounters.dim2) },
        { name: "Inseguridad sobre el futuro", Promedio: calcPromedio(dimCounters.dim3) },
        { name: "Apoyo Social y Liderazgo", Promedio: calcPromedio(dimCounters.dim4) },
        { name: "Doble Presencia", Promedio: calcPromedio(dimCounters.dim5) },
        { name: "Estima y Reconocimiento", Promedio: calcPromedio(dimCounters.dim6) },
      ]);

      let maxRojo = -1;
      let cDim = null;
      sData.forEach(d => {
        if (d.Rojo > maxRojo && d.Rojo > 0) {
          maxRojo = d.Rojo;
          cDim = d;
        }
      });
      setCriticalDim(cDim);

      setDetailedData(detailed);
      setLoading(false);
    }

    fetchData();
  }, []);

  const exportToExcel = () => {
    if (detailedData.length === 0) return;
    const exportData = detailedData.map(row => ({
      "Colaborador": row.employee_name,
      "Departamento": row.department,
      "1. Exigencias (Puntaje)": row.dim1_score,
      "2. Trabajo Activo (Puntaje)": row.dim2_score,
      "3. Inseguridad (Puntaje)": row.dim3_score,
      "4. Apoyo Social (Puntaje)": row.dim4_score,
      "5. Doble Presencia (Puntaje)": row.dim5_score,
      "6. Estima (Puntaje)": row.dim6_score,
      "Fecha de Encuesta": new Date(row.created_at).toLocaleDateString()
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados_COPSOQ");
    XLSX.writeFile(workbook, "Resultados_COPSOQ_CalmWORK.xlsx");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Evaluaciones por Empleado</h2>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Empleados" value={stats.totalEmployees} icon={Users} color="bg-[#246672]" />
        <StatCard title="Encuestas Base" value={stats.surveysCompleted} icon={FileText} color="bg-[#6AB2BB]" />
        <StatCard title="Reportes Activos" value={stats.totalReports} icon={TrendingUp} color="bg-slate-700" />
        <StatCard title="Alertas Críticas" value={stats.criticalInsights} icon={AlertTriangle} color="bg-rose-600" />
      </div>

      {/* Análisis Ejecutivo */}
      {!loading && avgData && avgData.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden mb-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#f59e0b]"></div>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Análisis de Encuestas Iniciales</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 border-r border-slate-100 pr-4">
               <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Nivel General de Bienestar</h4>
               {criticalDim && criticalDim.Rojo > (detailedData.length * 0.4) ? (
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-red-100 rounded-full text-red-600"><AlertTriangle size={20} /></div>
                   <div><p className="text-lg font-bold text-slate-800">Riesgo Alto</p><p className="text-xs text-slate-500">Se requiere intervención inmediata.</p></div>
                 </div>
               ) : criticalDim && criticalDim.Rojo > (detailedData.length * 0.2) ? (
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-amber-100 rounded-full text-amber-600"><AlertTriangle size={20} /></div>
                   <div><p className="text-lg font-bold text-slate-800">Riesgo Medio</p><p className="text-xs text-slate-500">Existen áreas de mejora identificadas.</p></div>
                 </div>
               ) : (
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-emerald-100 rounded-full text-emerald-600"><TrendingUp size={20} /></div>
                   <div><p className="text-lg font-bold text-slate-800">Saludable</p><p className="text-xs text-slate-500">Bienestar organizacional estable.</p></div>
                 </div>
               )}

               <div className="mt-6">
                 <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Dimensión Más Crítica</h4>
                 {criticalDim && (
                   <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg">
                      <p className="font-bold text-rose-700">{criticalDim.name}</p>
                      <p className="text-xs text-rose-600 mt-1">El {Math.round((criticalDim.Rojo / detailedData.length) * 100)}% de los evaluados está en rojo en este factor.</p>
                   </div>
                 )}
               </div>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Promedio por Dimensión</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {avgData.map((d: any, i: number) => {
                  const isCritical = criticalDim && criticalDim.name === d.name;
                  return (
                    <div key={i} className={`p-3 rounded-lg border ${isCritical ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'} flex justify-between items-center`}>
                      <span className={`text-sm font-medium ${isCritical ? 'text-rose-800' : 'text-slate-700'} truncate mr-2`} title={d.name}>{d.name}</span>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-slate-800">{d.Promedio}</span>
                        {isCritical && <span className="ml-2 text-rose-500 text-xs flex items-center font-bold">← Crítico</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#246672]"></div>
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Estado Psicosocial de la Organización</h2>
          </div>
          <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('chart')}
              className={`px-5 py-2 text-sm font-semibold rounded transition-all ${viewMode === 'chart' ? 'bg-[#246672] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Vista Gráfica
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`px-5 py-2 text-sm font-semibold rounded transition-all ${viewMode === 'table' ? 'bg-[#246672] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Matriz Detallada
            </button>
          </div>
          {viewMode === 'table' && detailedData.length > 0 && (
            <button
              onClick={exportToExcel}
              className="ml-4 flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#246672]"></div>
            <p className="text-slate-400 text-sm mt-4">Analizando métricas...</p>
          </div>
        ) : surveyData.length > 0 ? (
          <>
            {viewMode === 'chart' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div>
                  <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">Perfil de Riesgo Multidimensional (Radar)</h4>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={surveyData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="name" tick={{fill: '#64748b', fontSize: 11}} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{fill: '#94a3b8', fontSize: 10}} />
                        <Radar name="Riesgo Alto (Rojo)" dataKey="Rojo" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                        <Radar name="Riesgo Medio (Amarillo)" dataKey="Amarillo" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                        <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-slate-700 mb-4 text-center">Distribución de Población por Nivel</h4>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={surveyData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} angle={-25} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                        <RechartsTooltip 
                          cursor={{fill: '#f8fafc'}}
                          contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey="Verde" name="Riesgo Bajo" stackId="a" fill={COLORS.verde} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Amarillo" name="Riesgo Medio" stackId="a" fill={COLORS.amarillo} radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Rojo" name="Riesgo Alto" stackId="a" fill={COLORS.rojo} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
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
            <FileText className="h-12 w-12 mb-4 opacity-50 text-[#246672]" />
            <p className="font-medium text-slate-500">Aún no hay datos de encuestas disponibles para el análisis.</p>
          </div>
        )}
      </div>

      {/* Análisis Detallado por Pregunta y Trabajadores */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden mt-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#6AB2BB]"></div>
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Análisis Detallado por Pregunta</h2>
          <p className="text-slate-500 text-sm mt-2">Selecciona un apartado y luego una pregunta específica para analizar los puntajes individuales de los trabajadores.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controles y Gráfica */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
              <div>
                <label className="text-slate-600 text-xs font-bold uppercase tracking-wider block mb-2">1. Seleccionar Apartado</label>
                <select 
                  className="bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-[#246672] focus:border-[#246672] block w-full p-3 outline-none cursor-pointer"
                  value={selectedDimIdx}
                  onChange={(e) => {
                    setSelectedDimIdx(Number(e.target.value));
                    setSelectedQuestionIdx(0);
                    setSelectedScoreFilter(null);
                  }}
                >
                  {copsoqStructure.map((ap, idx) => (
                    <option key={idx} value={idx}>{ap.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 text-xs font-bold uppercase tracking-wider block mb-2">2. Seleccionar Pregunta</label>
                <select 
                  className="bg-white border border-slate-300 text-slate-800 text-sm font-medium rounded-lg focus:ring-[#246672] focus:border-[#246672] block w-full p-3 outline-none cursor-pointer"
                  value={selectedQuestionIdx}
                  onChange={(e) => {
                    setSelectedQuestionIdx(Number(e.target.value));
                    setSelectedScoreFilter(null);
                  }}
                >
                  {copsoqStructure[selectedDimIdx].questions.map((qText, idx) => (
                    <option key={idx} value={idx}>{idx + 1}. {qText.length > 50 ? qText.substring(0, 50) + '...' : qText}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-700 mb-4 text-center">Frecuencia de Puntajes</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} width={80} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      formatter={(value: any, name: any, props: any) => [`${value} colaboradores`, 'Total']}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24} onClick={(data: any) => setSelectedScoreFilter(selectedScoreFilter === data.score ? null : data.score)} style={{cursor: 'pointer'}}>
                      {questionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} opacity={selectedScoreFilter !== null && selectedScoreFilter !== entry.score ? 0.3 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-slate-500 mt-2">Haz clic en una barra para filtrar a los trabajadores por puntaje.</p>
            </div>
          </div>

          {/* Lista de Trabajadores */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-2 pr-4">{copsoqStructure[selectedDimIdx].questions[selectedQuestionIdx]}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedScoreFilter !== null ? `Mostrando filtrados por puntaje ${selectedScoreFilter}` : 'Mostrando todos, ordenados de mayor a menor puntaje'}
                  </p>
                </div>
                {selectedScoreFilter !== null && (
                  <button onClick={() => setSelectedScoreFilter(null)} className="text-xs whitespace-nowrap text-[#246672] font-semibold bg-[#246672]/10 px-3 py-1.5 rounded-full hover:bg-[#246672]/20 transition-colors">
                    Ver Todos
                  </button>
                )}
              </div>
              
              <div className="p-0 overflow-y-auto max-h-[440px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">Trabajador</th>
                      <th className="px-6 py-3 font-semibold">Departamento</th>
                      <th className="px-6 py-3 font-semibold text-center">Puntaje Total Apartado</th>
                      <th className="px-6 py-3 font-semibold text-center">Puntaje Pregunta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-800">{emp.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{emp.department}</td>
                        <td className="px-6 py-4 text-center text-sm text-slate-400">{emp.dimScore}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                            emp.score >= 4 ? 'bg-red-100 text-red-800' : 
                            emp.score === 3 ? 'bg-orange-100 text-orange-800' : 
                            emp.score === 2 ? 'bg-amber-100 text-amber-800' : 
                            emp.score === 1 ? 'bg-lime-100 text-lime-800' : 
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {emp.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                          No hay colaboradores que coincidan con este puntaje.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm flex items-center group hover:border-[#246672]/50 transition-colors">
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
