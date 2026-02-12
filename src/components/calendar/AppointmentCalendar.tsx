import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Phone, User, FileText } from "lucide-react";

interface Appointment {
  id: string;
  bot_id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string;
  date: string;
  time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface AppointmentCalendarProps {
  botId: string;
}

export function AppointmentCalendar({ botId }: AppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `bot_id=eq.${botId}`,
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [botId]);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("bot_id", botId)
      .order("date", { ascending: true });

    if (!error && data) {
      setAppointments(data);
    }
  };

  const events = appointments.map((apt) => ({
    id: apt.id,
    title: `${apt.name} - ${apt.service}`,
    start: `${apt.date}T${apt.time}`,
    backgroundColor:
      apt.status === "confirmed"
        ? "hsl(142 76% 36%)"
        : apt.status === "cancelled"
        ? "hsl(0 62% 50%)"
        : "hsl(239 84% 67%)",
    borderColor: "transparent",
    extendedProps: apt,
  }));

  const handleEventClick = (info: { event: { extendedProps: Appointment } }) => {
    setSelectedEvent(info.event.extendedProps as Appointment);
    setIsDialogOpen(true);
  };

  const updateStatus = async (status: string) => {
    if (!selectedEvent) return;

    await supabase
      .from("appointments")
      .update({ status })
      .eq("id", selectedEvent.id);

    setSelectedEvent({ ...selectedEvent, status });
    fetchAppointments();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-success text-success-foreground">Confirmed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge className="bg-accent text-accent-foreground">Pending</Badge>;
    }
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Appointment Calendar</h2>
          <p className="text-sm text-muted-foreground">View and manage all bookings</p>
        </div>
      </div>

      <div className="calendar-wrapper rounded-2xl overflow-hidden border border-border/50 bg-card/60 p-4 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.35)] light:bg-white dark:bg-card/60">
        <style>{`
          .fc {
            --fc-border-color: hsl(222 26% 20% / 0.45);
            --fc-button-bg-color: hsl(222 47% 11%);
            --fc-button-border-color: hsl(222 30% 22%);
            --fc-button-hover-bg-color: hsl(239 84% 67% / 0.18);
            --fc-button-active-bg-color: hsl(239 84% 67% / 0.28);
            --fc-today-bg-color: hsl(239 84% 67% / 0.12);
            --fc-event-border-color: transparent;
            --fc-neutral-bg-color: hsl(222 47% 8%);
            --fc-page-bg-color: transparent;
            --fc-list-event-hover-bg-color: hsl(239 84% 67% / 0.08);
            font-family: "Manrope", ui-sans-serif, system-ui;
          }
          .light .fc {
            --fc-border-color: hsl(220 13% 88%);
            --fc-button-bg-color: hsl(0 0% 100%);
            --fc-button-border-color: hsl(220 13% 88%);
            --fc-button-hover-bg-color: hsl(239 84% 67% / 0.12);
            --fc-button-active-bg-color: hsl(239 84% 67% / 0.2);
            --fc-today-bg-color: hsl(239 84% 67% / 0.08);
            --fc-neutral-bg-color: hsl(0 0% 100%);
            --fc-page-bg-color: hsl(0 0% 100%);
          }
          .fc .fc-view-harness {
            background: linear-gradient(160deg, hsl(222 47% 10% / 0.6), hsl(222 47% 8% / 0.35));
            border-radius: 16px;
            padding: 8px;
          }
          .light .fc .fc-view-harness {
            background: linear-gradient(160deg, hsl(0 0% 100%), hsl(220 16% 96%));
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: hsl(222 30% 18% / 0.5);
          }
          .light .fc-theme-standard td,
          .light .fc-theme-standard th {
            border-color: hsl(220 13% 88%);
          }
          .fc-col-header-cell-cushion, .fc-daygrid-day-number {
            color: hsl(210 40% 96%);
            font-weight: 500;
          }
          .light .fc-col-header-cell-cushion,
          .light .fc-daygrid-day-number {
            color: hsl(222 30% 12%);
          }
          .fc-event {
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.01em;
            box-shadow: 0 8px 18px -14px rgba(0,0,0,0.8);
          }
          .fc-button {
            border-radius: 999px !important;
            padding: 8px 14px !important;
            font-weight: 600 !important;
            letter-spacing: 0.01em;
          }
          .light .fc-button {
            color: hsl(222 30% 12%) !important;
          }
          .fc-toolbar-title {
            color: hsl(210 40% 98%) !important;
            font-size: 1.3rem !important;
            font-weight: 700 !important;
          }
          .light .fc-toolbar-title {
            color: hsl(222 30% 12%) !important;
          }
          .fc-day-today {
            background: hsl(239 84% 67% / 0.12) !important;
            border-radius: 12px;
          }
          .fc-daygrid-day-frame {
            border-radius: 12px;
            transition: background 120ms ease;
          }
          .fc-daygrid-day-frame:hover {
            background: hsl(239 84% 67% / 0.06);
          }
          .fc-day-other .fc-daygrid-day-number {
            color: hsl(215 18% 60%);
          }
          .light .fc-day-other .fc-daygrid-day-number {
            color: hsl(215 18% 50%);
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="glass-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">{selectedEvent.service}</span>
                {getStatusBadge(selectedEvent.status)}
              </div>

              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.name}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.email}</span>
                </div>
                {selectedEvent.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedEvent.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedEvent.time}</span>
                </div>
                {selectedEvent.notes && (
                  <div className="flex items-start gap-3 text-sm">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.notes}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateStatus("confirmed")}
                  disabled={selectedEvent.status === "confirmed"}
                  className="flex-1"
                >
                  Confirm
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => updateStatus("cancelled")}
                  disabled={selectedEvent.status === "cancelled"}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
