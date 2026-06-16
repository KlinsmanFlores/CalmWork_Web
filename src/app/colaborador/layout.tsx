"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FileEdit,
  ClipboardList,
  Heart,
  Bot,
  GraduationCap,
  BarChart,
  FolderOpen,
  Users,
  HelpCircle,
  Settings,
  ArrowLeft,
  Bell,
  ChevronDown,
} from "lucide-react";
import React from "react";

export default function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: "Inicio", href: "/colaborador", icon: Home },
    { name: "Reportar situación", href: "/colaborador/reportar-situacion", icon: FileEdit },
    { name: "Evaluación COPSOQ ISTAS21", href: "/colaborador/evaluacion", icon: ClipboardList },
    { name: "Bienestar emocional", href: "/colaborador/bienestar", icon: Heart },
    { name: "Asistente IA", href: "/colaborador/asistente", icon: Bot },
    { name: "Capacitaciones", href: "/colaborador/capacitaciones", icon: GraduationCap },
    { name: "Estadísticas", href: "/colaborador/estadisticas", icon: BarChart },
    { name: "Seguimiento de casos", href: "/colaborador/casos", icon: FolderOpen },
    { name: "Clima laboral", href: "/colaborador/clima", icon: Users },
    { name: "Centro de ayuda", href: "/colaborador/ayuda", icon: HelpCircle },
    { name: "Configuración", href: "/colaborador/configuracion", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 pt-4">
          <div className="flex items-center space-x-2">
            <div className="text-purple-600">
              {/* Mock logo for CalmWork */}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#6D4AFF] leading-tight">CalmWork</span>
              <span className="text-[10px] text-slate-500 leading-tight">Tu bienestar, nuestro<br/>compromiso</span>
            </div>
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            // Check if current path matches item href exactly, or if it's a child path (for reportar-situacion)
            const isActive = pathname === item.href || (item.href !== "/colaborador" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? "bg-[#6D4AFF] text-white shadow-sm shadow-purple-200"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#6D4AFF]"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center">
            {pathname !== "/colaborador" && (
              <button 
                onClick={() => router.back()}
                className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
              </button>
            )}
          </div>
          <div className="flex items-center space-x-6">
            <button className="relative p-1 text-slate-500 hover:text-slate-700 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria&backgroundColor=e9e3ff" alt="Avatar" className="h-full w-full object-cover" />
              </div>
              <div className="flex flex-col text-sm hidden sm:flex">
                <span className="font-semibold text-slate-800">Hola, María</span>
                <span className="text-slate-500 text-xs">Colaboradora</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-white sm:bg-transparent">
          {children}
        </div>
      </main>
    </div>
  );
}
