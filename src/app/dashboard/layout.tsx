"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, AlertTriangle, MessageSquare, LogOut, FileText, Shield, Calendar, ChevronDown, Inbox } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const navigation = [
    { name: "Dashboard General", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestión de Trabajadores", href: "/dashboard/employees", icon: Users },
    { name: "Diagnóstico Psicosocial", href: "/dashboard/copsoq", icon: FileText },
    { name: "Gestión de Incidencias", href: "/dashboard/reports", icon: AlertTriangle },
    { name: "Análisis Organizacional", href: "/dashboard/departments", icon: Users },
    { name: "Buzón de Análisis", href: "/dashboard/alerts", icon: Inbox },
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

        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
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

        {/* User Profile at bottom of sidebar */}
        <div className="p-4 border-t border-white/10 mt-auto relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors group"
          >
            <div className="h-10 w-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-bold mr-3 shadow-sm group-hover:scale-105 transition-transform shrink-0">
              RH
            </div>
            <div className="flex flex-col flex-1 overflow-hidden">
              <span className="text-sm font-bold text-white leading-tight truncate">Analista RR.HH.</span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-semibold truncate">Administrador</span>
            </div>
            <ChevronDown className={`w-4 h-4 ml-2 shrink-0 text-white/70 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </div>

          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-slate-800 truncate">Analista RR.HH.</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">admin@calmwork.com</p>
              </div>
              <div className="py-1">
                <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <LayoutDashboard className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                  Mi Perfil
                </Link>
                <Link href="/dashboard" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                  <Shield className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                  Configuración
                </Link>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button 
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3 shrink-0" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
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
