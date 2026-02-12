import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  MessageCircle,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  MapPin,
  Bot,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BotOption {
  id: string;
  name: string;
  bot_id: string | null;
  status: "draft" | "published";
}

interface AnalyticsData {
  date: string;
  total_users: number;
  total_chats: number;
  total_messages: number;
}

interface LocationData {
  location: string;
  user_count: number;
}

const COLORS = ["#0EA5E9", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#6366F1"];

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: typeof Users;
  iconColor?: string;
  suffix?: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor = "text-accent", suffix }: StatCardProps) {
  return (
    <div className="p-4 bg-card/80 border border-border/60 rounded-2xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground mt-2">
            {typeof value === "number" ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
          </p>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 mt-1 text-sm",
              change >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(change)}% from last period</span>
            </div>
          )}
        </div>
        <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", iconColor.replace("text-", "bg-") + "/10")}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotOptionId, setSelectedBotOptionId] = useState<string>("");
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [activeSessions, setActiveSessions] = useState(0);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalChats: 0,
    avgDuration: "0m 0s",
  });

  // Fetch user's bots linked to playgrounds
  useEffect(() => {
    const fetchBots = async () => {
      if (!user) {
        setBots([]);
        setSelectedBotId("");
        return;
      }
      const { data: playgrounds, error: playgroundError } = await supabase
        .from("playgrounds")
        .select("id,name,setup_step,module_id,bot_config")
        .eq("user_id", user.id);

      if (playgroundError) {
        console.error("Failed to load playgrounds", playgroundError);
        setBots([]);
        setSelectedBotId("");
        return;
      }

      if (!playgrounds || playgrounds.length === 0) {
        setBots([]);
        setSelectedBotOptionId("");
        return;
      }

      const { data, error } = await supabase
        .from("bots")
        .select("bot_id, name")
        .eq("is_active", true);

      if (!error && data) {
        const botsByName = new Map(data.map((bot) => [bot.name, bot.bot_id]));
        const options: BotOption[] = playgrounds.map((pg) => {
          const config = (pg.bot_config ?? {}) as { publishStatus?: string; publishedBotId?: string };
          const botId = config.publishedBotId || botsByName.get(pg.name) || null;
          const isPublished = config.publishStatus === "published" || Boolean(botId);
          return {
            id: pg.id,
            name: pg.name,
            bot_id: botId,
            status: isPublished ? "published" : "draft",
          };
        });
        setBots(options);
        if (options.length > 0 && !selectedBotOptionId) {
          setSelectedBotOptionId(options[0].id);
        }
      }
    };

    fetchBots();
  }, [user]);

  // Fetch analytics data
  useEffect(() => {
    const selectedBot = bots.find((bot) => bot.id === selectedBotOptionId);
    if (!selectedBot?.bot_id) {
      setAnalyticsData([]);
      setLocationData([]);
      setActiveSessions(0);
      setTotalStats({
        totalUsers: 0,
        totalChats: 0,
        avgDuration: "0m 0s",
      });
      setIsLoading(false);
      return;
    }

    const fetchAnalytics = async () => {
      setIsLoading(true);

      // Calculate date range
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch analytics data
      const { data: analytics } = await supabase
        .from("bot_analytics")
        .select("*")
        .eq("bot_id", selectedBot.bot_id)
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (analytics) {
        setAnalyticsData(analytics);
        
        // Calculate totals
        const totals = analytics.reduce(
          (acc, curr) => ({
            totalUsers: acc.totalUsers + (curr.total_users || 0),
            totalChats: acc.totalChats + (curr.total_chats || 0),
            totalDuration: acc.totalDuration + (curr.avg_session_duration_seconds || 0),
          }),
          { totalUsers: 0, totalChats: 0, totalDuration: 0 }
        );

        const avgSeconds = analytics.length > 0 ? totals.totalDuration / analytics.length : 0;
        const mins = Math.floor(avgSeconds / 60);
        const secs = Math.floor(avgSeconds % 60);

        setTotalStats({
          totalUsers: totals.totalUsers,
          totalChats: totals.totalChats,
          avgDuration: `${mins}m ${secs}s`,
        });
      }

      // Fetch location data
      const { data: locations } = await supabase
        .from("bot_location_analytics")
        .select("*")
        .eq("bot_id", selectedBot.bot_id)
        .order("user_count", { ascending: false })
        .limit(10);

      if (locations) {
        setLocationData(locations);
      }

      // Fetch active sessions count - sessions active in the last 60 seconds
      const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
      const { count } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .eq("bot_id", selectedBot.bot_id)
        .eq("status", "active")
        .gte("last_activity_at", sixtySecondsAgo);

      setActiveSessions(count || 0);

      setIsLoading(false);
    };

    fetchAnalytics();

    // Subscribe to realtime session updates for live count
    const channel = supabase
      .channel(`analytics-${selectedBot.bot_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `bot_id=eq.${selectedBot.bot_id}`,
        },
        async () => {
          // Re-fetch active sessions - those with activity in the last 60 seconds
          const sixtySecondsAgo = new Date(Date.now() - 60000).toISOString();
          const { count } = await supabase
            .from("chat_sessions")
            .select("*", { count: "exact", head: true })
            .eq("bot_id", selectedBot.bot_id)
            .eq("status", "active")
            .gte("last_activity_at", sixtySecondsAgo);
          setActiveSessions(count || 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBotOptionId, timeRange, bots, refreshTick]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTick((prev) => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Prepare chart data
  const chartData = analyticsData.map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    users: d.total_users,
    chats: d.total_chats,
  }));

  const topLocations = locationData.slice(0, 5);
  const leastLocations = [...locationData].reverse().slice(0, 5);
  const selectedBot = bots.find((bot) => bot.id === selectedBotOptionId);

  if (bots.length === 0 && !isLoading) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No AI found</p>
          <p className="text-sm">Create an AI in Playground to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-b from-background via-background to-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-3xl border border-border/60 bg-card/70 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Performance</p>
              <h2 className="text-3xl font-semibold text-foreground mt-2">Analytics</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Monitor your chatbot usage, engagement, and live activity.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedBotOptionId} onValueChange={setSelectedBotOptionId}>
                <SelectTrigger className="w-56">
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
              <div className="flex gap-2 p-1 rounded-full border border-border/60 bg-background/60">
                {(["7d", "30d", "90d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all",
                      timeRange === range
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="rounded-full">
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>

        {selectedBot?.status === "draft" ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Draft AI selected</p>
              <p className="text-sm">Publish this AI to view analytics.</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={totalStats.totalUsers}
                icon={Users}
                iconColor="text-accent"
              />
              <StatCard
                title="Total Chats"
                value={totalStats.totalChats}
                icon={MessageCircle}
                iconColor="text-purple-500"
              />
              <StatCard
                title="Avg. Session Duration"
                value={totalStats.avgDuration}
                icon={Clock}
                iconColor="text-orange-500"
              />
              <StatCard
                title="Live Users"
                value={activeSessions}
                icon={Activity}
                iconColor="text-green-500"
                suffix="now"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Usage Over Time */}
              <div className="lg:col-span-2 p-6 bg-card/80 border border-border/60 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  Usage Over Time
                </h3>
                {chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No data available for this period</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="users"
                          stroke="#0EA5E9"
                          fillOpacity={1}
                          fill="url(#colorUsers)"
                          name="Users"
                        />
                        <Area
                          type="monotone"
                          dataKey="chats"
                          stroke="#8B5CF6"
                          fillOpacity={1}
                          fill="url(#colorChats)"
                          name="Chats"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#0EA5E9]" />
                    <span className="text-sm text-muted-foreground">Users</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#8B5CF6]" />
                    <span className="text-sm text-muted-foreground">Chats</span>
                  </div>
                </div>
              </div>

              {/* Live Users Indicator */}
              <div className="p-6 bg-card/80 border border-border/60 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Live Activity
                </h3>
                <div className="text-center py-8">
                  <div className="relative inline-flex">
                    <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center">
                      <span className="text-4xl font-bold text-green-500">{activeSessions}</span>
                    </div>
                    {activeSessions > 0 && (
                      <div className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-muted-foreground mt-4">Users active right now</p>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total sessions today</span>
                    <span className="text-foreground font-medium">
                      {analyticsData.length > 0 ? analyticsData[analyticsData.length - 1]?.total_chats || 0 : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg. session duration</span>
                    <span className="text-foreground font-medium">{totalStats.avgDuration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Used Locations */}
              <div className="p-6 bg-card/80 border border-border/60 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  Most Used Locations
                </h3>
                {topLocations.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p>No location data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topLocations}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="user_count"
                          >
                            {topLocations.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {topLocations.map((loc, index) => (
                        <div key={loc.location} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm text-foreground truncate max-w-[120px]">
                              {loc.location}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">{loc.user_count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Least Used Locations */}
              <div className="p-6 bg-card/80 border border-border/60 rounded-2xl shadow-sm">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-500" />
                  Least Used Locations
                </h3>
                {leastLocations.length === 0 ? (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    <p>No location data available</p>
                  </div>
                ) : (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leastLocations} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis
                          type="category"
                          dataKey="location"
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          width={80}
                          tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="user_count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  Consider targeted campaigns in these regions to increase engagement.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
