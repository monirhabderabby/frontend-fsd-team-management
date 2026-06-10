/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { BarChart3, CalendarDays, CheckCircle2, LayoutGrid, RotateCcw, Target, TrendingUp, Users, XCircle, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateDeliveryData } from "../lib/queryInvalidation.js";

const normalizeList = (payload, fallbacks = []) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  for (const key of fallbacks) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  if (payload?.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.data.items)) return payload.data.items;
    if (Array.isArray(payload.data.results)) return payload.data.results;
    for (const key of fallbacks) {
      if (Array.isArray(payload.data[key])) return payload.data[key];
    }
    const nestedKey = Object.keys(payload.data).find((key) => Array.isArray(payload.data[key]));
    if (nestedKey) return payload.data[nestedKey];
  }
  const topKey = payload && typeof payload === "object"
    ? Object.keys(payload).find((key) => Array.isArray(payload[key]))
    : null;
  return topKey ? payload[topKey] : [];
};

const toMonthLabel = (v) =>
  v.toLocaleDateString("en-US", { month: "long", year: "numeric" });

const toMonthKey = (v) => {
  const m = String(v.getMonth() + 1).padStart(2, "0");
  return `${v.getFullYear()}-${m}`;
};

const parseMonthKey = (v) => {
  const [y, m] = v.split("-").map(Number);
  if (!y || !m) {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  }
  return { year: y, month: m };
};

const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const pct = (num, den) => (den ? Math.round((num / den) * 100) : 0);

/* ──────────────────────── Component ──────────────────────── */

