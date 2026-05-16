import {
  Bell,
  BarChart3,
  FileSpreadsheet,
  LayoutDashboard,
  Search,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/personas", label: "Personas", icon: Search },
  { to: "/importar", label: "Importar", icon: Upload },
  { to: "/alertas", label: "Alertas", icon: Bell },
  { to: "/reportes", label: "Reportes", icon: BarChart3 },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white/90 px-5 py-6 backdrop-blur xl:block">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-700 text-white">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-700">EP interna</p>
            <h1 className="text-lg font-semibold text-slate-950">Consulta Habitacional</h1>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur xl:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-700 text-white">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-cyan-700">EP interna</p>
              <h1 className="text-base font-semibold text-slate-950">Consulta Habitacional</h1>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
          compact ? "shrink-0" : "",
          isActive
            ? "bg-slate-950 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        ].join(" ")
      }
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}
