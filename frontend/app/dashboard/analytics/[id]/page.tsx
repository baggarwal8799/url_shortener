"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Link2, BarChart3, Globe } from "lucide-react";
import { toast } from "sonner";
import { ClicksChart } from "@/components/analytics/ClicksChart";
import { ReferrersList } from "@/components/analytics/ReferrersList";
import { useDataRefresh } from "@/lib/hooks/useDataRefresh";


interface AnalyticsData {
  shortCode: string;
  totalClicks: number;
  clicksByDay: Array<{ date: string; count: number }>;
  topReferers: Array<{ referer: string; count: number }>;
}

export default function IndividualAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const shortCode = params.id as string; // This is actually the shortCode/customAlias, not the ID

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!shortCode) {
      toast.error("No short code provided");
      router.push("/dashboard/analytics");
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/analytics/${shortCode}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("You don't have permission to view analytics for this URL. This URL may belong to another user or doesn't exist.");
        }

        throw new Error(result.msg || "Failed to fetch analytics");
      }

      setAnalytics(result.data || result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [shortCode, router]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Refetch data when tab becomes visible or when navigating back
  useDataRefresh(fetchAnalytics, [shortCode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/analytics")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Analytics
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground">
              Unable to load analytics for this URL.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Backend returns shortCode, construct the full short URL
  const urlShortCode = analytics.shortCode || shortCode;
  const shortUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${urlShortCode}`;

  // Calculate today and yesterday clicks
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const todayClicks =
    analytics.clicksByDay.find((d) => d.date === today)?.count || 0;
  const yesterdayClicks =
    analytics.clicksByDay.find((d) => d.date === yesterday)?.count || 0;

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/analytics")}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to Analytics
        </Button>
      </div>

      {/* URL Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            Analytics for {urlShortCode}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Link2 className="size-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Short URL</p>
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-primary hover:underline truncate block"
              >
                {shortUrl}
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clicks
            </CardTitle>
            <div className="rounded-lg p-2 bg-blue-100 dark:bg-blue-900/20">
              <BarChart3 className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
            <div className="rounded-lg p-2 bg-green-100 dark:bg-green-900/20">
              <BarChart3 className="size-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{todayClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">Clicks today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Yesterday
            </CardTitle>
            <div className="rounded-lg p-2 bg-purple-100 dark:bg-purple-900/20">
              <BarChart3 className="size-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{yesterdayClicks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Clicks yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clicks Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Clicks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.clicksByDay && analytics.clicksByDay.length > 0 ? (
            <ClicksChart data={analytics.clicksByDay} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>No click data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-5" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReferrersList
            referrers={analytics.topReferers || []}
            totalClicks={analytics.totalClicks}
          />
        </CardContent>
      </Card>
    </div>
  );
}
