"use client";

import Link from "next/link";
import { 
  Briefcase, 
  MessageSquareWarning, 
  Users, 
  Frown, 
  AlertTriangle,
  ChevronRight
} from "lucide-react";

export default function ReportarSituacionPage() {
  const categories = [
    {
      id: "sobrecarga",
      title: "Sobrecarga Laboral",
      description: "Exceso de tareas, horas extras constantes o plazos poco realistas.",
      icon: Briefcase,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "acoso",
      title: "Acoso o Discriminación",
      description: "Trato injusto, comentarios inapropiados o comportamientos hostiles.",
      icon: MessageSquareWarning,
      color: "bg-red-100 text-red-600",
    },
    {
      id: "conflictos",
      title: "Conflictos con el Equipo",
      description: "Problemas de comunicación o roces constantes con colegas.",
      icon: Users,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "estres",
      title: "Estrés y Ansiedad",
      description: "Sensación constante de agobio, falta de motivación o burnout.",
      icon: Frown,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "otros",
      title: "Otra Situación",
      description: "Cualquier otro problema que esté afectando tu bienestar laboral.",
      icon: AlertTriangle,
      color: "bg-slate-100 text-slate-600",
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Reportar una Situación</h1>
        <p className="text-slate-600 mt-2">
          Selecciona el tipo de situación que deseas reportar. Recuerda que todos los reportes son completamente confidenciales.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link 
              href={`/colaborador/reportar-situacion/formulario?tipo=${cat.id}`} 
              key={cat.id}
            >
              <div className="group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#6D4AFF]/30 transition-all cursor-pointer flex items-start gap-4">
                <div className={`p-3 rounded-xl shrink-0 ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 group-hover:text-[#6D4AFF] transition-colors">{cat.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{cat.description}</p>
                </div>
                <div className="shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="text-[#6D4AFF] h-5 w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
