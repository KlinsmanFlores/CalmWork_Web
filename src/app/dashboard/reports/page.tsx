"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Clock, ChevronDown, ChevronUp, ArrowLeft, ChevronLeft, ChevronRight, FolderOpen, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Vista y Paginación
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const REPORTS_PER_PAGE = 15;

  // Control de expansión de filas
  const [expandedReportIds, setExpandedReportIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchReports() {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          modules (
            title,
            icon_name,
            color_hex
          ),
          report_answers (
            selected_options,
            answer_text,
            numeric_value
          )
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setReports(data);
      } else {
        console.error("Error fetching reports:", error);
      }
      setLoading(false);
    }
    fetchReports();
  }, []);

  const toggleReport = (id: string) => {
    setExpandedReportIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Agrupar los reportes por título de módulo
  const groupedReports = reports.reduce((acc: any, report: any) => {
    const moduleTitle = report.modules?.title || 'Módulo Desconocido';
    if (!acc[moduleTitle]) {
      acc[moduleTitle] = [];
    }
    acc[moduleTitle].push(report);
    return acc;
  }, {});

  // Renderiza la vista de Carpetas / Módulos
  const renderModulesView = () => {
    if (reports.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center shadow-sm mt-6">
          <AlertTriangle className="h-12 w-12 text-[#00A67E] mx-auto mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-slate-800">No hay reportes disponibles</h3>
          <p className="text-slate-500 mt-2">Los reportes enviados por los trabajadores aparecerán aquí estructurados por módulos.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {Object.entries(groupedReports).map(([moduleTitle, moduleReports]: [string, any]) => {
          return (
            <div 
              key={moduleTitle} 
              onClick={() => {
                setSelectedModule(moduleTitle);
                setCurrentPage(1);
                setExpandedReportIds({}); // Resetear expansiones al cambiar de módulo
              }}
              className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-[#00A67E] transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-[#00A67E] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded bg-[#00A67E]/10 flex items-center justify-center text-[#00A67E] group-hover:bg-[#00A67E] group-hover:text-white transition-colors duration-300">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded font-medium border border-slate-200">
                    {moduleReports.length} {moduleReports.length === 1 ? 'Reporte' : 'Reportes'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#00A67E] transition-colors">{moduleTitle}</h3>
                <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                  Gestione y analice las respuestas confidenciales registradas en este módulo.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center text-[#00A67E] text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                Acceder al directorio <ChevronRight className="w-4 h-4 ml-auto" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderiza la lista paginada de reportes para el módulo seleccionado
  const renderReportsList = () => {
    const currentModuleReports = groupedReports[selectedModule!] || [];
    const totalPages = Math.ceil(currentModuleReports.length / REPORTS_PER_PAGE);
    
    // Calcular el rango para paginación
    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const paginatedReports = currentModuleReports.slice(startIndex, startIndex + REPORTS_PER_PAGE);

    return (
      <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header de la Subvista */}
        <div className="flex items-center justify-between bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSelectedModule(null)}
              className="mr-4 p-2 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00A67E]" />
                <h2 className="text-xl font-bold text-slate-800">{selectedModule}</h2>
              </div>
              <p className="text-slate-500 text-sm mt-1 ml-7">Mostrando {paginatedReports.length} de {currentModuleReports.length} registros confidenciales</p>
            </div>
          </div>
        </div>

        {/* Tabla de Reportes */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">ID de Registro</th>
                  <th className="px-6 py-4">Fecha de Recepción</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedReports.map((report: any, index: number) => {
                  const isExpanded = !!expandedReportIds[report.id];
                  // ID de visualización (mayor número es el reporte más antiguo o viceversa)
                  const globalIndex = startIndex + index;
                  const displayId = currentModuleReports.length - globalIndex;
                  const reportDate = new Date(report.created_at);

                  return (
                    <React.Fragment key={report.id}>
                      <tr 
                        onClick={() => toggleReport(report.id)}
                        className={`hover:bg-[#00A67E]/5 cursor-pointer transition-colors group ${isExpanded ? 'bg-[#00A67E]/5' : ''}`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          Registro #{displayId.toString().padStart(4, '0')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-2 text-slate-400" />
                            {reportDate.toLocaleDateString()} a las {reportDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Recibido
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 group-hover:text-[#00A67E] transition-colors p-1">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Fila Desplegable */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={4} className="px-0 py-0">
                            <div className="p-6 border-t border-slate-200">
                              <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Detalles del Reporte</h4>
                              {report.report_answers && report.report_answers.length > 0 ? (
                                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                  <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                        <th className="px-6 py-3 font-semibold w-1/3">Variable / Pregunta</th>
                                        <th className="px-6 py-3 font-semibold w-2/3 border-l border-slate-200">Información Proporcionada</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {report.report_answers.map((answer: any, idx: number) => (
                                        <React.Fragment key={`ans-${idx}`}>
                                          {answer.answer_text && (
                                            <tr className="hover:bg-slate-50 transition-colors">
                                              <td className="px-6 py-4 font-medium text-slate-700 align-top">
                                                Descripción General
                                              </td>
                                              <td className="px-6 py-4 text-slate-600 whitespace-pre-wrap border-l border-slate-200">
                                                {answer.answer_text}
                                              </td>
                                            </tr>
                                          )}

                                          {answer.selected_options && typeof answer.selected_options === 'object' && 
                                            Object.entries(answer.selected_options).map(([question, response], i) => {
                                              if (question === 'estado' && response === 'Completado desde App') return null;
                                              return (
                                                <tr key={`opt-${i}`} className="hover:bg-slate-50 transition-colors">
                                                  <td className="px-6 py-4 font-medium text-slate-700 align-top">
                                                    {question}
                                                  </td>
                                                  <td className="px-6 py-4 text-slate-600 border-l border-slate-200">
                                                    {Array.isArray(response) ? (
                                                      <ul className="space-y-1">
                                                        {response.map((item, j) => (
                                                          <li key={j} className="flex items-start">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00A67E] mt-2 mr-2 flex-shrink-0"></div>
                                                            <span>{item}</span>
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    ) : (
                                                      <span className="whitespace-pre-wrap">{String(response)}</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          }

                                          {answer.numeric_value !== null && answer.numeric_value !== undefined && (
                                            <tr className="hover:bg-slate-50 transition-colors">
                                              <td className="px-6 py-4 font-medium text-slate-700 align-top">
                                                Valor Cuantitativo
                                              </td>
                                              <td className="px-6 py-4 text-[#00A67E] font-bold border-l border-slate-200">
                                                {answer.numeric_value}
                                              </td>
                                            </tr>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <div className="text-center p-6 bg-white rounded-lg border border-slate-200">
                                  <p className="text-slate-500 text-sm">El reporte no contiene respuestas estructuradas.</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Página <span className="font-semibold text-slate-700">{currentPage}</span> de <span className="font-semibold text-slate-700">{totalPages}</span>
              </span>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto">
      <div className="flex justify-between items-end border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Directorio de Reportes</h2>
          <p className="text-slate-500 mt-2 text-sm">Centro de análisis y gestión de información confidencial enviada por el personal.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-10 w-10 border-b-2 border-[#00A67E] rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm mt-4">Sincronizando información...</p>
          </div>
        </div>
      ) : (
        selectedModule ? renderReportsList() : renderModulesView()
      )}
    </div>
  );
}
