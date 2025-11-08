import { BarChart3, Shield, Zap, Globe, Link2, MousePointerClick } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Link2,
    title: "Custom Short Links",
    description: "Create branded short links with custom aliases that reflect your brand identity.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track clicks, devices, browsers, and geographic data with detailed analytics dashboards.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Experience instant redirects with our globally distributed infrastructure.",
  },
  {
    icon: Shield,
    title: "Secure & Reliable",
    description: "Enterprise-grade security with 99.9% uptime guarantee for your links.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Reach audiences worldwide with our CDN-powered redirect service.",
  },
  {
    icon: MousePointerClick,
    title: "Click Tracking",
    description: "Monitor every click with real-time tracking and comprehensive reports.",
  },
];

export function Features() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything you need to manage links
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features to help you create, manage, and track your short links effectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="mb-4 size-12 rounded-lg bg-gradient-accent flex items-center justify-center">
                  <Icon className="size-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
