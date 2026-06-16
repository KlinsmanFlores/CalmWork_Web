"use client";

import { useState, Suspense } from "react";
import { Briefcase, Lock, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function FormularioReporte() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = searchParams.get("tipo") || "sobrecarga";

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mapear el tipo a un título legible (por defecto asume Sobrecarga Laboral basado en la imagen)
  const getTitle = () => {
    switch (tipo) {
      case "acoso": return "Acoso o Discriminación";
      case "conflictos": return "Conflictos con el Equipo";
      case "estres": return "Estrés y Ansiedad";
      case "otros": return "Otra Situación";
      default: return "Sobrecarga Laboral";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto flex flex-col items-center justify-center text-center py-20">
        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Reporte enviado con éxito</h2>
        <p className="text-slate-600 mb-8 max-w-md">
          Gracias por confiar en nosotros. Tu reporte ha sido registrado de forma segura y anónima. El equipo de Recursos Humanos lo revisará a la brevedad.
        </p>
        <button 
          onClick={() => router.push("/colaborador")}
          className="bg-[#6D4AFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5b3ce0] transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Header matching Image 2 */}
      <div className="flex items-start gap-4 mb-6">
        <div className="h-16 w-16 bg-[#6D4AFF] rounded-full flex items-center justify-center shrink-0 shadow-md shadow-purple-200">
          <Briefcase className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-[#1e1b4b]">
            Reporte: {getTitle()}
          </h1>
          <p className="text-slate-700 mt-1">
            Responde las siguientes preguntas para ayudarnos a entender mejor tu situación.
          </p>
        </div>
      </div>

      <div className="bg-[#f3efff] text-[#6D4AFF] p-4 rounded-xl flex items-center gap-3 font-medium mb-8">
        <Lock className="h-5 w-5 shrink-0" />
        <p>Este reporte es 100% confidencial y anónimo.</p>
      </div>

      {/* Multistep Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex-1 flex items-center gap-2">
              <div className={`h-2 rounded-full flex-1 transition-all ${step >= num ? "bg-[#6D4AFF]" : "bg-slate-100"}`}></div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold text-slate-800">1. Detalles del problema</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Desde hace cuánto tiempo experimentas esta situación?
                  </label>
                  <select required className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF] focus:border-transparent">
                    <option value="">Selecciona una opción</option>
                    <option value="dias">Hace unos días</option>
                    <option value="semanas">Hace algunas semanas</option>
                    <option value="meses">Hace meses</option>
                    <option value="siempre">Desde que ingresé al equipo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Con qué frecuencia ocurre?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["Diariamente", "Semanalmente", "Ocasionalmente"].map((freq) => (
                      <label key={freq} className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-[#6D4AFF] transition-all has-[:checked]:bg-purple-50 has-[:checked]:border-[#6D4AFF] has-[:checked]:text-[#6D4AFF]">
                        <input type="radio" name="frecuencia" value={freq} className="sr-only" required />
                        <span className="text-sm font-medium">{freq}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold text-slate-800">2. Descripción de la situación</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Describe brevemente lo que está ocurriendo (Opcional)
                </label>
                <textarea 
                  rows={5}
                  placeholder="Ej. Siento que se me asignan más tareas de las que puedo completar en mi horario laboral regular..."
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF] focus:border-transparent resize-none"
                ></textarea>
                <p className="text-xs text-slate-500 mt-2">No incluyas nombres de otras personas si deseas mantener el anonimato total.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-semibold text-slate-800">3. Impacto y Acciones</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Cómo ha afectado esta situación tu bienestar? (Puedes seleccionar varias)
                  </label>
                  <div className="space-y-2">
                    {["Dificultad para dormir", "Ansiedad o estrés constante", "Desmotivación", "Impacto en mi vida personal"].map((impact) => (
                      <label key={impact} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-[#6D4AFF] focus:ring-[#6D4AFF]" />
                        <span className="text-sm text-slate-700">{impact}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    ¿Has intentado hablar de esto con tu supervisor/a directo?
                  </label>
                  <select required className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D4AFF] focus:border-transparent">
                    <option value="">Selecciona una opción</option>
                    <option value="si">Sí, pero no hubo cambios</option>
                    <option value="no-comodo">No me siento cómodo/a haciéndolo</option>
                    <option value="no-oportunidad">No he tenido la oportunidad</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
            <button 
              type="button"
              onClick={() => step > 1 ? setStep(step - 1) : router.back()}
              className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
            >
              {step > 1 ? <><ArrowLeft className="w-4 h-4" /> Anterior</> : "Cancelar"}
            </button>
            <button 
              type="submit"
              className="bg-[#6D4AFF] text-white px-6 py-2.5 rounded-xl font-medium hover:bg-[#5b3ce0] transition-colors shadow-sm flex items-center gap-2"
            >
              {step === 3 ? "Enviar Reporte" : <>Siguiente <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FormularioReportePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[#6D4AFF]">Cargando formulario...</div>}>
      <FormularioReporte />
    </Suspense>
  );
}
