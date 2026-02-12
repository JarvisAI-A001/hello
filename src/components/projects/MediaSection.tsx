import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Video, 
  Loader2, 
  Eye, 
  Search, 
  Heart,
  Upload,
  Image,
  Music,
  ArrowLeft,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const videoStyles = [
  { value: "cinematic", label: "Cinematic" },
  { value: "documentary", label: "Documentary" },
  { value: "anime", label: "Anime" },
  { value: "3d-animation", label: "3D Animation" },
  { value: "motion-graphics", label: "Motion Graphics" },
  { value: "vintage", label: "Vintage/Retro" },
  { value: "sci-fi", label: "Sci-Fi" },
  { value: "nature", label: "Nature/Wildlife" },
];

const aspectRatios = [
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
];

const resolutions = [
  { value: "360p", label: "360p" },
  { value: "720p", label: "720p" },
  { value: "1080p", label: "1080p" },
];

const durations = [
  { value: "5s", label: "5s" },
  { value: "10s", label: "10s" },
  { value: "15s", label: "15s" },
];

interface GeneratedVideo {
  id: string;
  prompt: string;
  style: string;
  video_concept: string;
  thumbnail_url: string | null;
  video_url: string | null;
  username: string;
  created_at: string;
}

// Main Media Section Landing Page
function MediaLanding({ onSelectTool }: { onSelectTool: (tool: string) => void }) {
  const tools = [
    {
      id: "video-generator",
      name: "Video Generator",
      description: "Create AI-powered videos from text prompts",
      icon: Video,
      gradient: "from-purple-600 to-pink-600",
      available: true,
    },
    {
      id: "image-generator",
      name: "Image Generator",
      description: "Generate stunning images with AI",
      icon: Image,
      gradient: "from-blue-600 to-cyan-500",
      available: false,
    },
    {
      id: "audio-generator",
      name: "Audio Generator",
      description: "Create music and sound effects",
      icon: Music,
      gradient: "from-green-600 to-teal-500",
      available: false,
    },
  ];

  return (
    <div className="h-full flex flex-col bg-background p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Media Studio</h2>
        <p className="text-muted-foreground">Create stunning AI-generated content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => tool.available && onSelectTool(tool.id)}
            disabled={!tool.available}
            className={cn(
              "relative group rounded-2xl overflow-hidden border border-border/50 transition-all duration-300",
              tool.available 
                ? "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02] cursor-pointer" 
                : "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Gradient background */}
            <div className={cn(
              "h-32 bg-gradient-to-br",
              tool.gradient
            )}>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <tool.icon className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Content */}
            <div className="p-4 bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-foreground">{tool.name}</h3>
                {!tool.available && (
                  <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-xs rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </div>

            {/* Hover sparkles effect */}
            {tool.available && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Sora-style Video Generator Page
function VideoGeneratorPage({ onBack }: { onBack: () => void }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [resolution, setResolution] = useState("360p");
  const [duration, setDuration] = useState("10s");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing videos
  useEffect(() => {
    fetchVideos();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('generated-videos-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'generated_videos'
        },
        (payload) => {
          setVideos((prev) => [payload.new as GeneratedVideo, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please describe your video",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { prompt, style, aspectRatio, resolution, duration },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Save to database
      const { error: insertError } = await supabase
        .from('generated_videos')
        .insert({
          prompt,
          style,
          video_concept: data.videoConcept,
          username: 'user_' + Math.random().toString(36).substring(2, 8),
        });

      if (insertError) throw insertError;

      setPrompt("");
      
      toast({
        title: "Video Generated!",
        description: "Your video has been added to the gallery",
      });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate placeholder colors based on video id
  const getPlaceholderGradient = (id: string) => {
    const colors = [
      'from-purple-600 to-blue-600',
      'from-pink-600 to-orange-500',
      'from-green-600 to-teal-500',
      'from-indigo-600 to-purple-600',
      'from-red-600 to-pink-500',
      'from-yellow-500 to-orange-600',
      'from-cyan-500 to-blue-600',
      'from-emerald-500 to-green-600',
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Video Gallery Grid */}
      <div className="flex-1 overflow-auto p-4 pt-16 pb-32">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Be the first to create a video</h2>
            <p className="text-muted-foreground max-w-md">
              Describe your video below and watch it appear here. Your creations will be visible to everyone!
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform"
              >
                {/* Video Thumbnail - Gradient placeholder */}
                <div 
                  className={`bg-gradient-to-br ${getPlaceholderGradient(video.id)} aspect-[9/16] md:aspect-auto md:h-auto`}
                  style={{ 
                    minHeight: `${200 + (video.id.charCodeAt(1) % 200)}px` 
                  }}
                >
                  {/* Video concept preview */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm line-clamp-3">{video.video_concept}</p>
                  </div>
                </div>

                {/* Bottom info bar */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium truncate max-w-[60%]">
                      {video.username}
                    </span>
                    <div className="flex items-center gap-2">
                      <button className="text-white/70 hover:text-white transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-white/70 hover:text-white transition-colors">
                        <Search className="w-4 h-4" />
                      </button>
                      <button className="text-white/70 hover:text-white transition-colors">
                        <Heart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Style badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
                    {video.style}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Prompt Bar - Fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-12">
        <div className="max-w-4xl mx-auto">
          {/* Settings row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap justify-center">
            <Button variant="secondary" size="sm" className="gap-2">
              <Video className="w-4 h-4" />
              Video
            </Button>
            
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger className="w-20 h-8 bg-secondary/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ar) => (
                  <SelectItem key={ar.value} value={ar.value}>
                    {ar.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={resolution} onValueChange={setResolution}>
              <SelectTrigger className="w-20 h-8 bg-secondary/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {resolutions.map((res) => (
                  <SelectItem key={res.value} value={res.value}>
                    {res.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-20 h-8 bg-secondary/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durations.map((dur) => (
                  <SelectItem key={dur.value} value={dur.value}>
                    {dur.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="w-32 h-8 bg-secondary/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {videoStyles.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-secondary/90 backdrop-blur-lg rounded-xl p-2 border border-border/50 shadow-lg">
              <Button variant="ghost" size="icon" className="shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your video..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
                    <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main MediaSection component
export function MediaSection() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (activeTool === "video-generator") {
    return <VideoGeneratorPage onBack={() => setActiveTool(null)} />;
  }

  return <MediaLanding onSelectTool={setActiveTool} />;
}
