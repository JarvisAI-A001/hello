import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Clock,
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Playground } from "@/hooks/usePlaygrounds";

interface PlaygroundManagerProps {
  playgrounds: Playground[];
  currentPlaygroundId: string | null;
  playgroundLimit: number;
  userPlan: string;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onCreate: () => Promise<Playground | null>;
  onRename: (id: string, newName: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function PlaygroundManager({
  playgrounds,
  currentPlaygroundId,
  playgroundLimit,
  userPlan,
  isLoading,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: PlaygroundManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPlayground, setSelectedPlayground] = useState<Playground | null>(null);
  const [newName, setNewName] = useState("");

  const canCreateMore = playgrounds.length < playgroundLimit;

  const handleCreate = async () => {
    if (!canCreateMore) return;
    setIsCreating(true);
    const newPlayground = await onCreate();
    setIsCreating(false);
    if (newPlayground) {
      onSelect(newPlayground.id);
    }
  };

  const handleRename = async () => {
    if (!selectedPlayground || !newName.trim()) return;
    await onRename(selectedPlayground.id, newName.trim());
    setRenameDialogOpen(false);
    setSelectedPlayground(null);
    setNewName("");
  };

  const handleDelete = async () => {
    if (!selectedPlayground) return;
    await onDelete(selectedPlayground.id);
    setDeleteDialogOpen(false);
    setSelectedPlayground(null);
  };

  const openRenameDialog = (playground: Playground, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlayground(playground);
    setNewName(playground.name);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (playground: Playground, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlayground(playground);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPlanBadge = () => {
    switch (userPlan) {
      case "pro":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <Sparkles className="w-3 h-3" /> Pro
          </span>
        );
      case "exclusive":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
            <Crown className="w-3 h-3" /> Exclusive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
            Free Trial
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with plan info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {playgrounds.length}/{playgroundLimit} playgrounds
          </span>
          {getPlanBadge()}
        </div>
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!canCreateMore || isCreating}
          className="gap-1"
        >
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          New Playground
        </Button>
      </div>

      {/* Limit warning */}
      {!canCreateMore && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600">
          You've reached your playground limit ({playgroundLimit}).{" "}
          {userPlan === "free" && "Upgrade to Pro for 6 playgrounds."}
          {userPlan === "pro" && "Upgrade to Exclusive for 10 playgrounds."}
        </div>
      )}

      {/* Playground list */}
      {playgrounds.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No playgrounds yet</p>
          <p className="text-sm">Create your first playground to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playgrounds.map((playground) => (
            <button
              key={playground.id}
              onClick={() => onSelect(playground.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left group",
                currentPlaygroundId === playground.id
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/50 hover:bg-secondary/30"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <FolderOpen className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {playground.name}
                </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatDate(playground.updated_at)}
                {playground.module_id && (
                  <span className="px-1.5 py-0.5 bg-secondary rounded">
                    {playground.module_id}
                  </span>
                )}
                {playground.setup_step < 3 && (
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                    Draft
                  </span>
                )}
              </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={(e) => openRenameDialog(playground, e)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={(e) => openDeleteDialog(playground, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Playground</DialogTitle>
            <DialogDescription>
              Enter a new name for your playground.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playground name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playground?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedPlayground?.name}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
