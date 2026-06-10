/* eslint-disable react-hooks/purity */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { format as formatDate } from "date-fns";
import {
  Activity,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  AlertCircle,
  PauseCircle,
  Target,
  Timer,
  TrendingUp,
  ChevronRight,
  Eye,
  Filter,
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
  X,
  Star,
  Calendar,
} from "lucide-react";
import { apiRequest } from "../utils/apiClient.js";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateProjectData } from "../lib/queryInvalidation.js";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { DatePicker } from "@/components/ui/DatePicker.jsx";
import { DateTimePicker } from "@/components/ui/DateTimePicker.jsx";

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
    const nestedKey = Object.keys(payload.data).find((key) =>
      Array.isArray(payload.data[key]),
    );
    if (nestedKey) return payload.data[nestedKey];
  }
  const topKey =
    payload && typeof payload === "object"
      ? Object.keys(payload).find((key) => Array.isArray(payload[key]))
      : null;
  return topKey ? payload[topKey] : [];
};

const statusStyles = {
  WIP: "bg-amber-100 text-amber-700 border-amber-200",
  Delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  Revision: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Hold: "bg-slate-200 text-slate-700 border-slate-300",
};

const statusIcons = {
  WIP: <Clock size={12} />,
  Delivered: <CheckCircle2 size={12} />,
  Cancelled: <XCircle size={12} />,
  Revision: <RotateCcw size={12} />,
  Hold: <PauseCircle size={12} />,
};

const statusOptions = ["WIP", "Delivered", "Cancelled", "Revision", "Hold"];

const emptyProjectForm = {
  clientName: "",
  profileName: "",
  orderId: "",
  employeeId: "",
  amount: "",
  startDate: "",
  deadline: "",
  nextWipDeadline: "",
  deliveryDate: "",
  status: "WIP",
  instructionSheet: "",
  clientRating: "",
  serviceLine: "",
  team: "",
};

const toInputDateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(date, "yyyy-MM-dd");
};

const toInputDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDate(date, "yyyy-MM-dd'T'HH:mm");
};

const toDisplayDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
};
const formatRemaining = (ms) => {
  if (ms <= 0) return "Due now";
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
};

