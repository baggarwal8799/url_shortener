import { TrendingUp, Users, Link2, MousePointerClick } from "lucide-react";

const stats = [
  {
    icon: Link2,
    value: "10M+",
    label: "Links Shortened",
    description: "URLs transformed into powerful short links",
  },
  {
    icon: MousePointerClick,
    value: "500M+",
    label: "Clicks Tracked",
    description: "Every interaction monitored and analyzed",
  },
  {
    icon: Users,
    value: "100K+",
    label: "Active Users",
    description: "Businesses and individuals trust us",
  },
  {
    icon: TrendingUp,
    value: "99.9%",
    label: "Uptime",
    description: "Reliable service you can count on",
  },
];

export function Stats() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Trusted by thousands worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join our growing community of users who are transforming their links.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center space-y-3">
                <div className="mx-auto size-16 rounded-full bg-gradient-accent flex items-center justify-center mb-4">
                  <Icon className="size-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gradient">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold">{stat.label}</div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
