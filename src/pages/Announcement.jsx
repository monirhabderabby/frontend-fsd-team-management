import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  CalendarDays,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "../utils/apiClient.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// 🔥 Rich Text Editor
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import toast from "react-hot-toast";

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

const Announcement = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isProjectManager = user?.role === "PROJECT_MANAGER";
  const isTeamLeader = user?.role === "TEAM_LEADER";

  // SUPER_ADMIN & PROJECT_MANAGER can create/edit/delete any announcement.
  // TEAM_LEADER can create, but can only edit/delete their OWN announcements.
  const canCreate = isSuperAdmin || isProjectManager || isTeamLeader;

  // Check if the current user can edit a specific announcement
  const canEditAnnouncement = (announcement) => {
    if (isSuperAdmin || isProjectManager) return true;
    if (isTeamLeader) return announcement.authorId === String(user?._id);
    return false;
  };

  const { data: announcementPayload, isLoading } = useQuery({
    queryKey: ["announcements", { page: 1, limit: 50 }],
    queryFn: () => apiRequest("/api/announcements?limit=50"),
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const announcements = useMemo(() => announcementPayload?.data || [], [announcementPayload]);

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => {
      const timeB = new Date(b.updatedAt || b.date).getTime();
      const timeA = new Date(a.updatedAt || a.date).getTime();
      return timeB - timeA;
    });
  }, [announcements]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, title }
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });


  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  };

  const handleAdd = () => {
    setEditingAnnouncement(null);
    setFormData({ title: "", description: "" });
    setIsModalOpen(true);
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({ title: announcement.title, description: announcement.description });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) return;

    try {
      if (editingAnnouncement) {
        await apiRequest(`/api/announcements/${editingAnnouncement.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
          }),
        });
        toast?.success("Announcement updated!");
      } else {
        const created = await apiRequest("/api/announcements", {
          method: "POST",
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
          }),
        });
        const createdAnnouncement = created?.data || null;
        if (createdAnnouncement) {
          window.dispatchEvent(
            new CustomEvent("announcement_added", { detail: createdAnnouncement })
          );
        }
        toast?.success("Announcement published!");
      }
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setIsModalOpen(false);
    } catch (e) {
      toast?.error(e?.message || "Failed to save announcement.");
    }
  };

  const handleDelete = (announcement) => {
    setDeleteTarget({ id: announcement.id, title: announcement.title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/api/announcements/${deleteTarget.id}`, { method: "DELETE" });
      toast?.success("Announcement deleted.");
      await queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setDeleteTarget(null);
    } catch (e) {
      toast?.error(e?.message || "Failed to delete announcement.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = (announcement) => {
    setSelectedAnnouncement(announcement);
    setViewModal(true);
    if (!announcement?.isRead) {
      apiRequest(`/api/announcements/${announcement.id}/read`, { method: "POST" })
        .then(() => queryClient.invalidateQueries({ queryKey: ["announcements"] }))
        .catch(() => {});
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  };

  return (
    <div className="min-h-screen  max-w-[1600px] mx-auto stagger-children">
      {/* Header */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-emerald-950 border border-white/10 shadow-2xl p-8 sm:p-10 animate-fade-in">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-soft" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-emerald-500/10">
              <Megaphone className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white font-heading">
                Announcements
              </h1>
              <p className="text-slate-300 mt-1">
                Stay updated with the latest team news and system notices
              </p>
            </div>
          </div>

          {canCreate && (
            <button
              onClick={handleAdd}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={18} />
              Publish Announcement
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">
        {sortedAnnouncements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white rounded-3xl border border-slate-200/80 p-7 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group/card"
          >
            {/* Top */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden shrink-0 border-2 border-indigo-50">
                  {announcement.author?.image ? (
                    <img src={announcement.author.image} alt={announcement.author?.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(announcement.author?.name)
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-slate-800 text-base leading-tight">
                    {announcement.author?.name || "Unknown"}
                  </h3>
                  <p className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1">
                    {announcement.author?.role || "MEMBER"}
                  </p>
                  {/* Show team-scoped badge for TL announcements */}
                  {announcement.teamId && (
                    <span className="ml-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-1">
                      Team
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover/card:opacity-100 transition-opacity">
                {canEditAnnouncement(announcement) && (
                  <>
                    <button
                      onClick={() => handleEdit(announcement)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center text-slate-500 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center text-slate-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold text-slate-800 mb-3 leading-snug group-hover/card:text-indigo-600 transition-colors">
              {announcement.title}
            </h2>

            <div
              className="text-slate-500 text-sm line-clamp-3 prose prose-sm max-w-none mb-6 flex-1 overflow-hidden"
              dangerouslySetInnerHTML={{
                __html: announcement.description,
              }}
            />

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 mt-auto border-t border-slate-100 bg-slate-50/50 -mx-7 -mb-7 px-7 pb-6 rounded-b-3xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-0.5">Published</span>
                <div className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold">
                  <Clock size={14} className="text-indigo-400" />
                  {formatDateTime(announcement.date)}
                </div>
              </div>

              <button
                onClick={() => handleView(announcement)}
                className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                Read Full <span className="ml-1">→</span>
              </button>
            </div>
          </div>
        ))}
        {!isLoading && sortedAnnouncements.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-400 font-semibold bg-white rounded-3xl border border-slate-200 border-dashed">
            No announcements published yet.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[32px] p-8 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 font-heading">
                  {editingAnnouncement ? "Edit Announcement" : "Create Announcement"}
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  {isTeamLeader
                    ? "This announcement will be visible to your team members, your service line PM, and admins."
                    : "Format your message clearly so everyone understands it."}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  placeholder="Enter a clear title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 bg-slate-50 rounded-2xl px-5 py-3 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Message Content
                </label>
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
                  <ReactQuill
                    theme="snow"
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    modules={modules}
                    className="bg-white text-slate-800 h-80"
                  />
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={handleSave}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  {editingAnnouncement ? "Update Announcement" : "Publish to Workspace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal && selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh]">
            {/* Banner */}
            <div className="bg-linear-to-r from-slate-900 via-indigo-900 to-indigo-800 p-8 text-white relative shrink-0">
              <button
                onClick={() => setViewModal(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-3xl bg-indigo-500/40 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-xl backdrop-blur-md">
                  {selectedAnnouncement.author?.image ? (
                    <img src={selectedAnnouncement.author.image} alt={selectedAnnouncement.author?.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(selectedAnnouncement.author?.name)
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-bold font-heading">
                    {selectedAnnouncement.author?.name || "Unknown"}
                  </h3>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] font-bold tracking-wider bg-white/10 px-2.5 py-1 rounded-lg uppercase">
                      {selectedAnnouncement.author?.role || "MEMBER"}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-indigo-200">
                      <CalendarDays size={14} />
                      {formatDateTime(selectedAnnouncement.date)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content – no horizontal scroll, proper word wrapping */}
            <div className="p-8 md:p-10 overflow-y-auto bg-slate-50 flex-1 min-h-0">
              <h1 className="text-3xl font-bold text-slate-800 mb-8 leading-tight font-heading border-b border-slate-200 pb-6 break-words">
                {selectedAnnouncement.title}
              </h1>

              <div
                className="prose prose-slate max-w-none
                  [&_*]:max-w-full [&_*]:break-words [&_*]:overflow-wrap-anywhere
                  [&_pre]:whitespace-pre-wrap [&_pre]:overflow-x-auto [&_pre]:max-w-full
                  [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full
                  [&_img]:max-w-full [&_img]:h-auto
                  [&_a]:break-all"
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
        </div>
      )}
      {/* ─── Delete Confirmation Modal ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden animate-scale-in">
            {/* Red warning banner */}
            <div className="bg-linear-to-br from-rose-500 to-rose-700 p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.12)_0%,_transparent_70%)]" />
              <div className="relative w-16 h-16 rounded-[1.4rem] bg-white/15 border border-white/20 flex items-center justify-center mb-4 shadow-lg backdrop-blur-sm">
                <Trash2 size={28} className="text-white" />
              </div>
              <h3 className="relative text-2xl font-black text-white tracking-tight">Delete Announcement</h3>
              <p className="relative text-rose-100 text-sm mt-1.5 font-medium">This action cannot be undone</p>
            </div>

            {/* Body */}
            <div className="px-8 py-7">
              <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-5 py-4 mb-6">
                <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-slate-900">"{deleteTarget.title}"</span>?
                  {" "}It will be permanently removed for all users.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-rose-200 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={15} />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcement;