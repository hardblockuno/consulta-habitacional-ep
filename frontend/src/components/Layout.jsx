import {
  BarChart3,
  Bell,
  Database,
  FileSpreadsheet,
  HardHat,
  PiggyBank,
  ScanLine,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";

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
    <div className="min-h-screen bg-slate-50/60">
      {/* Sidebar para desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 overflow-y-auto xl:block shadow-sm">
        {/* Logo / Encabezado */}
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-700 text-white shadow-sm">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">EP Interna</p>
            <h1 className="text-base font-bold text-slate-950 leading-tight">Consulta Habitacional</h1>
          </div>
        </div>

        {/* Navegación por Áreas */}
        <nav className="mt-6 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem key={item.to} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="xl:pl-72">
        {/* Header responsive para móvil y tablet */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur xl:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-700 text-white">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-cyan-700">EP Interna</p>
              <h1 className="text-sm font-bold text-slate-950">Consulta Habitacional</h1>
            </div>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {navSections.flatMap((s) => s.items).map((item) => (
              <NavItem key={item.to} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
          compact ? "shrink-0 whitespace-nowrap text-xs" : "",
          isActive
            ? "bg-cyan-700 text-white shadow-sm font-semibold"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ")
      }
    >
      <Icon size={18} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}
