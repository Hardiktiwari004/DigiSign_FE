import React from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-blue-600/20 dark:bg-slate-950 dark:text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Navigation sidebar */}
      <Sidebar />

      {/* Primary content area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Desktop Navbar */}
        <Navbar />

        {/* Inner page content */}
        <main className="flex-grow overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
