/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { useQuery } from "@tanstack/react-query";
import {
  Rocket, Target, Sparkles, AlertTriangle, TrendingUp, ArrowRight, Clock,
  Users, BarChart3, CheckCircle2, AlertCircle, Zap, Award, Activity, ShieldAlert,
  Calendar, DollarSign, Briefcase, RefreshCcw, RotateCcw, MoreHorizontal, LayoutDashboard,
  CalendarDays
} from "lucide-react";
import { Badge } from "@/components/ui/badge.jsx";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import {
  ResponsiveContainer, Tooltip, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════

const toMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const toMonthLabel = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.projects)) return value.projects;
  return [];
};

const getMonthOptions = () => {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { value: toMonthKey(d), label: toMonthLabel(d) };
  });
};

const getTrendData = (projects) => {
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const stats = last7Days.reduce((acc, date) => {
    acc[date] = { delivered: 0, wip: 0, cancelled: 0 };
    return acc;
  }, {});

  projects.forEach(p => {
    const d = new Date(p.deliveryDate || p.createdAt).toISOString().split('T')[0];
    if (stats[d] !== undefined) {
      if (p.status === 'Delivered') stats[d].delivered += 1;
      else if (p.status === 'WIP') stats[d].wip += 1;
      else if (p.status === 'Cancelled') stats[d].cancelled += 1;
    }
  });

  return last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
    delivered: stats[date].delivered,
    wip: stats[date].wip,
    cancelled: stats[date].cancelled
  }));
};

const emptyMetrics = {
  deliveredAmount: 0,
  deliveredCount: 0,
  wipAmount: 0,
  wipCount: 0,
  cancelAmount: 0,
  cancelCount: 0,
  revisionAmount: 0,
  revisionCount: 0,
};

// ════════════════════════════════════════════════════════
// PREMIUM DYNAMIC UI COMPONENTS
// ════════════════════════════════════════════════════════

