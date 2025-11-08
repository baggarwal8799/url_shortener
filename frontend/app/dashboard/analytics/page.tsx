"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Link2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatNumber } from "@/utils/helpers";
import { useDataRefresh } from "@/lib/hooks/useDataRefresh";

interface URL {
  id?: string;
  _id?: string;
  originalUrl?: string;
  original_url?: string;
  shortUrl?: string;
  short_url?: string;
  shortCode?: string;
  short_code?: string;
  customAlias?: string;
  custom_alias?: string;
  clickCount?: number;
  click_count?: number;
  createdAt?: string;
  created_at?: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [urls, setUrls] = useState<URL[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUrls = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/urls", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || "Failed to fetch URLs");
      }

      const urlsData = result.data?.urls || result.urls || [];
      let processedUrls = Array.isArray(urlsData) ? urlsData : [];

      // Sort by click count (descending) to show most performing first
      processedUrls = processedUrls.sort((a, b) => {
        const aClicks = a.clickCount ?? a.click_count ?? 0;
        const bClicks = b.clickCount ?? b.click_count ?? 0;
        return bClicks - aClicks;
      });

      setUrls(processedUrls);
    } catch (error) {
      console.error("Error fetching URLs:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Refetch data when tab becomes visible or when navigating back
  useDataRefresh(fetchUrls);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            View detailed analytics for your short URLs
          </p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="size-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No URLs yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first short URL to see analytics
            </p>
            <Button onClick={() => router.push("/dashboard/create")}>
              Create Short URL
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          View detailed analytics for all your short URLs
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Showing {urls.length} URL{urls.length !== 1 ? 's' : ''} • Click any URL to see detailed analytics
        </p>
      </div>

      <div className="space-y-4">
        {urls.map((url) => {
          const urlId = url.id || url._id;
          const shortCode = url.shortCode || url.short_code;
          const customAlias = url.customAlias || url.custom_alias;
          const identifier = customAlias || shortCode; // Use custom alias if available, otherwise short code
          const shortUrl =
            url.shortUrl ||
            url.short_url ||
            `http://localhost:4000/${identifier}`;
          const originalUrl = url.originalUrl || url.original_url;
          const clickCount = url.clickCount ?? url.click_count ?? 0;
          const createdAt = url.createdAt || url.created_at;

          return (
            <Card
              key={urlId}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/dashboard/analytics/${identifier}`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Short URL */}
                    <div className="flex items-center gap-2">
                      <Link2 className="size-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-mono font-semibold text-primary truncate">
                        {shortUrl}
                      </span>
                    </div>

                    {/* Original URL */}
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-muted-foreground truncate">
                        {originalUrl}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="size-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {formatNumber(clickCount)}
                        </span>
                        <span className="text-muted-foreground">clicks</span>
                      </div>

                      {createdAt && (
                        <div className="text-muted-foreground">
                          Created {formatDate(createdAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" size="sm">
                    <BarChart3 className="size-4 mr-1" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
