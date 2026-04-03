"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { addEntryAction } from "@/app/actions";
import { Loader2 } from "lucide-react";

export function InputForm() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [muscleMass, setMuscleMass] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date || !weight || !bodyFat || !muscleMass) {
      setError("すべての項目を入力してください。");
      return;
    }

    const w = parseFloat(weight);
    const bf = parseFloat(bodyFat);
    const mm = parseFloat(muscleMass);

    if (isNaN(w) || isNaN(bf) || isNaN(mm)) {
      setError("数値のみ入力してください。");
      return;
    }

    startTransition(async () => {
      try {
        await addEntryAction({
          date,
          weight: w,
          bodyFat: bf,
          muscleMass: mm,
        });

        // Clear fields except date
        setWeight("");
        setBodyFat("");
        setMuscleMass("");
      } catch (err) {
        setError("データの保存に失敗しました。");
      }
    });
  };

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800">記録を追加</CardTitle>
        <CardDescription>日々の変化を記録しましょう</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isPending}
              className="w-full text-lg h-12"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">体重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="例: 65.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bodyFat">体脂肪率 (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="例: 18.2"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                required
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="muscleMass">骨格筋率 (%)</Label>
              <Input
                id="muscleMass"
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="例: 35.0"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                required
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          <Button 
            type="submit" 
            size="lg" 
            disabled={isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg h-14 mt-4 transition-all active:scale-95 disabled:opacity-70"
          >
            {isPending ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                通信中...
              </span>
            ) : (
              "記録する"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