const PulseCurve = ({ projects, title, icon: Icon }) => {
  const data = getTrendData(projects);

  return (
    <div className="relative overflow-hidden bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/60 group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-sm transition-transform duration-500 group-hover:scale-105">
            <Icon size={20} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">{title}</h3>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">7-Day Dynamic Trends</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-slate-100 px-4 py-2 rounded-2xl border border-slate-200 self-start sm:self-auto">
          {[
            { label: 'Delivered', color: 'bg-emerald-500 shadow-emerald-300' },
            { label: 'WIP', color: 'bg-indigo-500 shadow-indigo-300' },
            { label: 'Cancelled', color: 'bg-rose-500 shadow-rose-300' }
          ].map(dot => (
            <div key={dot.label} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${dot.color} shadow-sm`} />
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-wider">{dot.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#01A22A" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#01A22A" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="colorWip" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FFC300" stopOpacity={0.42} />
                <stop offset="95%" stopColor="#FFC300" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="colorCancelled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: '1px solid rgba(226, 232, 240, 0.8)',
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
                padding: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(4px)'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Area
              type="monotone"
              dataKey="wip"
              stroke="#FFC300"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWip)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="delivered"
              stroke="#01A22A"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorDelivered)"
              animationDuration={1200}
            />
            <Area
              type="monotone"
              dataKey="cancelled"
              stroke="#f43f5e"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorCancelled)"
              animationDuration={1200}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/**
 * Premium Stat Card with dynamic theme glows and deep shadows
 */
const StatCard = ({ title, value, trend, icon: Icon, color = "indigo" }) => {
  const iconColors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
  };

  const bgStyles = {
    indigo: "from-indigo-500/10 to-indigo-500/5 border-indigo-100",
    emerald: "from-emerald-500/10 to-emerald-500/5 border-emerald-100",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-100",
    amber: "from-amber-500/10 to-amber-500/5 border-amber-100",
    sky: "from-sky-500/10 to-sky-500/5 border-sky-100",
    orange: "from-orange-500/10 to-orange-500/5 border-orange-100",
  };

  const textColors = {
    indigo: "text-indigo-700",
    emerald: "text-emerald-700",
    rose: "text-rose-700",
    amber: "text-amber-700",
    sky: "text-sky-700",
    orange: "text-orange-700",
  };

  const accentColors = {
    indigo: "bg-indigo-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    orange: "bg-orange-500",
  };

  return (
    <Card className={`relative overflow-hidden border transition-all hover:scale-[1.02] bg-linear-to-br ${bgStyles[color]}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-xl ${accentColors[color]} text-white`}>
            <Icon size={20} />
          </div>
          <div className={`h-2 w-2 rounded-full ${accentColors[color]} animate-pulse`} />
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-600/90">{title}</p>
          <p className={`mt-1 text-3xl font-black tracking-tight ${textColors[color]}`}>{value}</p>
          {trend && (
            <div className="mt-4 flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${accentColors[color]}`} />
              <p className="text-xs font-bold text-slate-700/80">{trend}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Premium Glowing Pill Progress Bar
 */
const ProgressBar = ({ label, value, total, color = "indigo" }) => {
  const percentage = total > 0 ? Math.min(Math.round((value / total) * 100), 100) : 0;
  const colors = {
    indigo: "bg-linear-to-r from-indigo-500 to-indigo-600 shadow-indigo-200",
    emerald: "bg-linear-to-r from-emerald-400 to-emerald-500 shadow-emerald-200",
    rose: "bg-linear-to-r from-rose-400 to-rose-500 shadow-rose-200",
    amber: "bg-linear-to-r from-amber-400 to-amber-500 shadow-amber-200",
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end px-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-black text-slate-800 tracking-tight">{percentage}%</span>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200 shadow-inner">
        <div
          className={`h-full rounded-full ${colors[color]} shadow-md transition-all duration-1000 ease-out relative`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white/30 blur-[1px] rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Redesigned Premium Glassmorphic Header
 */
const DashboardHeader = ({ title, monthValue, onMonthChange }) => {
  const monthOptions = getMonthOptions();

  return (
    <div className="relative p-4 rounded-2xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 shadow-inner">
          <CalendarDays size={16} className="text-slate-500" />
          <Select value={monthValue} onValueChange={onMonthChange}>
            <SelectTrigger className="h-8 border-none bg-transparent px-2 text-[11px] font-black uppercase tracking-widest text-slate-700 outline-none focus:ring-0 cursor-pointer shadow-none">
              <SelectValue placeholder="Select Month" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-xl">
              {monthOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase tracking-wide cursor-pointer">{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ════════════════════════════════════════════════════════

const Dashboard = () => {
  const { user } = useAuth();

  // Global State
  const [currentMonth, setCurrentMonth] = useState(() => toMonthKey(new Date()));

  // Data State
  const [projects, setProjects] = useState([]);
  const [deliveryData, setDeliveryData] = useState(null);
  const [rankingData, setRankingData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isProjectManager = user?.role === "PROJECT_MANAGER";
  const isTeamLeader = user?.role === "TEAM_LEADER";
  const isMember = user?.role === "MEMBER";

  const [year, month] = currentMonth.split("-");
  const monthParam = currentMonth;
  const teamId = user?.team?._id || user?.team || "";
  const serviceLineId = user?.serviceLine?._id || user?.serviceLine || "";

  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => apiRequest("/api/projects"),
    enabled: !!user,
    select: toArray,
  });

  useEffect(() => {
    if (projectsData) {
      setProjects(projectsData);
    }
  }, [projectsData]);

  const { data: rankingResponse } = useQuery({
    queryKey: ["ranking", { month: Number(month), year: Number(year) }],
    queryFn: () => {
      const params = new URLSearchParams({ month, year });
      return apiRequest(`/api/ranking?${params}`);
    },
    enabled: !!user && !!month && !!year,
  });

  useEffect(() => {
    if (rankingResponse) {
      const payload = rankingResponse?.data || rankingResponse;
      setRankingData(payload);
    }
  }, [rankingResponse]);

  const canViewDelivery = ["TEAM_LEADER", "PROJECT_MANAGER", "SUPER_ADMIN"].includes(
    user?.role,
  );

  const { data: memberMonthMetrics = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", "member", monthParam, user?._id],
    queryFn: () => apiRequest(`/api/projects/metrics?month=${encodeURIComponent(monthParam)}`),
    enabled: isMember && !!user,
    select: (payload) => payload?.data || payload?.metrics || payload,
  });

  const { data: memberAllMetrics = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", "member", "all", user?._id],
    queryFn: () => apiRequest("/api/projects/metrics?month=all"),
    enabled: isMember && !!user,
    select: (payload) => payload?.data || payload?.metrics || payload,
  });

  const { data: scopedMonthMetrics = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", "scoped", monthParam, user?._id],
    queryFn: () => {
      const params = new URLSearchParams({ month: monthParam });
      if (isProjectManager) {
        params.set("scope", "service-line");
        if (serviceLineId) params.set("serviceLine", serviceLineId);
      }
      if (isTeamLeader) {
        params.set("scope", "team");
        if (teamId) params.set("team", teamId);
      }
      return apiRequest(`/api/projects/metrics-scope?${params.toString()}`);
    },
    enabled: (isProjectManager || isTeamLeader) && !!user,
    select: (payload) => payload?.data || payload?.metrics || payload,
  });

  const { data: scopedAllMetrics = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", "scoped", "all", user?._id],
    queryFn: () => {
      const params = new URLSearchParams({ month: "all" });
      if (isProjectManager) {
        params.set("scope", "service-line");
        if (serviceLineId) params.set("serviceLine", serviceLineId);
      }
      if (isTeamLeader) {
        params.set("scope", "team");
        if (teamId) params.set("team", teamId);
      }
      return apiRequest(`/api/projects/metrics-scope?${params.toString()}`);
    },
    enabled: (isProjectManager || isTeamLeader) && !!user,
    select: (payload) => payload?.data || payload?.metrics || payload,
  });

  const { data: deliveryResponse } = useQuery({
    queryKey: ["delivery", "summary", { month: Number(month), year: Number(year) }],
    queryFn: () => {
      const params = new URLSearchParams({ month, year });
      return apiRequest(`/api/delivery/summary?${params}`);
    },
    enabled: canViewDelivery && !!month && !!year,
  });

  useEffect(() => {
    if (deliveryResponse) {
      setDeliveryData(deliveryResponse);
    }
  }, [deliveryResponse]);

  const { data: teamMembersData } = useQuery({
    queryKey: ["users", "list", "dashboard"],
    queryFn: () => apiRequest("/api/users"),
    enabled: user?.role === "TEAM_LEADER",
    select: toArray,
  });

  useEffect(() => {
    if (teamMembersData) {
      setTeamMembers(teamMembersData);
    }
  }, [teamMembersData]);

  const { data: pmTeamsData } = useQuery({
    queryKey: ["teams", "summary"],
    queryFn: () => apiRequest("/api/teams/summary"),
    enabled: user?.role === "PROJECT_MANAGER",
    select: toArray,
  });

  const { data: pmServiceLinesData } = useQuery({
    queryKey: ["serviceLines", "list"],
    queryFn: () => apiRequest("/api/service-lines"),
    enabled: user?.role === "PROJECT_MANAGER",
    select: toArray,
  });

  useEffect(() => {
    if (user?.role === "PROJECT_MANAGER") {
      if (pmTeamsData) setTeams(pmTeamsData);
      if (pmServiceLinesData) setServiceLines(pmServiceLinesData);
    }
  }, [user?.role, pmTeamsData, pmServiceLinesData]);

  const { data: saServiceLinesData } = useQuery({
    queryKey: ["serviceLines", "summary"],
    queryFn: () => apiRequest("/api/service-lines/summary"),
    enabled: user?.role === "SUPER_ADMIN",
    select: toArray,
  });

  const { data: saTeamsData } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiRequest("/api/teams"),
    enabled: user?.role === "SUPER_ADMIN",
    select: toArray,
  });

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      if (saServiceLinesData) setServiceLines(saServiceLinesData);
      if (saTeamsData) setTeams(saTeamsData);
    }
  }, [user?.role, saServiceLinesData, saTeamsData]);

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
        <p className="text-xs font-black tracking-widest text-slate-600 uppercase">Synchronizing Portal...</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════
  // ROLE RENDERERS
  // ════════════════════════════════════════════════════════

  const renderMemberDashboard = () => {
    const memberProjects = projects.filter(
      p => String(p.employeeId) === String(user.employeeId) ||
        String(p.createdBy?._id || p.createdBy) === String(user._id)
    );
    const memberRanking = rankingData?.rows?.find(
      r => String(r.employeeId) === String(user.employeeId)
    );

    const memberMonthProjects = memberProjects.filter((p) => {
      if (!p.nextWipDeadline) return false;
      const date = new Date(p.nextWipDeadline);
      if (Number.isNaN(date.getTime())) return false;
      const start = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0);
      const end = new Date(Number(year), Number(month), 1, 0, 0, 0, 0);
      return date >= start && date < end;
    });

    return (
      <div className="space-y-4 animate-fade-in mt-1 h-auto">
        <DashboardHeader
          title={`Welcome back, ${user.name}`}
          monthValue={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Assigned Projects"
            value={memberMonthProjects.length}
            icon={Briefcase}
            color="indigo"
          />
          <StatCard
            title="Delivered"
            value={`$${Number(memberMonthMetrics.deliveredAmount || 0).toLocaleString()}`}
            trend={`${memberMonthMetrics.deliveredCount || 0} delivered`}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="Ranking"
            value={`#${memberRanking?.rank || '-'}`}
            icon={Award}
            color="amber"
          />
          <StatCard
            title="WIP"
            value={`$${Number(memberAllMetrics.wipAmount || 0).toLocaleString()}`}
            trend={`${memberAllMetrics.wipCount || 0} in progress`}
            icon={Activity}
            color="sky"
          />
        </div>

        {/* Detailed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <Zap size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Your Active Tasks</h3>
                </div>
                <Badge variant="outline" className="bg-white px-3 py-1 rounded-full border-slate-200 font-black text-[9px] uppercase tracking-widest text-slate-500">Live Status</Badge>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4">Project Details</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4 text-right">Value (-20%)</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberProjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider text-xs">
                          No active projects assigned yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberProjects.slice(0, 6).map((p) => (
                        <TableRow key={p._id} className="group hover:bg-slate-50/85 transition-all border-b border-slate-200 last:border-none">
                          <TableCell className="py-4">
                            <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">{p.clientName}</div>
                            <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">{p.profileName} • {p.projectId}</div>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <span className="font-black text-slate-800 text-sm">${p.amount}</span>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <span className={`inline-flex items-center px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${p.status === 'Delivered' ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300' :
                              p.status === 'WIP' ? 'bg-indigo-100/90 text-indigo-800 border-indigo-300' :
                                'bg-amber-100/90 text-amber-800 border-amber-300'
                              }`}>
                              {p.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Right Sidebar Charts & Insights */}
          <div className="space-y-6">
            <PulseCurve
              projects={memberProjects}
              title="Individual Flow"
              icon={Activity}
            />

            {/* Motivational glass panel */}
            <div className="relative overflow-hidden bg-linear-to-br from-[#07160B] via-[#015216] to-[#01A22A] p-8 rounded-3xl text-white shadow-xl shadow-emerald-900/10 group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                    <Sparkles className="text-amber-400" size={16} />
                  </div>
                  <h4 className="text-indigo-200 text-[9px] font-black uppercase tracking-widest">Focus Target</h4>
                </div>
                <p className="text-base font-black leading-snug tracking-tight italic text-indigo-50">
                  "Peak performance is driven by consistent execution and visual clarity."
                </p>
              </div>
              <TrendingUp className="absolute -bottom-6 -right-6 text-white/5 transition-transform duration-700 group-hover:scale-110" size={130} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeamLeaderDashboard = () => {
    const teamProjectCount = projects.filter(
      p => String(p.team?._id || p.team) === String(user.team)
    ).length;

    return (
      <div className="space-y-8 animate-fade-in">
        <DashboardHeader
          title={`Welcome back, ${user.name}`}
          monthValue={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Delivered"
            value={`$${Number(scopedMonthMetrics.deliveredAmount || 0).toLocaleString()}`}
            trend={`${scopedMonthMetrics.deliveredCount || 0} delivered`}
            icon={DollarSign}
            color="emerald"
          />
          <StatCard
            title="WIP"
            value={`$${Number(scopedAllMetrics.wipAmount || 0).toLocaleString()}`}
            trend={`${scopedAllMetrics.wipCount || 0} active`}
            icon={Briefcase}
            color="sky"
          />
          <StatCard
            title="Revisions"
            value={`$${Number(scopedMonthMetrics.revisionAmount || 0).toLocaleString()}`}
            trend={`${scopedMonthMetrics.revisionCount || 0} revision`}
            icon={RotateCcw}
            color="amber"
          />
          <StatCard
            title="Cancelled"
            value={`$${Number(scopedMonthMetrics.cancelAmount || 0).toLocaleString()}`}
            trend={`${scopedMonthMetrics.cancelCount || 0} cancelled`}
            icon={AlertCircle}
            color="rose"
          />
        </div>

        {/* Squad Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <Users size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Active Contributors</h3>
                </div>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4">Employee</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4">Designation</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4 text-right">Revenue Contributed</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-500 py-4 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-slate-400 font-bold uppercase tracking-wider text-xs">
                          No team members registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teamMembers.slice(0, 6).map(member => (
                        <TableRow key={member._id} className="group hover:bg-slate-50/50 transition-all border-b border-slate-100 last:border-none">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-700 text-sm group-hover:text-indigo-750 transition-colors">{member.name}</div>
                                <div className="text-[9px] text-slate-600 font-black uppercase tracking-wider mt-0.5">{member.employeeId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">{member.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <span className="font-black text-slate-800 text-sm">
                              ${(deliveryData?.memberRows?.find(r => r.employeeId === member.employeeId)?.deliveredAmount || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            <div className={`h-2 w-2 rounded-full mx-auto shadow-[0_0_8px_currentcolor] ${member.status === 'active' ? 'text-emerald-600 bg-current animate-pulse' : 'text-slate-400 bg-current'}`} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PulseCurve
              projects={projects.filter(p => String(p.team?._id || p.team) === String(user.team))}
              title="Squad Output"
              icon={Target}
            />

            {/* System Status Container */}
            <div className="bg-emerald-100 border border-emerald-300 p-6 rounded-3xl shadow-lg shadow-emerald-500/10 transition-all hover:shadow-emerald-500/15">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="p-2.5 bg-white rounded-xl text-emerald-600 shadow-sm border border-emerald-200">
                  <ShieldAlert size={20} className="animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-900 text-sm tracking-tight">Security & Nodes</h4>
                  <p className="text-[9px] font-bold text-emerald-650 uppercase tracking-widest mt-0.5">Secure Connection</p>
                </div>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed italic border-l-2 border-emerald-400 pl-4">
                "Operational pipeline is secured. All microservices running normal."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderManagerDashboard = (isSuperAdmin = false) => {
    const totalUnits = serviceLines.length;
    const totalSquads = teams.length;

    return (
      <div className="space-y-8 animate-fade-in">
        <DashboardHeader
          title={`Welcome back, ${user.name}`}
          monthValue={currentMonth}
          onMonthChange={setCurrentMonth}
        />

        {/* Enterprise Metrics */}
        {isSuperAdmin ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Delivered Revenue"
              value={`$${(deliveryData?.totals?.deliveredAmount || 0).toLocaleString()}`}
              trend="+18.3%"
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="Service Lines"
              value={totalUnits}
              icon={BarChart3}
              color="indigo"
            />
            <StatCard
              title="Active Teams"
              value={totalSquads}
              icon={Users}
              color="sky"
            />
            <StatCard
              title="Total Managed Projects"
              value={projects.length}
              icon={Briefcase}
              color="amber"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Delivered"
              value={`$${Number(scopedMonthMetrics.deliveredAmount || 0).toLocaleString()}`}
              trend={`${scopedMonthMetrics.deliveredCount || 0} delivered`}
              icon={DollarSign}
              color="emerald"
            />
            <StatCard
              title="WIP"
              value={`$${Number(scopedAllMetrics.wipAmount || 0).toLocaleString()}`}
              trend={`${scopedAllMetrics.wipCount || 0} active`}
              icon={Briefcase}
              color="sky"
            />
            <StatCard
              title="Revisions"
              value={`$${Number(scopedMonthMetrics.revisionAmount || 0).toLocaleString()}`}
              trend={`${scopedMonthMetrics.revisionCount || 0} revision`}
              icon={RotateCcw}
              color="amber"
            />
            <StatCard
              title="Cancelled"
              value={`$${Number(scopedMonthMetrics.cancelAmount || 0).toLocaleString()}`}
              trend={`${scopedMonthMetrics.cancelCount || 0} cancelled`}
              icon={AlertCircle}
              color="rose"
            />
          </div>
        )}

        {/* Enterprise Progress Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/30 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                    <TrendingUp size={18} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">{isSuperAdmin ? "Service Line Capacity" : "Squad Capacity"}</h3>
                </div>
              </div>
              <div className="overflow-x-auto px-6 pb-6">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-200">
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-505 py-4">Title / Label</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-505 py-4">Monthly Goal Progress</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-505 py-4 text-right">Revenue</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-wider text-slate-505 py-4 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(isSuperAdmin ? serviceLines : (deliveryData?.teamRows || [])).slice(0, 6).map(item => (
                      <TableRow key={item._id || item.id} className="group hover:bg-slate-50/85 transition-all border-b border-slate-200 last:border-none">
                        <TableCell className="py-4">
                          <div className="font-bold text-slate-750 text-sm group-hover:text-indigo-700 transition-colors">{item.name}</div>
                          <div className="text-[9px] text-slate-500 font-black uppercase tracking-wider mt-0.5">
                            {isSuperAdmin ? "Service Line" : "Team Squad"}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="w-40 md:w-48">
                            <ProgressBar
                              label="Target completion"
                              value={item.deliveredAmount || 0}
                              total={item.target || 1000}
                              color="indigo"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <span className="font-black text-slate-800 text-sm">${(item.deliveredAmount || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${item.status === 'Achieved' || (item.deliveredAmount >= (item.target || 0) && item.target > 0)
                            ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300'
                            : 'bg-indigo-100/90 text-indigo-800 border-indigo-300'
                            }`}>
                            {item.status || "Executing"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!isSuperAdmin && (!deliveryData?.teamRows || deliveryData.teamRows.length === 0)) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-slate-500 font-bold uppercase tracking-wider text-xs">
                          No performance rows loaded for this cycle.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <PulseCurve
              projects={projects}
              title="Enterprise Run-rate"
              icon={Activity}
            />

            {/* Premium System Stats Card */}
            <div className="bg-[#07160B] p-8 rounded-3xl text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xl border border-white/10">
                    <LayoutDashboard className="text-indigo-400 animate-pulse" size={20} />
                  </div>
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-300">Central Engine</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Live Sync</p>
                  </div>
                </div>
                <p className="text-base font-black leading-snug tracking-tight italic text-slate-200 border-l-2 border-indigo-500/50 pl-4">
                  "Operations are locked. Central dispatch mechanisms operating at peak efficiency."
                </p>
              </div>
              <Activity className="absolute -bottom-6 -right-6 text-white/5 transition-transform duration-700 group-hover:scale-110" size={150} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen pb-20 ">
      <div className="max-w-[1600px] mx-auto">
        {user.role === "MEMBER" && renderMemberDashboard()}
        {user.role === "TEAM_LEADER" && renderTeamLeaderDashboard()}
        {user.role === "PROJECT_MANAGER" && renderManagerDashboard(false)}
        {user.role === "SUPER_ADMIN" && renderManagerDashboard(true)}

        {/* Role Fallback */}
        {!["MEMBER", "TEAM_LEADER", "PROJECT_MANAGER", "SUPER_ADMIN"].includes(user.role) && (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-slate-200 shadow-xl">
            <div className="h-16 w-16 rounded-2xl bg-rose-100/80 flex items-center justify-center mb-6 border border-rose-300 shadow-md">
              <AlertTriangle size={32} className="text-rose-600 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Security Credentials Fault</h2>
            <p className="text-slate-600 mt-2 font-black uppercase tracking-widest text-[10px]">Please request a role update from your enterprise supervisor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
