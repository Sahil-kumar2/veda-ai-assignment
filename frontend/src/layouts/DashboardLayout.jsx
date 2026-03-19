import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-surface md:pl-72">
      <Sidebar />
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-8 sm:px-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
