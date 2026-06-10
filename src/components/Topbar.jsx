/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Bell, Menu, Search, User, Megaphone, X, CalendarDays, RefreshCcw, ExternalLink, Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";

const roleLabels = {
    SUPER_ADMIN: "Super Admin",
    PROJECT_MANAGER: "Project Manager",
    TEAM_LEADER: "Team Leader",
    MEMBER: "Member",
};

const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return `Just now`;
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

const formatDateTime = (isoStr) => {
    if (!isoStr) return "";
    try {
        const d = new Date(isoStr);
        if (isNaN(d.getTime())) return isoStr;
        return d.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (e) {
        return isoStr;
    }
};

const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
};

const TopBar = ({ onToggleSidebar }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Modal states
    const [viewModal, setViewModal] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    const dropdownRef = useRef(null);
    const lastSeenRef = useRef(0);
    const autoOpenLockRef = useRef(false);

    const displayName = user?.name || "User";
    const roleLabel = roleLabels[user?.role] || user?.role || "";
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const markAnnouncementRead = async (announcementId) => {
        if (!announcementId) return;
        try {
            await apiRequest(`/api/announcements/${announcementId}/read`, { method: "POST" });
            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === announcementId ? { ...item, isRead: true } : item
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
    };

    const fetchNotifications = async () => {
        try {
            const payload = await apiRequest("/api/announcements?limit=5");
            const list = payload?.data || [];
            setNotifications(list);
            setUnreadCount(Number(payload?.unreadCount || 0));

            if (list.length > 0) {
                const latest = list[0];
                const latestTime = new Date(latest.date).getTime();
                const lastSeen = lastSeenRef.current || 0;

                if (!autoOpenLockRef.current && !latest.isRead && latestTime > lastSeen) {
                    autoOpenLockRef.current = true;
                    setSelectedAnnouncement(latest);
                    setViewModal(true);
                    lastSeenRef.current = latestTime;
                    localStorage.setItem("announcement_last_seen_at", String(latestTime));
                    await markAnnouncementRead(latest.id);
                    autoOpenLockRef.current = false;
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Load initial announcements and read statuses
    useEffect(() => {
        try {
            const lastSeen = Number(localStorage.getItem("announcement_last_seen_at") || 0);
            lastSeenRef.current = Number.isNaN(lastSeen) ? 0 : lastSeen;
        } catch (e) { console.error(e); }

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);

        const handleAnnouncementAdded = () => {
            fetchNotifications();
        };

        window.addEventListener("announcement_added", handleAnnouncementAdded);

        // Handle clicks outside dropdown
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("announcement_added", handleAnnouncementAdded);
            document.removeEventListener("mousedown", handleClickOutside);
            clearInterval(interval);
        };
    }, []);

    const handleNotificationClick = (notification) => {
        setShowNotifications(false);
        // Open modal
        setSelectedAnnouncement(notification);
        setViewModal(true);
        if (!notification.isRead) {
            markAnnouncementRead(notification.id);
        }
    };

    const markAllAsRead = (e) => {
        e.stopPropagation();
        apiRequest("/api/announcements/read-all", { method: "POST" })
            .then(() => {
                setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
                setUnreadCount(0);
            })
            .catch((err) => console.error(err));
    };

    return (
        <header className="app-topbar relative z-40">
            {/* Left */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleSidebar}
                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-brand-green/15 bg-white hover:bg-brand-green-soft active:scale-95 transition-all cursor-pointer"
                    aria-label="Toggle sidebar"
                >
                    <Menu size={18} className="text-slate-600" />
                </button>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-6">

                {/* ScaleUp Portal Button */}
                <a
                    href="https://portal.scaleupdevagency.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:flex items-center gap-4 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-green to-brand-yellow text-white text-xs font-bold tracking-wide border border-brand-yellow/30 shadow-sm shadow-brand-green/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                    <Rocket size={14} />
                    ScaleUp Portal
                    <ExternalLink size={12} className="opacity-70" />
                </a>

                {/* Notification Button */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${showNotifications ? 'bg-brand-yellow-soft border-brand-yellow/40 text-brand-green-dark' : 'border-brand-green/15 bg-white hover:bg-brand-green-soft text-slate-500'}`}
                    >
                        <Bell size={17} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-linear-to-r from-rose-500 to-pink-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse-soft">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notifications Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-in origin-top-right">
                            <div className="bg-slate-50 border-b border-slate-100 p-3 px-4 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-[10px] font-bold text-brand-green hover:text-brand-green-dark cursor-pointer">
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(notification => {
                                        const isRead = !!notification.isRead;
                                        const updatedAt = notification.updatedAt || notification.date;
                                        const isUpdated = (() => {
                                            if (!notification.updatedAt) return false;
                                            const createdAt = new Date(notification.date).getTime();
                                            const updatedAt = new Date(notification.updatedAt).getTime();
                                            if (!Number.isFinite(createdAt) || !Number.isFinite(updatedAt)) return false;
                                            return updatedAt - createdAt > 1000;
                                        })();
                                        return (
                                            <div
                                                key={notification.id}
                                                className={`w-full relative p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-3 group ${!isRead ? 'bg-brand-green-soft/70' : ''}`}
                                            >
                                                <button
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className="absolute inset-0 w-full h-full cursor-pointer z-0"
                                                    aria-label="View announcement"
                                                />
                                                <div className="relative h-8 w-8 rounded-full bg-brand-yellow-soft text-brand-green flex items-center justify-center shrink-0 z-10 pointer-events-none">
                                                    <Megaphone size={14} />
                                                    {!isRead && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0 z-10 pointer-events-none">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <p className={`text-xs truncate transition-colors ${!isRead ? 'font-bold text-brand-green-dark' : 'font-semibold text-slate-800 group-hover:text-brand-green'}`}>
                                                            {notification.title}
                                                        </p>
                                                        {isUpdated && (
                                                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                                                Updated
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 line-clamp-1 mb-1">
                                                        New announcement by {notification.author?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-[9px] font-medium text-slate-400">
                                                        {formatTimeAgo(updatedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center text-slate-400 text-xs">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            {notifications.length > 0 && (
                                <Link
                                    to="/announcement"
                                    onClick={() => setShowNotifications(false)}
                                    className="block text-center p-2.5 bg-slate-50 text-[11px] font-bold text-brand-green hover:bg-brand-green-soft transition-colors"
                                >
                                    View all announcements
                                </Link>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-slate-200/80 hidden sm:block" />

                {/* User Profile */}
                <Link
                    to="/settings"
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
                        <p className="text-[11px] text-slate-500 leading-tight">{roleLabel}</p>
                    </div>

                    <div className="relative">
                        <div className="h-9 w-9 rounded-xl bg-linear-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                                initials || <User size={16} />
                            )}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                </Link>

            </div>

            {/* In-place View Modal */}
            {viewModal && selectedAnnouncement && createPortal(
                <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
                        {/* Banner */}
                        <div className="bg-linear-to-r from-[#07160B] via-brand-green-dark to-brand-green p-8 text-white relative shrink-0">
                            <button
                                onClick={() => setViewModal(false)}
                                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 rounded-3xl bg-brand-yellow/25 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-xl backdrop-blur-md">
                                    {selectedAnnouncement.author.image ? (
                                        <img src={selectedAnnouncement.author.image} alt={selectedAnnouncement.author.name} className="w-full h-full object-cover" />
                                    ) : (
                                        getInitials(selectedAnnouncement.author.name)
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-2xl font-bold font-heading">
                                        {selectedAnnouncement.author.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-[11px] font-bold tracking-wider bg-white/10 px-2.5 py-1 rounded-lg uppercase">
                                            {selectedAnnouncement.author.role}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs text-brand-yellow-soft">
                                            <CalendarDays size={14} />
                                            {formatDateTime(selectedAnnouncement.date)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 md:p-10 overflow-y-auto bg-slate-50 flex-1">
                            <h1 className="text-3xl font-bold text-slate-800 mb-8 leading-tight font-heading border-b border-slate-200 pb-6">
                                {selectedAnnouncement.title}
                            </h1>

                            <div
                                className="prose prose-slate max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: selectedAnnouncement.description,
                                }}
                            />
                        </div>

                        <div className="p-6 bg-white border-t border-slate-200 text-center shrink-0">
                            <button onClick={() => setViewModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer">
                                Close Announcement
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </header>
    );
};

export default TopBar;
