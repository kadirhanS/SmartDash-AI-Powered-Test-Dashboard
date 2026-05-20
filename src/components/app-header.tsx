"use client";

import { useState } from "react";
import {
  Menu,
  X,
  BarChart3,
  Clock,
  BrainCircuit,
  Filter,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

// ── Navigation link definitions ──
const navLinks = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "history", label: "Run History", icon: Clock },
  { id: "analiz", label: "AI Analiz", icon: BrainCircuit },
];

// Drawer uses the same links as nav + filter

export default function AppHeader({ navOpen, setNavOpen, toggleTheme }: AppHeaderProps) {
  const [activeLink, setActiveLink] = useState("dashboard");

  const scrollToSection = (sectionId: string) => {
    setNavOpen(false);
    setActiveLink(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          {/* Mobile: Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden size-9"
            onClick={() => setNavOpen(true)}
            aria-label="Menüyü aç"
            title="Menü"
          >
            <Menu className="size-5" />
          </Button>

          {/* Logo */}
          <div className="flex items-center gap-2 font-bold">
            <BarChart3 className="size-8 sm:size-9 text-primary" />
            <span className="text-xl sm:text-2xl tracking-tight">SmartDash</span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="ml-8 hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  activeLink === link.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <link.icon className="size-4" />
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="size-9"
              onClick={toggleTheme}
              aria-label="Tema değiştir"
              title="Tema değiştir"
              suppressHydrationWarning
            >
              <Sun className="size-5 block dark:hidden" />
              <Moon className="size-5 hidden dark:block" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Drawer ── */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Navigasyon menüsü"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-y-0 left-0 z-10 w-72 border-r bg-background shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b">
              <div className="flex items-center gap-2 font-bold text-xl">
                <BarChart3 className="size-7 text-primary" />
                <span className="tracking-tight">SmartDash</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() => setNavOpen(false)}
                aria-label="Menüyü kapat"
                title="Kapat"
              >
                <X className="size-5" />
              </Button>
            </div>

            {/* Nav links */}
            <nav className="p-4 space-y-1">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                    activeLink === link.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <link.icon className="size-5" />
                  {link.label}
                </button>
              ))}

              <Separator className="my-3" />

              {/* Filter link */}
              <button
                onClick={() => scrollToSection("filtreler")}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Filter className="size-5" />
                Filtreler
              </button>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
