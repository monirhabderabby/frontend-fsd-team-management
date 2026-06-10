import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import { apiRequest } from "../utils/apiClient.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateOrgData } from "../lib/queryInvalidation.js";
import { Card, CardContent } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Skeleton } from "@/components/ui/skeleton.jsx";

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

const ServiceLines = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryKey = ["serviceLines", "summary"];
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey,
    queryFn: () => apiRequest("/api/service-lines/summary"),
    select: (payload) => normalizeList(payload, ["summary", "serviceLines"]),
  });

  useEffect(() => {
    if (queryError) {
      setError(queryError.message || "Failed to load service lines");
    }
  }, [queryError]);

  const normalizeItem = (payload, fallback) => {
    if (!payload) return fallback;
    if (payload.serviceLine) return payload.serviceLine;
    if (payload.data) return payload.data;
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest("/api/service-lines", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      setError("");
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey) || [];
      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        _id: tempId,
        name: payload.name,
        status: "active",
        teamCount: 0,
        memberCount: 0,
        __optimistic: true,
      };
      queryClient.setQueryData(queryKey, [optimistic, ...previous]);
      return { previous, tempId };
    },
    onError: (err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setError(err.message || "Failed to create service line");
    },
    onSuccess: (payload, _vars, context) => {
      const created = normalizeItem(payload);
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((item) => (item._id === context?.tempId ? created : item))
      );
      invalidateOrgData(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiRequest(`/api/service-lines/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      ),
    onMutate: async ({ id, payload }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey) || [];
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((item) =>
          item._id === id ? { ...item, ...payload } : item
        )
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setError(err.message || "Failed to update service line");
    },
    onSuccess: (payload) => {
      const updated = normalizeItem(payload);
      if (!updated?._id) return;
      queryClient.setQueryData(queryKey, (current = []) =>
        current.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
      );
      invalidateOrgData(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/service-lines/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      setError("");
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey) || [];
      queryClient.setQueryData(queryKey, (current = []) =>
        current.filter((item) => item._id !== id)
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      setError(err.message || "Failed to delete service line");
    },
    onSuccess: () => {
      invalidateOrgData(queryClient);
    },
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    try {
      await createMutation.mutateAsync({ name: name.trim() });
      setName("");
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Failed to create service line");
    }
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditName(item.name);
    setEditStatus(item.status || "active");
  };

  const handleUpdate = async () => {
    if (!editName.trim() || !editItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem._id,
        payload: {
          name: editName.trim(),
          status: editStatus,
        },
      });
      setEditItem(null);
    } catch (err) {
      setError(err.message || "Failed to update service line");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete service line");
    }
  };

  const { totalTeams, totalMembers } = useMemo(() => ({
    totalTeams: items.reduce((sum, i) => sum + (i.teamCount || 0), 0),
    totalMembers: items.reduce((sum, i) => sum + (i.memberCount || 0), 0),
  }), [items]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero Banner ─── */}
      <header className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-400/20 blur-3xl animate-float" />
        <div className="absolute -left-24 bottom-0 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-10 rounded-full bg-emerald-400" />
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-300/80 font-bold">Service Line Control</p>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Service Lines</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300/80">
              Create, manage, and track service line capacity across your organization.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
              {items.length} Service Lines
            </Badge>
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={createMutation.isPending}
              className="rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20 gap-2"
            >
              <Plus size={16} />
              Add Service Line
            </Button>
          </div>
        </div>
              disabled={createMutation.isPending}
      </header>

              {createMutation.isPending ? "Saving..." : "Save Service Line"}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Total Service Lines", value: items.length, icon: ShieldCheck, color: "emerald" },
          { title: "Total Teams", value: totalTeams, icon: Layers, color: "indigo" },
          { title: "Total Members", value: totalMembers, icon: Users, color: "amber" },
        ].map((card) => (
          <Card key={card.title} className={`border shadow-sm transition-transform hover:scale-[1.02] border-${card.color}-200/60 bg-linear-to-br from-${card.color}-50 to-${card.color}-100/40`}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${card.color}-500/15 text-${card.color}-600`}>
                  <card.icon size={20} />
                </div>
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
        <div className="p-5 border-b border-border/60 flex items-center justify-between bg-linear-to-r from-slate-50/80 to-white">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <ShieldCheck size={18} />
            </div>
            <h2 className="text-base font-bold text-foreground">All Service Lines</h2>
          </div>
          <Badge variant="secondary" className="text-xs font-semibold">
            {items.length} {items.length === 1 ? "entry" : "entries"}
          </Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="font-semibold">Service Line</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Teams</TableHead>
              <TableHead className="font-semibold">Members</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                      <ShieldCheck size={28} />
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">No service lines yet</p>
                    <p className="text-xs text-muted-foreground">Click "Add Service Line" to create one.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id} className="group">
                  <TableCell className="font-semibold text-foreground">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 capitalize">
                      {item.status || "active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Layers size={15} className="text-indigo-500" />
                      <span className="font-semibold text-foreground">{item.teamCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users size={15} className="text-amber-500" />
                      <span className="font-semibold text-foreground">{item.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOpen(item)}
                        className="gap-1.5 rounded-xl border-slate-200"
                      >
                        <Plus className="rotate-45" size={14} />
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteTarget(item)}
                        className="gap-1.5 rounded-xl"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ─── Add Dialog ─── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Service Line</DialogTitle>
            <DialogDescription>Create a new service line to organize teams and members.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sl-name">Service Line Name</Label>
              <Input
                id="sl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CMS, SEO, UI/UX"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreate} className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white">
              Save Service Line
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Service Line</DialogTitle>
            <DialogDescription>Update the details for this service line.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sl-name">Service Line Name</Label>
              <Input
                id="edit-sl-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. CMS, SEO, UI/UX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sl-status">Status</Label>
              <select
                id="edit-sl-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="h-9 w-full rounded-3xl border border-input/50 bg-input/50 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white"
            >
              {updateMutation.isPending ? "Updating..." : "Update Service Line"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Line</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(deleteTarget?._id)}
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

export default ServiceLines;
