"use client";

import { useTransition } from "react";
import { BodyLogEntry } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteEntryAction } from "@/app/actions";

interface HistoryListProps {
  entries: BodyLogEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (window.confirm("この記録を削除してもよろしいですか？")) {
      startTransition(async () => {
        try {
          await deleteEntryAction(id);
        } catch (error) {
          alert("データの削除に失敗しました。");
        }
      });
    }
  };

  return (
    <Card className="w-full shadow-sm mt-8 mb-8">
      <CardHeader>
        <CardTitle className="text-xl text-slate-800">履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center text-slate-400 py-8">記録がありません</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-6 w-full sm:w-auto">
                  <div className="bg-slate-50 px-3 py-2 rounded-lg text-slate-600 font-medium text-sm whitespace-nowrap">
                    {entry.date.replace(/-/g, '/')}
                  </div>
                  <div className="grid grid-cols-3 gap-4 sm:gap-8 flex-1">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400">体重</span>
                      <span className="font-semibold text-slate-700">{entry.weight} kg</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400">体脂肪率</span>
                      <span className="font-semibold text-slate-700">{entry.bodyFat} %</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400">骨格筋率</span>
                      <span className="font-semibold text-slate-700">{entry.muscleMass} %</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 self-end sm:self-auto flex-shrink-0 disabled:opacity-50"
                  disabled={isPending}
                  onClick={() => handleDelete(entry.id)}
                >
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
