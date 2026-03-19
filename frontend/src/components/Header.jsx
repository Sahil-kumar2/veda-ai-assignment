import { Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-borderSoft bg-white/90 backdrop-blur md:ml-72">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/assignments")}
            className="rounded-lg border border-borderSoft p-2 text-slate-600 md:hidden"
          >
            <Menu size={18} />
          </button>
          <p className="text-sm font-semibold text-slate-500">AI Assessment Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.alert("No new notifications")}
            className="rounded-full border border-borderSoft p-2 text-slate-600"
          >
            <Bell size={16} />
          </button>
          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white">
            Beta
          </div>
        </div>
      </div>
    </header>
  );
}
