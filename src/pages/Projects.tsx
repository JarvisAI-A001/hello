import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bot,
  Mail,
  Users,
  Plus,
  Sparkles,
  LayoutDashboard,
  BadgeCheck,
  FolderOpen,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const industryIcons = [
  { id: "restaurant", label: "Restaurant", emoji: "??" },
  { id: "fitness", label: "Fitness", emoji: "???" },
  { id: "legal", label: "Legal", emoji: "??" },
  { id: "clinic", label: "Clinic", emoji: "??" },
  { id: "retail", label: "Retail", emoji: "??" },
  { id: "agency", label: "Agency", emoji: "??" },
];

type AgentType = "chatbot" | "model" | "email";

interface Agent {
  id: string;
  name: string;
  type: AgentType;
}

interface ProjectSlots {
  chatbot?: Agent;
  model?: Agent;
  email?: Agent;
}

interface Project {
  id: string;
  name: string;
  status: "active" | "paused";
  industryIcon: string;
  slots: ProjectSlots;
  revenue: number[];
}

const defaultAgents: Agent[] = [];

const defaultProjects: Project[] = [];

const slotMeta: Record<AgentType, { label: string; description: string; icon: typeof Bot }> = {
  chatbot: {
    label: "AI Chatbot",
    description: "Connect the Bot ID",
    icon: Bot,
  },
  model: {
    label: "Social AI Model",
    description: "Display the AI model avatar",
    icon: Users,
  },
  email: {
    label: "Email Replier",
    description: "Shows Gmail/Outlook connection",
    icon: Mail,
  },
};

const moduleToAgentType: Record<string, AgentType> = {
  'email-replier': 'email',
  'ai-human-models': 'model',
  'social-media-analyzer': 'model',
  'social-media-marketing': 'model',
  'appointment-maker': 'chatbot',
  'chatbot': 'chatbot',
};

