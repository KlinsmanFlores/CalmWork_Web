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
  
  // States for COPSOQ individual questions
  const [selectedApartadoIdx, setSelectedApartadoIdx] = useState<number>(0);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState<number>(0);

  const copsoqStructure = [
    {
      title: 'Apartado 1: Exigencias Psicológicas',
      questions: [
        '¿Tienes que trabajar muy rápido?',
        '¿La distribución de tareas es irregular y provoca que se te acumule el trabajo?',
        '¿Tienes tiempo de llevar al día tu trabajo?',
        '¿Te cuesta olvidar los problemas del trabajo?',
        '¿Tu trabajo, en general, es desgastador emocionalmente?',
        '¿Tu trabajo requiere que escondas tus emociones?'
      ]
    },
    {
      title: 'Apartado 2: Trabajo Activo y Desarrollo de Habilidades',
      questions: [
        '¿Tienes influencia sobre la cantidad de trabajo que se te asigna?',
        '¿Se tiene en cuenta tu opinión cuando se te asignan tareas?',
        '¿Tienes influencia sobre el orden en el que realizas las tareas?',
        '¿Puedes decidir cuándo haces un descanso?',
        'Si tienes algún asunto personal o familiar ¿puedes dejar tu puesto de trabajo al menos una hora sin pedir permiso especial?',
        '¿Tu trabajo requiere que tengas iniciativa?',
        '¿Tu trabajo permite que aprendas cosas nuevas?',
        '¿Te sientes comprometido con tu profesión?',
        '¿Tienen sentido tus tareas?',
        '¿Hablas con entusiasmo de tu empresa a otras personas?'
      ]
    },
    {
      title: 'Apartado 3: Inseguridad sobre el futuro',
      questions: [
        'En estos momentos, ¿estás preocupado/a por lo difícil que sería encontrar otro trabajo en el caso de que te quedaras en paro?',
        'En estos momentos, ¿estás preocupado/a por si te cambian de tareas contra tu voluntad?',
        'En estos momentos, ¿estás preocupado/a por si te cambian el horario (turno, días) contra tu voluntad?',
        'En estos momentos, ¿estás preocupado/a por si te varían el salario (bajada, no actualización)?'
      ]
    },
    {
      title: 'Apartado 4: Apoyo Social y Calidad de Liderazgo',
      questions: [
        '¿Sabes exactamente qué margen de autonomía tienes en tu trabajo?',
        '¿Sabes exactamente qué tareas son de tu responsabilidad?',
        '¿En tu empresa se te informa con antelación de cambios que afectan tu futuro?',
        '¿Recibes toda la información que necesitas para realizar bien tu trabajo?',
        '¿Recibes ayuda y apoyo de tus compañeras o compañeros?',
        '¿Recibes ayuda y apoyo de tu inmediato o inmediata superior?',
        '¿Tu puesto de trabajo se encuentra aislado del de tus compañeros/as?',
        'En el trabajo, ¿sientes que formas parte de un grupo?',
        '¿Tus actuales jefes inmediatos planifican bien el trabajo?',
        '¿Tus actuales jefes inmediatos se comunican bien con el equipo?'
      ]
    },
    {
      title: 'Apartado 5: Doble Presencia',
      questions: [
        '¿Qué parte del trabajo familiar y doméstico haces tú?',
        'Si faltas algún día de casa, ¿las tareas domésticas se quedan sin hacer?',
        'Cuando estás en la empresa ¿piensas en las tareas domésticas y familiares?',
        '¿Hay momentos en los que necesitarías estar en la empresa y en casa a la vez?'
      ]
    },
    {
      title: 'Apartado 6: Estima',
      questions: [
        'Mis superiores me dan el reconocimiento que merezco',
        'En las situaciones difíciles en el trabajo recibo el apoyo necesario',
        'En mi trabajo me tratan injustamente',
        'Pensando en mi esfuerzo, el reconocimiento que recibo me parece adecuado'
      ]
    }
  ];

  // Generate fake distribution based on selection so it looks realistic for the prototype
  const currentChartData = useMemo(() => {
    // Deterministic random based on indices so it doesn't flicker
    const seed = selectedApartadoIdx * 100 + selectedQuestionIdx;
    
    // Base options
    const isApartado3 = selectedApartadoIdx === 2;
    const isApartado5Q1 = selectedApartadoIdx === 4 && selectedQuestionIdx === 0;
    
    let options = ['Nunca', 'Sólo alguna vez', 'Algunas veces', 'Muchas veces', 'Siempre'];
    if (isApartado3) options = ['Nada preocupado', 'Poco preocupado', 'Más o menos', 'Bastante preocupado', 'Muy preocupado'];
    if (isApartado5Q1) options = ['Ninguna', 'Sólo tareas puntuales', 'Una cuarta parte', 'La mitad', 'La mayor parte'];

    const total = 95; // Fixed number of responses for prototype
    
    // Distribute remaining
    let remaining = total;
    const values = options.map((opt, i) => {
      if (i === options.length - 1) return { name: opt, count: remaining };
      const val = Math.floor(Math.abs(Math.sin(seed + i)) * (remaining * 0.5)) + 5;
      remaining -= val;
      return { name: opt, count: val };
    });

    const optionsData = values.map(v => ({
      name: v.name,
      count: v.count,
      percent: Math.round((v.count / total) * 100)
    })).sort((a, b) => b.count - a.count);

    return {
      question: copsoqStructure[selectedApartadoIdx].questions[selectedQuestionIdx],
      totalAnswers: total,
      options: optionsData,
      risk: optionsData.some(o => 
        (o.name.toLowerCase().includes('siempre') || o.name.toLowerCase().includes('frecuente') || o.name.toLowerCase().includes('desacuerdo') || o.name.toLowerCase().includes('muy preocupado') || o.name.toLowerCase().includes('mayor parte')) 
        && o.percent > 20
      ) ? 'Alto' : 'Normal'
    };
  }, [selectedApartadoIdx, selectedQuestionIdx]);



  const getBarColor = (index: number) => {
    const colors = ["#246672", "#6AB2BB", "#f59e0b", "#ef4444", "#8b5cf6"];
    return colors[index % colors.length];
  };

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

      {/* Análisis de Encuesta Inicial Section */}
      <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden mt-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-[#6AB2BB]"></div>
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold text-[#246672] tracking-tight">Análisis de Preguntas (COPSOQ-ISTAS21)</h2>
          <p className="text-slate-500 text-sm mt-2">Explora los resultados detallados por cada pregunta del cuestionario inicial agrupados en sus 6 apartados.</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de Apartado */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">1. Seleccionar Apartado</span>
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-lg focus:ring-[#246672] focus:border-[#246672] block w-full p-3 outline-none transition-colors cursor-pointer"
                value={selectedApartadoIdx}
                onChange={(e) => {
                  setSelectedApartadoIdx(Number(e.target.value));
                  setSelectedQuestionIdx(0);
                }}
              >
                {copsoqStructure.map((ap, idx) => (
                  <option key={idx} value={idx}>{ap.title}</option>
                ))}
              </select>
            </div>

            {/* Selector de Pregunta */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
              <span className="text-slate-600 text-xs font-bold uppercase tracking-wider">2. Seleccionar Pregunta</span>
              <select 
                className="bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-lg focus:ring-[#246672] focus:border-[#246672] block w-full p-3 outline-none transition-colors cursor-pointer"
                value={selectedQuestionIdx}
                onChange={(e) => setSelectedQuestionIdx(Number(e.target.value))}
              >
                {copsoqStructure[selectedApartadoIdx].questions.map((qText, idx) => (
                  <option key={idx} value={idx}>{idx + 1}. {qText}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 ${currentChartData.risk === 'Alto' ? 'bg-rose-500' : 'bg-[#6AB2BB]'}`}></div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-slate-800 pr-4 leading-snug">{currentChartData.question}</h3>
              {currentChartData.risk === 'Alto' && (
                <span className="bg-rose-100 text-rose-700 text-xs uppercase font-bold px-3 py-1.5 rounded-md whitespace-nowrap border border-rose-200 shadow-sm">
                  Atención Requerida
                </span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500 mb-8 uppercase tracking-wider">
              {currentChartData.totalAnswers} Respuestas consolidadas
            </p>

            <div className="h-80 mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={currentChartData.options} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={160} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    formatter={(value: any, name: any, props: any) => [`${value} votos (${props.payload.percent}%)`, 'Frecuencia']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
                    {currentChartData.options.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {currentChartData.options.map((opt: any, optIdx: number) => (
                <div key={optIdx} className="flex flex-col p-4 bg-slate-50 rounded-lg border border-slate-100 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase font-bold mb-2 truncate" title={opt.name}>{opt.name}</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-[#246672] leading-none">{opt.percent}%</span>
                    <span className="text-sm text-slate-400 mb-0.5 font-medium">({opt.count} votos)</span>
                  </div>
                </div>
              ))}
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
