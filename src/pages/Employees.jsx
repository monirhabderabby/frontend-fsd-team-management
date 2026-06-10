/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, Trash2, UserCog, Users, ShieldCheck, Check, X } from "lucide-react";
import { apiRequest } from "../utils/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateUserData } from "../lib/queryInvalidation.js";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";
import { Separator } from "@/components/ui/separator.jsx";
import toast from "react-hot-toast";

const roleLabels = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  TEAM_LEADER: "Team Leader",
  MEMBER: "Member",
};

const approvalVariant = {
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
};

const verifyVariant = {
  true: "border-emerald-200 bg-emerald-50 text-emerald-700",
  false: "border-rose-200 bg-rose-50 text-rose-700",
};

const statusVariant = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-rose-200 bg-rose-50 text-rose-700",
};

const getId = (value) =>
  value && typeof value === "object" ? value._id : value;

const selectClass = "h-9 w-full rounded-3xl border border-input/50 bg-input/50 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 outline-none disabled:cursor-not-allowed disabled:opacity-50";

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

const Employees = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serviceLines, setServiceLines] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [pageMeta, setPageMeta] = useState({ page: 1, totalPages: 1, total: 0, approvedCount: 0, pendingCount: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editForm, setEditForm] = useState({
    approvalStatus: "pending",
    status: "active",
    role: "",
    serviceLine: "",
    team: "",
    monthlyTarget: 1100,
    name: "",
    email: "",
    employeeId: "",
    phone: "",
    officeEmail: "",
    dateOfBirth: "",
    joinDate: "",
    presentAddress: "",
    permanentAddress: "",
    profileImage: "",
    emailVerified: false,
    password: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const canApprove = useMemo(
    () => ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role),
    [user]
  );
  const canManageStatus = useMemo(
    () => ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role),
    [user]
  );
  const canDelete = canManageStatus;
  const canAssignRole = useMemo(
    () => ["SUPER_ADMIN", "PROJECT_MANAGER"].includes(user?.role),
    [user]
  );
  const canEditTarget = useMemo(
    () => ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER"].includes(user?.role),
    [user]
  );
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isProjectManager = user?.role === "PROJECT_MANAGER";
  const userId = user?._id || user?.id;
  const canEdit = canApprove || canManageStatus || canAssignRole;
  const allowedRoles = useMemo(() => {
    if (user?.role === "SUPER_ADMIN") {
      return ["SUPER_ADMIN", "PROJECT_MANAGER", "TEAM_LEADER", "MEMBER"];
    }
    if (user?.role === "PROJECT_MANAGER") {
      return ["TEAM_LEADER", "MEMBER"];
    }
    return [];
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const usersQueryKey = ["users", "list", currentPage, searchTerm];
  const normalizeUsersResponse = (payload) => {
    const list = normalizeList(payload, ["users"]);
    const meta = payload?.meta || {
      page: currentPage,
      totalPages: 1,
      total: list.length,
      approvedCount: 0,
      pendingCount: 0,
    };
    return { items: list, meta };
  };

  const {
    data: usersResponse,
    isLoading: loading,
    error: usersError,
  } = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      return apiRequest(`/api/users?page=${currentPage}&limit=${pageSize}${searchParam}`);
    },
    select: normalizeUsersResponse,
  });

  const items = usersResponse?.items || [];

  const projectManagerByServiceLine = useMemo(() => {
    const map = new Map();
    items
      .filter((employee) => employee.role === "PROJECT_MANAGER")
      .forEach((employee) => {
        const serviceLineId = getId(employee.serviceLine);
        if (serviceLineId) {
          map.set(serviceLineId, employee);
        }
      });
    return map;
  }, [items]);

  const editServiceLineId = editForm.serviceLine;
  const projectManagerConflict = useMemo(() => {
    if (!editUser || editForm.role !== "PROJECT_MANAGER" || !editServiceLineId) {
      return null;
    }
    const existing = projectManagerByServiceLine.get(editServiceLineId);
    if (!existing) return null;
    return existing._id !== editUser._id ? existing : null;
  }, [editForm.role, editServiceLineId, editUser, projectManagerByServiceLine]);

  const { data: slData, error: slError } = useQuery({
    queryKey: ["serviceLines", "list"],
    queryFn: () => apiRequest("/api/service-lines"),
    enabled: canAssignRole,
  });

  useEffect(() => {
    if (slData) {
      setServiceLines(normalizeList(slData, ["serviceLines"]));
    }
  }, [slData]);

  const { data: teamsData, error: teamsError } = useQuery({
    queryKey: ["teams", "list"],
    queryFn: () => apiRequest("/api/teams"),
    enabled: canAssignRole,
  });

  useEffect(() => {
    if (teamsData) {
      setTeams(normalizeList(teamsData, ["teams"]));
    }
  }, [teamsData]);

  useEffect(() => {
    const err = usersError || slError || teamsError;
    if (err) {
      setError(err.message || "Failed to load employees");
    }
  }, [usersError, slError, teamsError]);

  const updateUserCache = (id, updater) => {
    queryClient.setQueryData(usersQueryKey, (current) => {
      const items = Array.isArray(current?.items) ? current.items : [];
      return {
        ...(current || {}),
        items: items.map((item) => (item._id === id ? updater(item) : item)),
      };
    });
  };

  const approveMutation = useMutation({
    mutationFn: ({ id, approvalStatus }) =>
      apiRequest(`/api/users/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ approvalStatus }),
      }),
    onMutate: async ({ id, approvalStatus }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      updateUserCache(id, (item) => ({ ...item, approvalStatus }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to update approval status");
      toast.error(err.message || "Failed to update approval status");
    },
    onSuccess: (response, _vars, context) => {
      const updated = response?.user;
      if (updated?._id) {
        updateUserCache(updated._id, (item) => ({ ...item, ...updated }));
      } else if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      invalidateUserData(queryClient);
      toast.success("Approval status updated.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      apiRequest(`/api/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onMutate: async ({ id, status }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      updateUserCache(id, (item) => ({ ...item, status }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to update status");
      toast.error(err.message || "Failed to update status");
    },
    onSuccess: () => {
      invalidateUserData(queryClient);
      toast.success("Status updated.");
    },
  });

  const targetMutation = useMutation({
    mutationFn: ({ id, monthlyTarget }) =>
      apiRequest(`/api/users/${id}/target`, {
        method: "PATCH",
        body: JSON.stringify({ monthlyTarget }),
      }),
    onMutate: async ({ id, monthlyTarget }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      updateUserCache(id, (item) => ({ ...item, monthlyTarget }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to update target");
      toast.error(err.message || "Failed to update target");
    },
    onSuccess: () => {
      invalidateUserData(queryClient);
      toast.success("Target updated.");
    },
  });

  const assignmentMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiRequest(`/api/users/${id}/assign`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: async ({ id, payload }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      const assignedServiceLine = serviceLines.find((line) => line._id === payload.serviceLine);
      const assignedTeam = teams.find((team) => team._id === payload.team);
      updateUserCache(id, (item) => ({
        ...item,
        role: payload.role ?? item.role,
        serviceLine: assignedServiceLine || payload.serviceLine || item.serviceLine,
        team: assignedTeam || payload.team || item.team,
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to update assignment");
      toast.error(err.message || "Failed to update assignment");
    },
    onSuccess: () => {
      invalidateUserData(queryClient);
      toast.success("Assignment updated.");
    },
  });

  const adminUpdateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiRequest(`/api/users/${id}/admin`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onMutate: async ({ id, payload }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      const assignedServiceLine = serviceLines.find((line) => line._id === payload.serviceLine);
      const assignedTeam = teams.find((team) => team._id === payload.team);
      updateUserCache(id, (item) => ({
        ...item,
        ...payload,
        serviceLine: assignedServiceLine || payload.serviceLine || item.serviceLine,
        team: assignedTeam || payload.team || item.team,
      }));
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to update user");
      toast.error(err.message || "Failed to update user");
    },
    onSuccess: (response, _vars, context) => {
      const updated = response?.user;
      if (updated?._id) {
        updateUserCache(updated._id, (item) => ({ ...item, ...updated }));
      } else if (context?.previous) {
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      invalidateUserData(queryClient);
      toast.success("Employee updated.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/users/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: usersQueryKey });
      const previous = queryClient.getQueryData(usersQueryKey);
      queryClient.setQueryData(usersQueryKey, (current) => {
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
        queryClient.setQueryData(usersQueryKey, context.previous);
      }
      setError(err.message || "Failed to delete employee");
      toast.error(err.message || "Failed to delete employee");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users", "list"] });
      invalidateUserData(queryClient);
      toast.success("Employee deleted.");
    },
  });

  const removeUser = async (id) => {
    await deleteMutation.mutateAsync(id);
    setDeleteTarget(null);
  };

  const handleQuickApprove = async (id, status) => {
    try {
      await approveMutation.mutateAsync({ id, approvalStatus: status });
    } catch (err) {
      setError(err.message || "Failed to update approval status");
      toast.error(err.message || "Failed to update approval status");
    }
  };

  const buildAssignmentPayload = (form) => {
    const payload = { role: form.role };
    if (form.serviceLine) payload.serviceLine = form.serviceLine;
    if (form.team) payload.team = form.team;
    return payload;
  };

  const handleEditOpen = (employee) => {
    setEditUser(employee);
    setEditForm({
      approvalStatus: employee.approvalStatus || "pending",
      status: employee.status || "active",
      role: employee.role || "",
      serviceLine: getId(employee.serviceLine) || "",
      team: getId(employee.team) || "",
      monthlyTarget:
        typeof employee.monthlyTarget === "number" ? employee.monthlyTarget : 1100,
      name: employee.name || "",
      email: employee.email || "",
      employeeId: employee.employeeId || "",
      phone: employee.phone || "",
      officeEmail: employee.officeEmail || "",
      dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "",
      joinDate: employee.joinDate ? employee.joinDate.slice(0, 10) : "",
      presentAddress: employee.presentAddress || "",
      permanentAddress: employee.permanentAddress || "",
      profileImage: employee.profileImage || "",
      emailVerified: !!employee.emailVerified,
      password: "",
    });
  };

  const buildAdminPayload = (form, employee) => {
    const payload = {};
    const compare = (key, value, current) => {
      if (value !== current) payload[key] = value;
    };

    compare("name", form.name, employee.name || "");
    compare("email", form.email, employee.email || "");
    compare("employeeId", form.employeeId, employee.employeeId || "");
    compare("phone", form.phone || "", employee.phone || "");
    compare("officeEmail", form.officeEmail || "", employee.officeEmail || "");
    compare("profileImage", form.profileImage || "", employee.profileImage || "");

    compare("dateOfBirth", form.dateOfBirth || "", employee.dateOfBirth ? employee.dateOfBirth.slice(0, 10) : "");
    compare("joinDate", form.joinDate || "", employee.joinDate ? employee.joinDate.slice(0, 10) : "");
    compare("presentAddress", form.presentAddress || "", employee.presentAddress || "");
    compare("permanentAddress", form.permanentAddress || "", employee.permanentAddress || "");

    compare("emailVerified", !!form.emailVerified, !!employee.emailVerified);
    compare("approvalStatus", form.approvalStatus, employee.approvalStatus || "pending");
    compare("status", form.status, employee.status || "active");
    compare("role", form.role, employee.role || "");

    const currentServiceLine = getId(employee.serviceLine) || "";
    const currentTeam = getId(employee.team) || "";
    compare("serviceLine", form.serviceLine || "", currentServiceLine);
    compare("team", form.team || "", currentTeam);

    const currentTarget = typeof employee.monthlyTarget === "number" ? employee.monthlyTarget : 1100;
    const nextTarget = Number(form.monthlyTarget);
    if (!Number.isNaN(nextTarget) && nextTarget !== currentTarget) {
      payload.monthlyTarget = nextTarget;
    }

    if (form.password) {
      payload.password = form.password;
    }

    return payload;
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setError("");
    setIsUpdating(true);

    try {
      if (isSuperAdmin) {
        const payload = buildAdminPayload(editForm, editUser);
        if (Object.keys(payload).length > 0) {
          await adminUpdateMutation.mutateAsync({ id: editUser._id, payload });
        }
        setEditUser(null);
        return;
      }

      if (canAssignRole) {
        if (editForm.role === "PROJECT_MANAGER" && isSuperAdmin && !editForm.serviceLine) {
          setError("Service line is required for Project Manager.");
          setIsUpdating(false);
          return;
        }
        if (editForm.role === "TEAM_LEADER" && !editForm.team) {
          setError("Team is required for Team Leader.");
          setIsUpdating(false);
          return;
        }
        if (projectManagerConflict) {
          setError("Project Manager already exists for this service line.");
          setIsUpdating(false);
          return;
        }
      }

      const updates = [];
      if (canApprove) updates.push(approveMutation.mutateAsync({
        id: editUser._id,
        approvalStatus: editForm.approvalStatus,
      }));
      if (canManageStatus) updates.push(statusMutation.mutateAsync({
        id: editUser._id,
        status: editForm.status,
      }));
      if (canEditTarget) updates.push(targetMutation.mutateAsync({
        id: editUser._id,
        monthlyTarget: Number(editForm.monthlyTarget),
      }));
      if (canAssignRole) updates.push(assignmentMutation.mutateAsync({
        id: editUser._id,
        payload: buildAssignmentPayload(editForm),
      }));

      if (updates.length > 0) {
        await Promise.all(updates);
      }
      setEditUser(null);
    } catch (err) {
      setError(err.message || "Failed to update employee");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (usersResponse?.meta) {
      setPageMeta(usersResponse.meta);
    }
  }, [usersResponse]);

  const approvedCount = Number(pageMeta.approvedCount || 0);
  const pendingCount = Number(pageMeta.pendingCount || 0);
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

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Indicator Cards ─── */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { title: "Total Employees", value: pageMeta.total || 0, icon: Users, color: "violet" },
          { title: "Approved Staff", value: approvedCount, icon: ShieldCheck, color: "emerald" },
          { title: "Pending Requests", value: pendingCount, icon: UserCog, color: "amber" },
        ].map((c) => (
          <Card key={c.title} className="rounded-[2rem] border-none bg-white p-1 ring-1 ring-slate-100">
            <CardContent className="flex items-center gap-5 p-6">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${c.color === "violet" ? "bg-violet-50 text-violet-600" :
                  c.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                    "bg-amber-50 text-amber-600"
                }`}>
                <c.icon size={28} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {c.title}
                </p>
                <p className="text-3xl font-black tracking-tight text-slate-900 mt-1">
                  {c.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}

      {/* ─── Table ─── */}
      <Card className="overflow-hidden border border-border/60 shadow-sm">
        <div className="p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-linear-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center text-white">
              <UserCog size={18} />
            </div>
            <h2 className="text-base font-bold text-foreground">All Employees</h2>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or ID"
              className="h-9 w-56 rounded-full"
            />
            <Badge variant="secondary" className="text-xs font-semibold">
              {pageMeta.total || 0} {(pageMeta.total || 0) === 1 ? "employee" : "employees"}
            </Badge>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-semibold">Employee</TableHead>
              <TableHead className="font-semibold">Approval</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Role</TableHead>
              <TableHead className="font-semibold">Service Line</TableHead>
              <TableHead className="font-semibold">Team</TableHead>
              <TableHead className="font-semibold">Target</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <Users size={28} />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">No employees found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((employee) => (
                <TableRow key={employee._id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200">
                        {employee.profileImage ? (
                          <img src={employee.profileImage} alt={employee.name} className="w-full h-full object-cover" />
                        ) : (
                          employee.name?.charAt(0)?.toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {employee.name}{" "}
                          <span className="text-xs text-muted-foreground font-normal">({employee.employeeId})</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{employee.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${approvalVariant[employee.approvalStatus] || ""}`}>
                      {employee.approvalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${verifyVariant[!!employee.emailVerified]}`}>
                      {employee.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize ${statusVariant[employee.status] || ""}`}>
                      {employee.status || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">{roleLabels[employee.role] || employee.role}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{employee.serviceLine?.name || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{employee.team?.name || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-semibold text-foreground">${employee.monthlyTarget ?? 1100}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setActiveUser(employee)}
                        className="rounded-xl"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </Button>

                      {employee.approvalStatus !== "approved" ? (
                        employee.emailVerified ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleQuickApprove(employee._id, "approved")}
                              disabled={approveMutation.isPending}
                              className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              title="Approve"
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleQuickApprove(employee._id, "rejected")}
                              disabled={approveMutation.isPending}
                              className="rounded-xl border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                              title="Reject"
                            >
                              <X size={14} />
                            </Button>
                            {isSuperAdmin && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  onClick={() => handleEditOpen(employee)}
                                  className="rounded-xl"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  onClick={() => setDeleteTarget(employee)}
                                  className="rounded-xl"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="px-2 py-1 rounded-lg bg-red-100 border border-red-200">
                              <span className="text-[11px] text-red-500 tracking-tighter">Pending Verification</span>
                            </div>
                            {isSuperAdmin && (
                              <>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  onClick={() => handleEditOpen(employee)}
                                  className="rounded-xl"
                                  title="Edit"
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon-sm"
                                  onClick={() => setDeleteTarget(employee)}
                                  className="rounded-xl"
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </>
                            )}
                          </>
                        )
                      ) : (
                        <>
                          {canEdit && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => handleEditOpen(employee)}
                              className="rounded-xl"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => setDeleteTarget(employee)}
                              className="rounded-xl"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </>
                      )}
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
                  className={`h-9 w-9 rounded-xl text-xs font-semibold ${page === currentPage ? "bg-violet-600 text-white hover:bg-violet-500" : ""}`}
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

      {/* ─── View Dialog ─── */}
      <Dialog open={!!activeUser} onOpenChange={(open) => !open && setActiveUser(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-3xl">
          <DialogHeader className="pb-4 border-b border-slate-50">
            <DialogTitle className="text-2xl font-black text-slate-900">Employee Profile</DialogTitle>
            <DialogDescription className="text-slate-400 font-medium">Complete identity and access details.</DialogDescription>
          </DialogHeader>
          {activeUser && (
            <div className="space-y-8 py-6">
              {/* Header Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-[2rem] bg-linear-to-br from-violet-500 to-purple-600 p-1 shadow-xl shadow-violet-200">
                    <div className="h-full w-full rounded-[1.8rem] bg-white flex items-center justify-center text-violet-500 font-black text-3xl overflow-hidden">
                      {activeUser.profileImage ? (
                        <img src={activeUser.profileImage} alt={activeUser.name} className="w-full h-full object-cover" />
                      ) : (
                        activeUser.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-4 border-white flex items-center justify-center shadow-md ${activeUser.approvalStatus === "approved" ? "bg-emerald-500" : "bg-amber-500"
                    }`}>
                    {activeUser.approvalStatus === "approved" ? <ShieldCheck className="text-white" size={16} /> : <UserCog className="text-white" size={16} />}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl font-black text-slate-900 truncate">{activeUser.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant="outline" className="rounded-lg border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      ID: {activeUser.employeeId}
                    </Badge>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${approvalVariant[activeUser.approvalStatus]}`}>
                      {activeUser.approvalStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                {/* Personal Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 rounded-full bg-violet-500" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personal Details</h4>
                  </div>

                  <div className="grid gap-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Primary Email</p>
                      <p className="font-bold text-slate-700 text-sm">{activeUser.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Personal Phone</p>
                      <p className="font-bold text-slate-700 text-sm">{activeUser.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Date of Birth</p>
                      <p className="font-bold text-slate-700 text-sm">
                        {activeUser.dateOfBirth ? new Date(activeUser.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Present Address</p>
                      <p className="font-bold text-slate-700 text-sm leading-relaxed">{activeUser.presentAddress || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Permanent Address</p>
                      <p className="font-bold text-slate-700 text-sm leading-relaxed">{activeUser.permanentAddress || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-1 w-8 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Employment Details</h4>
                  </div>

                  <div className="grid gap-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Current Role</p>
                        <p className="font-bold text-slate-700 text-sm">{roleLabels[activeUser.role] || activeUser.role}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Join Date</p>
                        <p className="font-bold text-slate-700 text-sm">
                          {activeUser.joinDate ? new Date(activeUser.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Office Email</p>
                      <p className="font-bold text-slate-700 text-sm">{activeUser.officeEmail || "Not assigned"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Service Line</p>
                        <p className="font-bold text-slate-700 text-sm">{activeUser.serviceLine?.name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Team Name</p>
                        <p className="font-bold text-slate-700 text-sm">{activeUser.team?.name || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Monthly Target</p>
                        <p className="text-lg font-black text-emerald-600">${activeUser.monthlyTarget ?? 1100}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Verification</p>
                        <Badge variant="outline" className={`mt-1 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${verifyVariant[!!activeUser.emailVerified]}`}>
                          {activeUser.emailVerified ? "Verified" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details and permissions.</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg overflow-hidden">
                  {editUser.profileImage ? (
                    <img src={editUser.profileImage} alt={editUser.name} className="w-full h-full object-cover" />
                  ) : (
                    editUser.name?.charAt(0)?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{editUser.name}</p>
                  <p className="text-xs text-muted-foreground">{editUser.email}</p>
                </div>
              </div>

              <Separator />

              {isSuperAdmin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input
                        value={editForm.employeeId}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, employeeId: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Office Email</Label>
                      <Input
                        type="email"
                        value={editForm.officeEmail}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, officeEmail: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Image URL</Label>
                      <Input
                        value={editForm.profileImage}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, profileImage: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date of Birth</Label>
                      <Input
                        type="date"
                        value={editForm.dateOfBirth}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Join Date</Label>
                      <Input
                        type="date"
                        value={editForm.joinDate}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, joinDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Present Address</Label>
                    <Input
                      value={editForm.presentAddress}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, presentAddress: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Permanent Address</Label>
                    <Input
                      value={editForm.permanentAddress}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, permanentAddress: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Verified</Label>
                      <select
                        value={editForm.emailVerified ? "true" : "false"}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            emailVerified: e.target.value === "true",
                          }))
                        }
                        className={selectClass}
                      >
                        <option value="true">Verified</option>
                        <option value="false">Unverified</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Password (optional)</Label>
                      <Input
                        type="password"
                        value={editForm.password}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Set new password"
                      />
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {(canApprove || canManageStatus) && (
                <div className="grid grid-cols-2 gap-4">
                  {canApprove && (
                    <div className="space-y-2">
                      <Label>Approval</Label>
                      <select
                        value={editForm.approvalStatus}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, approvalStatus: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  )}
                  {canManageStatus && (
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        value={editForm.status}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {canEditTarget && (
                <div className="space-y-2">
                  <Label>Monthly Target ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editForm.monthlyTarget}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, monthlyTarget: e.target.value }))}
                  />
                </div>
              )}

              {canAssignRole && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <select
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            role: e.target.value,
                            team: e.target.value === "PROJECT_MANAGER" ? "" : prev.team,
                          }))
                        }
                        className={selectClass}
                        disabled={editUser?._id === userId}
                      >
                        {allowedRoles.map((role) => (
                          <option key={role} value={role}>{roleLabels[role] || role}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Service Line</Label>
                      <select
                        value={isProjectManager ? getId(user?.serviceLine) || "" : editForm.serviceLine}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, serviceLine: e.target.value, team: "" }))
                        }
                        className={selectClass}
                        disabled={isProjectManager}
                      >
                        <option value="">Select service line</option>
                        {serviceLines.map((line) => (
                          <option key={line._id} value={line._id}>{line.name}</option>
                        ))}
                      </select>
                      {projectManagerConflict && (
                        <p className="text-xs text-rose-600">PM already exists for this service line.</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <select
                      value={editForm.team}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, team: e.target.value }))}
                      className={selectClass}
                      disabled={editForm.role === "PROJECT_MANAGER"}
                    >
                      <option value="">Select team</option>
                      {teams
                        .filter((team) => {
                          const serviceLineId =
                            user?.role === "PROJECT_MANAGER"
                              ? user?.serviceLine?._id
                              : editForm.serviceLine;
                          if (!serviceLineId) return true;
                          return (
                            String(team.serviceLine?._id || team.serviceLine) === String(serviceLineId)
                          );
                        })
                        .map((team) => (
                          <option key={team._id} value={team._id}>{team.name}</option>
                        ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type="button" onClick={handleEditSave} disabled={isUpdating} className="w-full rounded-2xl">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeUser(deleteTarget?._id)}
              disabled={deleteMutation.isPending}
              className="bg-rose-600 hover:bg-rose-500"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Employees;
