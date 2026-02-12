import { useCallback, useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { featureRows, pricingPlans } from "@/data/pricing";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface AppointmentReminder {
  id: string;
  name: string;
  service: string;
  date: string;
  time: string;
  status: string | null;
}

const PROMO_LAST_SHOWN_KEY = "pricingPromo:lastShown";
const PROMO_DISMISSED_KEY = "pricingPromo:dismissed";
const REMINDER_PREFIX = "appointmentReminder";
const REMINDER_WINDOWS_MIN = [10, 1];
const PROMO_INTERVAL_MS = 3 * 60 * 60 * 1000;

const pad = (value: number) => String(value).padStart(2, "0");

const formatLocalDate = (value: Date) => {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
};

const getAppointmentStart = (appointment: AppointmentReminder) => {
  const start = new Date(`${appointment.date}T${appointment.time}`);
  return Number.isNaN(start.getTime()) ? null : start;
};

export function GlobalNotifiers() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<AppointmentReminder[]>([]);
  const [todayKey, setTodayKey] = useState(() => formatLocalDate(new Date()));
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  const fetchTodayAppointments = useCallback(async () => {
    const today = formatLocalDate(new Date());
    setTodayKey(today);

    const { data } = await supabase
      .from("appointments")
      .select("id,name,service,date,time,status")
      .eq("date", today);

    setAppointments((data ?? []) as AppointmentReminder[]);
  }, []);

  useEffect(() => {
    fetchTodayAppointments();
    const interval = setInterval(fetchTodayAppointments, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTodayAppointments]);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const today = formatLocalDate(now);
      if (today !== todayKey) {
        fetchTodayAppointments();
        return;
      }

      appointments.forEach((apt) => {
        const status = apt.status?.toLowerCase();
        if (status === "cancelled" || status === "completed") return;

        const start = getAppointmentStart(apt);
        if (!start) return;

        const diffMs = start.getTime() - now.getTime();
        if (diffMs <= 0) return;

        REMINDER_WINDOWS_MIN.forEach((minutes) => {
          const upper = minutes * 60 * 1000;
          const lower = (minutes - 1) * 60 * 1000;
          if (diffMs <= upper && diffMs > lower) {
            const reminderKey = `${REMINDER_PREFIX}:${apt.id}:${minutes}`;
            if (localStorage.getItem(reminderKey)) return;

            localStorage.setItem(reminderKey, "true");
            toast(`Appointment in ${minutes} ${minutes === 1 ? "minute" : "minutes"}`, {
              description: `${apt.name} · ${apt.service} at ${apt.time}`,
              duration: 8000,
            });
          }
        });
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60 * 1000);
    return () => clearInterval(interval);
  }, [appointments, fetchTodayAppointments, todayKey]);

  useEffect(() => {
    const shouldShowPromo = () => {
      if (localStorage.getItem(PROMO_DISMISSED_KEY) === "true") return false;
      const lastShown = Number(localStorage.getItem(PROMO_LAST_SHOWN_KEY) || "0");
      return Date.now() - lastShown >= PROMO_INTERVAL_MS;
    };

    const openPromo = () => {
      setIsPromoOpen(true);
      localStorage.setItem(PROMO_LAST_SHOWN_KEY, String(Date.now()));
    };

    if (shouldShowPromo()) {
      openPromo();
    }

    const interval = setInterval(() => {
      if (!isPromoOpen && shouldShowPromo()) {
        openPromo();
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [isPromoOpen]);

  const handlePromoOpenChange = (open: boolean) => {
    setIsPromoOpen(open);
    if (!open) {
      localStorage.setItem(PROMO_LAST_SHOWN_KEY, String(Date.now()));
    }
  };

  const handleDismissPromo = () => {
    localStorage.setItem(PROMO_DISMISSED_KEY, "true");
    setIsPromoOpen(false);
  };

  const handleViewPricing = () => {
    setIsPromoOpen(false);
    localStorage.setItem(PROMO_LAST_SHOWN_KEY, String(Date.now()));
    navigate("/pricing");
  };

  return (
    <Dialog open={isPromoOpen} onOpenChange={handlePromoOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Subscription</DialogTitle>
          <DialogDescription>
            Choose the plan that fits your growth stage and unlock advanced features.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "rounded-xl border p-4 bg-card",
                plan.highlight ? "border-accent shadow-glow" : "border-border/60"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-foreground">{plan.name}</p>
                {plan.badge && (
                  <Badge variant="outline" className="border-accent text-accent text-xs">
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{plan.bestFor}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/40">
                <th className="text-left py-3 px-3 text-sm font-semibold text-foreground">
                  Feature
                </th>
                {pricingPlans.map((plan) => (
                  <th
                    key={plan.id}
                    className="text-center py-3 px-3 text-sm font-semibold text-foreground"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row, index) => (
                <tr
                  key={row.name}
                  className={cn(
                    "border-b border-border/50",
                    index % 2 === 0 ? "bg-card/40" : ""
                  )}
                >
                  <td className="py-3 px-3 text-sm text-foreground">{row.name}</td>
                  {pricingPlans.map((plan) => (
                    <td key={plan.id} className="py-3 px-3 text-center text-sm">
                      <span
                        className={cn(
                          plan.highlight ? "font-medium text-accent" : "text-foreground"
                        )}
                      >
                        {row.values[plan.id]}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleDismissPromo}>
            Don't show again
          </Button>
          <Button variant="outline" onClick={() => setIsPromoOpen(false)}>
            Not now
          </Button>
          <Button variant="accent" onClick={handleViewPricing}>
            View Pricing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
