import { Home, Files, ClipboardList, BookOpen, Wrench, Settings, Plus } from "lucide-react";
import clsx from "clsx";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Home", icon: Home, to: "/assignments" },
  { label: "My Groups", icon: Files, to: "/groups" },
  { label: "Assignments", icon: ClipboardList, to: "/assignments" },
  { label: "AI Teacher's Toolkit", icon: Wrench, to: "/toolkit" },
  { label: "My Library", icon: BookOpen, to: "/library" },
];

const mobileItems = [
  { label: "Home", to: "/assignments", icon: Home },
  { label: "My Groups", to: "/groups", icon: Files },
  { label: "Library", to: "/library", icon: BookOpen },
  { label: "AI Toolkit", to: "/toolkit", icon: Wrench },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 flex-col border-r border-borderSoft bg-white px-5 py-6 shadow-panel md:flex">
        <Link to="/assignments" className="mb-6 text-3xl font-black text-ink">
          <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-red-500 text-white">V</span>
          VedaAI
        </Link>

        <button
          type="button"
          onClick={() => navigate("/assignments/create")}
          className="mb-8 inline-flex items-center justify-center gap-2 rounded-full border border-accent bg-navy px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={14} />
          Create Assignment
        </button>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-slate-100 font-semibold text-ink"
                    : "text-slate-500 hover:bg-slate-50"
                )
              }
              end={item.to === "/assignments"}
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div
          className="mt-auto cursor-pointer rounded-2xl border border-borderSoft bg-slate-50 p-4"
          onClick={() => navigate("/settings")}
        >
          <p className="mb-2 inline-flex items-center gap-2 text-xs text-slate-500"><Settings size={12} /> Settings</p>
        </div>
      </aside>

      <button
        type="button"
        onClick={() => navigate("/assignments/create")}
        className="fixed bottom-24 right-5 z-40 inline-grid h-12 w-12 place-items-center rounded-full bg-white text-accent shadow-panel md:hidden"
        aria-label="Create Assignment"
      >
        <Plus size={20} />
      </button>

      <nav className="fixed bottom-3 left-1/2 z-40 flex w-[92%] -translate-x-1/2 items-center justify-around rounded-2xl bg-[#11151d] px-3 py-2 text-white shadow-panel md:hidden">
        {mobileItems.map((item) => {
          const active = location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={clsx("flex flex-col items-center gap-1 px-2 py-1 text-[10px]", active ? "text-white" : "text-slate-400")}
            >
              <item.icon size={14} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
