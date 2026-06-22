"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { ThemeSwitch } from "./ThemeSwitch";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Files,
  ShieldCheck,
  History,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: "USER" },
    { name: isAdmin ? "All Documents" : "My Documents", href: "/documents", icon: Files, role: "USER" },
    { name: "Public Verify", href: "/verify", icon: ShieldCheck, role: "USER" },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: History, role: "ADMIN" },
  ];

  const filteredNavigation = navigation.filter(
    (item) => item.role === "USER" || user?.role === "ADMIN"
  );

  const handleLogout = () => {
    logout();
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100 border-r border-slate-800 dark:bg-slate-950 dark:border-slate-900">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-slate-800 dark:border-slate-900">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <span className="font-bold text-white text-base">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            DigiSign
          </span>
        </Link>
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 font-semibold"
                  : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mr-3 transition-transform duration-200 group-hover:scale-110",
                  isActive ? "text-white" : "text-slate-500 group-hover:text-slate-400"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile and Settings */}
      <div className="p-4 border-t border-slate-800 dark:border-slate-900 bg-slate-900/50 dark:bg-slate-950/50 space-y-4">
        {/* Theme Switching & Quick Links */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-500">Theme Preference</span>
          <ThemeSwitch />
        </div>

        {/* User profile capsule */}
        <div className="flex items-center p-3 rounded-xl bg-slate-800/40 dark:bg-slate-900/30 border border-slate-800/60 dark:border-slate-900/40">
          <div className="w-9 h-9 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mr-3">
            <UserIcon className="h-[18px] w-[18px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 truncate flex items-center mt-0.5">
              <span className={cn(
                "px-1.5 py-0.5 rounded-md font-mono text-[9px]",
                user?.role === "ADMIN" ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
              )}>
                {user?.role}
              </span>
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/5 rounded-xl px-4 py-3 h-auto"
        >
          <LogOut className="w-5 h-5 mr-3 text-red-400/80" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header (Navbar) */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-900 text-slate-100 border-b border-slate-800 dark:bg-slate-950 dark:border-slate-900 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="font-bold text-white text-base">D</span>
          </div>
          <span className="font-bold text-lg tracking-tight">DigiSign</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Mobile Sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="relative flex flex-col w-full max-w-xs h-full animate-in slide-in-from-left duration-200">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Layout */}
      <aside className="hidden md:flex md:flex-shrink-0 w-64 flex-col fixed inset-y-0 z-20">
        <SidebarContent />
      </aside>
    </>
  );
}
export default Sidebar;
