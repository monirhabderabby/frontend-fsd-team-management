/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { Activity, Award, Calendar, CalendarDays, Filter, RotateCcw, Search, Target, TrendingUp, Trophy, User, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { useQuery } from "@tanstack/react-query";

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
const toMonthKey = (v) =>
  `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, "0")}`;
const parseMonthKey = (v) => {
  const [y, m] = v.split("-").map(Number);
  if (!y || !m) { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() + 1 }; }
  return { year: y, month: m };
};
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const getTeamColor = (name) => {
  const colors = [
    "bg-blue-50 text-blue-600 border-blue-100",
    "bg-emerald-50 text-emerald-600 border-emerald-100",
    "bg-violet-50 text-violet-600 border-violet-100",
    "bg-amber-50 text-amber-600 border-amber-100",
    "bg-rose-50 text-rose-600 border-rose-100",
    "bg-cyan-50 text-cyan-600 border-cyan-100",
    "bg-indigo-50 text-indigo-600 border-indigo-100",
    "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
    "bg-orange-50 text-orange-600 border-orange-100",
    "bg-teal-50 text-teal-600 border-teal-100",
    "bg-slate-50 text-slate-600 border-slate-200",
    "bg-pink-50 text-pink-600 border-pink-100",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
};

const medalEmoji = ["🥇", "🥈", "🥉"];

const roleBadge = {
  PROJECT_MANAGER: { label: "PM", cls: "bg-violet-100 text-violet-700 border-violet-200" },
  TEAM_LEADER: { label: "TL", cls: "bg-sky-100 text-sky-700 border-sky-200" },
  MEMBER: { label: "Member", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  SUPER_ADMIN: { label: "Admin", cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

const Ranking = () => {
  const { user } = useAuth();
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const [serviceLineId, setServiceLineId] = useState("all");
  const [teamId, setTeamId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [topRows, setTopRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [meta, setMeta] = useState({ serviceLines: [], teams: [] });
  const [pageMeta, setPageMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: pageSize });
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const isSA = user?.role === "SUPER_ADMIN";
  const isPM = user?.role === "PROJECT_MANAGER";
  const isTL = user?.role === "TEAM_LEADER";

  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { value: toMonthKey(d), label: toMonthLabel(d) };
    });
  }, []);

  const { year, month } = useMemo(() => parseMonthKey(monthKey), [monthKey]);

  useEffect(() => {
    if (!user) return;
    if (!isSA && user.serviceLine) setServiceLineId(String(user.serviceLine));
  }, [user]);

  const filteredTeams = useMemo(() => {
    const t = meta.teams || [];
    if (serviceLineId === "all") return t;
    return t.filter((x) => {
      const sl = x.serviceLine?._id || x.serviceLine;
      return String(sl) === serviceLineId;
    });
  }, [meta.teams, serviceLineId]);

  useEffect(() => {
    if (teamId !== "all" && !filteredTeams.some((t) => String(t._id) === teamId)) setTeamId("all");
  }, [filteredTeams, teamId]);

  // Debounce the search input by 350ms before sending to API
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(val.trim());
      setCurrentPage(1);
    }, 350);
  };

  const { data: rankingData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ["ranking", { month, year, serviceLineId, teamId, currentPage, search: debouncedSearch }],
    queryFn: async () => {
      const p = new URLSearchParams({
        month: String(month),
        year: String(year),
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (serviceLineId !== "all") p.set("serviceLine", serviceLineId);
      if (teamId !== "all") p.set("team", teamId);
      if (debouncedSearch) p.set("search", debouncedSearch);
      p.set("allWip", "1");
      return apiRequest(`/api/ranking?${p}`);
    },
  });

  useEffect(() => {
    if (rankingData) {
      const payload = rankingData?.data || rankingData;
      setRows(payload?.rows || []);
      setTopRows(payload?.topRows || []);
      if (payload?.meta) {
        setPageMeta({
          page: payload.meta.page || 1,
          totalPages: payload.meta.totalPages || 1,
          total: payload.meta.total || 0,
          limit: payload.meta.limit || pageSize,
        });
      }
      setMeta((prev) => ({
        ...prev,
        serviceLines: payload?.serviceLines || prev.serviceLines,
        teams: payload?.teams || prev.teams,
      }));
    }
  }, [rankingData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load");
    }
  }, [queryError]);

  const { data: slData } = useQuery({
    queryKey: ["serviceLines", "list"],
    queryFn: () => apiRequest("/api/service-lines"),
    enabled: isSA,
  });

  useEffect(() => {
    if (slData) {
      const list = normalizeList(slData, ["serviceLines"]);
      if (list.length) {
        setMeta((prev) => ({ ...prev, serviceLines: list }));
      }
    }
  }, [slData]);

  const { data: teamsListData } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiRequest("/api/teams"),
  });

  useEffect(() => {
    if (teamsListData) {
      const list = normalizeList(teamsListData, ["teams"]);
      if (list.length) {
        setMeta((prev) => ({ ...prev, teams: list }));
      }
    }
  }, [teamsListData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [monthKey, serviceLineId, teamId, debouncedSearch]);

  const totalPages = Math.max(1, Number(pageMeta.totalPages || 1));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage - 1 > 1) pages.add(currentPage - 1);
    if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  const displayRows = useMemo(() => {
    let prevAmount = null;
    let prevRank = null;
    return rows.map((row, idx) => {
      const baseRank = row.rank ?? ((currentPage - 1) * pageSize + idx + 1);
      const amount = Number(row.deliveredAmount || 0);
      let displayRank = baseRank;
      if (prevAmount !== null && amount === prevAmount) {
        displayRank = prevRank;
      }
      prevAmount = amount;
      prevRank = displayRank;
      return { ...row, _displayRank: displayRank };
    });
  }, [rows, currentPage, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-10 p-6 pb-12">

      {/* ─── Podium Section ─── */}
      {!loading && topRows.length >= 3 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end px-4 py-8">

          {/* ================= SILVER / BLUE ================= */}
          <div className="order-2 md:order-1">
            <div className="relative overflow-hidden rounded-[2.7rem] border border-blue-400/20 bg-linear-to-br from-[#172554] via-[#1e3a8a] to-[#312e81] p-8 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.45)]">
              <div className="absolute -top-20 right-0 h-40 w-40 rounded-full bg-blue-400/20 blur-[90px]" />
              <div className="absolute top-5 right-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-xl font-black text-white">2</div>
              </div>
              <div className="relative mb-6 flex justify-center">
                <div className="h-28 w-28 rounded-[2rem] bg-linear-to-br from-blue-300 via-cyan-300 to-indigo-400 p-0.75 shadow-[0_10px_30px_rgba(96,165,250,0.45)]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.8rem] bg-[#0f172a]">
                    {topRows[1]?.profileImage ? (
                      <img src={getImageUrl(topRows[1].profileImage)} alt={topRows[1].name} className="h-full w-full object-cover" />
                    ) : (
                      <User size={48} className="text-blue-200" />
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-center text-2xl font-black text-white line-clamp-1">{topRows[1]?.name}</h3>
              <p className="mt-2 mb-7 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-blue-200/70">{topRows[1]?.employeeId}</p>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/50 block mb-1">Delivered</span>
                    <p className="text-2xl font-black tracking-tight text-blue-100">{fmt(topRows[1]?.deliveredAmount)}</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-100/50 block mb-1">Remaining</span>
                    <p className={`text-sm font-black ${topRows[1]?.remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {topRows[1]?.remaining > 0 ? `-${fmt(topRows[1].remaining)}` : `+${fmt(Math.abs(topRows[1]?.remaining))}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= GOLD ================= */}
          <div className="order-1 md:order-2 z-10">
            <div className="relative overflow-hidden rounded-[3rem] border border-yellow-300/20 bg-linear-to-br from-[#3b0764] via-[#581c87] to-[#1e1b4b] p-10 shadow-[0_30px_80px_-20px_rgba(250,204,21,0.35)]">
              <div className="absolute top-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[100px]" />
              <div className="absolute top-6 right-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br from-yellow-300 via-amber-400 to-orange-500 text-2xl font-black text-white shadow-[0_10px_30px_rgba(251,191,36,0.45)]">1</div>
              </div>
              <div className="relative mb-8 flex justify-center">
                <div className="h-36 w-36 rounded-[2.8rem] bg-linear-to-br from-yellow-300 via-amber-400 to-orange-500 p-1 shadow-[0_15px_40px_rgba(251,191,36,0.45)]">
                  <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[2.4rem] bg-[#140f2d]">
                    {topRows[0]?.profileImage ? (
                      <img src={getImageUrl(topRows[0].profileImage)} alt={topRows[0].name} className="h-full w-full object-cover" />
                    ) : (
                      <User size={64} className="text-yellow-200" />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-yellow-500/20 to-transparent" />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#22103a] border border-yellow-400/20 shadow-2xl">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-yellow-300 to-orange-500 text-white"><Award size={22} /></div>
                </div>
              </div>
              <h3 className="text-center text-3xl font-black text-white">{topRows[0]?.name}</h3>
              <p className="mt-2 mb-8 text-center text-[11px] font-black uppercase tracking-[0.45em] text-yellow-200">MVP of the Month</p>
              <div className="rounded-[2.2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-100/60 block mb-1">Delivered</span>
                    <p className="text-3xl font-black leading-none tracking-tight text-yellow-300">{fmt(topRows[0]?.deliveredAmount)}</p>
                  </div>
                  <div className="h-12 w-px bg-white/10" />
                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-100/60 block mb-1">Remaining</span>
                    <p className={`text-lg font-black ${topRows[0]?.remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {topRows[0]?.remaining > 0 ? `-${fmt(topRows[0].remaining)}` : `+${fmt(Math.abs(topRows[0]?.remaining))}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= BRONZE / INDIGO ================= */}
          <div className="order-3">
            <div className="relative overflow-hidden rounded-[2.7rem] border border-indigo-400/20 bg-linear-to-br from-[#312e81] via-[#4338ca] to-[#581c87] p-8 shadow-[0_20px_60px_-15px_rgba(99,102,241,0.45)]">
              <div className="absolute -bottom-20 left-0 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-[90px]" />
              <div className="absolute top-5 right-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-xl font-black text-white">3</div>
              </div>
              <div className="relative mb-6 flex justify-center">
                <div className="h-28 w-28 rounded-[2rem] bg-linear-to-br from-indigo-300 via-violet-300 to-fuchsia-400 p-0.75 shadow-[0_10px_30px_rgba(129,140,248,0.45)]">
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[1.8rem] bg-[#140f2d]">
                    {topRows[2]?.profileImage ? (
                      <img src={getImageUrl(topRows[2].profileImage)} alt={topRows[2].name} className="h-full w-full object-cover" />
                    ) : (
                      <User size={48} className="text-indigo-200" />
                    )}
                  </div>
                </div>
              </div>
              <h3 className="text-center text-2xl font-black text-white line-clamp-1">{topRows[2]?.name}</h3>
              <p className="mt-2 mb-7 text-center text-[11px] font-bold uppercase tracking-[0.35em] text-indigo-200/70">{topRows[2]?.employeeId}</p>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100/50 block mb-1">Delivered</span>
                    <p className="text-2xl font-black tracking-tight text-indigo-100">{fmt(topRows[2]?.deliveredAmount)}</p>
                  </div>
                  <div className="h-10 w-px bg-white/10" />
                  <div className="flex-1 text-right">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100/50 block mb-1">Remaining</span>
                    <p className={`text-sm font-black ${topRows[2]?.remaining > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {topRows[2]?.remaining > 0 ? `-${fmt(topRows[2].remaining)}` : `+${fmt(Math.abs(topRows[2]?.remaining))}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── Ranking Table ─── */}
      <Card className="rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-10 py-8 border-b border-slate-50 bg-slate-50/30">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100"><Award size={28} /></div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employee Rankings</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-none font-bold rounded-full px-4 py-1 text-xs">{pageMeta.total} Members</Badge>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Active Performers</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200 min-w-44">
              <div className="pl-1 pr-2 py-0.5 border-r border-slate-50">
                <CalendarDays size={16} className="text-indigo-500" />
              </div>
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger className="h-8 border-none bg-transparent px-2 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer shadow-none">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {monthOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-xs font-semibold">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSA && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200 min-w-48">
                <div className="pl-1 pr-2 py-0.5 border-r border-slate-50">
                  <TrendingUp size={16} className="text-indigo-500" />
                </div>
                <Select value={serviceLineId} onValueChange={setServiceLineId}>
                  <SelectTrigger className="h-8 border-none bg-transparent px-2 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer shadow-none">
                    <SelectValue placeholder="All Service Lines" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <SelectItem value="all" className="text-xs font-semibold">All Service Lines</SelectItem>
                    {meta.serviceLines.map((sl) => (
                      <SelectItem key={sl._id} value={sl._id} className="text-xs font-semibold">{sl.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200 min-w-48">
              <div className="pl-1 pr-2 py-0.5 border-r border-slate-50">
                <Users size={16} className="text-indigo-500" />
              </div>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="h-8 border-none bg-transparent px-2 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer shadow-none">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all" className="text-xs font-semibold">All Teams</SelectItem>
                  {filteredTeams.map((t) => (
                    <SelectItem key={t._id} value={t._id} className="text-xs font-semibold">{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search input */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-200 min-w-52 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/10">
              <Search size={14} className="text-indigo-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search name or ID…"
                className="h-8 w-full bg-transparent text-xs font-semibold text-slate-700 placeholder:text-slate-400 outline-none border-none focus:ring-0"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setDebouncedSearch(""); setCurrentPage(1); }}
                  className="text-slate-300 hover:text-rose-400 transition-colors"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Button variant="ghost" size="sm" onClick={() => {
              setMonthKey(toMonthKey(new Date()));
              setServiceLineId(isSA ? "all" : (user?.serviceLine ? String(user.serviceLine) : "all"));
              setTeamId("all");
              setSearchInput("");
              setDebouncedSearch("");
              setCurrentPage(1);
            }} className="h-10 px-4 rounded-2xl hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 transition-all">
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="text-[10px] font-black uppercase tracking-widest">Reset</span>
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="w-20 text-center font-black uppercase text-[12px] tracking-widest text-slate-500">Rank</TableHead>
                <TableHead className="font-black uppercase text-[12px] tracking-widest text-slate-500">Contributor</TableHead>
                <TableHead className="font-black uppercase text-[12px] tracking-widest text-slate-500">Team</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Delivered</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">WIP</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Revision</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Cancel</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Cancel %</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Target</TableHead>
                <TableHead className="text-right font-black uppercase text-[12px] tracking-widest text-slate-500">Remaining</TableHead>
                <TableHead className="text-center font-black uppercase text-[12px] tracking-widest text-slate-500">Achievement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 11 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="h-40 text-center text-slate-400 italic">No rankings available for this period.</TableCell></TableRow>
              ) : (
                displayRows.map((r) => {
                  const rankValue = r._displayRank;
                  const rankNumber = Number(rankValue) || 0;
                  const isTop3 = rankNumber > 0 && rankNumber <= 3;
                  const isMe = r.employeeId === user?.employeeId;
                  const totalProjects = (r.deliveredCount || 0) + (r.wipCount || 0) + (r.revisionCount || 0) + (r.cancelCount || 0);
                  const cancelPercent = Number(r.cancelPercent ?? 0).toFixed(1);

                  return (
                    <TableRow key={r.employeeId} className={`group transition-all duration-500 relative
                      ${isMe ? "bg-indigo-50/40 hover:bg-indigo-50/60 border-y border-indigo-100/50" : isTop3 ? "bg-slate-50/40 hover:bg-slate-100/40" : "hover:bg-slate-50/80 border-y border-transparent hover:border-slate-100/50"}`}>
                      <TableCell className="text-center relative py-4">
                        {isMe && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center mx-auto shadow-sm text-sm font-black transition-all duration-300 group-hover:scale-110
                          ${rankNumber === 1 ? "bg-linear-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200" :
                            rankNumber === 2 ? "bg-linear-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-200" :
                              rankNumber === 3 ? "bg-linear-to-br from-orange-300 to-orange-500 text-white shadow-lg shadow-orange-200" :
                                isMe ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-white border border-slate-100 text-slate-400"}`}>
                          {rankValue}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-slate-400 font-bold overflow-hidden transition-all duration-500 group-hover:rotate-3
                            ${isMe ? "ring-2 ring-indigo-500 shadow-xl shadow-indigo-500/30 scale-105" : isTop3 ? "bg-white shadow-sm ring-1 ring-slate-100" : "bg-white border border-slate-100 shadow-xs"}`}>
                            {r.profileImage ? (
                              <img src={getImageUrl(r.profileImage)} alt={r.name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className={`font-black tracking-tight ${isMe ? "text-indigo-900" : "text-slate-900"}`}>{r.name}</div>
                              {isMe && (
                                <Badge className="bg-linear-to-r from-indigo-600 to-violet-600 text-white text-[9px] h-5 px-2 border-none shadow-lg shadow-indigo-200 font-black animate-pulse">
                                  YOU
                                </Badge>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">{r.employeeId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className={`rounded-xl px-4 py-1.5 font-black text-[10px] border shadow-xs transition-colors group-hover:bg-white/50 ${getTeamColor(r.team?.name)}`}>
                          {r.team?.name || "—"}
                        </Badge>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-tighter mt-1.5 ml-1 opacity-60">{r.serviceLine?.name || "—"}</div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="font-black text-emerald-600 text-sm leading-none mb-1">{fmt(r.deliveredAmount)}</div>
                        <div className="text-[12px] text-slate-400 font-black uppercase tracking-tighter">{r.deliveredCount || 0}</div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="font-bold text-indigo-600 text-sm leading-none mb-1">
                          {fmt(r.allWipAmount ?? r.wipAmount)}
                        </div>
                        <div className="text-[12px] text-slate-400 font-black uppercase tracking-tighter">
                          {(r.allWipCount ?? r.wipCount) || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="font-bold text-orange-600 text-sm leading-none mb-1">{fmt(r.revisionAmount)}</div>
                        <div className="text-[12px] text-slate-400 font-black uppercase tracking-tighter">{r.revisionCount || 0}</div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className="font-bold text-rose-600 text-sm leading-none mb-1">{fmt(r.cancelAmount)}</div>
                        <div className="text-[12px] text-slate-400 font-black uppercase tracking-tighter">{r.cancelCount || 0}</div>
                      </TableCell>
                      <TableCell className="text-right py-4">
                        <div className={`font-black text-xs ${Number(cancelPercent) > 15 ? "text-rose-600" : Number(cancelPercent) > 5 ? "text-amber-600" : "text-emerald-600"}`}>
                          {cancelPercent}%
                        </div>
                        <div className="text-[12px] text-slate-400 font-medium leading-none mt-1">{r.cancelCount || 0}/{totalProjects}</div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-700 text-sm py-4">{fmt(r.target)}</TableCell>
                      <TableCell className="text-right py-4">
                        {r.target > 0 ? (
                          r.remaining > 0 ? (
                            <span className="text-amber-600 font-black text-sm">-{fmt(r.remaining)}</span>
                          ) : (
                            <span className="text-emerald-500 font-black text-sm">+{fmt(Math.abs(r.remaining))}</span>
                          )
                        ) : <span className="text-slate-300">-</span>}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge className={`rounded-full px-4 py-1.5 text-[12px] font-black border-none
                          ${r.status === "Achieved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-50 px-8 py-5">
            <p className="text-xs font-semibold text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canGoPrev}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="h-9 rounded-xl px-4 text-xs font-semibold"
              >
                Previous
              </Button>
              {visiblePages.map((page) => (
                <Button
                  key={page}
                  type="button"
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 w-9 rounded-xl text-xs font-semibold ${page === currentPage ? "bg-indigo-600 text-white hover:bg-indigo-500" : ""}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={!canGoNext}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="h-9 rounded-xl px-4 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Ranking;
