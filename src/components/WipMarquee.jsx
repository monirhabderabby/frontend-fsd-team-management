/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../utils/apiClient.js";
import { useAuth } from "../context/AuthContext.jsx";

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
    const topKey = payload && typeof payload === "object"
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

const WipMarquee = () => {
    const { user } = useAuth();
    const [activeIndex, setActiveIndex] = useState(0);

    const isMember = user?.role === "MEMBER";
    const isTeamLeader = user?.role === "TEAM_LEADER";
    const isProjectManager = user?.role === "PROJECT_MANAGER";

    const queryKey = ["projects", "wip-marquee", user?.role, user?.employeeId, user?.team, user?.serviceLine];

    const { data: projects = [] } = useQuery({
        queryKey,
        queryFn: async () => {
            if (isMember) return apiRequest("/api/projects?scope=own");
            if (isTeamLeader || isProjectManager) return apiRequest("/api/projects");
            return [];
        },
        select: normalizeList,
        enabled: !!user && (isMember || isTeamLeader || isProjectManager),
    });

    const items = useMemo(() => {
        if (!user) return [];
        const now = Date.now();
        const eligible = projects.filter((project) => {
            if (["Delivered", "Cancelled"].includes(project.status)) return false;
            const deadline = new Date(project.nextWipDeadline).getTime();
            if (Number.isNaN(deadline)) return false;
            const diff = deadline - now;
            return diff <= 48 * 60 * 60 * 1000;
        });

        return eligible
            .map((project) => {
                const deadline = new Date(project.nextWipDeadline).getTime();
                const diff = deadline - now;
                const level = diff <= 0 ? "overdue" : diff <= 24 * 60 * 60 * 1000 ? "critical" : "warning";
                return {
                    key: project._id || project.projectId || project.orderId,
                    profileName: project.profileName || "-",
                    clientName: project.clientName || "-",
                    orderId: project.orderId || "-",
                    employeeName: project.employeeName || project.employeeId || "-",
                    teamName: project.team?.name || "-",
                    remaining: formatRemaining(diff),
                    remainingMs: diff,
                    deadline,
                    level,
                };
            })
            .sort((a, b) => a.remainingMs - b.remainingMs);
    }, [projects, user]);

    useEffect(() => {
        if (items.length === 0) {
            setActiveIndex(0);
            return;
        }
        const id = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % items.length);
        }, 4000);
        return () => clearInterval(id);
    }, [items.length]);

    useEffect(() => {
        if (activeIndex >= items.length) {
            setActiveIndex(0);
        }
    }, [activeIndex, items.length]);

    useEffect(() => {
        const className = "has-wip-marquee";
        const target = document.body;
        if (items.length > 0) {
            target.classList.add(className);
        } else {
            target.classList.remove(className);
        }
        return () => target.classList.remove(className);
    }, [items.length]);

    if (items.length === 0) return null;

    const current = items[activeIndex];

    const badgeClass = current.level === "overdue"
        ? "bg-rose-700 text-rose-100"
        : current.level === "critical"
            ? "bg-red-600 text-red-100"
            : "bg-amber-600 text-amber-100";

    const barClass = current.level === "overdue"
        ? "bg-rose-100 text-rose-600"
        : current.level === "critical"
            ? "bg-red-100 text-red-600"
            : "bg-amber-100 text-slate-600";

    const labelClass = current.level === "overdue"
        ? "text-rose-600"
        : current.level === "critical"
            ? "text-red-600"
            : "text-amber-600";

    const textClass = current.level === "overdue"
        ? "text-rose-900"
        : current.level === "critical"
            ? "text-red-900"
            : "text-amber-900";

    return (
        <div className={`sticky top-0 z-35 ${barClass} border-b border-black/10 px-6 py-2 overflow-hidden`}>
            <div
                className="flex items-center gap-3 animate-slide-up"
                key={`${current.key}-${activeIndex}`}
            >
                <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${labelClass}`}>
                    Next WIP Alert:
                </span>
                <span className={`text-[16px] font-bold tracking-wide truncate flex-1 ${textClass}`}>
                    {current.profileName} <span className="mx-4">✯</span> {current.clientName} <span className="mx-4">✯</span> {current.orderId} <span className="mx-4">✯</span> {current.teamName} <span className="mx-4">✯</span> {current.employeeName} <span className="mx-4">✯</span> {new Date(current.deadline).toLocaleString("en-US")}
                </span>
                <span className={`rounded-full px-3 py-1 text-[16px] font-black uppercase tracking-widest ${badgeClass}`}>
                    {current.level === "overdue"
                        ? `Overdue ${formatRemaining(Math.abs(current.remainingMs))}`
                        : `Upcoming ${current.remaining}`}
                </span>
            </div>
        </div>
    );
};

export default WipMarquee;
