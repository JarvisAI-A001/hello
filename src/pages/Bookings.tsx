import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppointmentCalendar } from "@/components/calendar/AppointmentCalendar";
import { cn } from "@/lib/utils";
import { 
  Calendar, 
  Bot, 
  Loader2, 
  Inbox, 
  Clock, 
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  Zap
} from "lucide-react";

interface BotOption {
  id: string;
  name: string;
  bot_id: string | null;
  status: "draft" | "published";
}

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

export default function Bookings() {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotOptionId, setSelectedBotOptionId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBots();
  }, []);

  useEffect(() => {
    if (selectedBotOptionId) {
      fetchAppointments();
    }
  }, [selectedBotOptionId]);

  const fetchBots = async () => {
    setIsLoading(true);
    if (!user) {
      setBots([]);
      setSelectedBotOptionId(null);
      setIsLoading(false);
      return;
    }

    const { data: playgrounds, error: playgroundError } = await supabase
      .from("playgrounds")
      .select("id,name")
      .eq("user_id", user.id);

    if (playgroundError) {
      console.error("Failed to load playgrounds", playgroundError);
      setBots([]);
      setSelectedBotOptionId(null);
      setIsLoading(false);
      return;
    }

    if (!playgrounds || playgrounds.length === 0) {
      setBots([]);
      setSelectedBotOptionId(null);
      setIsLoading(false);
      return;
    }

    // Start with playgrounds as draft bots
    let options: BotOption[] = playgrounds.map((pg) => ({
      id: pg.id,
      name: pg.name,
      bot_id: null,
      status: "draft" as const,
    }));

    const { data, error } = await supabase
      .from("bots")
      .select("bot_id, name")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const botsByName = new Map(data.map((bot) => [bot.name, bot.bot_id]));
      options = options.map((opt) => {
        const botId = botsByName.get(opt.name) || null;
        return {
          ...opt,
          bot_id: botId,
          status: botId ? "published" : "draft",
        };
      });
    }

    setBots(options);
    if (options.length > 0) {
      setSelectedBotOptionId(options[0].id);
    }
    setIsLoading(false);
  };

  const fetchAppointments = async () => {
    const selectedBot = bots.find((bot) => bot.id === selectedBotOptionId);
    if (!selectedBot?.bot_id) {
      setAppointments([]);
      return;
    }
    
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("bot_id", selectedBot.bot_id)
      .order("date", { ascending: false });

    if (!error && data) {
      setAppointments(data);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "completed":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
    confirmed: appointments.filter(a => a.status?.toLowerCase() === 'confirmed').length,
    completed: appointments.filter(a => a.status?.toLowerCase() === 'completed').length,
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
                  <p className="text-sm text-muted-foreground">
                    Manage all your booking requests in one place
                  </p>
                </div>
              </div>

              {/* Bot Selector */}
              {bots.length > 0 && (
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Select value={selectedBotOptionId || undefined} onValueChange={setSelectedBotOptionId}>
                    <SelectTrigger className="w-[240px] bg-secondary/50 border-secondary">
                      <SelectValue placeholder="Select a bot" />
                    </SelectTrigger>
                    <SelectContent>
                      {bots.map((bot) => (
                        <SelectItem key={bot.id} value={bot.id}>
                          <span className="font-medium">{bot.name}</span>
                          <span className={cn(
                            "ml-2 text-xs",
                            bot.status === "published" ? "text-emerald-500" : "text-amber-500"
                          )}>
                            {bot.status === "published" ? "Published" : "Draft"}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            {!isLoading && selectedBotOptionId && bots.find((bot) => bot.id === selectedBotOptionId)?.bot_id && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Total</p>
                        <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                      </div>
                      <Zap className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Pending</p>
                        <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-yellow-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Confirmed</p>
                        <p className="text-2xl font-bold text-foreground">{stats.confirmed}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">Completed</p>
                        <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Appointments List */}
          {isLoading ? (
            <Card className="bg-secondary/30 border-secondary">
              <CardContent className="p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-accent animate-spin mb-4" />
                <p className="text-muted-foreground">Loading appointments...</p>
              </CardContent>
            </Card>
          ) : bots.length === 0 ? (
            <Card className="bg-secondary/30 border-secondary">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                  <Inbox className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No Bots Found</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Create a chatbot in the Playground first to start receiving appointments.
                </p>
                <Button 
                  onClick={() => window.location.href = "/playground"}
                  className="bg-accent hover:bg-accent/90"
                >
                  Go to Playground
                </Button>
              </CardContent>
            </Card>
          ) : bots.find((bot) => bot.id === selectedBotOptionId)?.status === "draft" ? (
            <Card className="bg-secondary/30 border-secondary">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                  <Bot className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Draft AI Selected</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Publish this AI to start receiving appointments.
                </p>
                <Button 
                  onClick={() => window.location.href = "/playground"}
                  className="bg-accent hover:bg-accent/90"
                >
                  Go to Playground
                </Button>
              </CardContent>
            </Card>
          ) : appointments.length === 0 ? (
            <Card className="bg-secondary/30 border-secondary">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
                  <Calendar className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">No Appointments Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Share your booking widget with your visitors to start receiving appointments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-secondary/40 to-secondary/20 border-secondary/60 hover:border-accent/40"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold text-foreground">{appointment.name}</h3>
                          <Badge 
                            className={`${getStatusColor(appointment.status)} border`}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(appointment.status)}
                              {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1).toLowerCase()}
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{appointment.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">{appointment.service}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm pt-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${appointment.email}`} className="hover:text-accent transition-colors">
                              {appointment.email}
                            </a>
                          </div>
                          {appointment.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span>{appointment.phone}</span>
                            </div>
                          )}
                        </div>

                        {appointment.notes && (
                          <div className="pt-2 text-sm">
                            <p className="text-muted-foreground italic">"{appointment.notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 md:flex-col">
                        <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                          View Details
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 md:flex-none">
                          Actions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && bots.find((bot) => bot.id === selectedBotOptionId)?.bot_id && appointments.length > 0 && (
            <div className="mt-8">
              <AppointmentCalendar botId={bots.find((bot) => bot.id === selectedBotOptionId)?.bot_id || ""} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
