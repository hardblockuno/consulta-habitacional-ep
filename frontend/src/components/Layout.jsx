import {
  BarChart3,
  Bell,
  Building2,
  Database,
  HardHat,
  LineChart,
  LogOut,
  Menu,
  PiggyBank,
  ScanLine,
  ShieldCheck,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function getNavSectionsForUser(user) {
  if (!user) return [];

  if (user.es_admin) {
    return [
      {
        title: "ADMINISTRACIÓN",
        items: [
          { to: "/admin-soporte", label: "Admin y Soporte", icon: ShieldCheck, primary: true },
        ],
      },
      {
        title: "COORDINACIÓN",
        items: [
          { to: "/coordinacion", label: "Consola Ejecutiva", icon: LineChart },
        ],
      },
      {
        title: "ÁREA SOCIAL",
        items: [
          { to: "/demanda", label: "Organización Demanda", icon: Users },
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
  }

  if (user.rol === "coordinador") {
    return [
      {
        title: "COORDINACIÓN",
        items: [
          { to: "/coordinacion", label: "Consola Ejecutiva", icon: LineChart, primary: true },
        ],
      },
      {
        title: "ÁREA SOCIAL",
        items: [
          { to: "/demanda", label: "Organización Demanda", icon: Users },
          { to: "/bases-datos", label: "Bases de datos", icon: Database },
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
  }

  if (user.rol === "tecnico") {
    return [
      {
        title: "ÁREA TÉCNICA",
        items: [
          { to: "/tecnica", label: "Proyectos y Terrenos", icon: HardHat, primary: true },
          { to: "/postventa", label: "Postventa", icon: Wrench },
        ],
      },
      {
        title: "SEGUIMIENTO",
        items: [
          { to: "/alertas", label: "Alertas Técnicas", icon: Bell },
        ],
      },
    ];
  }

  // Por defecto: Profesional Área Social
  return [
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
      title: "SEGUIMIENTO",
      items: [
        { to: "/alertas", label: "Alertas Sociales", icon: Bell },
      ],
    },
  ];
}

const rolePills = {
  admin: { label: "Admin / Soporte", dot: "bg-slate-900" },
  coordinador: { label: "Coordinación", dot: "bg-indigo-500" },
  social: { label: "Área Social", dot: "bg-emerald-500" },
  tecnico: { label: "Área Técnica", dot: "bg-amber-500" },
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navSections = getNavSectionsForUser(user);
  const pill = rolePills[user?.rol] || { label: "Profesional", dot: "bg-slate-400" };

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 antialiased">
      {/* Sidebar para desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/80 bg-white px-4 py-5 overflow-y-auto xl:flex xl:flex-col xl:justify-between">
        <div>
          {/* Logo / Encabezado */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white shadow-2xs">
              <Building2 size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-slate-900 leading-tight">SIGEP</h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Plan Social · EP
              </p>
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
        </div>

        {/* Perfil del Usuario y Salir */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.nombre_completo || user?.username || "Usuario"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
                  {pill.label}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Drawer móvil con Backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white p-5 border-r border-slate-200/80 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white shadow-2xs">
                    <Building2 size={16} />
                  </div>
                  <div>
                    <h1 className="text-xs font-semibold text-slate-900 leading-tight">SIGEP</h1>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Plan Social</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Cerrar menú"
                >
                  <X size={14} />
                </button>
              </div>

              <nav className="mt-4 space-y-4">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <p className="px-2.5 text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => (
                        <NavItem
                          key={item.to}
                          item={item}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.nombre_completo || user?.username || "Usuario"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate">
                      {pill.label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  title="Cerrar sesión"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Contenido principal */}
      <div className="xl:pl-64">
        {/* Header responsive para móvil y tablet */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 px-4 py-3 backdrop-blur xl:hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                aria-label="Abrir menú"
              >
                <Menu size={16} />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white">
                  <Building2 size={14} />
                </div>
                <div>
                  <h1 className="text-xs font-semibold text-slate-900 leading-tight">SIGEP</h1>
                  <p className="text-[9px] font-medium uppercase text-slate-400">Plan Social</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 shadow-2xs">
                <span className={`h-1.5 w-1.5 rounded-full ${pill.dot}`} />
                {pill.label}
              </span>
              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>

          <nav className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {navSections.flatMap((s) => s.items).map((item) => (
              <NavItem key={item.to} item={item} compact />
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ item, compact = false, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onClick}
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
