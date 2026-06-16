"use client";

import { Hand, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ColaboradorPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            ¡Hola, María! <Hand className="text-yellow-500 h-6 w-6" />
          </h1>
          <p className="text-slate-600 mt-2">
            Te damos la bienvenida a tu espacio seguro en CalmWork. Aquí puedes gestionar tu bienestar, reportar situaciones y acceder a recursos para mejorar tu experiencia laboral.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/colaborador/reportar-situacion">
            <button className="bg-[#6D4AFF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#5b3ce0] transition-colors shadow-sm flex items-center gap-2">
              Reportar una situación <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-2">Evaluación Pendiente</h3>
          <p className="text-sm text-purple-700 mb-4">Tienes pendiente completar tu evaluación COPSOQ ISTAS21 de este mes.</p>
          <button className="text-purple-600 font-medium text-sm hover:underline">Comenzar evaluación</button>
        </div>
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2">Asistente IA</h3>
          <p className="text-sm text-blue-700 mb-4">¿Necesitas orientación rápida? Nuestro asistente virtual está disponible 24/7.</p>
          <button className="text-blue-600 font-medium text-sm hover:underline">Conversar ahora</button>
        </div>
        <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
          <h3 className="font-semibold text-teal-900 mb-2">Capacitaciones</h3>
          <p className="text-sm text-teal-700 mb-4">Descubre nuestros nuevos cursos sobre manejo del estrés y resiliencia.</p>
          <button className="text-teal-600 font-medium text-sm hover:underline">Ver catálogo</button>
        </div>
      </div>
    </div>
  );
}
