/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Layers, Pencil, Plus, Trash2, Users } from "lucide-react";
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

const Teams = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", serviceLine: "" });
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", serviceLine: "", status: "active" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const teamsQueryKey = ["teams", "summary"];
  const serviceLinesQueryKey = ["serviceLines", "list"];
  const {
    data: items = [],
    isLoading: loading,
    error: teamsError,
  } = useQuery({
    queryKey: teamsQueryKey,
    queryFn: () => apiRequest("/api/teams/summary"),
    select: (payload) => normalizeList(payload, ["summary", "teams"]),
  });

  const { data: serviceLines = [], error: slError } = useQuery({
    queryKey: serviceLinesQueryKey,
    queryFn: () => apiRequest("/api/service-lines"),
    select: (payload) => normalizeList(payload, ["serviceLines"]),
  });

  useEffect(() => {
    const err = teamsError || slError;
    if (err) {
      setError(err.message || "Failed to load data");
    }
  }, [teamsError, slError]);

  const normalizeItem = (payload, fallback) => {
    if (!payload) return fallback;
    if (payload.team) return payload.team;
    if (payload.data) return payload.data;
    return payload;
  };

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest("/api/teams", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: teamsQueryKey });
      const previous = queryClient.getQueryData(teamsQueryKey) || [];
      const tempId = `temp-${Date.now()}`;
      const selectedLine = serviceLines.find((line) => line._id === payload.serviceLine);
      const optimistic = {
        _id: tempId,
        name: payload.name,
        serviceLine: selectedLine || payload.serviceLine,
        status: "active",
        memberCount: 0,
        teamTarget: 0,
        __optimistic: true,
      };
      queryClient.setQueryData(teamsQueryKey, [optimistic, ...previous]);
      return { previous, tempId, selectedLine };
    },
    onError: (err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(teamsQueryKey, context.previous);
      }
      setError(err.message || "Failed to create team");
    },
    onSuccess: (payload, _vars, context) => {
      const created = normalizeItem(payload);
      const hydrated = created?.serviceLine?.name
        ? created
        : { ...created, serviceLine: context?.selectedLine || created?.serviceLine };
      queryClient.setQueryData(teamsQueryKey, (current = []) =>
        current.map((item) => (item._id === context?.tempId ? hydrated : item))
      );
      invalidateOrgData(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) =>
      apiRequest(`/api/teams/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      ),
    onMutate: async ({ id, payload }) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: teamsQueryKey });
      const previous = queryClient.getQueryData(teamsQueryKey) || [];
      const selectedLine = serviceLines.find((line) => line._id === payload.serviceLine);
      queryClient.setQueryData(teamsQueryKey, (current = []) =>
        current.map((item) =>
          item._id === id
            ? { ...item, ...payload, serviceLine: selectedLine || payload.serviceLine }
            : item
        )
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(teamsQueryKey, context.previous);
      }
      setError(err.message || "Failed to update team");
    },
    onSuccess: (payload) => {
      const updated = normalizeItem(payload);
      if (!updated?._id) return;
      queryClient.setQueryData(teamsQueryKey, (current = []) =>
        current.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
      );
      invalidateOrgData(queryClient);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/api/teams/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      setError("");
      await queryClient.cancelQueries({ queryKey: teamsQueryKey });
      const previous = queryClient.getQueryData(teamsQueryKey) || [];
      queryClient.setQueryData(teamsQueryKey, (current = []) =>
        current.filter((item) => item._id !== id)
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(teamsQueryKey, context.previous);
      }
      setError(err.message || "Failed to delete team");
    },
    onSuccess: () => {
      invalidateOrgData(queryClient);
    },
  });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.serviceLine) return;
    try {
      await createMutation.mutateAsync({
        name: form.name.trim(),
        serviceLine: form.serviceLine,
      });
      setForm({ name: "", serviceLine: "" });
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Failed to create team");
    }
  };

  const handleEditOpen = (item) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      serviceLine: item.serviceLine?._id || item.serviceLine || "",
      status: item.status || "active",
    });
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim() || !editForm.serviceLine || !editItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editItem._id,
        payload: {
          name: editForm.name.trim(),
          serviceLine: editForm.serviceLine,
          status: editForm.status,
        },
      });
      setEditItem(null);
    } catch (err) {
      setError(err.message || "Failed to update team");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.message || "Failed to delete team");
    }
  };

  const totalMembers = useMemo(
    () => items.reduce((sum, i) => sum + (i.memberCount || 0), 0),
    [items]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ─── Hero Banner ─── */}
      {/* ─── Summary Cards ─── */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { title: "Total Teams", value: items.length, icon: Users, color: "violet" },
          { title: "Total Members", value: totalMembers, icon: Users, color: "emerald" },
          { title: "Service Lines", value: serviceLines.length, icon: Layers, color: "amber" },
        ].map((c) => (
          <Card key={c.title} className="rounded-[2rem] border-none bg-white p-1 ring-1 ring-slate-100">
            <CardContent className="flex items-center gap-5 p-6">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                c.color === "violet" ? "bg-violet-50 text-violet-600" :
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
                  {c.customVal ?? c.value}
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
      <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/60 ring-1 ring-slate-100">
        <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-indigo-50 text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">All Teams</h2>
              <p className="text-xs font-semibold text-slate-400">Manage organizational team structures</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600">
              {items.length} {items.length === 1 ? "team" : "teams"}
            </Badge>
            <Button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={createMutation.isPending}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest h-10 px-6 gap-2 transition-all shadow-lg shadow-slate-200"
            >
              <Plus size={16} />
              Add Team
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="pl-8 font-black uppercase tracking-widest text-[12px] text-slate-600 w-[25%]">Team Name</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[12px] text-slate-600 w-[20%]">Service Line</TableHead>
              <TableHead className="font-black uppercase tracking-widest text-[12px] text-slate-600 w-[20%] text-center">Members</TableHead>
              <TableHead className="pr-8 font-black uppercase tracking-widest text-[12px] text-slate-600 text-right w-[35%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-8"><Skeleton className="h-5 w-32 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12 mx-auto rounded-lg" /></TableCell>
                  <TableCell className="pr-8"><Skeleton className="h-8 w-24 ml-auto rounded-xl" /></TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 ring-1 ring-slate-100">
                      <Users size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">No Teams Found</p>
                      <p className="text-xs font-medium text-slate-400 mt-1">Start by adding a new team to this list.</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item._id} className="group hover:bg-slate-50/30 transition-colors border-slate-50">
                  <TableCell className="pl-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 tracking-tight text-sm">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg border-indigo-100 bg-indigo-50/50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                      {item.serviceLine?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <Users size={12} className="text-emerald-500" />
                      <span className="font-black text-emerald-700 text-sm">{item.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleEditOpen(item)}
                        className="rounded-xl border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                        title="Edit Team"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(item)}
                        className="rounded-xl border-slate-100 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition-all"
                        title="Delete Team"
                      >
                        <Trash2 size={14} />
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
            <DialogTitle>Add Team</DialogTitle>
            <DialogDescription>Create a new team under a service line.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Wix Spark"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-sl">Service Line</Label>
              <select
                id="team-sl"
                value={form.serviceLine}
                onChange={(e) => setForm((prev) => ({ ...prev, serviceLine: e.target.value }))}
                className="h-9 w-full rounded-3xl border border-input/50 bg-input/50 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 outline-none"
              >
                <option value="">Select service line</option>
                {serviceLines.map((line) => (
                  <option key={line._id} value={line._id}>{line.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleCreate} className="w-full rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white">
              Save Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Dialog ─── */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>Update the details for this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Wix Spark"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-sl">Service Line</Label>
              <select
                id="edit-team-sl"
                value={editForm.serviceLine}
                onChange={(e) => setEditForm((prev) => ({ ...prev, serviceLine: e.target.value }))}
                className="h-9 w-full rounded-3xl border border-input/50 bg-input/50 px-3 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 outline-none"
              >
                <option value="">Select service line</option>
                {serviceLines.map((line) => (
                  <option key={line._id} value={line._id}>{line.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-team-status">Status</Label>
              <select
                id="edit-team-status"
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
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
              {updateMutation.isPending ? "Updating..." : "Update Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
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

export default Teams;
