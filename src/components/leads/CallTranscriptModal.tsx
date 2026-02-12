import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, User, Bot, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface CallTranscriptModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  visitorName?: string;
}

export function CallTranscriptModal({
  sessionId,
  isOpen,
  onClose,
  visitorName = "Visitor",
}: CallTranscriptModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages();
    }
  }, [isOpen, sessionId]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    setLoading(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-accent" />
            Conversation Transcript
            <Badge variant="outline" className="ml-2">
              {messages.length} messages
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageSquare className="w-10 h-10 mb-2 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user"
                        ? "bg-accent/20"
                        : "bg-muted"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="w-4 h-4 text-accent" />
                    ) : (
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "flex-1 max-w-[80%]",
                      message.role === "user" ? "text-right" : "text-left"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {message.role === "user" ? visitorName : "AI Assistant"}
                      </span>
                      <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                    <div
                      className={cn(
                        "inline-block p-3 rounded-2xl text-sm",
                        message.role === "user"
                          ? "bg-accent text-accent-foreground rounded-tr-md"
                          : "bg-muted text-foreground rounded-tl-md"
                      )}
                    >
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
