import {
  BarChart3,
  Bell,
  Building2,
  Database,
  FileSpreadsheet,
  HardHat,
  PiggyBank,
  ScanLine,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navSections = [
  {
    title: "ÁREA SOCIAL",
    items: [
      { to: "/demanda", label: "Organización Demanda", icon: Users, primary: true },
      { to: "/bases-datos", label: "Bases de datos", icon: Database },
      { to: "/extraer-ahorro", label: "Extraer ahorro", icon: PiggyBank },
      { to: "/extraer-rukan", label: "Extraer RUKAN", icon: ScanLine },
    ],
  },
  {
    title: "ÁREA TÉCNICA",
    items: [
      { to: "/tecnica", label: "Proyectos y Terrenos", icon: HardHat },
      { to: "/postventa", label: "Postventa", icon: Wrench },
    ],
  },
  {
    title: "SEGUIMIENTO",
    items: [
      { to: "/alertas", label: "Alertas", icon: Bell },
      { to: "/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased">
      {/* Sidebar para desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white px-4 py-5 overflow-y-auto xl:block">
        {/* Logo / Encabezado */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white shadow-2xs">
            <Building2 size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900 leading-tight">Plan Social</h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Entidad Patrocinante</p>
          </div>
        </div>

        {/* Navegación por Áreas */}
        <nav className="mt-5 space-y-5">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-2.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="xl:pl-64">
        {/* Header responsive para móvil y tablet */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur xl:hidden shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
              <Building2 size={16} />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-slate-900">Plan Social</h1>
              <p className="text-[10px] font-medium uppercase text-slate-400">Entidad Patrocinante</p>
            </div>
          </div>

          <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {navSections.flatMap((s) => s.items).map((item) => (
              <NavItem key={item.to} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, compact = false }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
          compact ? "shrink-0 whitespace-nowrap text-xs" : "",
          isActive
            ? "bg-slate-900 text-white shadow-2xs"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        ].join(" ")
      }
    >
      <Icon size={16} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}
