import { Card, CardContent } from "@/components/ui/card";
import { BodyLogEntry } from "@/app/actions";
import { Activity, Scale, Percent, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface SummaryCardsProps {
  entries: BodyLogEntry[];
}

export function SummaryCards({ entries }: SummaryCardsProps) {
  if (entries.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["体重", "体脂肪率", "骨格筋率"].map((title) => (
          <Card key={title} className="bg-slate-50/50 shadow-sm border-dashed">
            <CardContent className="p-6 flex flex-col items-center justify-center text-slate-400">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-2xl font-bold mt-2">--</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const latest = entries[0];
  const previous = entries.length > 1 ? entries[1] : null;

  const getDiffLabel = (current: number, prev: number | null, inverseBad = false) => {
    if (prev === null) return <span className="text-slate-400 text-sm">--</span>;
    const diff = current - prev;
    if (diff === 0) return <span className="text-slate-500 text-sm flex items-center"><Minus className="w-4 h-4 mr-1" /> ±0</span>;
    
    // inverseBad = true の場合（筋肉量など）、増加が良い色（緑）
    const isGood = inverseBad ? diff > 0 : diff < 0;
    const colorClass = isGood ? "text-emerald-500" : "text-rose-500";
    
    return (
      <span className={`${colorClass} text-sm flex items-center font-medium`}>
        {diff > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="shadow-sm border-l-4 border-l-indigo-500 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">体重</p>
            <div className="p-2 bg-indigo-50 rounded-full text-indigo-500"><Scale className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-slate-800">{latest.weight.toFixed(1)}</span>
              <span className="text-sm font-medium text-slate-500">kg</span>
            </div>
            {getDiffLabel(latest.weight, previous?.weight ?? null)}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-sky-500 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">体脂肪率</p>
            <div className="p-2 bg-sky-50 rounded-full text-sky-500"><Percent className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-slate-800">{latest.bodyFat.toFixed(1)}</span>
              <span className="text-sm font-medium text-slate-500">%</span>
            </div>
            {getDiffLabel(latest.bodyFat, previous?.bodyFat ?? null)}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-l-4 border-l-emerald-500 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">骨格筋率</p>
            <div className="p-2 bg-emerald-50 rounded-full text-emerald-500"><Activity className="w-5 h-5" /></div>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-slate-800">{latest.muscleMass.toFixed(1)}</span>
              <span className="text-sm font-medium text-slate-500">%</span>
            </div>
            {getDiffLabel(latest.muscleMass, previous?.muscleMass ?? null, true)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
