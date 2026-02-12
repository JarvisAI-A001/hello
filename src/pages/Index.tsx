import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Zap,
  Shield,
  BarChart3,
  ArrowRight,
  Bot,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI Chatbot",
    description: "Deploy intelligent chatbots that understand context and provide human-like responses.",
  },
  {
    icon: Mail,
    title: "Email Replier",
    description: "Automate email responses with AI that maintains your brand voice and tone.",
  },
  {
    icon: Calendar,
    title: "Appointment Maker",
    description: "Let AI handle scheduling, reminders, and calendar management seamlessly.",
  },
  {
    icon: FileText,
    title: "Content Generator",
    description: "Create engaging content at scale with AI-powered writing assistance.",
  },
];

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500M+", label: "API Calls" },
  { value: "99.9%", label: "Uptime" },
  { value: "50ms", label: "Avg Response" },
];

const benefits = [
  "No coding required",
  "Enterprise-grade security",
  "24/7 technical support",
  "Unlimited API calls on Pro",
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-accent/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute top-1/3 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-accent/15 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 pointer-events-none">
          <div className="animated-orbits" />
          <div className="glitter-lines" />
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-foreground/90 text-sm font-medium mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>New: Content Generator 2.0 is here</span>
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight animate-slide-up">
                Build AI-Powered
                <br />
                <span className="gradient-text">Business Solutions</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up delay-100">
                ModelStack provides enterprise-grade AI modules for small and medium businesses.
                Deploy chatbots, automate emails, and generate content - all without writing code.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up delay-200">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/pricing">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="hero-outline" size="xl" asChild>
                  <Link to="/playground">Try Playground</Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 animate-slide-up delay-300">
                {stats.map((stat) => (
                  <div key={stat.label} className="glass-card p-5 text-center">
                    <div className="text-2xl md:text-3xl font-bold text-accent mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:pl-6">
              <div className="glass-card p-6 md:p-8 card-hover">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Live Revenue Impact</p>
                    <p className="text-2xl font-semibold text-foreground">$128,490</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    +18.2%
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Chatbot Conversions", value: "42%", icon: Bot },
                    { label: "Email Open Rate", value: "61%", icon: Mail },
                    { label: "Bookings Scheduled", value: "320", icon: Calendar },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-accent" />
                        </div>
                        <span className="text-sm text-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-6 -left-4 hidden lg:block">
                <div className="glass-card p-4 w-52">
                  <p className="text-xs text-muted-foreground">AI Autopilot</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-sm text-foreground">Running 12 workflows</span>
                  </div>
                </div>
              </div>

              <div className="absolute -top-6 -right-2 hidden lg:block">
                <div className="glass-card p-4 w-48">
                  <p className="text-xs text-muted-foreground">Time Saved</p>
                  <div className="text-2xl font-semibold text-foreground mt-1">23 hrs/wk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              AI Modules Built for Business
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pre-built, production-ready AI modules that integrate seamlessly with your existing workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group glass-card p-6 card-hover"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-accent group-hover:text-accent-foreground transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Businesses Choose
                <span className="gradient-text"> ModelStack</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We've simplified AI deployment so you can focus on growing your business.
                No infrastructure to manage, no complex integrations - just results.
              </p>

              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Button variant="accent" size="lg" className="mt-8" asChild>
                <Link to="/pricing">
                  View Pricing Plans
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="glass-card p-6 card-hover">
                  <Zap className="w-8 h-8 text-accent mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">Lightning Fast</h4>
                  <p className="text-sm text-muted-foreground">Sub-50ms response times globally</p>
                </div>
                <div className="glass-card p-6 card-hover">
                  <BarChart3 className="w-8 h-8 text-accent mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">Analytics</h4>
                  <p className="text-sm text-muted-foreground">Real-time insights and metrics</p>
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="glass-card p-6 card-hover">
                  <Shield className="w-8 h-8 text-accent mb-3" />
                  <h4 className="font-semibold text-foreground mb-1">Secure</h4>
                  <p className="text-sm text-muted-foreground">SOC 2 compliant infrastructure</p>
                </div>
                <div className="bg-accent rounded-3xl p-6 text-accent-foreground shadow-glow">
                  <div className="text-4xl font-bold mb-1">50%</div>
                  <p className="text-sm text-accent-foreground/80">Avg. cost reduction</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px]" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" asChild>
              <Link to="/pricing">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/playground">Explore Playground</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
