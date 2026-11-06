"use client";

import { useState, useMemo } from "react";
import { BodyLogEntry } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { subDays, isAfter, startOfDay, eachDayOfInterval, format, startOfWeek, addDays } from "date-fns";

interface TrendChartProps {
  entries: BodyLogEntry[];
}

type Period = "7" | "30" | "all";
type Metric = "all" | "weight" | "bodyFat" | "muscleMass";
type Aggregation = "daily" | "weekly";

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

  const isWeeklyLabel = label.endsWith("週");
  const formattedDate = isWeeklyLabel ? `${label} (平均)` : label.replace(/-/g, "/");
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
  const [metric, setMetric] = useState<Metric>("all");
  const [aggregation, setAggregation] = useState<Aggregation>("daily");

  const handlePeriodChange = (newPeriod: Period) => {
    setPeriod(newPeriod);
    if (newPeriod === "all") {
      setAggregation("weekly");
    } else if (newPeriod === "7") {
      setAggregation("daily");
    }
  };

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

    // 週平均モード（7日間の場合は日別強制）
    if (aggregation === "weekly" && period !== "7") {
      const weekMap = new Map<string, {
        weekStart: Date;
        weights: number[];
        bodyFats: number[];
        muscleMasses: number[];
      }>();

      const currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
      const finalWeekStart = startOfWeek(endDate, { weekStartsOn: 1 });

      let cur = currentWeekStart;
      while (!isAfter(cur, finalWeekStart)) {
        const key = format(cur, "yyyy-MM-dd");
        weekMap.set(key, {
          weekStart: cur,
          weights: [],
          bodyFats: [],
          muscleMasses: [],
        });
        cur = addDays(cur, 7);
      }

      for (const entry of entries) {
        const entryDate = parseLocalDate(entry.date);
        if (entryDate >= startDate && entryDate <= endDate) {
          const wStart = startOfWeek(entryDate, { weekStartsOn: 1 });
          const key = format(wStart, "yyyy-MM-dd");
          const bucket = weekMap.get(key);
          if (bucket) {
            if (entry.weight != null) bucket.weights.push(entry.weight);
            if (entry.bodyFat != null) bucket.bodyFats.push(entry.bodyFat);
            if (entry.muscleMass != null) bucket.muscleMasses.push(entry.muscleMass);
          }
        }
      }

      const avg = (arr: number[]) => {
        if (arr.length === 0) return null;
        const sum = arr.reduce((a, b) => a + b, 0);
        return Math.round((sum / arr.length) * 10) / 10;
      };

      return Array.from(weekMap.values()).map((bucket) => {
        const dateStr = format(bucket.weekStart, "yyyy-MM-dd");
        const displayLabel = `${format(bucket.weekStart, "MM/dd")}週`;
        const weight = avg(bucket.weights);
        const bodyFat = avg(bucket.bodyFats);
        const muscleMass = avg(bucket.muscleMasses);
        const hasData = weight != null || bodyFat != null || muscleMass != null;

        return {
          date: dateStr,
          label: displayLabel,
          weight,
          bodyFat,
          muscleMass,
          hasData,
        };
      });
    }

    // 日別モード
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return days.map((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const entry = entryMap.get(dateStr);
      return {
        date: dateStr,
        label: dateStr,
        weight: entry ? entry.weight : null,
        bodyFat: entry ? entry.bodyFat : null,
        muscleMass: entry ? entry.muscleMass : null,
        hasData: Boolean(entry),
      };
    });
  }, [entries, period, aggregation]);

  const hasValidData = useMemo(() => {
    return chartData.some((d) => d.hasData);
  }, [chartData]);

  // ドットの表示判定：7日間、または週平均かつ週数が少ない場合のみ表示
  const showDots = period === "7" || (aggregation === "weekly" && chartData.length <= 16);

  const showWeight = metric === "all" || metric === "weight";
  const showBodyFat = metric === "all" || metric === "bodyFat";
  const showMuscleMass = metric === "all" || metric === "muscleMass";

  return (
    <Card className="w-full shadow-sm mt-8">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-xl text-slate-800">推移グラフ</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant={period === "7" ? "default" : "outline"} 
              size="sm" 
              onClick={() => handlePeriodChange("7")}
              className={period === "7" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              7日間
            </Button>
            <Button 
              variant={period === "30" ? "default" : "outline"} 
              size="sm" 
              onClick={() => handlePeriodChange("30")}
              className={period === "30" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              30日間
            </Button>
            <Button 
              variant={period === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => handlePeriodChange("all")}
              className={period === "all" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
            >
              全期間
            </Button>
          </div>
        </div>

        {/* コントロールバー（指標・集計の切り替え） */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          {/* 指標タブ */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setMetric("all")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                metric === "all"
                  ? "bg-white text-slate-800 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              すべて
            </button>
            <button
              type="button"
              onClick={() => setMetric("weight")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                metric === "weight"
                  ? "bg-white text-indigo-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              体重
            </button>
            <button
              type="button"
              onClick={() => setMetric("bodyFat")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                metric === "bodyFat"
                  ? "bg-white text-sky-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              体脂肪率
            </button>
            <button
              type="button"
              onClick={() => setMetric("muscleMass")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                metric === "muscleMass"
                  ? "bg-white text-emerald-600 shadow-xs font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              骨格筋率
            </button>
          </div>

          {/* 集計セレクター（7日間以外で表示） */}
          {period !== "7" && (
            <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAggregation("daily")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  aggregation === "daily"
                    ? "bg-white text-slate-800 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                日別
              </button>
              <button
                type="button"
                onClick={() => setAggregation("weekly")}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  aggregation === "weekly"
                    ? "bg-white text-indigo-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                週平均
              </button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasValidData ? (
          <div className="h-[400px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: metric === "all" ? 10 : 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => {
                    if (typeof val !== "string") return val;
                    if (val.endsWith("週")) return val;
                    return val.substring(5).replace('-', '/');
                  }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  minTickGap={16}
                />
                
                {metric !== "all" ? (
                  <YAxis 
                    yAxisId="single"
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={false}
                    dx={-5}
                    unit={metric === "weight" ? "kg" : "%"}
                  />
                ) : (
                  <>
                    <YAxis 
                      yAxisId="left"
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      dx={-5}
                      unit="kg"
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 11, fill: '#64748b' }} 
                      domain={['auto', 'auto']}
                      axisLine={false}
                      tickLine={false}
                      dx={5}
                      unit="%"
                    />
                  </>
                )}

                <Tooltip content={<CustomTooltip />} />
                
                {metric === "all" && (
                  <Legend layout="vertical" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                )}

                {showWeight && (
                  <Line 
                    yAxisId={metric === "weight" ? "single" : "left"}
                    type="monotone" 
                    dataKey="weight" 
                    name="体重 (kg)" 
                    stroke="#6366f1" 
                    strokeWidth={metric === "weight" ? 3 : 2.5}
                    connectNulls={true}
                    dot={showDots ? { r: 3 } : false}
                    activeDot={{ r: 6, strokeWidth: 0 }} 
                  />
                )}
                {showBodyFat && (
                  <Line 
                    yAxisId={metric === "bodyFat" ? "single" : "right"}
                    type="monotone" 
                    dataKey="bodyFat" 
                    name="体脂肪率 (%)" 
                    stroke="#0ea5e9" 
                    strokeWidth={metric === "bodyFat" ? 3 : 2}
                    connectNulls={true}
                    dot={showDots ? { r: 3 } : false}
                    activeDot={{ r: 5, strokeWidth: 0 }} 
                  />
                )}
                {showMuscleMass && (
                  <Line 
                    yAxisId={metric === "muscleMass" ? "single" : "right"}
                    type="monotone" 
                    dataKey="muscleMass" 
                    name="骨格筋率 (%)" 
                    stroke="#10b981" 
                    strokeWidth={metric === "muscleMass" ? 3 : 2}
                    connectNulls={true}
                    dot={showDots ? { r: 3 } : false}
                    activeDot={{ r: 5, strokeWidth: 0 }} 
                  />
                )}
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
