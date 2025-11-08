"use client";

import { Globe, Link2 } from "lucide-react";

interface ReferrersListProps {
  referrers: Array<{ referer: string; count: number }>;
  totalClicks: number;
}

export function ReferrersList({ referrers, totalClicks }: ReferrersListProps) {
  if (!referrers || referrers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Globe className="size-12 mb-4" />
        <p>No referrer data available yet</p>
      </div>
    );
  }

  // Take top 10 referrers
  const topReferrers = referrers.slice(0, 10);

  return (
    <div className="space-y-3">
      {topReferrers.map((ref, index) => {
        const percentage = totalClicks > 0
          ? ((ref.count / totalClicks) * 100).toFixed(1)
          : "0.0";

        // Display "Direct" for empty referrer
        const displayReferer = ref.referer || "Direct / Unknown";

        return (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {ref.referer ? (
                  <Link2 className="size-4 text-muted-foreground" />
                ) : (
                  <Globe className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" title={displayReferer}>
                  {displayReferer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {percentage}% of total clicks
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-2xl font-bold">{ref.count}</div>
              <div className="text-xs text-muted-foreground">clicks</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
