import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Copy, 
  Check, 
  Globe, 
  Shield, 
  MessageSquare,
  ExternalLink,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Embed() {
  const [botId, setBotId] = useState("YOUR_BOT_ID");
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const iframeSnippet = `<!-- ModelStack AI Chatbot (iFrame Embed) -->
<iframe
  src="${window.location.origin}/widget/${botId}"
  title="ModelStack AI Chatbot"
  style="width: 380px; height: 560px; border: 0; border-radius: 24px; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25); overflow: hidden;"
  allow="clipboard-read; clipboard-write; microphone; speaker; camera"
  loading="lazy"
></iframe>
<!-- End ModelStack AI Chatbot -->`;

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Embed Your AI Bot
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Add your custom AI assistant to any website with a simple iFrame embed.
            </p>
          </div>

          {/* Bot ID Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                Your Bot ID
              </CardTitle>
              <CardDescription>
                Enter your bot ID from the Playground. You'll receive this after creating your bot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  value={botId}
                  onChange={(e) => setBotId(e.target.value)}
                  placeholder="e.g., abc12345"
                  className="max-w-xs font-mono"
                />
                <Badge variant="outline" className="h-10 px-4 flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    botId && botId !== "YOUR_BOT_ID" ? "bg-green-500" : "bg-yellow-500"
                  )} />
                  {botId && botId !== "YOUR_BOT_ID" ? "Ready" : "Enter Bot ID"}
                </Badge>
              </div>
            </CardContent>
          </Card>
          {/* iFrame Embed */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                iFrame Embed
              </CardTitle>
              <CardDescription>
                The only supported embed method. Place this iFrame anywhere on your site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full">
                <pre className="bg-secondary/50 rounded-lg p-6 overflow-auto text-sm font-mono text-foreground max-h-96 border border-border">
                  <code>{iframeSnippet}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(iframeSnippet, "iframe")}
                >
                  {copiedSnippet === "iframe" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="flex items-start gap-2 p-4 bg-accent/10 rounded-lg">
                <Info className="w-5 h-5 text-accent mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Installation Instructions:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                    <li>Copy the code snippet above</li>
                    <li>Paste it where you want the bot to appear</li>
                    <li>Replace <code className="bg-secondary px-1 rounded">YOUR_BOT_ID</code> with your actual bot ID</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Best Practices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Security & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Security Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      All communications use HTTPS encryption
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Bot ID validation before loading
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Optional domain restrictions available
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      No sensitive data stored client-side
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      iFrame sandboxing prevents interference
                    </li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Domain Restrictions</h4>
                  <p className="text-sm text-muted-foreground">
                    For added security, you can restrict which domains can embed your bot.
                    Configure this in your bot settings to prevent unauthorized usage.
                  </p>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Configure Domain Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

