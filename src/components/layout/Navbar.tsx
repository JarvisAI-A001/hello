import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Layers, Home, FolderKanban, Sparkles, Store, DollarSign, Shield, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "Create AI", path: "/playground", icon: Sparkles },
  { name: "Bookings", path: "/bookings", icon: Calendar },
  { name: "Marketplace", path: "/marketplace", icon: Store },
  { name: "Pricing", path: "/pricing", icon: DollarSign },
  { name: "Policies", path: "/policies", icon: Shield },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile } = useAuth();
  const initials = useMemo(() => {
    const email = user?.email || "";
    if (!email) return "U";
    return email.slice(0, 2).toUpperCase();
  }, [user?.email]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-md shadow-accent/30 group-hover:shadow-lg group-hover:shadow-accent/40 transition-all duration-300">
              <Layers className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">
              model<span className="text-accent">stack</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <span className={cn("relative", isActive && "nav-icon-active")}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="rounded-full">
              <Link to="/settings" aria-label="Settings">
                <Settings className="w-4 h-4" />
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="ghost" size="icon" className="rounded-full">
                <Link to="/settings" aria-label="Account">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Profile"
                      className="w-8 h-8 rounded-full object-cover border border-border/60"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-accent/20 border border-border/60 flex items-center justify-center text-xs font-semibold text-accent">
                      {initials}
                    </div>
                  )}
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild variant="accent" size="sm">
                  <Link to="/pricing">Start Free Trial</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/30 animate-slide-up">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-3",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <span className={cn("relative", isActive && "nav-icon-active")}>
                      <Icon className="w-4 h-4" />
                    </span>
                    {link.name}
                  </Link>
                );
              })}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border/30">
                <Button asChild variant="ghost" className="w-full justify-center">
                  <Link to="/settings">Settings</Link>
                </Button>
                {user ? (
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to="/settings">Account</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full justify-center">
                      <Link to="/auth">Log in</Link>
                    </Button>
                    <Button asChild variant="accent" className="w-full justify-center">
                      <Link to="/pricing">Start Free Trial</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
