import { FileText, PieChart, Activity, ShieldCheck, Download, ArrowRight, Sparkles, HeartPulse } from "lucide-react";

const reportTypes = [
  { name: "Weekly Digest", desc: "Consolidated squad performance and delivery velocity.", icon: FileText, color: "emerald" },
  { name: "Client Health", desc: "Satisfaction indices and retention risk assessment.", icon: HeartPulse, color: "rose" },
  { name: "Team Velocity", desc: "Sprint completion rates and bottleneck analysis.", icon: Activity, color: "cyan" },
  { name: "Ops Review", desc: "Operational efficiency and resource utilization metrics.", icon: ShieldCheck, color: "indigo" },
];

const Reports = () => {
  return (
    <div className="space-y-10 animate-fade-in">
      {/* ── Premium Header ── */}
      <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl animate-float" />
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-1 w-12 rounded-full bg-emerald-400" />
            <p className="text-[11px] uppercase tracking-[0.4em] text-emerald-400 font-black">Analytics Engine</p>
          </div>
          <h1 className="text-4xl font-black tracking-tight mb-4">Reporting Studio</h1>
          <p className="text-slate-400 text-lg leading-relaxed font-medium max-w-2xl">
            Generate high-fidelity insight packs and client-ready metrics to drive data-informed decisions across the organization.
          </p>
        </div>
      </header>

      {/* ── Report Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 stagger-children">
        {reportTypes.map((report) => (
          <div
            key={report.name}
            className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`p-4 rounded-2xl bg-${report.color}-50 text-${report.color}-500 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm`}>
                <report.icon size={28} />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 text-slate-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-inner">
                <Sparkles size={12} className="text-amber-400" />
                PREMIUM PACK
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">{report.name}</h3>
              <p className="mt-3 text-sm font-bold text-slate-400 leading-relaxed">
                {report.desc}
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Last Update</span>
                <span className="text-[12px] font-black text-slate-500">2 HOURS AGO</span>
              </div>
              <button className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black text-white shadow-xl shadow-slate-900/20 transition-all hover:scale-105 active:scale-95">
                GENERATE <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Action Bar ── */}
      <div className="rounded-[2.5rem] bg-emerald-500/5 border border-emerald-500/10 p-10 flex flex-col lg:flex-row items-center justify-between gap-8 backdrop-blur-sm">
         <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30">
               <Download size={32} />
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-900">Bulk Export Studio</h4>
               <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Download all active data nodes as raw CSV/JSON.</p>
            </div>
         </div>
         <button className="w-full lg:w-auto rounded-2xl bg-white border border-slate-200 px-10 py-5 text-sm font-black text-slate-900 shadow-xl transition-all hover:bg-slate-50 active:scale-95 flex items-center justify-center gap-3">
            INITIALIZE EXPORT
            <ArrowRight size={18} className="text-emerald-500" />
         </button>
      </div>
    </div>
  );
};

export default Reports;
