"use client";

import { Bell, Moon, Sun, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const roleBadgeColors: Record<string, string> = {
    Admin: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    "Entry Operator": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    Viewer: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects, systems, inventory..."
            className="pl-9 h-9 bg-muted/50 border-0 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            3
          </span>
          <span className="sr-only">Notifications</span>
        </Button>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {user?.full_name?.split(" ").map(n => n[0]).join("") || "U"}
          </div>

          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-foreground">
              {user?.full_name || "User"}
            </p>

            <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
              {user?.roles?.length
                ? user.roles.join(", ")
                : "Viewer"}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