const Delivery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /* ── state ── */
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const [serviceLineId, setServiceLineId] = useState("all");
  const [teamId, setTeamId] = useState("all");
  const [teamRows, setTeamRows] = useState([]);
  const [memberRows, setMemberRows] = useState([]);
  const [totals, setTotals] = useState({
    deliveredAmount: 0, deliveredCount: 0,
    wipAmount: 0, wipCount: 0,
    cancelAmount: 0, cancelCount: 0,
    revisionAmount: 0, revisionCount: 0,
  });
  const [meta, setMeta] = useState({ serviceLines: [], teams: [] });
  const [teamTargets, setTeamTargets] = useState({});
  const [savingTargetId, setSavingTargetId] = useState("");
  const [error, setError] = useState("");

  /* ── role helpers ── */
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isPM = user?.role === "PROJECT_MANAGER";
  const isTL = user?.role === "TEAM_LEADER";
  const canView = isSuperAdmin || isPM || isTL;
  const canSetTarget = isSuperAdmin || isPM;

  /* ── month options ── */
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { value: toMonthKey(d), label: toMonthLabel(d) };
    });
  }, []);

  const { year, month } = useMemo(() => parseMonthKey(monthKey), [monthKey]);

  /* ── auto‑lock filters for PM / TL ── */
  useEffect(() => {
    if (!user) return;
    if ((isPM || isTL) && user.serviceLine) {
      setServiceLineId(String(user.serviceLine));
    }
  }, [user]);

  /* ── filtered team list for dropdown ── */
  const filteredTeams = useMemo(() => {
    const t = meta.teams || [];
    if (serviceLineId === "all") return t;
    return t.filter((x) => {
      const sl = x.serviceLine?._id || x.serviceLine;
      return String(sl) === serviceLineId;
    });
  }, [meta.teams, serviceLineId]);

  useEffect(() => {
    if (teamId !== "all" && !filteredTeams.some((t) => String(t._id) === teamId)) {
      setTeamId("all");
    }
  }, [filteredTeams, teamId]);

  /* ── fetch data ── */
  const { data: deliveryData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["delivery", "summary", { month, year, serviceLineId, teamId }],
    enabled: canView,
    queryFn: async () => {
      const p = new URLSearchParams({ month: String(month), year: String(year) });
      if (serviceLineId !== "all") p.set("serviceLine", serviceLineId);
      if (teamId !== "all") p.set("team", teamId);
      return apiRequest(`/api/delivery/summary?${p}`);
    },
  });

  useEffect(() => {
    if (deliveryData) {
      const payload = deliveryData?.data || deliveryData;
      setTeamRows(payload?.teamRows || []);
      setMemberRows(payload?.memberRows || []);
      setTotals(payload?.totals || {});
      setMeta({
        serviceLines: payload?.serviceLines || [],
        teams: payload?.teams || [],
      });
    }
  }, [deliveryData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load");
    }
  }, [queryError]);

  const { data: serviceLinesData } = useQuery({
    queryKey: ["serviceLines", "list"],
    queryFn: () => apiRequest("/api/service-lines"),
    enabled: canView,
  });

  useEffect(() => {
    if (serviceLinesData) {
      const list = normalizeList(serviceLinesData, ["serviceLines"]);
      if (list.length) {
        setMeta((prev) => ({ ...prev, serviceLines: list }));
      }
    }
  }, [serviceLinesData]);

  const { data: teamsData } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiRequest("/api/teams"),
    enabled: canView,
  });

  useEffect(() => {
    if (teamsData) {
      const list = normalizeList(teamsData, ["teams"]);
      if (list.length) {
        setMeta((prev) => ({ ...prev, teams: list }));
      }
    }
  }, [teamsData]);

  /* ── sync local target inputs ── */
  useEffect(() => {
    const n = {};
    teamRows.forEach((r) => { n[r.id] = r.target ?? 0; });
    setTeamTargets(n);
  }, [teamRows]);

  /* ── save target ── */
  const saveTargetMutation = useMutation({
    mutationFn: ({ tid, value }) =>
      apiRequest(`/api/delivery/team-target/${tid}`, {
        method: "PATCH",
        body: JSON.stringify({ teamTarget: value, month, year }),
      }),
    onMutate: ({ tid }) => {
      setError("");
      setSavingTargetId(tid);
    },
    onError: (err) => {
      setError(err.message || "Failed to update target");
    },
    onSuccess: (_payload, { tid, value }) => {
      setTeamRows((prev) =>
        prev.map((r) => {
          if (r.id !== tid) return r;
          const remaining = value > 0 ? value - r.deliveredAmount : 0;
          return { ...r, target: value, remaining };
        })
      );
      invalidateDeliveryData(queryClient);
    },
    onSettled: () => {
      setSavingTargetId("");
    },
  });

  const saveTarget = (tid) => {
    const value = Number(teamTargets[tid] || 0);
    saveTargetMutation.mutate({ tid, value });
  };

  /* ── derived metrics ── */
  const totalActivity = totals.deliveredAmount + totals.wipAmount + totals.cancelAmount + totals.revisionAmount;
  const cancelRatio = pct(totals.cancelAmount, totalActivity);
  const revisionRatio = pct(totals.revisionAmount, totalActivity);

  const bestDeliveredTeam = useMemo(() => {
    if (!teamRows.length) return null;
    return [...teamRows].sort((a, b) => b.deliveredAmount - a.deliveredAmount)[0];
  }, [teamRows]);

  const bestOverallTeam = useMemo(() => {
    if (!teamRows.length) return null;
    return [...teamRows]
      .map((r) => ({ ...r, score: r.target ? r.deliveredAmount / r.target : r.deliveredAmount }))
      .sort((a, b) => b.score - a.score)[0];
  }, [teamRows]);

  /* ── permission gate ── */
  if (!canView) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            You do not have permission to view delivery tracking.
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── indicator cards data ── */
  const cards = [
    { title: "Total Delivered", value: fmt(totals.deliveredAmount), sub: `${totals.deliveredCount} projects`, color: "emerald", icon: CheckCircle2 },
    { title: "Total WIP", value: fmt(totals.wipAmount), sub: `${totals.wipCount} projects`, color: "indigo", icon: RotateCcw },
    { title: "Total Revision", value: fmt(totals.revisionAmount), sub: `${totals.revisionCount} projects · ${revisionRatio}%`, color: "orange", icon: TrendingUp },
    { title: "Total Cancel", value: fmt(totals.cancelAmount), sub: `${totals.cancelCount} cancelled · ${cancelRatio}%`, color: "rose", icon: XCircle },
    { title: "Best Delivered Team", value: bestDeliveredTeam?.name || "-", sub: bestDeliveredTeam ? fmt(bestDeliveredTeam.deliveredAmount) : "No data", color: "emerald", icon: Target },
    { title: "Best Overall Team", value: bestOverallTeam?.name || "-", sub: bestOverallTeam ? fmt(bestOverallTeam.deliveredAmount) : "No data", color: "sky", icon: BarChart3 },
  ];

  const indicatorStyles = {
    emerald: { icon: "bg-emerald-50 text-emerald-600", text: "text-emerald-600" },
    indigo: { icon: "bg-indigo-50 text-indigo-600", text: "text-indigo-600" },
    orange: { icon: "bg-orange-50 text-orange-600", text: "text-orange-600" },
    rose: { icon: "bg-rose-50 text-rose-600", text: "text-rose-600" },
    amber: { icon: "bg-amber-50 text-amber-600", text: "text-amber-600" },
    sky: { icon: "bg-sky-50 text-sky-600", text: "text-sky-600" }
  };

  return (
    <div className="space-y-8 p-6 pb-12">

      {/* ─── Indicator Cards ─── */}
      {/* <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const style = indicatorStyles[c.color];
          return (
            <Card key={c.title} className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${style.icon}`}>
                    <c.icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-widest text-slate-500">
                      {c.title}
                    </p>
                    <p className="text-2xl font-black tracking-tight text-slate-900 truncate my-2">
                      {c.value}
                    </p>
                    <p className={`text-sm font-bold truncate ${style.text}`}>
                      {c.sub}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div> */}





      <Card className="rounded-lg border-none bg-white shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100 overflow-hidden">
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-slate-50 px-8 py-8 gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.5rem] bg-emerald-50 text-emerald-600 shadow-inner">
              <LayoutGrid size={28} />
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Team Breakdown</CardTitle>
              <p className="text-sm font-semibold text-slate-400">Detailed delivery stats across all teams</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 p-2.5 rounded-[2rem] border border-slate-100 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 px-3 border-r border-slate-200">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Tracking</span>
            </div>

            <div className="min-w-35">
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger className="h-9 border-none bg-transparent px-3 text-xs font-bold text-slate-700 shadow-none focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {monthOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-40">
              <Select value={serviceLineId} onValueChange={setServiceLineId} disabled={isPM || isTL}>
                <SelectTrigger className="h-9 border-none bg-transparent px-3 text-xs font-bold text-slate-700 shadow-none focus:ring-0 disabled:opacity-40">
                  <SelectValue placeholder="All Service Lines" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all">All Service Lines</SelectItem>
                  {meta.serviceLines.map((sl) => (<SelectItem key={sl._id} value={sl._id}>{sl.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-35">
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="h-9 border-none bg-transparent px-3 text-xs font-bold text-slate-700 shadow-none focus:ring-0">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all">All Teams</SelectItem>
                  {filteredTeams.map((t) => (<SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon-sm" className="h-9 w-9 rounded-xl hover:bg-white hover:text-emerald-600 transition-all"
              onClick={() => {
                setMonthKey(toMonthKey(new Date()));
                setServiceLineId((isPM || isTL) && user?.serviceLine ? String(user.serviceLine) : "all");
                setTeamId(isTL && user?.team ? String(user.team) : "all");
              }}>
              <RotateCcw size={16} />
            </Button>
          </div>
        </CardHeader>
        <div className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100/50">
                <TableHead className="py-3 text-sm font-black uppercase tracking-widest text-slate-500">Team</TableHead>
                <TableHead className="py-3 text-sm font-black uppercase tracking-widest text-slate-500">Service Line</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Delivered</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">WIP</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Revision</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Cancel</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Target ($)</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Remaining</TableHead>
                <TableHead className="py-3 text-right text-sm font-black uppercase tracking-widest text-slate-500">Cancel %</TableHead>
                <TableHead className="py-3 text-center text-sm font-black uppercase tracking-widest text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 10 }).map((_, j) => (
                      <TableCell key={j} className="py-4"><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : teamRows.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="h-64 text-center text-slate-400 font-medium">No teams found for the selected period.</TableCell></TableRow>
              ) : (
                teamRows.map((r) => (
                  <TableRow key={r.id} className={`group border-slate-50 transition-all hover:bg-slate-50/50 ${teamId !== "all" && String(r.id) === teamId ? "bg-emerald-50/30" : ""}`}>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        {teamId !== "all" && String(r.id) === teamId && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(1,162,42,0.5)]" />
                        )}
                        <span className="text-base font-black text-slate-900">{r.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
                        {r.serviceLine?.name || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-black text-emerald-600">{fmt(r.deliveredAmount)}</span>
                        <span className="text-sm font-bold text-slate-400">{r.deliveredCount} </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-black text-indigo-600">{fmt(r.wipAmount)}</span>
                        <span className="text-sm font-bold text-slate-400">{r.wipCount} </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-black text-orange-600">{fmt(r.revisionAmount)}</span>
                        <span className="text-sm font-bold text-slate-400">{r.revisionCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-black text-rose-600">{fmt(r.cancelAmount)}</span>
                        <span className="text-sm font-bold text-slate-400">{r.cancelCount}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-4">
                      {canSetTarget ? (
                        <div className="flex items-center justify-end gap-2">
                          <div className="relative">
                            <Input type="number" min={0} value={teamTargets[r.id] ?? ""}
                              onChange={(e) => setTeamTargets((prev) => ({ ...prev, [r.id]: e.target.value }))}
                              className="h-10 w-28 rounded-xl border-slate-200 bg-slate-50/50 text-right text-sm font-bold shadow-none transition-all focus:border-emerald-500 focus:ring-emerald-500/10" />
                          </div>
                          <Button size="sm" disabled={savingTargetId === r.id} onClick={() => saveTarget(r.id)}
                            className="h-10 rounded-xl bg-slate-900 px-4 text-xs font-bold hover:bg-slate-800 transition-all">
                            {savingTargetId === r.id ? "..." : "Set"}
                          </Button>
                        </div>
                      ) : (<span className="text-base font-black text-slate-700">{fmt(r.target)}</span>)}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      {r.target > 0 ? (
                        r.remaining > 0 ? (
                          <Badge variant="outline" className="rounded-xl border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-black text-amber-700">
                            {fmt(r.remaining)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-xl border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                            + {fmt(Math.abs(r.remaining))}
                          </Badge>
                        )
                      ) : <span className="text-slate-300 font-bold">-</span>}
                    </TableCell>
                    <TableCell className="text-right py-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-base font-black ${r.cancelPercent > 10 ? "text-rose-600" : "text-slate-600"}`}>
                          {r.cancelPercent}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-4">
                      <div className={`inline-flex items-center justify-center rounded-xl px-4 py-1.5 text-xs font-black uppercase tracking-widest ${r.status === "Achieved"
                          ? "bg-emerald-500 text-white shadow-emerald-200"
                          : "bg-amber-100 text-amber-700"
                        }`}>
                        {r.status}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Delivery;
