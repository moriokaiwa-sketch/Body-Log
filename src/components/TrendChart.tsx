"use client";

import { useState, useMemo } from "react";
import { BodyLogEntry } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { subDays, isAfter, startOfDay } from "date-fns";

interface TrendChartProps {
  entries: BodyLogEntry[];
}

type Period = "7" | "30" | "all";

export function TrendChart({ entries }: TrendChartProps) {
  const [period, setPeriod] = useState<Period>("30");

  const chartData = useMemo(() => {
    // Recharts requires chronological order (oldest first for left-to-right axis)
    // entries are currently newest first
    const chronological = [...entries].reverse();
    
    if (period === "all" || chronological.length === 0) {
      return chronological;
    }

    const daysCount = parseInt(period);
    const thresholdDate = subDays(startOfDay(new Date()), daysCount);

    return chronological.filter((entry) => 
      isAfter(new Date(entry.date), thresholdDate) || entry.date === thresholdDate.toISOString().split('T')[0]
    );
  }, [entries, period]);

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
        {chartData.length > 0 ? (
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
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="weight" 
                  name="体重 (kg)" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bodyFat" 
                  name="体脂肪率 (%)" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                  activeDot={{ r: 5, strokeWidth: 0 }} 
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="muscleMass" 
                  name="骨格筋率 (%)" 
                  stroke="#10b981" 
                  strokeWidth={2}
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
