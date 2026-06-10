/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/purity */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.jsx";
import { Button } from "./ui/button.jsx";

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (payload?.data && typeof payload.data === "object") {
    if (Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload.data.items)) return payload.data.items;
    if (Array.isArray(payload.data.results)) return payload.data.results;
  }
  const topKey =
    payload && typeof payload === "object"
      ? Object.keys(payload).find((key) => Array.isArray(payload[key]))
      : null;
  return topKey ? payload[topKey] : [];
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

const WipDeadlineAlert = () => {
  const { user } = useAuth();
  const isMember = user?.role === "MEMBER";
  const [dismissedKeys, setDismissedKeys] = useState(() => new Set());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isMember) return undefined;
    const id = setInterval(() => setTick((prev) => prev + 1), 60000);
    return () => clearInterval(id);
  }, [isMember]);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", "wip-alerts", user?.employeeId],
    queryFn: async () => apiRequest("/api/projects?scope=own"),
    select: normalizeList,
    enabled: isMember && !!user?.employeeId,
  });

  const candidateAlerts = useMemo(() => {
    if (!isMember || !user?.employeeId) return [];
    const now = Date.now();
    return projects
      .filter(
        (project) =>
          String(project.employeeId) === String(user.employeeId) &&
          !["Delivered", "Cancelled"].includes(project.status),
      )
      .map((project) => {
        const deadline = new Date(project.nextWipDeadline).getTime();
        if (Number.isNaN(deadline)) return null;
        const diff = deadline - now;
        if (diff > 48 * 60 * 60 * 1000) return null;
        const level = diff <= 0 ? "overdue" : diff <= 24 * 60 * 60 * 1000 ? "critical" : "warning";
        const key = `${project._id || project.projectId}-${level}`;
        return {
          key,
          level,
          remainingMs: diff,
          deadline,
          profileName: project.profileName,
          clientName: project.clientName,
          orderId: project.orderId,
          teamName: project.team?.name,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.remainingMs - b.remainingMs);
  }, [isMember, projects, tick, user?.employeeId]);

  const visibleAlerts = useMemo(
    () => candidateAlerts.filter((alert) => !dismissedKeys.has(alert.key)),
    [candidateAlerts, dismissedKeys],
  );
  const open = visibleAlerts.length > 0;

  const handleDismiss = () => {
    if (!visibleAlerts.length) return;
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      visibleAlerts.forEach((alert) => next.add(alert.key));
      return next;
    });
  };

  if (!isMember) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleDismiss()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Next WIP Deadline Alert</DialogTitle>
          <DialogDescription>
            Upcoming deadlines within the next 48 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.key}
              className={`rounded-2xl border p-4 ${
                alert.level === "overdue"
                  ? "border-rose-300 bg-rose-100"
                  : alert.level === "critical"
                    ? "border-rose-200 bg-rose-50"
                    : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">
                    Profile
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {alert.profileName || "-"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white ${
                    alert.level === "overdue"
                      ? "bg-rose-700"
                      : alert.level === "critical"
                        ? "bg-rose-600"
                        : "bg-amber-500"
                  }`}
                >
                  {alert.level === "overdue"
                    ? `Overdue ${formatRemaining(Math.abs(alert.remainingMs))}`
                    : `Upcoming ${formatRemaining(alert.remainingMs)}`}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-slate-500">
                Next WIP: {new Date(alert.deadline).toLocaleString("en-US")}
              </p>
              {alert.level === "overdue" && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  Overdue by {formatRemaining(Math.abs(alert.remainingMs))}
                </p>
              )}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div>
                  <span className="font-bold">Client:</span>{" "}
                  {alert.clientName || "-"}
                </div>
                <div>
                  <span className="font-bold">Order ID:</span>{" "}
                  {alert.orderId || "-"}
                </div>
                <div>
                  <span className="font-bold">Team:</span>{" "}
                  {alert.teamName || "-"}
                </div>
                <div>
                  <span className="font-bold">Status:</span>{" "}
                  {alert.level === "overdue"
                    ? "Overdue"
                    : alert.level === "critical"
                      ? "Critical"
                      : "Warning"}
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleDismiss}>
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WipDeadlineAlert;
