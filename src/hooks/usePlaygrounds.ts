import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Json } from "@/integrations/supabase/types";

export interface Playground {
  id: string;
  user_id: string;
  name: string;
  module_id: string | null;
  bot_config: Record<string, unknown>;
  messages: Array<{ role: string; content: string }>;
  current_view: string;
  setup_step: number;
  created_at: string;
  updated_at: string;
}

export function usePlaygrounds(userId: string | undefined) {
  const { toast } = useToast();
  const [playgrounds, setPlaygrounds] = useState<Playground[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlaygroundId, setCurrentPlaygroundId] = useState<string | null>(null);

  const fetchPlaygrounds = useCallback(async () => {
    if (!userId) {
      setPlaygrounds([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("playgrounds")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((p) => ({
        ...p,
        bot_config: (p.bot_config as Record<string, unknown>) || {},
        messages: (p.messages as Array<{ role: string; content: string }>) || [],
      }));
      setPlaygrounds(mapped);
    } catch (err) {
      console.error("Error fetching playgrounds:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPlaygrounds();
  }, [fetchPlaygrounds]);

  const createPlayground = async (name: string = "Untitled Playground") => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("playgrounds")
        .insert({
          user_id: userId,
          name,
          bot_config: {},
          messages: [],
          current_view: "home",
          setup_step: 1,
        })
        .select()
        .single();

      if (error) throw error;

      const newPlayground: Playground = {
        ...data,
        bot_config: (data.bot_config as Record<string, unknown>) || {},
        messages: (data.messages as Array<{ role: string; content: string }>) || [],
      };
      
      setPlaygrounds((prev) => [newPlayground, ...prev]);
      return newPlayground;
    } catch (err) {
      console.error("Error creating playground:", err);
      toast({
        title: "Error",
        description: "Failed to create playground",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePlayground = async (id: string, updates: Partial<Omit<Playground, "id" | "user_id" | "created_at" | "updated_at">>) => {
    try {
      const dbUpdates: Record<string, Json | string | number> = {};
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.module_id !== undefined) dbUpdates.module_id = updates.module_id;
      if (updates.bot_config !== undefined) dbUpdates.bot_config = updates.bot_config as Json;
      if (updates.messages !== undefined) dbUpdates.messages = updates.messages as unknown as Json;
      if (updates.current_view !== undefined) dbUpdates.current_view = updates.current_view;
      if (updates.setup_step !== undefined) dbUpdates.setup_step = updates.setup_step;

      const { error } = await supabase
        .from("playgrounds")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;

      setPlaygrounds((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p
        )
      );
    } catch (err) {
      console.error("Error updating playground:", err);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const renamePlayground = async (id: string, newName: string) => {
    await updatePlayground(id, { name: newName });
    toast({
      title: "Renamed",
      description: "Playground renamed successfully",
    });
  };

  const deletePlayground = async (id: string) => {
    try {
      const { error } = await supabase
        .from("playgrounds")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setPlaygrounds((prev) => prev.filter((p) => p.id !== id));
      
      if (currentPlaygroundId === id) {
        setCurrentPlaygroundId(null);
      }

      toast({
        title: "Deleted",
        description: "Playground deleted successfully",
      });
    } catch (err) {
      console.error("Error deleting playground:", err);
      toast({
        title: "Error",
        description: "Failed to delete playground",
        variant: "destructive",
      });
    }
  };

  return {
    playgrounds,
    isLoading,
    currentPlaygroundId,
    setCurrentPlaygroundId,
    createPlayground,
    updatePlayground,
    renamePlayground,
    deletePlayground,
    refetch: fetchPlaygrounds,
  };
}
