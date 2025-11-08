"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Button } from "@/components/ui/button";

interface ClicksChartProps {
  data: Array<{ date: string; count: number }>;
}

type TimeRange = 7 | 30 | 90 | "all";

export function ClicksChart({ data }: ClicksChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  // Filter and format data based on selected time range
  const chartData = useMemo(() => {
    const now = new Date();
    let filteredData = [...data];

    if (timeRange !== "all") {
      const cutoffDate = subDays(now, timeRange);
      filteredData = data.filter((item) => {
        const itemDate = parseISO(item.date);
        return itemDate >= cutoffDate;
      });
    }

    return filteredData
      .map((item) => ({
        ...item,
        formattedDate: format(parseISO(item.date), "MMM dd"),
      }))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [data, timeRange]);

  const timeRangeButtons: Array<{ label: string; value: TimeRange }> = [
    { label: "7 Days", value: 7 },
    { label: "30 Days", value: 30 },
    { label: "90 Days", value: 90 },
    { label: "All Time", value: "all" },
  ];

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <div className="flex flex-wrap gap-2">
        {timeRangeButtons.map((button) => (
          <Button
            key={button.value}
            variant={timeRange === button.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(button.value)}
          >
            {button.label}
          </Button>
        ))}
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="formattedDate"
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: "hsl(var(--muted-foreground))" }}
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, coordinate }) => {
              if (!active || !payload || !payload.length) return null;
              return (
                <div
                  style={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    transform: "translateX(-50%)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {payload[0].value}
                </div>
              );
            }}
            cursor={false}
            offset={-40}
          />
          <Bar
            dataKey="count"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
            maxBarSize={60}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
