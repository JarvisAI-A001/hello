import { useState, useEffect } from "react";
import {
  Eye,
  MessageCircle,
  User,
  Clock,
  AlertTriangle,
  Shield,
  Search,
  Globe,
  RefreshCw,
  Bot,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ChatSession {
  id: string;
  bot_id: string;
  visitor_id: string;
  location: string;
  started_at: string;
  status: "active" | "idle" | "ended";
  flagged: boolean;
  updated_at: string;
  last_activity_at?: string;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "bot";
  content: string;
  created_at: string;
}

interface BotOption {
  id: string;
  name: string;
  bot_id: string | null;
  status: "draft" | "published";
}

export default function LiveChatViewer() {
  const { user } = useAuth();
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotOptionId, setSelectedBotOptionId] = useState<string>("");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "flagged">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch sessions for selected bot
  useEffect(() => {
    const selectedBot = bots.find((bot) => bot.id === selectedBotOptionId);
    if (!selectedBot?.bot_id) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    const fetchSessions = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("bot_id", selectedBot.bot_id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setSessions(data as ChatSession[]);
        if (data.length > 0 && !selectedSession) {
          setSelectedSession(data[0] as ChatSession);
        }
      }
      setIsLoading(false);
    };

    fetchSessions();

    // Subscribe to realtime updates for sessions
    const sessionsChannel = supabase
      .channel(`sessions-${selectedBot.bot_id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `bot_id=eq.${selectedBot.bot_id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSessions((prev) => [payload.new as ChatSession, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === (payload.new as ChatSession).id ? (payload.new as ChatSession) : s
              )
            );
            if (selectedSession?.id === (payload.new as ChatSession).id) {
              setSelectedSession(payload.new as ChatSession);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
    };
  }, [selectedBotOptionId, bots]);

  // Fetch messages for selected session
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", selectedSession.id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
    };

    fetchMessages();

    // Subscribe to realtime updates for messages
    const messagesChannel = supabase
      .channel(`messages-${selectedSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `session_id=eq.${selectedSession.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [selectedSession?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const botId = selectedBot?.bot_id;
    if (botId) {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("bot_id", botId)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (data) {
        setSessions(data as ChatSession[]);
      }
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (startStr: string) => {
    const diff = Date.now() - new Date(startStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const filteredSessions = sessions.filter((session) => {
    if (filterStatus === "active" && session.status !== "active") return false;
    if (filterStatus === "flagged" && !session.flagged) return false;
    if (searchQuery && !session.visitor_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Calculate live sessions - those active within the last 60 seconds
  const sixtySecondsAgo = Date.now() - 60000;
  
  // Deduplicate sessions by visitor_id to get unique active sessions
  const uniqueSessionMap = new Map<string, ChatSession>();
  sessions.forEach(s => {
    if (s.status === 'active') {
      const lastActivity = s.last_activity_at ? new Date(s.last_activity_at).getTime() : new Date(s.updated_at).getTime();
      if (lastActivity >= sixtySecondsAgo) {
        // Keep only the most recent session per visitor
        const existing = uniqueSessionMap.get(s.visitor_id);
        if (!existing || new Date(s.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          uniqueSessionMap.set(s.visitor_id, s);
        }
      }
    }
  });
  
  const liveSessions = uniqueSessionMap.size;
  const flaggedSessions = sessions.filter((s) => s.flagged).length;

  // Helper to check if a session is "live"
  const isSessionLive = (session: ChatSession) => {
    if (session.status !== "active") return false;
    const lastActivity = session.last_activity_at ? new Date(session.last_activity_at).getTime() : new Date(session.updated_at).getTime();
    return lastActivity >= sixtySecondsAgo;
  };

  if (bots.length === 0 && !isLoading) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No AI found</p>
          <p className="text-sm">Create an AI in Playground to view live conversations</p>
        </div>
      </div>
    );
  }

  const selectedBot = bots.find((bot) => bot.id === selectedBotOptionId);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-accent" />
              Live Chat Viewer
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitor conversations in real-time. <span className="text-orange-500">View-only mode</span> - you cannot interact with users.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedBotOptionId} onValueChange={setSelectedBotOptionId}>
              <SelectTrigger className="w-48">
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
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-500">{liveSessions} live</span>
          </div>
          {flaggedSessions > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-full">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium text-orange-500">{flaggedSessions} flagged</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{sessions.length} total sessions</span>
          </div>
        </div>
      </div>

      {selectedBot?.status === "draft" ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Draft AI selected</p>
            <p className="text-sm">Publish this AI to view live conversations.</p>
          </div>
        </div>
      ) : (
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions List */}
        <div className="w-80 border-r border-border flex flex-col shrink-0">
          {/* Search & Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search visitors..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "active", "flagged"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={cn(
                    "flex-1 px-2 py-1 text-xs font-medium rounded transition-all capitalize",
                    filterStatus === status
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Sessions */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions found</p>
              </div>
            ) : (
              filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    "w-full p-3 border-b border-border text-left transition-colors",
                    selectedSession?.id === session.id
                      ? "bg-accent/10"
                      : "hover:bg-secondary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground text-sm">
                          {session.visitor_id.substring(0, 16)}...
                        </span>
                        {session.flagged && (
                          <AlertTriangle className="inline-block w-3 h-3 text-orange-500 ml-1" />
                        )}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        session.status === "active" ? "bg-green-500" : session.status === "idle" ? "bg-yellow-500" : "bg-gray-400"
                      )}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-10">
                    <Globe className="w-3 h-3" />
                    {session.location || "Unknown"}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 ml-10">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(session.started_at)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat View */}
        <div className="flex-1 flex flex-col">
          {selectedSession ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedSession.visitor_id}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-3 h-3" />
                        {selectedSession.location || "Unknown"}
                        <span>•</span>
                        <span>Session: {formatDuration(selectedSession.started_at)}</span>
                      </div>
                    </div>
                  </div>
                  {selectedSession.flagged && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-500">Flagged for review</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2 rounded-2xl",
                          msg.role === "user"
                            ? "bg-accent text-accent-foreground rounded-br-sm"
                            : "bg-secondary text-foreground rounded-bl-sm"
                        )}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-1">{formatTime(msg.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* View-only notice */}
              <div className="p-4 border-t border-border bg-secondary/30">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">View-only mode - You cannot send messages or interact with this conversation</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a session to view the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
