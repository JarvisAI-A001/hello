import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Video, Wand2, Loader2, Download, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

interface GeneratedVideo {
  prompt: string;
  style: string;
  videoConcept: string;
  timestamp: string;
}

export function VideoGenerator() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for your video",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { prompt, style },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedVideos((prev) => [data, ...prev]);
      setPrompt("");
      
      toast({
        title: "Video Concept Generated!",
        description: "Your video concept is ready",
      });
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video concept",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied!",
      description: "Video concept copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Video className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">AI Video Generator</h2>
            <p className="text-sm text-muted-foreground">Generate video concepts with AI</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Video Prompt
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create... e.g., 'A peaceful sunrise over mountain peaks with clouds rolling through valleys'"
              className="min-h-[100px] bg-secondary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Video Style
              </label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="bg-secondary/50">
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

            <div className="flex items-end">
              <Button
                variant="accent"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Generated Videos */}
      {generatedVideos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Generated Concepts</h3>
          
          {generatedVideos.map((video, index) => (
            <div
              key={video.timestamp}
              className="bg-card border border-border rounded-xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 bg-accent/10 text-accent rounded-full">
                      {video.style}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(video.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{video.prompt}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(video.videoConcept, video.timestamp)}
                >
                  {copied === video.timestamp ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                  {video.videoConcept}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {generatedVideos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos generated yet. Enter a prompt above to get started!</p>
        </div>
      )}
    </div>
  );
}