function RevenueChart({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((value, idx) => (
        <div
          key={`${value}-${idx}`}
          className="flex-1 rounded-full bg-gradient-to-t from-accent/80 to-accent/20"
          style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function ProjectOverview({
  project,
  onBack,
  onAssign,
  onUnassign,
  unassignedAgents,
  draggingAgent,
  onDragStart,
  onDragEnd,
}: {
  project: Project;
  onBack: () => void;
  onAssign: (agent: Agent, slot: AgentType) => void;
  onUnassign: (slot: AgentType) => void;
  unassignedAgents: Agent[];
  draggingAgent: Agent | null;
  onDragStart: (agent: Agent) => void;
  onDragEnd: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </button>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <BadgeCheck className="w-3 h-3 text-emerald-400" />
            {project.status === "active" ? "Active" : "Paused"}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{project.industryIcon} {project.name}</h1>
          <p className="text-muted-foreground">Command center for this business. Drag agents to organize slots.</p>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">Unassigned Agents</span>
              </div>
              <div className="space-y-2">
                {isLoadingAgents ? (
                  <div className="text-xs text-muted-foreground">Loading your AI agents...</div>
                ) : unassignedAgents.length === 0 ? (
                  <div className="text-xs text-muted-foreground">All agents assigned.</div>
                ) : (
                  unassignedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      draggable
                      onDragStart={() => onDragStart(agent)}
                      onDragEnd={onDragEnd}
                      className={cn(
                        "rounded-xl border border-border/60 bg-card/60 px-3 py-2 text-sm cursor-grab transition",
                        draggingAgent?.id === agent.id && "opacity-60"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {agent.type === "chatbot" && <Bot className="w-4 h-4 text-accent" />}
                        {agent.type === "email" && <Mail className="w-4 h-4 text-accent" />}
                        {agent.type === "model" && <Users className="w-4 h-4 text-accent" />}
                        <span>{agent.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid md:grid-cols-3 gap-6">
              {(Object.keys(slotMeta) as AgentType[]).map((slot) => {
                const meta = slotMeta[slot];
                const assigned = project.slots[slot];
                return (
                  <div
                    key={slot}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggingAgent || draggingAgent.type !== slot) return;
                      onAssign(draggingAgent, slot);
                    }}
                    className={cn(
                      "rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 min-h-[200px] transition",
                      draggingAgent?.type === slot && "border-accent/80 shadow-[0_0_20px_rgba(99,102,241,0.35)]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <meta.icon className="w-5 h-5 text-accent" />
                        <span className="font-semibold text-foreground">{meta.label}</span>
                      </div>
                      {assigned && (
                        <button
                          onClick={() => onUnassign(slot)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Unassign
                        </button>
                      )}
                    </div>
                    {assigned ? (
                      <div className="rounded-xl border border-border/60 bg-card/80 p-4">
                        <div className="text-sm font-semibold text-foreground">{assigned.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">Connected</div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {meta.description}
                        <div className="mt-3 rounded-lg border border-dashed border-border/60 px-3 py-2 text-[11px]">
                          Drag a {meta.label} here
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-[2fr_1fr] gap-6">
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Revenue Generated</span>
                </div>
                <RevenueChart data={project.revenue} />
                <div className="mt-3 text-xs text-muted-foreground">
                  Track revenue and lead value from agents assigned to this folder.
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard className="w-4 h-4 text-accent" />
                  <span className="text-sm font-semibold text-foreground">Folder Summary</span>
                </div>
                <div className="text-xs text-muted-foreground">Agents assigned</div>
                <div className="text-2xl font-bold text-foreground mt-2">
                  {Object.values(project.slots).filter(Boolean).length}
                </div>
                <div className="mt-4 text-xs text-muted-foreground">Status</div>
                <div className="text-sm text-foreground mt-1 capitalize">{project.status}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [unassignedAgents, setUnassignedAgents] = useState<Agent[]>(defaultAgents);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggingAgent, setDraggingAgent] = useState<Agent | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    industryIcon: industryIcons[0].emoji,
  });
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      if (!user) return;
      setIsLoadingAgents(true);
      const { data, error } = await supabase
        .from('playgrounds')
        .select('id,name,module_id,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to load playground agents', error);
        setUnassignedAgents([]);
        setIsLoadingAgents(false);
        return;
      }

      const agents = (data || []).map((pg) => {
        const type = moduleToAgentType[pg.module_id || 'chatbot'] || 'chatbot';
        return {
          id: pg.id,
          name: pg.name,
          type,
        } as Agent;
      });

      setUnassignedAgents(agents);
      setIsLoadingAgents(false);
    };

    fetchAgents();
  }, [user]);

  const handleAssignAgent = (agent: Agent, slot: AgentType) => {
    if (!selectedProject) return;
    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              slots: {
                ...project.slots,
                [slot]: agent,
              },
            }
          : project
      )
    );
    setUnassignedAgents((prev) => prev.filter((item) => item.id !== agent.id));
  };

  const handleUnassignAgent = (slot: AgentType) => {
    if (!selectedProject) return;
    const agent = selectedProject.slots[slot];
    if (!agent) return;

    setProjects((prev) =>
      prev.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              slots: {
                ...project.slots,
                [slot]: undefined,
              },
            }
          : project
      )
    );
    setUnassignedAgents((prev) => [...prev, agent]);
  };

  const selectedProjectData = useMemo(() => {
    if (!selectedProject) return null;
    return projects.find((project) => project.id === selectedProject.id) || null;
  }, [projects, selectedProject]);

  if (selectedProjectData) {
    return (
      <Layout>
        <ProjectOverview
          project={selectedProjectData}
          onBack={() => setSelectedProject(null)}
          onAssign={handleAssignAgent}
          onUnassign={handleUnassignAgent}
          unassignedAgents={unassignedAgents}
          draggingAgent={draggingAgent}
          onDragStart={(agent) => setDraggingAgent(agent)}
          onDragEnd={() => setDraggingAgent(null)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Workspace Dashboard</h1>
              <p className="text-muted-foreground">Organize your AI agency with project folders.</p>
            </div>
            <Button variant="accent" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Project
            </Button>
          </div>

          <div className="grid md:grid-cols-[260px_1fr] gap-6">
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-4">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-sm font-semibold text-foreground">Unassigned AI Agents</span>
              </div>
              <div className="space-y-2">
                {isLoadingAgents ? (
                  <div className="text-xs text-muted-foreground">Loading your AI agents...</div>
                ) : unassignedAgents.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No AI agents yet. Create one in Playground.</div>
                ) : (
                  unassignedAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className="rounded-xl border border-border/60 bg-card/80 px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {agent.type === "chatbot" && <Bot className="w-4 h-4 text-accent" />}
                        {agent.type === "email" && <Mail className="w-4 h-4 text-accent" />}
                        {agent.type === "model" && <Users className="w-4 h-4 text-accent" />}
                        <span>{agent.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map((project) => {
                const agentCount = Object.values(project.slots).filter(Boolean).length;
                return (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className={cn(
                      "text-left rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-5 transition",
                      project.status === "active"
                        ? "shadow-[0_0_30px_rgba(34,197,94,0.25)]"
                        : "hover:border-border/80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{project.industryIcon}</span>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        project.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-secondary/60 text-muted-foreground"
                      )}>
                        {project.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{agentCount} Agents</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Project Name</label>
              <Input
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Dublin Pizza"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Industry Icon</label>
              <Select
                value={newProject.industryIcon}
                onValueChange={(value) => setNewProject({ ...newProject, industryIcon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {industryIcons.map((icon) => (
                    <SelectItem key={icon.id} value={icon.emoji}>
                      {icon.emoji} {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Select AI Agents</label>
              <div className="space-y-2 max-h-48 overflow-auto rounded-lg border border-border/60 bg-card/60 p-3">
                {isLoadingAgents ? (
                  <div className="text-xs text-muted-foreground">Loading your AI agents...</div>
                ) : unassignedAgents.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No AI agents available. Create one in Playground.</div>
                ) : (
                  unassignedAgents.map((agent) => (
                    <label key={agent.id} className="flex items-center gap-3 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-accent"
                        checked={selectedAgentIds.includes(agent.id)}
                        onChange={(event) => {
                          setSelectedAgentIds((prev) =>
                            event.target.checked
                              ? [...prev, agent.id]
                              : prev.filter((id) => id !== agent.id)
                          );
                        }}
                      />
                      <span className="flex items-center gap-2">
                        {agent.type === "chatbot" && <Bot className="w-4 h-4 text-accent" />}
                        {agent.type === "email" && <Mail className="w-4 h-4 text-accent" />}
                        {agent.type === "model" && <Users className="w-4 h-4 text-accent" />}
                        {agent.name}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="accent"
                onClick={() => {
                  if (!newProject.name.trim()) return;
                  const selectedAgents = unassignedAgents.filter((agent) => selectedAgentIds.includes(agent.id));
                  const slots: ProjectSlots = {};
                  selectedAgents.forEach((agent) => {
                    if (agent.type === "chatbot" && !slots.chatbot) slots.chatbot = agent;
                    if (agent.type === "model" && !slots.model) slots.model = agent;
                    if (agent.type === "email" && !slots.email) slots.email = agent;
                  });
                  const project: Project = {
                    id: `project-${Date.now()}`,
                    name: newProject.name,
                    status: "active",
                    industryIcon: newProject.industryIcon,
                    slots,
                    revenue: [800, 1200, 1400, 1600, 2100, 2600, 3000],
                  };
                  setProjects((prev) => [project, ...prev]);
                  setUnassignedAgents((prev) => prev.filter((agent) => !selectedAgentIds.includes(agent.id)));
                  setSelectedAgentIds([]);
                  setIsCreateModalOpen(false);
                  setNewProject({ name: "", industryIcon: industryIcons[0].emoji });
                }}
              >
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
