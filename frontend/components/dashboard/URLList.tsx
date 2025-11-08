"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Link2,
  Copy,
  ExternalLink,
  BarChart3,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { copyToClipboard, formatDate, formatNumber } from "@/utils/helpers";
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
  isActive?: boolean;
  is_active?: boolean;
  expiresAt?: string;
  expires_at?: string;
  createdAt?: string;
  created_at?: string;
}

interface URLListProps {
  limit?: number; // Optional limit for number of URLs to display
}

export function URLList({ limit }: URLListProps = {}) {
  const [urls, setUrls] = useState<URL[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const fetchUrls = useCallback(async () => {
    try {
      setIsLoading(true);
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

      if (!response.ok) {
        throw new Error(result.msg || 'Failed to fetch URLs');
      }

      // Backend returns: { success: true, data: { urls: [], total, page, limit } }
      const urlsData = result.data?.urls || result.urls || [];
      let processedUrls = Array.isArray(urlsData) ? urlsData : [];

      // Sort by click count (descending) and apply limit if specified
      processedUrls = processedUrls.sort((a, b) => {
        const aClicks = a.clickCount ?? a.click_count ?? 0;
        const bClicks = b.clickCount ?? b.click_count ?? 0;
        return bClicks - aClicks;
      });

      if (limit) {
        processedUrls = processedUrls.slice(0, limit);
      }

      setUrls(processedUrls);
    } catch (error) {
      console.error('Error fetching URLs:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, limit]);

  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Refetch data when tab becomes visible or when navigating back
  useDataRefresh(fetchUrls, [limit]);

  const handleCopy = async (url: string, id: string) => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  const handleDelete = async (shortCode: string, urlId: string) => {
    if (!confirm("Are you sure you want to delete this URL? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/urls/${shortCode}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.msg || "Failed to delete URL");
      }

      toast.success("URL deleted successfully");

      // Refresh the list
      fetchUrls();
    } catch (error) {
      console.error("Error deleting URL:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (urls.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Link2 className="size-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No URLs yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first short URL to get started
          </p>
          <Button onClick={() => router.push('/dashboard/create')}>
            Create Short URL
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {urls.map((url) => {
        const urlId = url.id || url._id;
        const shortCode = url.shortCode || url.short_code;
        const customAlias = url.customAlias || url.custom_alias;
        const identifier = customAlias || shortCode; // Use custom alias if available, otherwise short code
        const shortUrl = url.shortUrl || url.short_url || `http://localhost:4000/${identifier}`;
        const originalUrl = url.originalUrl || url.original_url;
        const clickCount = url.clickCount ?? url.click_count ?? 0;
        const isActive = url.isActive ?? url.is_active ?? true;
        const expiresAt = url.expiresAt || url.expires_at;
        const createdAt = url.createdAt || url.created_at;

        return (
          <Card
            key={urlId}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/dashboard/analytics/${identifier}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                {/* Left side - URL Info */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Short URL */}
                  <div className="flex items-center gap-2">
                    <Link2 className="size-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-semibold text-primary hover:underline truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {shortUrl}
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(shortUrl, urlId!);
                      }}
                    >
                      {copiedId === urlId ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>

                  {/* Original URL */}
                  <div className="flex items-start gap-2">
                    <ExternalLink className="size-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground truncate"
                      title={originalUrl}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {originalUrl}
                    </a>
                  </div>

                  {/* Stats & Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="size-4 text-muted-foreground" />
                      <span className="font-semibold">{formatNumber(clickCount)}</span>
                      <span className="text-muted-foreground">clicks</span>
                    </div>

                    {createdAt && (
                      <div className="text-muted-foreground">
                        Created {formatDate(createdAt)}
                      </div>
                    )}

                    {expiresAt && (
                      <Badge variant="outline" className="text-xs">
                        Expires {formatDate(expiresAt)}
                      </Badge>
                    )}

                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/dashboard/analytics/${identifier}`)}
                  >
                    <BarChart3 className="size-4 mr-1" />
                    View Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                    onClick={() => handleDelete(identifier, urlId!)}
                  >
                    <Trash2 className="size-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
