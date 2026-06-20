"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Rocket,
  Package,
  Network,
  Wrench,
  UserCog,
  LogOut,
  Satellite,
  Gauge,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Projects", href: "/projects", icon: Rocket },
  { label: "Systems Hierarchy", href: "/hierarchy", icon: Network },
  { label: "Inventory", href: "/inventory", icon: Package },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
];

const adminItems = [
  { label: "Users", href: "/users", icon: UserCog },
  { label: "Statuses", href: "/statuses", icon: Gauge },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Satellite className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-semibold tracking-tight text-sidebar-foreground">SSDLS</h1>
          <p className="text-xs text-sidebar-foreground/60">Product Lifecycle Management System </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {user?.roles?.includes("Admin") && (
          <div className="mt-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Admin
            </p>
            <div className="space-y-1">
              {adminItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