const formatOverdue = (ms) => {
  const totalMinutes = Math.ceil(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
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
  nearestNextWip: null,
};

const Projects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterMode, setFilterMode] = useState("own");
  const [serviceLineFilter, setServiceLineFilter] = useState("");
  const [teamFilter, setTeamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState([
    "WIP",
    "Revision",
    "Hold",
  ]);
  const [orderFilter, setOrderFilter] = useState("");
  const [memberFilter, setMemberFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeActivity, setActiveActivity] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [activeRemarksProject, setActiveRemarksProject] = useState(null);
  const [remarkInput, setRemarkInput] = useState("");
  const [deletingRemarkId, setDeletingRemarkId] = useState(null);
  const [deleteRemarkTarget, setDeleteRemarkTarget] = useState(null);
  const [form, setForm] = useState(emptyProjectForm);
  const [formErrors, setFormErrors] = useState({});
  const [deleteProject, setDeleteProject] = useState(null);
  const [error, setError] = useState("");
  const [activeDetailsProject, setActiveDetailsProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineTeamFilter, setTimelineTeamFilter] = useState("all_teams");
  const [tempFilters, setTempFilters] = useState({
    filterMode: "own",
    serviceLineFilter: "",
    teamFilter: "",
    statusFilter: ["WIP", "Revision", "Hold"],
    orderFilter: "",
    memberFilter: "",
    memberSearch: "",
  });
  const [metricsMonth, setMetricsMonth] = useState("all");

  const metricsMonthOptions = useMemo(() => {
    const now = new Date();
    const opts = [{ value: "all", label: "All Months" }];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      opts.push({ value: key, label });
    }
    return opts;
  }, []);

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isProjectManager = user?.role === "PROJECT_MANAGER";
  const isTeamLeader = user?.role === "TEAM_LEADER";
  const isMember = user?.role === "MEMBER";
  const memberTeamId = user?.team?._id || user?.team || "";
  const memberServiceLineId = user?.serviceLine?._id || user?.serviceLine || "";
  const canDeleteRemark = [
    "SUPER_ADMIN",
    "PROJECT_MANAGER",
    "TEAM_LEADER",
  ].includes(user?.role);
  const canEditWipDeadline = isSuperAdmin || isProjectManager || isTeamLeader;
  const canPickEmployee = isSuperAdmin || isProjectManager || isTeamLeader;
  const pageSize = 10;
  const defaultFilterMode = isSuperAdmin
    ? "all"
    : isProjectManager
      ? "service-line"
      : isTeamLeader
        ? "team"
        : "own";

  useEffect(() => {
    setFilterMode(defaultFilterMode);
    setServiceLineFilter("");
    setTeamFilter(isTeamLeader ? memberTeamId : "");
    setStatusFilter(["WIP", "Revision", "Hold"]);
    setOrderFilter("");
    setMemberFilter("");
    setCurrentPage(1);
  }, [defaultFilterMode, isTeamLeader, memberTeamId]);

  const { data: serviceLines = [] } = useQuery({
    queryKey: ["serviceLines", "list"],
    queryFn: () => apiRequest("/api/service-lines"),
    select: (payload) => normalizeList(payload, ["serviceLines"]),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiRequest("/api/teams"),
    select: (payload) => normalizeList(payload, ["teams"]),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "list"],
    queryFn: () => apiRequest("/api/users?all=true"),
    select: (payload) => normalizeList(payload, ["users"]),
  });

  const {
    data: timelineResponse,
    isLoading: timelineLoading,
    error: timelineError,
  } = useQuery({
    queryKey: ["projects", "timeline", user?._id, user?.role],
    queryFn: () => apiRequest("/api/projects/timeline"),
    select: (payload) => normalizeList(payload, ["projects"]),
    enabled: !!user && showTimelineModal,
  });

  const timelineData = timelineResponse || [];

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (isMember) {
      if (filterMode === "service-line") {
        params.set("scope", "service-line");
        if (teamFilter && teamFilter !== "all_teams") {
          params.set("team", teamFilter);
        }
      } else {
        params.set("scope", "own");
      }
    }
    if (isSuperAdmin) {
      if (filterMode === "own") params.set("scope", "own");
      if (filterMode === "service-line" && serviceLineFilter) {
        params.set("serviceLine", serviceLineFilter);
      }
      if (filterMode === "team" && teamFilter) {
        params.set("team", teamFilter);
      }
      if (filterMode === "all") {
        if (serviceLineFilter) params.set("serviceLine", serviceLineFilter);
        if (teamFilter) params.set("team", teamFilter);
      }
    }
    if (isProjectManager) {
      if (filterMode === "team" && teamFilter) params.set("team", teamFilter);
    }
    if (isTeamLeader) {
      const serviceLineId = user?.serviceLine?._id || user?.serviceLine;
      if (teamFilter && teamFilter !== "all_teams") {
        params.set("team", teamFilter);
      } else if (serviceLineId) {
        params.set("serviceLine", serviceLineId);
      } else {
        const teamId = user?.team?._id || user?.team;
        if (teamId) params.set("team", teamId);
      }
    }
    if (statusFilter.length > 0) params.set("status", statusFilter.join(","));
    if (orderFilter) params.set("orderId", orderFilter);
    if (memberFilter && memberFilter !== "all_members") {
      params.set("employeeId", memberFilter);
    }
    if (metricsMonth && metricsMonth !== "all") {
      params.set("month", metricsMonth);
    }
    params.set("page", String(currentPage));
    params.set("limit", String(pageSize));
    return params.toString();
  };

  const projectsQueryKey = useMemo(
    () => [
      "projects",
      {
        filterMode,
        serviceLineFilter,
        teamFilter,
        statusFilter: statusFilter.join("|"),
        orderFilter,
        memberFilter,
        metricsMonth,
        currentPage,
        userId: user?._id,
        role: user?.role,
      },
    ],
    [
      filterMode,
      serviceLineFilter,
      teamFilter,
      statusFilter,
      orderFilter,
      memberFilter,
      metricsMonth,
      currentPage,
      user?._id,
      user?.role,
    ],
  );

  const normalizeProject = (payload, fallback) => {
    if (!payload) return fallback;
    if (payload.project) return payload.project;
    if (payload.data) return payload.data;
    if (payload.item) return payload.item;
    return payload;
  };

  const updateProjectCache = (id, updater) => {
    queryClient.setQueryData(projectsQueryKey, (current) => {
      const items = Array.isArray(current?.items) ? current.items : [];
      return {
        ...(current || {}),
        items: items.map((item) => (item._id === id ? updater(item) : item)),
      };
    });
  };
  const refreshProjectQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] });
    queryClient.invalidateQueries({ queryKey: ["projects", "timeline"] });
    invalidateProjectData(queryClient);
  };

  const createProjectMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previous = queryClient.getQueryData(projectsQueryKey);
      const tempId = `temp-${Date.now()}`;
      const sl = serviceLines.find((line) => line._id === payload.serviceLine);
      const team = teams.find((item) => item._id === payload.team);
      const optimistic = {
        _id: tempId,
        ...payload,
        serviceLine: sl || payload.serviceLine,
        team: team || payload.team,
        status: payload.status || "WIP",
        employeeId: payload.employeeId || user?.employeeId || "",
        createdBy: user?._id,
        __optimistic: true,
      };
      const prevItems = Array.isArray(previous?.items) ? previous.items : [];
      queryClient.setQueryData(projectsQueryKey, {
        ...(previous || {}),
        items: [optimistic, ...prevItems],
      });
      return { previous, tempId };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKey, context.previous);
      }
      setError(err.message || "Failed to create project");
    },
    onSuccess: (payload, _vars, context) => {
      const created = normalizeProject(payload);
      if (!created?._id) return;
      queryClient.setQueryData(projectsQueryKey, (current) => {
        const items = Array.isArray(current?.items) ? current.items : [];
        return {
          ...(current || {}),
          items: items.map((item) =>
            item._id === context?.tempId ? created : item,
          ),
        };
      });
      refreshProjectQueries();
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiRequest(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: async ({ id, payload }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previous = queryClient.getQueryData(projectsQueryKey);
      updateProjectCache(id, (item) => ({ ...item, ...payload }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKey, context.previous);
      }
      setError(err.message || "Failed to update project");
    },
    onSuccess: (payload) => {
      const updated = normalizeProject(payload);
      if (!updated?._id) return;
      queryClient.setQueryData(projectsQueryKey, (current) => {
        const items = Array.isArray(current?.items) ? current.items : [];
        return {
          ...(current || {}),
          items: items.map((item) =>
            item._id === updated._id ? { ...item, ...updated } : item,
          ),
        };
      });
      refreshProjectQueries();
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/projects/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previous = queryClient.getQueryData(projectsQueryKey);
      queryClient.setQueryData(projectsQueryKey, (current) => {
        const items = Array.isArray(current?.items) ? current.items : [];
        return {
          ...(current || {}),
          items: items.filter((item) => item._id !== id),
        };
      });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKey, context.previous);
      }
      setError(err.message || "Failed to delete project");
    },
    onSuccess: () => {
      refreshProjectQueries();
    },
  });

  const remarkMutation = useMutation({
    mutationFn: ({ id, text }) =>
      apiRequest(`/api/projects/${id}/remarks`, {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
    onMutate: async ({ id, text }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previous = queryClient.getQueryData(projectsQueryKey);
      updateProjectCache(id, (item) => ({
        ...item,
        remarks: [
          {
            text,
            createdAt: new Date().toISOString(),
            createdBy: {
              _id: user?._id,
              name: user?.name,
              employeeId: user?.employeeId,
            },
          },
          ...(item.remarks || []),
        ],
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKey, context.previous);
      }
      setError(err.message || "Failed to add remark");
    },
    onSuccess: (payload) => {
      const updated = normalizeProject(payload);
      if (!updated?._id) return;
      queryClient.setQueryData(projectsQueryKey, (current) => {
        const items = Array.isArray(current?.items) ? current.items : [];
        return {
          ...(current || {}),
          items: items.map((item) =>
            item._id === updated._id ? { ...item, ...updated } : item,
          ),
        };
      });
      refreshProjectQueries();
    },
  });

  const deleteRemarkMutation = useMutation({
    mutationFn: ({ id, remarkId }) =>
      apiRequest(`/api/projects/${id}/remarks/${remarkId}`, {
        method: "DELETE",
      }),
    onMutate: async ({ id, remarkId }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previous = queryClient.getQueryData(projectsQueryKey);
      updateProjectCache(id, (item) => ({
        ...item,
        remarks: (item.remarks || []).filter(
          (remark) => remark._id !== remarkId,
        ),
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(projectsQueryKey, context.previous);
      }
      const msg = err.message || "Failed to delete remark";
      setError(msg);
      toast.error(msg);
    },
    onSuccess: (payload) => {
      const updated = normalizeProject(payload);
      if (!updated?._id) return;
      queryClient.setQueryData(projectsQueryKey, (current) => {
        const items = Array.isArray(current?.items) ? current.items : [];
        return {
          ...(current || {}),
          items: items.map((item) =>
            item._id === updated._id ? { ...item, ...updated } : item,
          ),
        };
      });
      refreshProjectQueries();
      toast.success("Remark deleted successfully!");
    },
  });

  const normalizeProjectsList = (payload) =>
    normalizeList(payload, ["projects"]);

  const normalizeProjectsResponse = (payload) => {
    const items = normalizeProjectsList(payload);
    const meta = payload?.meta || {
      page: currentPage,
      limit: pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    };
    return { items, meta };
  };

  const {
    data: projectsResponse,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: projectsQueryKey,
    queryFn: async () => {
      const query = buildQuery();
      return apiRequest(`/api/projects${query ? `?${query}` : ""}`);
    },
    select: normalizeProjectsResponse,
    enabled: !!user,
  });

  const { data: metricsResponse = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", metricsMonth, user?._id],
    queryFn: () =>
      apiRequest(
        `/api/projects/metrics?month=${encodeURIComponent(metricsMonth)}`,
      ),
    select: (payload) => payload?.data || payload?.metrics || payload,
    enabled: !!user,
  });

  const { data: currentMonthMetricsResponse = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", currentMonthKey, user?._id],
    queryFn: () =>
      apiRequest(
        `/api/projects/metrics?month=${encodeURIComponent(currentMonthKey)}`,
      ),
    select: (payload) => payload?.data || payload?.metrics || payload,
    enabled: !!user,
  });

  const { data: allMonthsMetricsResponse = emptyMetrics } = useQuery({
    queryKey: ["projects", "metrics", "all", user?._id],
    queryFn: () => apiRequest("/api/projects/metrics?month=all"),
    select: (payload) => payload?.data || payload?.metrics || payload,
    enabled: !!user,
  });

  const { data: wipOverviewResponse } = useQuery({
    queryKey: ["projects", "wip-overview", user?._id, user?.role],
    queryFn: () => apiRequest("/api/projects/wip-overview"),
    select: (payload) => payload?.data || payload,
    enabled: !!user && (isSuperAdmin || isProjectManager),
  });

  const projects = projectsResponse?.items || [];
  const pagination = projectsResponse?.meta || {
    page: currentPage,
    limit: pageSize,
    total: projects.length,
    totalPages: 1,
  };
  const totalProjectsCount = Number(pagination.total || 0);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load projects");
    }
  }, [queryError]);

  useEffect(() => {
    if (!activeRemarksProject) return;
    const updated = projects.find(
      (item) => item._id === activeRemarksProject._id,
    );
    if (updated) {
      setActiveRemarksProject(updated);
    }
  }, [projects, activeRemarksProject]);

  useEffect(() => {
    if (showFilterModal) {
      setTempFilters({
        filterMode,
        serviceLineFilter,
        teamFilter: isTeamLeader ? teamFilter || memberTeamId : teamFilter,
        statusFilter,
        orderFilter,
        memberFilter,
        memberSearch: "",
      });
    }
  }, [
    showFilterModal,
    filterMode,
    serviceLineFilter,
    teamFilter,
    statusFilter,
    orderFilter,
    memberFilter,
    isTeamLeader,
    memberTeamId,
  ]);

  useEffect(() => {
    if (!showTimelineModal || !isTeamLeader) return;
    setTimelineTeamFilter(user?.team?._id || user?.team || "all_teams");
  }, [showTimelineModal, isTeamLeader, user?.team]);

  useEffect(() => {
    setCurrentPage(1);
  }, [metricsMonth]);

  const handleApplyFilters = () => {
    setFilterMode(tempFilters.filterMode);
    setServiceLineFilter(tempFilters.serviceLineFilter);
    setTeamFilter(tempFilters.teamFilter);
    setStatusFilter(tempFilters.statusFilter);
    setOrderFilter(tempFilters.orderFilter);
    setMemberFilter(
      (isMember && tempFilters.filterMode !== "service-line")
        ? ""
        : tempFilters.memberFilter === "all_members"
          ? ""
          : tempFilters.memberFilter,
    );
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      filterMode: defaultFilterMode,
      serviceLineFilter: "",
      teamFilter: isTeamLeader ? memberTeamId : "",
      statusFilter: ["WIP", "Revision", "Hold"],
      orderFilter: "",
      memberFilter: "",
      memberSearch: "",
    };
    setFilterMode(resetFilters.filterMode);
    setServiceLineFilter(resetFilters.serviceLineFilter);
    setTeamFilter(resetFilters.teamFilter);
    setStatusFilter(resetFilters.statusFilter);
    setOrderFilter(resetFilters.orderFilter);
    setMemberFilter(resetFilters.memberFilter);
    setTempFilters(resetFilters);
    setCurrentPage(1);
    setShowFilterModal(false);
  };

  const totalPages = Math.max(1, Number(pagination.totalPages || 1));
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const visiblePages = useMemo(() => {
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = new Set([1, totalPages, currentPage]);
    if (currentPage - 1 > 1) pages.add(currentPage - 1);
    if (currentPage + 1 < totalPages) pages.add(currentPage + 1);
    return Array.from(pages).sort((a, b) => a - b);
  }, [totalPages, currentPage]);

  const availableMembers = useMemo(() => {
    if (!user) return [];
    const allowedRoles = ["MEMBER", "PROJECT_MANAGER", "TEAM_LEADER"];
    let scoped = users.filter((u) => allowedRoles.includes(u.role));

    if (!isSuperAdmin) {
      const serviceLineId = user?.serviceLine?._id || user?.serviceLine;
      if (serviceLineId) {
        scoped = scoped.filter(
          (u) => String(u.serviceLine?._id || u.serviceLine) === String(serviceLineId),
        );
      }
      if (tempFilters.teamFilter && tempFilters.teamFilter !== "all_teams") {
        scoped = scoped.filter(
          (u) => String(u.team?._id || u.team) === String(tempFilters.teamFilter),
        );
      }
    }

    return scoped;
  }, [users, user, isSuperAdmin, tempFilters.teamFilter]);

  const filteredMembers = useMemo(() => {
    const term = tempFilters.memberSearch.trim().toLowerCase();
    if (!term) return availableMembers;
    return availableMembers.filter((member) =>
      `${member.name || ""} ${member.employeeId || ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [availableMembers, tempFilters.memberSearch]);

  const canEditProject = (project) => {
    if (isSuperAdmin) return true;
    if (isProjectManager) {
      return (
        String(project.serviceLine?._id || project.serviceLine) ===
        String(user?.serviceLine?._id || user?.serviceLine)
      );
    }
    if (isTeamLeader) {
      return (
        String(project.team?._id || project.team) ===
        String(user?.team?._id || user?.team)
      );
    }
    return (
      String(project.createdBy?._id || project.createdBy) === String(user?._id)
    );
  };

  const canDeleteProject = (project) => {
    if (
      ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role)
    ) {
      return canEditProject(project);
    }
    return false;
  };

  const canViewProject = (project) => {
    if (isSuperAdmin) return true;
    if (isProjectManager) {
      return (
        String(project.serviceLine?._id || project.serviceLine) ===
        String(user?.serviceLine?._id || user?.serviceLine)
      );
    }
    if (isTeamLeader) {
      return (
        String(project.team?._id || project.team) ===
        String(user?.team?._id || user?.team)
      );
    }
    if (
      String(project.createdBy?._id || project.createdBy) === String(user?._id)
    )
      return true;
    return (
      String(project.serviceLine?._id || project.serviceLine) ===
      String(user?.serviceLine?._id || user?.serviceLine)
    );
  };

  const handleAddOpen = () => {
    setForm({
      ...emptyProjectForm,
      serviceLine: isSuperAdmin
        ? ""
        : user?.serviceLine?._id || user?.serviceLine || "",
      team: isSuperAdmin ? "" : user?.team?._id || user?.team || "",
      employeeId: user?.employeeId || "",
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditOpen = (project) => {
    setForm({
      clientName: project.clientName || "",
      profileName: project.profileName || "",
      orderId: project.orderId || "",
      employeeId: project.employeeId || "",
      amount: project.amount ?? "",
      startDate: toInputDateOnly(project.startDate),
      deadline: toInputDate(project.deadline),
      nextWipDeadline: toInputDate(project.nextWipDeadline),
      deliveryDate: toInputDateOnly(project.deliveryDate),
      status: project.status || "WIP",
      instructionSheet: project.instructionSheet || "",
      clientRating: project.clientRating ?? "",
      serviceLine: project.serviceLine?._id || project.serviceLine || "",
      team: project.team?._id || project.team || "",
    });
    setFormErrors({});
    setEditProject(project);
    setShowEditModal(true);
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.clientName.trim())
      nextErrors.clientName = "Client name is required.";
    if (!form.profileName.trim())
      nextErrors.profileName = "Profile name is required.";
    if (!form.orderId.trim()) nextErrors.orderId = "Order ID is required.";
    if (!form.amount || Number(form.amount) < 0) {
      nextErrors.amount = "Amount must be 0 or greater.";
    }
    if (!form.startDate) nextErrors.startDate = "Start date is required.";
    if (!form.deadline) nextErrors.deadline = "Deadline is required.";
    if (canEditWipDeadline && !form.nextWipDeadline) {
      nextErrors.nextWipDeadline = "Next WIP deadline is required.";
    }
    if (!form.status) nextErrors.status = "Status is required.";
    if (!form.instructionSheet || !form.instructionSheet.trim()) {
      nextErrors.instructionSheet = "Instruction sheet URL is required.";
    } else {
      const urlRegex = /^(https?:\/\/)([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;

      if (!urlRegex.test(form.instructionSheet.trim())) {
        nextErrors.instructionSheet = "Please enter a valid URL.";
      }
    }
    if (isSuperAdmin && !form.serviceLine) {
      nextErrors.serviceLine = "Service line is required.";
    }
    if ((isSuperAdmin || isProjectManager) && !form.team) {
      nextErrors.team = "Team is required.";
    }
    if (
      form.clientRating &&
      (Number(form.clientRating) < 1 || Number(form.clientRating) > 5)
    ) {
      nextErrors.clientRating = "Rating must be between 1 and 5.";
    }
    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const findEmployeeLabel = (employeeId, projectData = null) => {
    if (!employeeId) return "-";

    // 0. Use backend-provided employeeName if available (populated by our recent backend fix)
    if (projectData?.employeeName && projectData.employeeName !== "Unknown") {
      return `${projectData.employeeName} (${employeeId})`;
    }

    // 1. Check if employeeId is already a populated object
    if (typeof employeeId === "object" && employeeId.name) {
      return `${employeeId.name} (${employeeId.employeeId || employeeId._id})`;
    }

    // 2. Try to find in the loaded users list (for local/fresh additions)
    const match = users.find(
      (u) => u.employeeId === employeeId || u._id === employeeId,
    );
    if (match) return `${match.name} (${match.employeeId})`;

    // 3. Fallback: check if it matches the current logged-in user
    if (user && (user.employeeId === employeeId || user._id === employeeId)) {
      return `${user.name} (${user.employeeId})`;
    }

    // 4. Ultimate fallback: return a placeholder
    return `Unknown (${employeeId})`;
  };

  const getBadgeColor = (key) => {
    const palette = [
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-sky-100 text-sky-700",
      "bg-rose-100 text-rose-700",
      "bg-indigo-100 text-indigo-700",
      "bg-orange-100 text-orange-700",
    ];
    if (!key) return "bg-slate-100 text-slate-600";
    const hash = String(key)
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };

  const handleCreateProject = async () => {
    setError("");
    setFormErrors({});
    if (!validateForm()) return;
    const effectiveNextWip = canEditWipDeadline
      ? form.nextWipDeadline
      : form.deadline;
    const payload = {
      clientName: form.clientName,
      profileName: form.profileName,
      orderId: form.orderId,
      amount: Number(form.amount),
      startDate: new Date(form.startDate).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
      nextWipDeadline: new Date(effectiveNextWip).toISOString(),
      deliveryDate: form.deliveryDate
        ? new Date(form.deliveryDate).toISOString()
        : undefined,
      status: form.status,
      instructionSheet: form.instructionSheet || undefined,
      clientRating: form.clientRating ? Number(form.clientRating) : undefined,
      employeeId:
        canPickEmployee && form.employeeId ? form.employeeId : undefined,
      serviceLine: isSuperAdmin ? form.serviceLine : undefined,
      team: isSuperAdmin || isProjectManager ? form.team : undefined,
    };
    try {
      await createProjectMutation.mutateAsync(payload);
      setShowAddModal(false);
      toast.success("Project created successfully!");
    } catch (err) {
      if (err.payload?.errors?.fieldErrors) {
        const mapped = {};
        Object.entries(err.payload.errors.fieldErrors).forEach(
          ([field, msgs]) => {
            const key = field.replace("body.", "");
            mapped[key] = msgs[0];
          },
        );
        setFormErrors(mapped);
        toast.error("Please fix the errors in the form.");
      } else {
        const msg = err.message || "Something went wrong";
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const handleStatusUpdate = async (project, newStatus) => {
    if (project.status === newStatus) return;
    const previous = queryClient.getQueryData(projectsQueryKey);
    updateProjectCache(project._id, (item) => ({ ...item, status: newStatus }));
    try {
      const res = await apiRequest(`/api/projects/${project._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = normalizeProject(res, { ...project, status: newStatus });
      updateProjectCache(project._id, () => updated);
      refreshProjectQueries();
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      if (previous) {
        queryClient.setQueryData(projectsQueryKey, previous);
      }
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleUpdateProject = async () => {
    if (!editProject) return;
    setError("");
    setFormErrors({});
    if (!validateForm()) return;
    const payload = {
      clientName: form.clientName,
      profileName: form.profileName,
      orderId: form.orderId,
      amount: Number(form.amount),
      startDate: new Date(form.startDate).toISOString(),
      deliveryDate: form.deliveryDate
        ? new Date(form.deliveryDate).toISOString()
        : undefined,
      status: form.status,
      instructionSheet: form.instructionSheet || undefined,
      clientRating: form.clientRating ? Number(form.clientRating) : undefined,
    };
    const nextDeadlineIso = form.deadline
      ? new Date(form.deadline).toISOString()
      : null;
    const currentDeadlineIso = editProject?.deadline
      ? new Date(editProject.deadline).toISOString()
      : null;
    if (nextDeadlineIso && nextDeadlineIso !== currentDeadlineIso) {
      payload.deadline = nextDeadlineIso;
    }
    if (canEditWipDeadline) {
      const nextWipIso = form.nextWipDeadline
        ? new Date(form.nextWipDeadline).toISOString()
        : null;
      const currentWipIso = editProject?.nextWipDeadline
        ? new Date(editProject.nextWipDeadline).toISOString()
        : null;
      if (nextWipIso && nextWipIso !== currentWipIso) {
        payload.nextWipDeadline = nextWipIso;
      }
    }
    if (isSuperAdmin) {
      payload.serviceLine = form.serviceLine;
      payload.team = form.team;
    }
    try {
      await updateProjectMutation.mutateAsync({ id: editProject._id, payload });
      setShowEditModal(false);
      setEditProject(null);
      toast.success("Project updated successfully!");
    } catch (err) {
      if (err.payload?.errors?.fieldErrors) {
        const mapped = {};
        Object.entries(err.payload.errors.fieldErrors).forEach(
          ([field, msgs]) => {
            const key = field.replace("body.", "");
            mapped[key] = msgs[0];
          },
        );
        setFormErrors(mapped);
        toast.error("Please fix the errors in the form.");
      } else {
        const msg = err.message || "Something went wrong";
        setError(msg);
        toast.error(msg);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProject) return;
    try {
      await deleteProjectMutation.mutateAsync(deleteProject._id);
      setDeleteProject(null);
      toast.success("Project deleted successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  const handleAddRemark = async () => {
    if (!remarkInput.trim() || !activeRemarksProject) return;
    await remarkMutation.mutateAsync({
      id: activeRemarksProject._id,
      text: remarkInput.trim(),
    });
    setRemarkInput("");
  };

  const handleDeleteRemark = (remark) => {
    if (!activeRemarksProject) return;
    setDeleteRemarkTarget(remark);
  };

  const handleConfirmDeleteRemark = async () => {
    if (!activeRemarksProject || !deleteRemarkTarget?._id) return;
    setDeletingRemarkId(deleteRemarkTarget._id);
    try {
      await deleteRemarkMutation.mutateAsync({
        id: activeRemarksProject._id,
        remarkId: deleteRemarkTarget._id,
      });
      setDeleteRemarkTarget(null);
    } finally {
      setDeletingRemarkId(null);
    }
  };

  const getRemarkAuthor = (remark) => {
    const creator = remark?.createdBy;
    if (creator && typeof creator === "object") {
      return {
        name: creator.name || "Unknown",
        id: creator.employeeId || creator._id || "-",
      };
    }
    return { name: "Unknown", id: "-" };
  };

  const timelineProjects = useMemo(() => {
    if (!user) return [];
    const now = Date.now();
    let scoped = timelineData;

    if (
      (isProjectManager || isTeamLeader) &&
      timelineTeamFilter !== "all_teams"
    ) {
      scoped = scoped.filter(
        (project) =>
          String(project.team?._id || project.team) ===
          String(timelineTeamFilter),
      );
    }

    return scoped
      .map((project) => {
        const deadline = new Date(project.nextWipDeadline).getTime();
        if (Number.isNaN(deadline)) return null;
        const remainingMs = deadline - now;
        return {
          ...project,
          remainingMs,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [timelineData, user, isProjectManager, timelineTeamFilter]);

  const filteredProjects = useMemo(() => {
    if (metricsMonth === "all") return projects;
    const [y, m] = metricsMonth.split("-").map(Number);
    const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const end = new Date(y, m, 1, 0, 0, 0, 0);
    return projects.filter((p) => {
      const wip = new Date(p.nextWipDeadline);
      return wip >= start && wip < end;
    });
  }, [projects, metricsMonth]);
  const sortedProjects = useMemo(() => {
    const now = Date.now();
    return [...filteredProjects].sort((a, b) => {
      const aTime = new Date(a.deadline).getTime();
      const bTime = new Date(b.deadline).getTime();
      const aRemaining = Number.isNaN(aTime) ? Number.POSITIVE_INFINITY : aTime - now;
      const bRemaining = Number.isNaN(bTime) ? Number.POSITIVE_INFINITY : bTime - now;
      const aOverdue = aRemaining <= 0;
      const bOverdue = bRemaining <= 0;
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
      if (aOverdue && bOverdue) return bRemaining - aRemaining;
      return aRemaining - bRemaining;
    });
  }, [filteredProjects]);
  const deliveryMetrics =
    metricsMonth === "all"
      ? currentMonthMetricsResponse || emptyMetrics
      : metricsResponse || emptyMetrics;
  const cardMetrics =
    metricsMonth === "all"
      ? currentMonthMetricsResponse || emptyMetrics
      : deliveryMetrics;
  const allMonthsMetrics = allMonthsMetricsResponse || emptyMetrics;
  const wipOverview = wipOverviewResponse || {
    overdueCount: 0,
    upcoming24Count: 0,
    upcoming48Count: 0,
    nearestUpcoming: null,
  };
  const targetAmount = Number(user?.monthlyTarget ?? 1100);
  const targetStatus =
    deliveryMetrics.deliveredAmount >= targetAmount
      ? "Achieved"
      : "In Progress";
  const nearestNextWip = useMemo(() => {
    if (!deliveryMetrics.nearestNextWip) return null;
    const date = new Date(deliveryMetrics.nearestNextWip);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [deliveryMetrics.nearestNextWip]);
  const upcomingWipLabel = nearestNextWip
    ? toDisplayDate(nearestNextWip)
    : "No upcoming WIP";
  const isWipUrgent = useMemo(() => {
    if (!nearestNextWip) return false;
    const diff = nearestNextWip.getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }, [nearestNextWip]);

  const showManagerOverview = isSuperAdmin || isProjectManager;
  const nearestUpcomingProject = wipOverview.nearestUpcoming;

  const copyText = async (value, label) => {
    if (!value) return;
    const text = String(value);
    try {
      await navigator.clipboard.writeText(text);
      if (label) toast.success(`${label} copied`);
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      if (label) toast.success(`${label} copied`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {showManagerOverview ? (
        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="relative overflow-hidden border border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Next WIP Overview
                  </p>
                  <h3 className="text-2xl font-black text-slate-900">
                    Project Counts
                  </h3>
                </div>
              </div>
              {isProjectManager ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <div className="flex flex-col items-center rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-rose-600">
                      Overdue
                    </span>
                    <span className="text-lg font-black text-rose-700">
                      {wipOverview.overdueCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                      Upcoming 24h
                    </span>
                    <span className="text-lg font-black text-amber-700">
                      {wipOverview.upcoming24Count}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                      Upcoming 48h
                    </span>
                    <span className="text-lg font-black text-slate-700">
                      {wipOverview.upcoming48Count}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-col items-center rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
                      Overdue
                    </span>
                    <span className="text-xl font-black text-rose-700">
                      {wipOverview.overdueCount}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                      Upcoming 24h
                    </span>
                    <span className="text-xl font-black text-amber-700">
                      {wipOverview.upcoming24Count}
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-600">
                      Upcoming 48h
                    </span>
                    <span className="text-xl font-black text-slate-700">
                      {wipOverview.upcoming48Count}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border border-amber-200 bg-linear-to-br from-amber-50 to-white">
            <CardContent className="p-5 relative flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-amber-200 shadow-lg">
                    <Timer className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-700/60">
                      Upcoming Next WIP
                    </p>
                    <h3 className="text-2xl font-black leading-tight text-amber-900">
                      {nearestUpcomingProject?.nextWipDeadline
                        ? toDisplayDate(nearestUpcomingProject.nextWipDeadline)
                        : "No upcoming WIP"}
                    </h3>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700">
                  {nearestUpcomingProject ? (
                    <div className="space-y-1">
                      <div>{nearestUpcomingProject.profileName || "-"}</div>
                      <div className="text-xs text-slate-500">
                        {nearestUpcomingProject.clientName || "-"} • {nearestUpcomingProject.orderId || "-"}
                      </div>
                    </div>
                  ) : (
                    "No upcoming WIP deadline found."
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-6 w-6 rounded-full border-2 border-white bg-amber-200"
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTimelineModal(true)}
                  className="font-bold text-xs uppercase tracking-widest rounded-xl px-4 text-amber-700 hover:bg-amber-100"
                >
                  View Timeline <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* ─── Metrics Cards ─── */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "My Delivered",
                value: formatCurrency(cardMetrics.deliveredAmount),
                sub: `${cardMetrics.deliveredCount} projects completed`,
                icon: <CheckCircle2 className="h-5 w-5" />,
                cls: "from-emerald-500/10 to-emerald-500/5 border-emerald-100",
                text: "text-emerald-700",
                accent: "bg-emerald-500",
              },
              {
                title: "My WIP",
                value: formatCurrency(allMonthsMetrics.wipAmount),
                sub: `${allMonthsMetrics.wipCount} active projects`,
                icon: <Clock className="h-5 w-5" />,
                cls: "from-indigo-500/10 to-indigo-500/5 border-indigo-100",
                text: "text-indigo-700",
                accent: "bg-indigo-500",
              },
              {
                title: "My Revision",
                value: formatCurrency(cardMetrics.revisionAmount),
                sub: `${cardMetrics.revisionCount} needs attention`,
                icon: <RotateCcw className="h-5 w-5" />,
                cls: "from-orange-500/10 to-orange-500/5 border-orange-100",
                text: "text-orange-700",
                accent: "bg-orange-500",
              },
              {
                title: "My Cancelled",
                value: formatCurrency(cardMetrics.cancelAmount),
                sub: `${cardMetrics.cancelCount} projects dropped`,
                icon: <XCircle className="h-5 w-5" />,
                cls: "from-rose-500/10 to-rose-500/5 border-rose-100",
                text: "text-rose-700",
                accent: "bg-rose-500",
              },
            ].map((c) => (
              <Card
                key={c.title}
                className={`relative overflow-hidden border transition-all hover:scale-[1.02] bg-linear-to-br ${c.cls}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-xl ${c.accent} text-white`}>
                      {c.icon}
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${c.accent} animate-pulse`}
                    />
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600/90">
                      {c.title}
                    </p>
                    <p
                      className={`mt-1 text-3xl font-black tracking-tight ${c.text}`}
                    >
                      {c.value}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${c.accent}`} />
                      <p className="text-xs font-bold text-slate-700/80">{c.sub}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Target & WIP Summary ─── */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card className="relative overflow-hidden border border-slate-200 bg-white group">
              <div className="absolute right-0 top-0 h-32 w-32 translate-x-16 -translate-y-16 rounded-full bg-slate-50 transition-transform group-hover:scale-110" />
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
                      <Target className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        Monthly Target
                      </p>
                      <h3 className="text-3xl font-black text-slate-900">
                        {formatCurrency(targetAmount)}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Remaining
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xl font-black ${targetAmount - deliveryMetrics.deliveredAmount <= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {formatCurrency(
                          Math.max(
                            0,
                            targetAmount - deliveryMetrics.deliveredAmount,
                          ),
                        )}
                      </span>
                      <TrendingUp
                        className={`h-5 w-5 ${targetAmount - deliveryMetrics.deliveredAmount <= 0 ? "text-emerald-500" : "text-rose-400"}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="text-slate-700">
                        Delivered: {formatCurrency(deliveryMetrics.deliveredAmount)}
                      </span>
                    </div>
                    <span className="text-slate-600">
                      {Math.round(
                        (deliveryMetrics.deliveredAmount / targetAmount) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden p-1 border border-slate-200/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${targetStatus === "Achieved" ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"}`}
                      style={{
                        width: `${Math.min(100, (deliveryMetrics.deliveredAmount / targetAmount) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Badge
                      variant="outline"
                      className={`rounded-xl px-5 py-1.5 text-xs font-black uppercase tracking-wider ${targetStatus === "Achieved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-indigo-200 bg-indigo-50 text-indigo-700"}`}
                    >
                      {targetStatus}
                    </Badge>
                    {targetStatus === "Achieved" && (
                      <p className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                        GOAL ACHIEVED <TrendingUp size={14} />
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`relative overflow-hidden border group transition-all ${isWipUrgent ? "border-rose-300 bg-rose-50" : "border-amber-200 bg-linear-to-br from-amber-50 to-white"}`}
            >
              <div
                className={`absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl transition-all group-hover:scale-150 ${isWipUrgent ? "bg-rose-200/50" : "bg-amber-100/50"}`}
              />
              <CardContent className="p-6 relative flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`p-2.5 rounded-2xl text-white shadow-lg ${isWipUrgent ? "bg-rose-600 shadow-rose-200" : "bg-amber-500 shadow-amber-200"}`}
                    >
                      <Timer className="h-6 w-6" />
                    </div>
                    <div>
                      <p
                        className={`text-xs font-bold uppercase tracking-widest ${isWipUrgent ? "text-rose-700/60" : "text-amber-700/60"}`}
                      >
                        Upcoming Next WIP
                      </p>
                      <h3
                        className={`text-2xl font-black leading-tight ${isWipUrgent ? "text-rose-900" : "text-amber-900"}`}
                      >
                        {upcomingWipLabel}
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`flex items-start gap-3 p-4 rounded-2xl border shadow-sm ${isWipUrgent ? "bg-white/80 border-rose-100" : "bg-white/60 border-amber-100"}`}
                  >
                    <div
                      className={`mt-1 p-1 rounded-full ${isWipUrgent ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}
                    >
                      <TrendingUp size={12} />
                    </div>
                    <p
                      className={`text-xs font-bold leading-relaxed ${isWipUrgent ? "text-rose-800" : "text-amber-800/80"}`}
                    >
                      {isWipUrgent
                        ? "CRITICAL: Deadline is within 24 hours! Submit your work immediately."
                        : "Nearest upcoming WIP deadline. Prepare your updates to stay ahead of the schedule."}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-6 w-6 rounded-full border-2 border-white ${isWipUrgent ? "bg-rose-200" : "bg-amber-200"}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTimelineModal(true)}
                    className={`font-bold text-xs uppercase tracking-widest rounded-xl px-4 ${isWipUrgent ? "text-rose-700 hover:bg-rose-100" : "text-amber-700 hover:bg-amber-100"}`}
                  >
                    View Timeline <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      <Card className="overflow-hidden border border-border/60 shadow-sm">
        <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-sm">
              <FolderKanban size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                All Projects
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider bg-amber-100 py-1 px-2 rounded-2xl">
                  {totalProjectsCount}{" "}
                  {totalProjectsCount === 1
                    ? "Project Found"
                    : "Projects Found"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-slate-200/60 shadow-sm min-w-40">
              <Select value={metricsMonth} onValueChange={setMetricsMonth}>
                <SelectTrigger className="h-8 border-none bg-transparent px-3 text-xs font-bold text-slate-700 outline-none focus:ring-0 cursor-pointer shadow-none">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {metricsMonthOptions.map((o) => (
                    <SelectItem
                      key={o.value}
                      value={o.value}
                      className="text-xs font-semibold"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className="h-9 rounded-xl gap-2 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 hover:text-emerald-600 transition-all duration-200 shadow-sm"
              >
                <Filter size={14} /> Filter
              </Button>
              <Button
                type="button"
                onClick={handleAddOpen}
                className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 gap-2 text-xs font-semibold transition-all duration-200"
              >
                <Plus size={14} /> Add Project
              </Button>
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-semibold text-center w-12.5">
                SL
              </TableHead>
              <TableHead className="font-semibold">Client Info</TableHead>
              <TableHead className="font-semibold">Team</TableHead>
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Project Dates</TableHead>
              <TableHead className="font-semibold">Next WIP End</TableHead>
              <TableHead className="font-semibold">Days Left</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-center">
                Remarks
              </TableHead>
              <TableHead className="font-semibold">Instruction</TableHead>
              <TableHead className="font-semibold text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 13 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : sortedProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <FolderKanban size={28} />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">
                      No projects found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedProjects.map((project, index) => (
                <TableRow
                  key={project.projectId}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="text-center text-muted-foreground font-medium">
                    {(currentPage - 1) * pageSize + index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => copyText(project.profileName, "Profile name")}
                        className="text-left text-slate-700 rounded mt-0.5 hover:text-emerald-600"
                        title="Click to copy"
                      >
                        {project.profileName}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(project.clientName, "Client name")}
                        className="text-left font-bold text-slate-900 leading-tight hover:text-emerald-600"
                        title="Click to copy"
                      >
                        {project.clientName}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(project.orderId, "Order ID")}
                        className="text-left text-slate-700 rounded mt-0.5 hover:text-emerald-600"
                        title="Click to copy"
                      >
                        {project.orderId}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 text-sm leading-tight">
                        {project.team?.name || "-"}
                      </span>
                      <span className="text-[12px] text-emerald-600 font-semibold">
                        {project.serviceLine?.name || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-800 text-sm leading-tight">
                        {
                          findEmployeeLabel(project.employeeId, project).split(
                            " (",
                          )[0]
                        }
                      </span>
                      <span className="text-[12px] text-slate-500">
                        {project.employeeId || "-"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {formatCurrency(project.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-slate-500">
                          Start: {toDisplayDate(project.startDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-rose-600">
                          Deadline: {toDisplayDate(project.deadline)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold">
                    <span className="bg-amber-50 text-amber-700 py-1 px-3 rounded-2xl">
                      {toDisplayDate(project.nextWipDeadline)}
                    </span>
                  </TableCell>
                  <TableCell className="text-[13px] font-semibold text-center">
                    {project.status === "Delivered" ? (
                      <div className="rounded-2xl px-3 py-1 bg-emerald-100 text-emerald-700">
                        Done
                      </div>
                    ) : project.status === "Cancelled" ? (
                      <div className="rounded-2xl px-3 py-1 bg-rose-100 text-rose-700">
                        Cancelled
                      </div>
                    ) : (
                      (() => {
                        const remainingMs =
                          new Date(project.deadline).getTime() - Date.now();
                        const isOverdue = remainingMs <= 0;
                        const isUrgent = !isOverdue && remainingMs <= 2 * 24 * 60 * 60 * 1000;
                        const badgeClass = isOverdue
                          ? "bg-rose-100 text-rose-700"
                          : isUrgent
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-50 text-slate-700";

                        return (
                          <div className={`rounded-2xl px-3 py-1 ${badgeClass}`}>
                            <div>{formatRemaining(remainingMs)}</div>
                            {isOverdue && (
                              <div className="text-[11px] font-semibold text-rose-600">
                                {formatOverdue(Math.abs(remainingMs))}
                              </div>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </TableCell>
                  <TableCell>
                    {canEditProject(project) ? (
                      <Select
                        value={project.status}
                        onValueChange={(val) =>
                          handleStatusUpdate(project, val)
                        }
                      >
                        <SelectTrigger
                          className={`h-8 w-36 justify-between rounded-xl border px-3 text-[11px] font-black uppercase tracking-wider transition-all hover:opacity-80 ${statusStyles[project.status]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 shadow-xl">
                          {statusOptions.map((opt) => (
                            <SelectItem
                              key={opt}
                              value={opt}
                              className="text-[11px] font-bold uppercase tracking-wide"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={statusStyles[opt].split(" ")[1]}
                                >
                                  {statusIcons[opt]}
                                </span>
                                {opt}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${statusStyles[project.status]}`}
                      >
                        {project.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="relative inline-block">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="h-8 w-8 rounded-lg border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all"
                        onClick={() => {
                          setActiveRemarksProject(project);
                          setRemarkInput("");
                        }}
                        disabled={!canViewProject(project)}
                      >
                        <Plus size={14} />
                      </Button>
                      {(project.remarks || []).length > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm">
                          {project.remarks.length}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div>
                        {project.instructionSheet ? (
                          <a
                            href={project.instructionSheet}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold text-[13px] hover:underline bg-emerald-50 px-4 py-1 rounded-lg border border-emerald-100 transition-colors"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </div>
                      <div>
                        {project.clientRating ? (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                            <span className="text-slate-900 font-bold text-xs">
                              {project.clientRating}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setActiveDetailsProject(project);
                          setShowDetailsModal(true);
                        }}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        aria-label="View details"
                      >
                        <Eye size={14} />
                      </Button>

                      {canEditProject(project) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEditOpen(project)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                          aria-label="Edit project"
                        >
                          <Pencil size={14} />
                        </Button>
                      )}
                      {canDeleteProject(project) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteProject(project)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          aria-label="Delete project"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setActiveActivity(project)}
                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                        aria-label="View activity"
                      >
                        <Activity size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-4">
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
                  className={`h-9 w-9 rounded-xl text-xs font-semibold ${page === currentPage ? "bg-emerald-600 text-white hover:bg-emerald-500" : ""}`}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                disabled={!canGoNext}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                className="h-9 rounded-xl px-4 text-xs font-semibold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filter projects</DialogTitle>
            <DialogDescription>
              Refine visible projects by scope, service line, team, status, or
              order ID.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {!isTeamLeader && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  View scope
                </Label>
                <Select
                  value={tempFilters.filterMode}
                  onValueChange={(val) =>
                    setTempFilters((prev) => {
                      const next = { ...prev, filterMode: val };
                      if (isMember && val !== "service-line") {
                        next.memberFilter = "all_members";
                      }
                      return next;
                    })
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {(isSuperAdmin || isMember) && (
                      <SelectItem value="own">My Projects</SelectItem>
                    )}
                    {(isSuperAdmin || isProjectManager || isMember) && (
                      <SelectItem value="service-line">
                        My Service Line
                      </SelectItem>
                    )}
                    {(isSuperAdmin || isProjectManager || isTeamLeader) && (
                      <SelectItem value="team">My Team</SelectItem>
                    )}
                    {isSuperAdmin && (
                      <SelectItem value="all">
                        All Projects (System Wide)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isSuperAdmin &&
              (tempFilters.filterMode === "service-line" ||
                tempFilters.filterMode === "all") && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Service line
                  </Label>
                  <Select
                    value={tempFilters.serviceLineFilter}
                    onValueChange={(val) =>
                      setTempFilters((prev) => ({
                        ...prev,
                        serviceLineFilter: val,
                      }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                      <SelectValue placeholder="All service lines" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all_lines">
                        All service lines
                      </SelectItem>
                      {serviceLines.map((line) => (
                        <SelectItem key={line._id} value={line._id}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            {(tempFilters.filterMode === "team" ||
              (isMember && tempFilters.filterMode === "service-line") ||
              isTeamLeader ||
              (isProjectManager && tempFilters.filterMode === "team") ||
              (isSuperAdmin && tempFilters.filterMode === "all")) && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Team name
                  </Label>
                  <Select
                    value={tempFilters.teamFilter}
                    onValueChange={(val) =>
                      setTempFilters((prev) => ({ ...prev, teamFilter: val }))
                    }
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      <SelectItem value="all_teams">All teams</SelectItem>
                      {teams
                        .filter((team) => {
                          if (isMember) {
                            return (
                              String(
                                team.serviceLine?._id || team.serviceLine,
                              ) === String(memberServiceLineId)
                            );
                          }
                          if (isTeamLeader) {
                            return (
                              String(
                                team.serviceLine?._id || team.serviceLine,
                              ) ===
                              String(user?.serviceLine?._id || user?.serviceLine)
                            );
                          }
                          if (
                            tempFilters.serviceLineFilter &&
                            tempFilters.serviceLineFilter !== "all_lines"
                          ) {
                            return (
                              String(
                                team.serviceLine?._id || team.serviceLine,
                              ) === String(tempFilters.serviceLineFilter)
                            );
                          }
                          return true;
                        })
                        .map((team) => (
                          <SelectItem key={team._id} value={team._id}>
                            {team.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            {(isSuperAdmin || isProjectManager || isTeamLeader || (isMember && tempFilters.filterMode === "service-line")) && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Member
                </Label>
                <Select
                  value={tempFilters.memberFilter || "all_members"}
                  onValueChange={(val) =>
                    setTempFilters((prev) => ({ ...prev, memberFilter: val }))
                  }
                >
                  <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                    <SelectValue placeholder="All members" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <div className="sticky top-0 z-10 bg-white p-2">
                      <Input
                        value={tempFilters.memberSearch}
                        onChange={(e) =>
                          setTempFilters((prev) => ({
                            ...prev,
                            memberSearch: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        placeholder="Search member"
                        className="h-9 rounded-xl border-slate-200"
                      />
                    </div>
                    <SelectItem value="all_members">All members</SelectItem>
                    {filteredMembers.map((member) => (
                      <SelectItem
                        key={member._id}
                        value={member.employeeId || member._id}
                      >
                        {member.name} ({member.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    setTempFilters((prev) => ({ ...prev, statusFilter: [] }))
                  }
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-emerald-600"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((status) => {
                  const isChecked = tempFilters.statusFilter.includes(status);
                  return (
                    <label
                      key={status}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${isChecked
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-emerald-200"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 accent-emerald-600"
                        checked={isChecked}
                        onChange={(e) => {
                          setTempFilters((prev) => {
                            const next = e.target.checked
                              ? [...prev.statusFilter, status]
                              : prev.statusFilter.filter(
                                (item) => item !== status,
                              );
                            return { ...prev, statusFilter: next };
                          });
                        }}
                      />
                      {status}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Order ID</Label>
              <Input
                value={tempFilters.orderFilter}
                onChange={(e) =>
                  setTempFilters((prev) => ({
                    ...prev,
                    orderFilter: e.target.value,
                  }))
                }
                placeholder="Search order ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              className="rounded-2xl"
            >
              Reset
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-2xl"
            >
              Apply filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Add New Project
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Enter project details below to create a new record.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-3 p-6 pt-0">
            <div className="space-y-1.5">
              <Label
                htmlFor="add-profile"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Profile Name
              </Label>
              <Input
                id="add-profile"
                value={form.profileName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, profileName: e.target.value }))
                }
                placeholder="Profile Name"
                className="rounded-xl border-slate-200 transition-all hover:border-emerald-300 focus:ring-emerald-500/10"
              />
              {formErrors.profileName && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.profileName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-client"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Client Name
              </Label>
              <Input
                id="add-client"
                value={form.clientName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
                placeholder="Client Name"
                className="rounded-xl border-slate-200 transition-all hover:border-emerald-300 focus:ring-emerald-500/10"
              />
              {formErrors.clientName && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.clientName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-order"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Order ID
              </Label>
              <Input
                id="add-order"
                value={form.orderId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, orderId: e.target.value }))
                }
                placeholder="Order ID"
                className="rounded-xl border-slate-200 transition-all hover:border-emerald-300 focus:ring-emerald-500/10"
              />
              {formErrors.orderId && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.orderId}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-employee"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Employee (ID)
              </Label>
              {canPickEmployee ? (
                <Select
                  value={form.employeeId || ""}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, employeeId: val }))
                  }
                >
                  <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {users
                      .filter((item) =>
                        ["MEMBER", "PROJECT_MANAGER", "TEAM_LEADER"].includes(
                          item.role,
                        ),
                      )
                      .map((item) => (
                        <SelectItem key={item._id} value={item.employeeId}>
                          {item.name} ({item.employeeId})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={`${user?.name || ""} (${user?.employeeId || ""})`}
                  disabled
                  className="rounded-xl bg-slate-50 text-slate-500 border-slate-200"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-sl"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Service Line
              </Label>
              <Select
                value={form.serviceLine}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, serviceLine: val }))
                }
                disabled={!isSuperAdmin}
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50">
                  <SelectValue placeholder="Service Line" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {serviceLines.map((line) => (
                    <SelectItem key={line._id} value={line._id}>
                      {line.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.serviceLine && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.serviceLine}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-team"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Team
              </Label>
              <Select
                value={form.team}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, team: val }))
                }
                disabled={!isSuperAdmin && !isProjectManager}
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10 disabled:opacity-50">
                  <SelectValue placeholder="Team" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {teams
                    .filter((team) =>
                      form.serviceLine
                        ? String(team.serviceLine?._id || team.serviceLine) ===
                        String(form.serviceLine)
                        : true,
                    )
                    .map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formErrors.team && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.team}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-amount"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Amount (-20%)
              </Label>
              <Input
                id="add-amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Amount"
                className="rounded-xl border-slate-200 transition-all hover:border-emerald-300 focus:ring-emerald-500/10"
              />
              {formErrors.amount && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.amount}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-status"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.status}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-instruction"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Instruction Sheet
              </Label>
              <Input
                id="add-instruction"
                type="url"
                value={form.instructionSheet}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    instructionSheet: e.target.value,
                  }))
                }
                placeholder="URL"
                className="rounded-xl border-slate-200 transition-all hover:border-emerald-300 focus:ring-emerald-500/10"
              />
              {formErrors.instructionSheet && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.instructionSheet}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-start"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Start Date
              </Label>
              <DatePicker
                date={form.startDate}
                setDate={(d) => setForm((prev) => ({ ...prev, startDate: d }))}
              />
              {formErrors.startDate && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.startDate}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-deadline"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Deadline
              </Label>
              <DateTimePicker
                date={form.deadline}
                setDate={(d) => setForm((prev) => ({ ...prev, deadline: d }))}
              />
              {formErrors.deadline && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.deadline}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="add-delivery"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                My Delivery Date
              </Label>
              <DatePicker
                date={form.deliveryDate}
                setDate={(d) =>
                  setForm((prev) => ({ ...prev, deliveryDate: d }))
                }
              />
            </div>

            {/* Row 5 */}
            <div className="space-y-1.5">
              <Label
                htmlFor="add-rating"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Client Rating
              </Label>
              <div className="flex items-center gap-1.5 pt-2 justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={`cursor-pointer transition-all hover:scale-110 ${form.clientRating >= star ? "fill-amber-400 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]" : "text-slate-200 hover:text-amber-200"}`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, clientRating: star }))
                    }
                  />
                ))}
                {form.clientRating > 0 && (
                  <span className="ml-2 text-xs font-black text-amber-600">
                    {form.clientRating}/5
                  </span>
                )}
              </div>
            </div>
            {canEditWipDeadline ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor="add-wip"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Next WIP Deadline
                </Label>
                <DateTimePicker
                  date={form.nextWipDeadline}
                  setDate={(d) =>
                    setForm((prev) => ({ ...prev, nextWipDeadline: d }))
                  }
                  className="border-amber-200 hover:border-amber-400"
                />
                {formErrors.nextWipDeadline && (
                  <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                    {formErrors.nextWipDeadline}
                  </p>
                )}
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
          <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
            <Button
              type="button"
              onClick={() => setShowAddModal(false)}
              variant="outline"
              className="rounded-xl px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateProject}
              disabled={createProjectMutation.isPending}
              className="rounded-xl px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-200"
            >
              {createProjectMutation.isPending
                ? "Creating..."
                : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditModal && !!editProject}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false);
            setEditProject(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              Edit Project Details
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Update the information for project: {editProject?.projectId}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <div className="mt-6 grid gap-6 sm:grid-cols-3 p-6 pt-0">
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-profile"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Profile Name
              </Label>
              <Input
                id="edit-profile"
                value={form.profileName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, profileName: e.target.value }))
                }
                placeholder="Profile Name"
                className="rounded-xl border-slate-200 transition-all hover:border-amber-300 focus:ring-amber-500/10"
              />
              {formErrors.profileName && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.profileName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-client"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Client Name
              </Label>
              <Input
                id="edit-client"
                value={form.clientName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, clientName: e.target.value }))
                }
                placeholder="Client Name"
                className="rounded-xl border-slate-200 transition-all hover:border-amber-300 focus:ring-amber-500/10"
              />
              {formErrors.clientName && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.clientName}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-order"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Order ID
              </Label>
              <Input
                id="edit-order"
                value={form.orderId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, orderId: e.target.value }))
                }
                placeholder="Order ID"
                className="rounded-xl border-slate-200 transition-all hover:border-amber-300 focus:ring-amber-500/10"
              />
              {formErrors.orderId && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.orderId}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-employee"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Employee (ID)
              </Label>
              <Input
                value={form.employeeId || ""}
                disabled
                className="rounded-xl bg-slate-50 text-slate-500 border-slate-200 opacity-70"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-sl"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Service Line
              </Label>
              <Input
                value={
                  serviceLines.find((sl) => sl._id === form.serviceLine)
                    ?.name || "N/A"
                }
                disabled
                className="rounded-xl bg-slate-50 text-slate-500 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-team"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Team
              </Label>
              <Input
                value={teams.find((t) => t._id === form.team)?.name || "N/A"}
                disabled
                className="rounded-xl bg-slate-50 text-slate-500 border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-amount"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Amount (-20%)
              </Label>
              <Input
                id="edit-amount"
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                placeholder="Amount"
                className="rounded-xl border-slate-200 transition-all hover:border-amber-300 focus:ring-amber-500/10"
              />
              {formErrors.amount && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.amount}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-status"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Status
              </Label>
              <Select
                value={form.status}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, status: val }))
                }
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 bg-white px-3 text-sm transition-all hover:border-amber-300 focus:ring-2 focus:ring-amber-500/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.status && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.status}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-instruction"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Instruction Sheet
              </Label>
              <Input
                id="edit-instruction"
                type="url"
                value={form.instructionSheet}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    instructionSheet: e.target.value,
                  }))
                }
                placeholder="URL"
                className="rounded-xl border-slate-200 transition-all hover:border-amber-300 focus:ring-amber-500/10"
              />
              {formErrors.instructionSheet && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.instructionSheet}
                </p>
              )}
            </div>
            {/* Row 4 */}
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-start"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Start Date
              </Label>
              <DatePicker
                date={form.startDate}
                setDate={(d) => setForm((prev) => ({ ...prev, startDate: d }))}
              />
              {formErrors.startDate && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.startDate}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-deadline"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Deadline
              </Label>
              <DateTimePicker
                date={form.deadline}
                setDate={(d) => setForm((prev) => ({ ...prev, deadline: d }))}
              />
              {formErrors.deadline && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.deadline}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-delivery"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                My Delivery Date
              </Label>
              <DatePicker
                date={form.deliveryDate}
                setDate={(d) =>
                  setForm((prev) => ({ ...prev, deliveryDate: d }))
                }
              />
            </div>

            {/* Row 5 */}
            <div className="space-y-1.5">
              <Label
                htmlFor="edit-rating"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider"
              >
                Client Rating
              </Label>
              <div className="flex items-center gap-1.5 pt-2 justify-start">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={22}
                    className={`cursor-pointer transition-all hover:scale-110 ${form.clientRating >= star ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-200"}`}
                    onClick={() =>
                      setForm((prev) => ({ ...prev, clientRating: star }))
                    }
                  />
                ))}
                {form.clientRating > 0 && (
                  <span className="ml-2 text-xs font-black text-amber-600">
                    {form.clientRating}/5
                  </span>
                )}
              </div>
              {formErrors.clientRating && (
                <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                  {formErrors.clientRating}
                </p>
              )}
            </div>
            {canEditWipDeadline ? (
              <div className="space-y-1.5">
                <Label
                  htmlFor="edit-wip"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider"
                >
                  Next WIP Deadline
                </Label>
                <DateTimePicker
                  date={form.nextWipDeadline}
                  setDate={(d) =>
                    setForm((prev) => ({ ...prev, nextWipDeadline: d }))
                  }
                  className="border-amber-200 hover:border-amber-400"
                />
                {formErrors.nextWipDeadline && (
                  <p className="text-xs font-bold text-rose-600 px-1 animate-in fade-in slide-in-from-top-1">
                    {formErrors.nextWipDeadline}
                  </p>
                )}
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>
          <DialogFooter className="mt-8 border-t border-slate-100 pt-6">
            <Button
              type="button"
              onClick={() => setShowEditModal(false)}
              variant="outline"
              className="rounded-xl px-8 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateProject}
              disabled={updateProjectMutation.isPending}
              className="rounded-xl px-8 bg-amber-600 hover:bg-amber-500 text-white font-black shadow-lg shadow-amber-200"
            >
              {updateProjectMutation.isPending
                ? "Updating..."
                : "Update Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!activeActivity}
        onOpenChange={(open) => {
          if (!open) setActiveActivity(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activity log</DialogTitle>
            <DialogDescription>
              {activeActivity?.projectId} • {activeActivity?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {Array.isArray(activeActivity?.activity) &&
              activeActivity.activity.length > 0 ? (
              <ul className="space-y-4 py-2">
                {activeActivity.activity.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-600">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400 italic">
                No activity recorded yet.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!activeRemarksProject}
        onOpenChange={(open) => !open && setActiveRemarksProject(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden flex flex-col p-0 rounded-[2rem] border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Plus size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-900">
                  Project Remarks
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium text-xs">
                  Add or view activity logs for:{" "}
                  <span className="font-bold text-sm text-green-700">{activeRemarksProject?.profileName} / {activeRemarksProject?.clientName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            <div className="space-y-3">
              <textarea
                value={remarkInput}
                onChange={(e) => setRemarkInput(e.target.value)}
                rows={3}
                placeholder="Write a remark..."
                className="w-full rounded-2xl border border-input/50 bg-input/50 px-4 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              />
              <Button
                onClick={handleAddRemark}
                disabled={remarkMutation.isPending}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500"
              >
                {remarkMutation.isPending ? "Saving..." : "Add remark"}
              </Button>
            </div>
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Remark history
              </Label>
              <div className="max-h-[40vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {(activeRemarksProject?.remarks || []).length > 0 ? (
                  [...activeRemarksProject.remarks]
                    .sort((a, b) => {
                      const tA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const tB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return tB - tA;
                    })
                    .map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {getRemarkAuthor(item).name}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-400">
                              ID: {getRemarkAuthor(item).id}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                              {toDisplayDate(item.createdAt)}
                            </p>
                            {canDeleteRemark && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteRemark(item)}
                                disabled={deletingRemarkId === item._id}
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                aria-label="Delete remark"
                              >
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-base text-slate-700 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))
                ) : (
                  <p className="py-4 text-center text-sm text-slate-400 italic">
                    No remarks found.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteRemarkTarget}
        onOpenChange={(open) => !open && setDeleteRemarkTarget(null)}
      >
        <AlertContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Delete this remark?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. The selected remark will be removed
              permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteRemark}
              disabled={deletingRemarkId === deleteRemarkTarget?._id}
              className="rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-200"
            >
              {deletingRemarkId === deleteRemarkTarget?._id
                ? "Deleting..."
                : "Delete Remark"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteProject}
        onOpenChange={(open) => !open && setDeleteProject(null)}
      >
        <AlertContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This will permanently delete the project{" "}
              <span className="font-semibold text-slate-900">
                {deleteProject?.projectId}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-slate-900">
                {deleteProject?.clientName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="rounded-2xl border-slate-200 hover:bg-slate-50 text-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              disabled={deleteProjectMutation.isPending}
              className="rounded-2xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-200"
            >
              {deleteProjectMutation.isPending
                ? "Deleting..."
                : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertContent>
      </AlertDialog>

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-0 border-none shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/80 backdrop-blur-md border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <FolderKanban size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Project Details
                </h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">
                  ID: {activeDetailsProject?.projectId}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`rounded-xl px-4 py-1.5 text-xs font-bold ${statusStyles[activeDetailsProject?.status]}`}
            >
              {activeDetailsProject?.status}
            </Badge>
          </div>

          <div className="p-8 space-y-8">
            {/* ─── Client Info Section ─── */}
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Client Name
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {activeDetailsProject?.clientName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Profile Name
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {activeDetailsProject?.profileName}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Order ID
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {activeDetailsProject?.orderId}
                </p>
              </div>
            </div>

            {/* ─── Assignment & Metrics ─── */}
            <div className="grid grid-cols-2 gap-8 p-6 rounded-3xl bg-slate-50/50 border border-slate-100">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Assigned Team
                  </p>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className="rounded-lg bg-white shadow-sm border-slate-200 text-slate-900 font-bold px-3 py-1"
                    >
                      {activeDetailsProject?.team?.name || "-"}
                    </Badge>
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {activeDetailsProject?.serviceLine?.name}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Assigned Employee
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
                      {findEmployeeLabel(
                        activeDetailsProject?.employeeId,
                        activeDetailsProject,
                      ).charAt(0)}
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {findEmployeeLabel(
                        activeDetailsProject?.employeeId,
                        activeDetailsProject,
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Budget Amount
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(activeDetailsProject?.amount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Client Rating
                  </p>
                  <div className="flex items-center gap-1.5">
                    {activeDetailsProject?.clientRating ? (
                      <>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 w-2 rounded-full ${i < activeDetailsProject.clientRating ? "bg-amber-400" : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-slate-900">
                          {activeDetailsProject.clientRating}/5
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        No rating yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Timeline Section ─── */}
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Project Timeline
              </p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  {
                    label: "Start Date",
                    date: activeDetailsProject?.startDate,
                    icon: "bg-blue-500",
                  },
                  {
                    label: "Deadline",
                    date: activeDetailsProject?.deadline,
                    icon: "bg-rose-500",
                  },
                  {
                    label: "Next WIP",
                    date: activeDetailsProject?.nextWipDeadline,
                    icon: "bg-indigo-500",
                  },
                  {
                    label: "My Delivered",
                    date: activeDetailsProject?.deliveryDate,
                    icon: "bg-emerald-500",
                  },
                ].map((t) => (
                  <div
                    key={t.label}
                    className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${t.icon}`} />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                        {t.label}
                      </p>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900">
                      {t.date ? toDisplayDate(t.date) : "-"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ─── Resources Section ─── */}
            {activeDetailsProject?.instructionSheet && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Resources
                </p>
                <a
                  href={activeDetailsProject.instructionSheet}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-200 transition-all font-bold text-sm"
                >
                  <Eye size={16} /> Open Instruction Sheet
                </a>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showTimelineModal} onOpenChange={setShowTimelineModal}>
        <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black text-slate-900">
              Upcoming WIP Timeline
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Closest deadlines appear first.
            </DialogDescription>
            {(isProjectManager || isTeamLeader) && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                  Filter by team
                </span>
                <Select
                  value={timelineTeamFilter}
                  onValueChange={setTimelineTeamFilter}
                >
                  <SelectTrigger className="h-9 w-full max-w-xs rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold shadow-sm">
                    <SelectValue placeholder="All teams" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    <SelectItem value="all_teams">All teams</SelectItem>
                    {teams
                      .filter((team) =>
                        isTeamLeader
                          ? String(
                            team.serviceLine?._id || team.serviceLine,
                          ) ===
                          String(user?.serviceLine?._id || user?.serviceLine)
                          : true,
                      )
                      .map((team) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {timelineError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {timelineError.message || "Failed to load timeline"}
              </div>
            )}
            {timelineLoading ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                Loading timeline...
              </div>
            ) : timelineProjects.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center text-sm font-semibold text-slate-500">
                No upcoming WIP deadlines found.
              </div>
            ) : (
              timelineProjects.map((project) => {
                const isCritical = project.remainingMs <= 24 * 60 * 60 * 1000;
                const isWarning =
                  !isCritical && project.remainingMs <= 48 * 60 * 60 * 1000;
                const urgencyClasses = isCritical
                  ? "bg-rose-100 text-rose-700 border-rose-200"
                  : isWarning
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200";
                const containerClasses = isCritical
                  ? "border-rose-400 bg-rose-50"
                  : isWarning
                    ? "border-amber-400 bg-amber-50"
                    : "border-slate-100 bg-white";

                return (
                  <div
                    key={project._id || project.projectId}
                    className={`rounded-3xl border p-5 shadow-sm ${containerClasses}`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                          <span>Profile Name:</span>
                          <span className="text-slate-900">
                            {project.profileName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                          <span>Client Name:</span>
                          <span className="text-slate-900">
                            {project.clientName}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                          <span>Order ID:</span>
                          <span className="text-slate-900">
                            {project.orderId}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:items-center">
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-black uppercase tracking-widest ${urgencyClasses}`}
                        >
                          {isCritical
                            ? "Critical"
                            : isWarning
                              ? "Warning"
                              : "Upcoming"}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-black uppercase tracking-widest ${urgencyClasses}`}
                        >
                          {formatRemaining(project.remainingMs)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-4">
                      <div>
                        <span className="font-bold text-slate-900">Team:</span>{" "}
                        {project.team?.name || "-"}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          Employee:
                        </span>{" "}
                        {
                          findEmployeeLabel(project.employeeId, project).split(
                            " (",
                          )[0]
                        }
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          Next WIP:
                        </span>{" "}
                        {toDisplayDate(project.nextWipDeadline)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">
                          Deadline:
                        </span>{" "}
                        {toDisplayDate(project.deadline)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTimelineModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
