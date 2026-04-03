import { getEntriesAction } from "@/app/actions";
import { InputForm } from "@/components/InputForm";
import { SummaryCards } from "@/components/SummaryCards";
import { TrendChart } from "@/components/TrendChart";
import { HistoryList } from "@/components/HistoryList";
import { Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const entries = await getEntriesAction();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 selection:bg-indigo-100">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center">
          <div className="bg-indigo-600 p-1.5 rounded-lg mr-3 shadow-md border border-indigo-500">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-sky-500 tracking-tight">
            BodyLog
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8 animate-in fade-in duration-500 slide-in-from-bottom-4">
        <section>
          <SummaryCards entries={entries} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 xl:col-span-4">
            <InputForm />
          </div>
          <div className="lg:col-span-7 xl:col-span-8">
            <TrendChart entries={entries} />
          </div>
        </div>

        <section>
          <HistoryList entries={entries} />
        </section>
      </main>
    </div>
  );
}
