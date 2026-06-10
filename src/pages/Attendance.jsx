import { Calendar, Clock, Coffee, Moon, Sun, Sunrise, Info, CheckCircle2, AlertCircle, RefreshCw, Users } from "lucide-react";

const shiftRules = {
  Morning: { start: "07:00 AM", onTimeUntil: "07:15 AM", lateAfter: "07:16 AM", icon: Sunrise, color: "text-amber-500", bg: "bg-amber-50" },
  Day: { start: "08:00 AM", onTimeUntil: "08:15 AM", lateAfter: "08:16 AM", icon: Sun, color: "text-emerald-500", bg: "bg-emerald-50" },
  Evening: { start: "03:00 PM", onTimeUntil: "03:15 PM", lateAfter: "03:16 PM", icon: Coffee, color: "text-orange-500", bg: "bg-orange-50" },
  Night: { start: "10:30 PM", onTimeUntil: "10:45 PM", lateAfter: "10:46 PM", icon: Moon, color: "text-indigo-500", bg: "bg-indigo-50" },
};

const attendanceSeed = [
  {
    employeeId: "EMP-019",
    date: "2026-05-06",
    checkInTime: "07:08 AM",
    shift: "Morning",
    status: "Auto",
  },
  {
    employeeId: "EMP-022",
    date: "2026-05-06",
    checkInTime: "08:22 AM",
    shift: "Day",
    status: "Auto",
  },
  {
    employeeId: "EMP-031",
    date: "2026-05-06",
    checkInTime: "03:10 PM",
    shift: "Evening",
    status: "Auto",
  },
  {
    employeeId: "EMP-041",
    date: "2026-05-06",
    checkInTime: "10:52 PM",
    shift: "Night",
    status: "Auto",
  },
  {
    employeeId: "EMP-055",
    date: "2026-05-06",
    checkInTime: "--",
    shift: "Day",
    status: "Leave",
  },
  {
    employeeId: "EMP-063",
    date: "2026-05-06",
    checkInTime: "--",
    shift: "Morning",
    status: "Offday",
  },
  {
    employeeId: "EMP-071",
    date: "2026-05-06",
    checkInTime: "08:12 AM",
    shift: "Day",
    status: "Swap",
  },
];

const statusStyles = {
  "In Time": "bg-emerald-100 text-emerald-700",
  Late: "bg-rose-100 text-rose-700",
  Leave: "bg-indigo-100 text-indigo-700",
  Offday: "bg-slate-200 text-slate-700",
  Swap: "bg-amber-100 text-amber-700",
};

const parseTimeToMinutes = (value) => {
  if (!value || value === "--") return null;
  const [time, meridiem] = value.split(" ");
  const [hours, minutes] = time.split(":").map(Number);
  let total = hours % 12;
  if (meridiem === "PM") total += 12;
  return total * 60 + minutes;
};

const resolveStatus = (entry) => {
  if (entry.status !== "Auto") return entry.status;
  const rule = shiftRules[entry.shift];
  if (!rule) return "Late";
  const checkIn = parseTimeToMinutes(entry.checkInTime);
  const onTimeUntil = parseTimeToMinutes(rule.onTimeUntil);
  if (checkIn !== null && checkIn <= onTimeUntil) return "In Time";
  return "Late";
};

const Attendance = () => {
  const stats = attendanceSeed.reduce(
    (acc, entry) => {
      const status = resolveStatus(entry);
      acc.total += 1;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Premium Header ─── */}
      <header className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl animate-float" />
        <div className="absolute -left-32 bottom-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-1 w-12 rounded-full bg-amber-400" />
              <p className="text-[11px] uppercase tracking-[0.4em] text-amber-400 font-bold">Attendance Monitoring</p>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-4">Daily Workforce Pulse</h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Real-time monitoring of team availability and shift adherence based on organizational standards.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 px-8 py-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
            <Clock className="text-amber-400 mb-1" size={32} />
            <span className="text-3xl font-black">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Current System Time</span>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-4 stagger-children">
        {[
          { label: "On Premises", value: stats.total, icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Punctual", value: stats["In Time"] || 0, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Delayed", value: stats.Late || 0, icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Away / Leave", value: (stats.Leave || 0) + (stats.Offday || 0), icon: Info, color: "text-indigo-500", bg: "bg-indigo-50" },
        ].map((item) => (
          <div
            key={item.label}
            className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm card-hover"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`h-12 w-12 rounded-2xl ${item.bg} flex items-center justify-center ${item.color} shadow-inner`}>
                <item.icon size={24} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-slate-900">{item.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">
              {item.label}
            </p>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
              <div className={`h-full ${item.color.replace('text-', 'bg-')} transition-all duration-1000`} style={{ width: `${(item.value / stats.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        <div className="rounded-[2.5rem] border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white">
                <Calendar size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Attendance Log</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Sync</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-100">
                  <th className="px-8 py-4 text-left font-bold">Employee ID</th>
                  <th className="px-4 py-4 text-left font-bold">Session Date</th>
                  <th className="px-4 py-4 text-left font-bold">Check In</th>
                  <th className="px-4 py-4 text-left font-bold">Shift Track</th>
                  <th className="px-8 py-4 text-center font-bold">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceSeed.map((entry) => {
                  const status = resolveStatus(entry);
                  const rule = shiftRules[entry.shift];
                  const Icon = rule?.icon || Clock;
                  return (
                    <tr key={`${entry.employeeId}-${entry.date}`} className="transition-all hover:bg-slate-50/80">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                            {entry.employeeId.split('-')[1]}
                          </div>
                          <span className="font-bold text-slate-900">{entry.employeeId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-5 text-slate-600 font-medium">{entry.date}</td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 text-slate-700 font-black">
                          <Clock size={14} className="text-slate-300" />
                          {entry.checkInTime}
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${rule?.bg} ${rule?.color}`}>
                            <Icon size={14} />
                          </div>
                          <span className="font-bold text-slate-700">{entry.shift}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black shadow-sm border
                          ${status === 'In Time' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                            status === 'Late' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                              'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${status === 'In Time' ? 'bg-emerald-500' : status === 'Late' ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                          {status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Sunrise size={20} className="text-amber-500" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Shift Framework</h3>
            </div>

            <div className="space-y-4">
              {Object.entries(shiftRules).map(([name, rule]) => (
                <div key={name} className="group p-5 rounded-[2rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl ${rule.bg} flex items-center justify-center ${rule.color}`}>
                        <rule.icon size={20} />
                      </div>
                      <p className="font-black text-slate-800 text-base">{name} Shift</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Rule</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-white border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Punctual Cut-off</p>
                      <p className="text-sm font-bold text-emerald-600">{rule.onTimeUntil}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penalty Threshold</p>
                      <p className="text-sm font-bold text-rose-600">{rule.lateAfter}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw size={20} className="text-indigo-500" />
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Status Directory</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {Object.keys(statusStyles).map((status) => (
                <span
                  key={status}
                  className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-sm border ${statusStyles[status]}`}
                >
                  {status}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-400 leading-relaxed italic">
              Attendance statuses are resolved automatically based on check-in timestamps and assigned shift rules.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Attendance;
