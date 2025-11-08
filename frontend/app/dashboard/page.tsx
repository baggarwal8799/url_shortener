"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, MousePointerClick, TrendingUp, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { URLList } from "@/components/dashboard/URLList";
import { formatNumber } from "@/utils/helpers";
import { useDataRefresh } from "@/lib/hooks/useDataRefresh";

interface Stats {
  totalLinks: number;
  totalClicks: number;
  activeLinks: number;
  averageCTR: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalLinks: 0,
    totalClicks: 0,
    activeLinks: 0,
    averageCTR: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoadingStats(true);
      const token = localStorage.getItem('auth_token');

      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/urls', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        const urlsData = result.data?.urls || result.urls || [];

        // Calculate stats from URLs data
        const totalLinks = urlsData.length;
        const totalClicks = urlsData.reduce((sum: number, url: any) =>
          sum + (url.clickCount || url.click_count || 0), 0
        );
        const activeLinks = urlsData.filter((url: any) =>
          url.isActive ?? url.is_active ?? true
        ).length;
        const averageCTR = totalLinks > 0 ? (totalClicks / totalLinks) : 0;

        setStats({
          totalLinks,
          totalClicks,
          activeLinks,
          averageCTR,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Refetch data when tab becomes visible or when navigating back
  useDataRefresh(fetchStats);

  const statsCards = [
    {
      title: "Total Links",
      value: formatNumber(stats.totalLinks),
      icon: Link2,
      description: "URLs created",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Total Clicks",
      value: formatNumber(stats.totalClicks),
      icon: MousePointerClick,
      description: "All-time clicks",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Avg Clicks/Link",
      value: formatNumber(Math.round(stats.averageCTR * 10) / 10),
      icon: TrendingUp,
      description: "Average per link",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      title: "Active Links",
      value: formatNumber(stats.activeLinks),
      icon: Eye,
      description: "Currently active",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your URL shortening activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="bg-gradient-accent">
            <Link href="/dashboard/create">
              <Link2 className="mr-2 size-4" />
              Create New Short URL
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Top Performing URLs */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Top Performing URLs</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Your 3 most clicked short URLs
        </p>
        <URLList limit={3} />
      </div>
    </div>
  );
}
