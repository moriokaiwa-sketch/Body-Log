"use client";

import { useState, useMemo } from "react";
import { BodyLogEntry } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { subDays, isAfter, startOfDay, eachDayOfInterval, format } from "date-fns";

interface TrendChartProps {
  entries: BodyLogEntry[];
}

type Period = "7" | "30" | "all";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number | null;
    color?: string;
    stroke?: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !label) return null;

  const formattedDate = typeof label === "string" ? label.replace(/-/g, "/") : label;
  const hasData = payload && payload.some((p) => p.value != null);

  return (
    <div className="bg-white p-3 rounded-lg shadow-md border border-slate-100 text-sm">
      <p className="font-bold text-slate-800 mb-1.5">{formattedDate}</p>
      {hasData ? (
        <div className="space-y-1">
          {payload.map((p) => {
            if (p.value == null) return null;
            return (
              <div key={p.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: p.stroke || p.color }}
                />
                <span className="text-slate-600">{p.name}:</span>
                <span className="font-semibold text-slate-800">{p.value}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-slate-400">記録なし</p>
      )}
    </div>
  );
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function TrendChart({ entries }: TrendChartProps) {
  const [period, setPeriod] = useState<Period>("30");

  const chartData = useMemo(() => {
    if (entries.length === 0) return [];

    const entryMap = new Map<string, BodyLogEntry>();
    for (const entry of entries) {
      entryMap.set(entry.date, entry);
    }

    const sortedDates = [...entries].map((e) => e.date).sort();
    const oldestDateStr = sortedDates[0];
    const newestDateStr = sortedDates[sortedDates.length - 1];

    const today = startOfDay(new Date());
    const newestDate = parseLocalDate(newestDateStr);
    const oldestDate = parseLocalDate(oldestDateStr);

    let startDate: Date;
    let endDate: Date;

    if (period === "7") {
      endDate = isAfter(newestDate, today) ? newestDate : today;
      startDate = subDays(endDate, 6);
    } else if (period === "30") {
      endDate = isAfter(newestDate, today) ? newestDate : today;
      startDate = subDays(endDate, 29);
    } else {
      startDate = oldestDate;
      endDate = newestDate;
    }

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entryMap.get(dateStr);
      return {
        date: dateStr,
        weight: entry ? entry.weight : null,
        bodyFat: entry ? entry.bodyFat : null,
        muscleMass: entry ? entry.muscleMass : null,
        hasData: Boolean(entry),
      };
    });
  }, [entries, period]);

  const hasValidData = useMemo(() => {
    return chartData.some((d) => d.hasData);
  }, [chartData]);

  return (
    <Card className="w-full shadow-sm mt-8">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2">
        <CardTitle className="text-xl text-slate-800">推移グラフ</CardTitle>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <Button 
            variant={period === "7" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setPeriod("7")}
            className={period === "7" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            7日間
          </Button>
          <Button 
            variant={period === "30" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setPeriod("30")}
            className={period === "30" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            30日間
          </Button>
          <Button 
            variant={period === "all" ? "default" : "outline"} 
            size="sm" 
            onClick={() => setPeriod("all")}
            className={period === "all" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
          >
            全期間
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {hasValidData ? (
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickFormatter={(val) => val.substring(5).replace('-', '/')} // MM/DD
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  minTickGap={16}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  domain={['auto', 'auto']}
                  axisLine={false}
                  tickLine={false}
                  dx={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  name="体重 (kg)" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  connectNulls={true}
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bodyFat" 
                  name="体脂肪率 (%)" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  connectNulls={true}
                  activeDot={{ r: 5, strokeWidth: 0 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="muscleMass" 
                  name="骨格筋率 (%)" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  connectNulls={true}
                  activeDot={{ r: 5, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] w-full mt-4 flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed text-slate-400">
            データがありません
          </div>
        )}
      </CardContent>
    </Card>
  );
}
