"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, AlertTriangle, MessageSquare, LogOut, FileText, Shield, Calendar, ChevronDown } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setIsDateOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigation = [
    { name: "Dashboard General", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestión de Trabajadores", href: "/dashboard/employees", icon: Users },
    { name: "Diagnóstico Psicosocial", href: "/dashboard/copsoq", icon: Users },
    { name: "Gestión de Incidencias", href: "/dashboard/reports", icon: AlertTriangle },
    { name: "Análisis Organizacional", href: "/dashboard/departments", icon: Users },
    { name: "Alertas Predictivas IA", href: "/dashboard/insights", icon: MessageSquare },
    { name: "Seguimiento de Casos", href: "/dashboard/cases", icon: Shield },
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-br from-[#4BA5B5] to-[#246672] border-r border-[#246672] flex flex-col hidden md:flex">
        <div className="py-6 flex items-center px-6 border-b border-white/10">
          <Image src="/logo_cropped.png" width={42} height={42} alt="CalmWORK Logo" className="mr-3 rounded-xl shadow-sm" />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-white leading-tight tracking-wide">CalmWORK</span>
            <span className="text-[10px] text-white/70 font-medium leading-tight mt-0.5">Bienestar que impulsa resultados</span>
          </div>
        </div>

        <div className="flex-1 py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? "bg-white/20 text-white font-bold border border-white/30 shadow-sm"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-white" : "text-white/70"}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header (Mobile menu placeholder, Admin info) */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Centro de Analítica RR.HH.</h1>
          </div>
          <div className="flex items-center gap-6">
            
            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <div 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center pl-6 border-l border-slate-200 cursor-pointer hover:opacity-80 transition-opacity group"
              >
                <div className="h-10 w-10 rounded-full bg-[#246672] flex items-center justify-center text-white font-bold mr-3 shadow-sm group-hover:scale-105 transition-transform">
                  RH
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700 leading-tight">Analista RR.HH.</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Administrador</span>
                </div>
                <ChevronDown className={`w-4 h-4 ml-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </div>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800">Analista RR.HH.</p>
                    <p className="text-xs text-slate-500 mt-0.5">admin@calmwork.com</p>
                  </div>
                  <div className="py-1">
                    <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400" />
                      Mi Perfil
                    </Link>
                    <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      <Shield className="w-4 h-4 mr-3 text-slate-400" />
                      Configuración
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 py-1">
                    <button className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                      <LogOut className="w-4 h-4 mr-3" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
