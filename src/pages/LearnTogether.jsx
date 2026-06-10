/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Heart,
  Bookmark,
  MessageSquare,
  Share2,
  MoreVertical,
  Flame,
  Sparkles,
  TrendingUp,
  Video,
  FileText,
  Code,
  Lightbulb,
  Folder,
  Compass,
  BookOpen,
  Users,
  Award,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  User,
  Calendar,
  Paperclip,
  Globe,
  Lock,
  Eye,
  ThumbsUp,
  Activity,
  Layers,
  ArrowRight,
  Pin,
  CheckCircle,
  Copy,
  PlusCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.jsx";
import { Badge } from "@/components/ui/badge.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Label } from "@/components/ui/label.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const CATEGORIES = [
  { name: "Development", count: 24, icon: Code, color: "from-blue-500/20 to-blue-600/20 text-blue-600 border-blue-200" },
  { name: "UI/UX", count: 16, icon: Layers, color: "from-fuchsia-500/20 to-fuchsia-600/20 text-fuchsia-600 border-fuchsia-200" },
  { name: "AI & Automation", count: 18, icon: Sparkles, color: "from-emerald-500/20 to-emerald-600/20 text-emerald-600 border-emerald-200" },
  { name: "DevOps", count: 12, icon: Flame, color: "from-orange-500/20 to-orange-600/20 text-orange-600 border-orange-200" },
  { name: "Project Management", count: 9, icon: Users, color: "from-indigo-500/20 to-indigo-600/20 text-indigo-600 border-indigo-200" },
  { name: "Client Communication", count: 7, icon: MessageSquare, color: "from-pink-500/20 to-pink-600/20 text-pink-600 border-pink-200" },
  { name: "Security", count: 11, icon: Lock, color: "from-rose-500/20 to-rose-600/20 text-rose-600 border-rose-200" },
  { name: "Productivity", count: 15, icon: Lightbulb, color: "from-amber-500/20 to-amber-600/20 text-amber-600 border-amber-200" },
];

const TRENDING_TOPICS = [
  { topic: "React 19 Server Components", learners: 18, trend: "+24%", color: "from-blue-500 to-indigo-600" },
  { topic: "Tailwind v4 Configuration", learners: 14, trend: "+18%", color: "from-emerald-400 to-teal-600" },
  { topic: "Velo Backend Routing", learners: 9, trend: "+12%", color: "from-purple-500 to-fuchsia-600" },
  { topic: "Claude API Integrations", learners: 22, trend: "+35%", color: "from-amber-500 to-orange-600" },
  { topic: "OWASP API Protection", learners: 11, trend: "+8%", color: "from-rose-500 to-pink-600" },
];

const CONTRIBUTORS = [
  { name: "Khairul Islam", points: 840, avatar: "", rank: 1, role: "Super Admin" },
  { name: "Sarah Kabir", points: 620, avatar: "", rank: 2, role: "Team Leader" },
  { name: "Tariqul Bashar", points: 590, avatar: "", rank: 3, role: "Project Manager" },
  { name: "Asif Rahman", points: 410, avatar: "", rank: 4, role: "Team Leader" },
  { name: "Rashedul Amin", points: 380, avatar: "", rank: 5, role: "Member" },
];

const LearnTogether = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Navigation & Filtering State
  const [activeSubNav, setActiveSubNav] = useState("explore"); // explore, saved, contributions, ai-insights, drafts
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // newest, popular, helpful
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const { data: postsPayload } = useQuery({
    queryKey: [
      "learn-together",
      "posts",
      {
        tab: activeSubNav,
        category: selectedCategory,
        search: searchQuery,
        sort: sortBy,
        page: currentPage,
      },
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        tab: activeSubNav,
        sort: sortBy,
      });
      if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      return apiRequest(`/api/learn-together/posts?${params.toString()}`);
    },
    enabled: !!user,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  // Posts Data State
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (postsPayload?.data) {
      setPosts(postsPayload.data);
    }
  }, [postsPayload]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubNav, selectedCategory, searchQuery, sortBy]);

  // Modals & Panels State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [activePost, setActivePost] = useState(null); // for edit/delete
  const [menuPostId, setMenuPostId] = useState(null); // for card menu toggle

  // Form State
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Development");
  const [newPostType, setNewPostType] = useState("article");
  const [newPostTags, setNewPostTags] = useState("");
  const [newPostVideoUrl, setNewPostVideoUrl] = useState("");
  const [isDraftCheck, setIsDraftCheck] = useState(false);

  // Comments input map { postId: commentText }
  const [commentsInputs, setCommentsInputs] = useState({});
  const [expandedComments, setExpandedComments] = useState({}); // { postId: boolean }
  const [viewPost, setViewPost] = useState(null); // for detail view modal

  const [editingComment, setEditingComment] = useState(null); // { postId, commentId, text }

  const canManagePost = (post) => {
    if (!user || !post) return false;
    if (user.role === "SUPER_ADMIN" || user.role === "PROJECT_MANAGER") return true;
    return String(post.authorId) === String(user._id);
  };

  const formatCommentTime = (timeStr) => {
    if (!timeStr) return "";
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return timeStr;
      return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (e) {
      return timeStr;
    }
  };

  // Quick Action Trigger
  const handleQuickAction = (actionType) => {
    setNewPostType(actionType === "video" ? "video" : "article");
    if (actionType === "workflow") {
      setNewPostTitle("AI Workflow: [Your Workflow Name]");
      setNewPostContent("💡 AI Model: \n📦 Prompt Template: \n⚙️ Execution Pipeline: \n✨ Output Format: ");
      setNewPostCategory("AI & Automation");
    } else if (actionType === "experience") {
      setNewPostTitle("Project Experience: Lessons from [Project Name]");
      setNewPostContent("🎯 Goal: \n⚠️ Challenges Encountered: \n🚀 Solution & Tools used: \n📝 Core Takeaway for the team: ");
    } else if (actionType === "case-study") {
      setNewPostTitle("Case Study: [Client Domain] Solutions");
      setNewPostCategory("Client Communication");
    } else {
      setNewPostTitle("");
      setNewPostContent("");
    }
    setIsCreateOpen(true);
  };

  // Create Post
  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in the title and content.");
      return;
    }

    const tagsArray = newPostTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    apiRequest("/api/learn-together/posts", {
      method: "POST",
      body: JSON.stringify({
        title: newPostTitle,
        content: newPostContent,
        type: newPostType,
        videoUrl: ["video", "image", "file"].includes(newPostType) ? newPostVideoUrl : "",
        category: newPostCategory,
        tags: tagsArray.length > 0 ? tagsArray : ["General"],
        isDraft: isDraftCheck,
      }),
    })
      .then((payload) => {
        const created = payload?.data;
        if (created) {
          setPosts((prev) => [created, ...prev.filter((p) => p.id !== created.id)]);
        }
        queryClient.invalidateQueries({ queryKey: ["learn-together", "posts"] });
        setIsCreateOpen(false);
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostTags("");
        setNewPostVideoUrl("");
        setIsDraftCheck(false);
        toast.success(isDraftCheck ? "Draft saved successfully!" : "Post published successfully!");
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to publish post.");
      });
  };

  // Set Post for Edit
  const openEditModal = (post) => {
    setActivePost(post);
    setNewPostTitle(post.title);
    setNewPostContent(post.content);
    setNewPostCategory(post.category);
    setNewPostType(post.type);
    setNewPostTags(post.tags.join(", "));
    setNewPostVideoUrl(post.videoUrl || "");
    setIsDraftCheck(post.isDraft);
    setIsEditOpen(true);
  };

  // Edit Post Action
  const handleEditPost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      toast.error("Please fill in the title and content.");
      return;
    }

    const tagsArray = newPostTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    apiRequest(`/api/learn-together/posts/${activePost.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: newPostTitle,
        content: newPostContent,
        type: newPostType,
        videoUrl: ["video", "image", "file"].includes(newPostType) ? newPostVideoUrl : "",
        category: newPostCategory,
        tags: tagsArray,
        isDraft: isDraftCheck,
      }),
    })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
        queryClient.invalidateQueries({ queryKey: ["learn-together", "posts"] });
        setIsEditOpen(false);
        setActivePost(null);
        toast.success("Post updated successfully!");
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to update post.");
      });
  };

  // Delete Post
  const openDeleteModal = (post) => {
    setActivePost(post);
    setIsDeleteOpen(true);
  };

  const handleDeletePost = () => {
    apiRequest(`/api/learn-together/posts/${activePost.id}`, { method: "DELETE" })
      .then(() => {
        setPosts((prev) => prev.filter((p) => p.id !== activePost.id));
        queryClient.invalidateQueries({ queryKey: ["learn-together", "posts"] });
        setIsDeleteOpen(false);
        setActivePost(null);
        toast.success("Post deleted permanently.");
      })
      .catch((err) => {
        toast.error(err?.message || "Failed to delete post.");
      });
  };

  // Quick Action Toggles: Like, Save, Helpful
  const toggleLike = (id) => {
    apiRequest(`/api/learn-together/posts/${id}/like`, { method: "POST" })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      })
      .catch((err) => toast.error(err?.message || "Failed to update like."));
  };

  const toggleSave = (id) => {
    apiRequest(`/api/learn-together/posts/${id}/save`, { method: "POST" })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          toast.success(updated.isSaved ? "Added to Saved Posts" : "Removed from Saved Posts");
        }
      })
      .catch((err) => toast.error(err?.message || "Failed to update saved post."));
  };

  const toggleHelpful = (id) => {
    apiRequest(`/api/learn-together/posts/${id}/helpful`, { method: "POST" })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
      })
      .catch((err) => toast.error(err?.message || "Failed to update helpful count."));
  };

  // Share link mock copy
  const handleShare = (post) => {
    const shareLink = `${window.location.origin}/learn-together#post-${post.id}`;
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  // Add Comment
  const handleAddComment = (postId) => {
    const commentText = commentsInputs[postId] || "";
    if (!commentText.trim()) return;

    apiRequest(`/api/learn-together/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content: commentText }),
    })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
        setCommentsInputs({ ...commentsInputs, [postId]: "" });
        toast.success("Comment added!");
      })
      .catch((err) => toast.error(err?.message || "Failed to add comment."));
  };

  const handleEditComment = (postId, commentId, newContent) => {
    if (!newContent.trim()) return;
    apiRequest(`/api/learn-together/posts/${postId}/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ content: newContent }),
    })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
        toast.success("Comment updated!");
      })
      .catch((err) => toast.error(err?.message || "Failed to update comment."));
  };

  const handleDeleteComment = (postId, commentId) => {
    apiRequest(`/api/learn-together/posts/${postId}/comments/${commentId}`, { method: "DELETE" })
      .then((payload) => {
        const updated = payload?.data;
        if (updated) {
          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        }
        toast.success("Comment deleted!");
      })
      .catch((err) => toast.error(err?.message || "Failed to delete comment."));
  };

  // Toggle comments expand
  const toggleCommentsExpanded = (postId) => {
    setExpandedComments({
      ...expandedComments,
      [postId]: !expandedComments[postId]
    });
  };

  const filteredPosts = useMemo(() => posts, [posts]);

  // Initial user avatar calculation
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="max-w-[1600px] mx-auto stagger-children">

      {/* ─── Premium Page Hero Header ─── */}
      <div className="relative mb-8 rounded-3xl overflow-hidden bg-linear-to-br from-slate-900 via-indigo-950 to-emerald-950 border border-white/10 shadow-2xl p-4 sm:p-8 animate-fade-in">

        {/* Animated Background Lights */}
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-[100px] animate-pulse-soft" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse-soft" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-xs font-semibold mb-4 tracking-wider uppercase">
              <Sparkles size={13} className="animate-spin-slow" />
              Collective Knowledge Platform
            </div> */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-heading leading-tight mb-2">
              Learn Together
            </h1>
            <p className="text-slate-300 text-sm sm:text-md leading-relaxed">
              Share daily insights, code snippets, project breakthroughs, and AI workflows with your teammates.
              Collaborate and raise the team's collective standard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              onClick={() => handleQuickAction("")}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl border border-transparent shadow-lg shadow-emerald-500/15 py-5 px-6"
            >
              <Plus size={18} className="mr-2" />
              Share Learning
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setActiveSubNav("explore");
                setSelectedCategory("All");
                setSearchQuery("");
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10 rounded-xl py-5 px-6 font-semibold"
            >
              <Compass size={18} className="mr-2 text-emerald-400" />
              Explore Feed
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Navigation Tabs & Filters ─── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8 border-b border-slate-200">

        {/* Left: Tabs */}
        <div className="flex items-center gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {[
            { id: "explore", label: "Explore Feed" },
            { id: "saved", label: "Saved Insights" },
            { id: "contributions", label: "My Contributions" },
            { id: "drafts", label: "Drafts Archive" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubNav(tab.id);
                setSelectedCategory("All");
              }}
              className={`px-4 py-3 text-[14px] font-bold border-b-[2px] transition-colors whitespace-nowrap mb-[-1px] ${activeSubNav === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          {/* Category Selector */}
          <div className="w-[150px]">
            <Select value={selectedCategory} onValueChange={(val) => {
              setSelectedCategory(val);
              if (activeSubNav === "drafts" && val !== "All") {
                setActiveSubNav("explore");
              }
            }}>
              <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="All" className="text-xs">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="relative w-[200px]">
            <Search className="absolute px-4 left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-slate-200 rounded-xl text-xs w-full h-9 focus-visible:ring-indigo-500/25"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Sorting Actions */}
          <div className="w-[140px]">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full rounded-xl border-slate-200 bg-white text-xs font-semibold text-slate-700 h-9">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 bg-white">
                <SelectItem value="newest" className="text-xs">Newest Posts</SelectItem>
                <SelectItem value="popular" className="text-xs">Most Liked</SelectItem>
                <SelectItem value="helpful" className="text-xs">Marked Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid: Feed + Right Widgets ─── */}
      <div className="w-full max-w-[1600px] grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main Feed Area */}
        <div className="lg:col-span-12 space-y-6">

          {/* Active Filters Display */}
          {(selectedCategory !== "All" || searchQuery !== "" || activeSubNav !== "explore") && (
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs text-slate-500">Active filters:</span>
              {activeSubNav !== "explore" && (
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg py-1">
                  Tab: {activeSubNav === "saved" ? "Saved" : activeSubNav === "contributions" ? "Contributions" : "Drafts"}
                  <X size={11} className="ml-1.5 cursor-pointer" onClick={() => setActiveSubNav("explore")} />
                </Badge>
              )}
              {selectedCategory !== "All" && (
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg py-1">
                  Category: {selectedCategory}
                  <X size={11} className="ml-1.5 cursor-pointer" onClick={() => setSelectedCategory("All")} />
                </Badge>
              )}
              {searchQuery !== "" && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-600 border border-amber-100 rounded-lg py-1">
                  Query: "{searchQuery}"
                  <X size={11} className="ml-1.5 cursor-pointer" onClick={() => setSearchQuery("")} />
                </Badge>
              )}
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSearchQuery("");
                  setActiveSubNav("explore");
                }}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Feed Posts - 3 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredPosts.length === 0 ? (
              <Card className="border-slate-200 border-dashed bg-white/60 p-12 text-center rounded-2xl flex flex-col items-center col-span-full">
                <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <Compass className="text-slate-400 animate-pulse-soft" size={28} />
                </div>
                <h3 className="font-bold text-slate-700 text-base mb-1">No learning resources found</h3>
                <p className="text-xs text-slate-500 max-w-sm mb-6">
                  No post matches your query. Share your learnings today to help build the knowledge hub!
                </p>
                <Button onClick={() => handleQuickAction("")} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl">
                  <PlusCircle size={16} className="mr-2" /> Share First Insight
                </Button>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  id={`post-${post.id}`}
                  onClick={() => setViewPost(post)}
                  className="border-slate-200/85 bg-white hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden group/card flex flex-col cursor-pointer"
                >
                  {/* Image preview for image posts */}
                  {post.type === "image" && post.videoUrl && (
                    <div className="w-full h-40 overflow-hidden">
                      <img
                        src={post.videoUrl}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between">
                      {/* Author Info */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-linear-to-br from-indigo-500 to-indigo-700 text-white rounded-lg flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0">
                          {post.author.avatar ? (
                            <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            getInitials(post.author.name)
                          )}
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-slate-800 leading-tight">{post.author.name}</p>
                          <p className="text-[10px] text-slate-400">{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                        </div>
                      </div>

                      {/* Badges */}
                        <div className="flex items-center gap-1.5">
                        {post.isPinned && (
                          <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md py-0 text-[8px] font-bold flex items-center gap-0.5">
                            <Pin size={8} className="rotate-45" /> Pinned
                          </Badge>
                        )}
                        {post.isDraft && (
                          <Badge className="bg-amber-50 text-amber-600 border border-amber-100 rounded-md py-0 text-[8px] font-bold">
                            Draft
                          </Badge>
                        )}

                        {/* Three-dot menu */}
                        {canManagePost(post) && (
                          <div className="relative">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                setMenuPostId(menuPostId === post.id ? null : post.id);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {menuPostId === post.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 animate-scale-in">
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEditModal(post);
                                    setMenuPostId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Edit3 size={13} className="text-slate-400" /> Edit Post
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    apiRequest(`/api/learn-together/posts/${post.id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ isPinned: !post.isPinned }),
                                    })
                                      .then((payload) => {
                                        const updated = payload?.data;
                                        if (updated) {
                                          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                                        }
                                        setMenuPostId(null);
                                        toast.success(post.isPinned ? "Unpinned Post" : "Pinned Post to top");
                                      })
                                      .catch((err) => {
                                        toast.error(err?.message || "Failed to update post.");
                                      });
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Pin size={13} className="text-slate-400 rotate-45" /> {post.isPinned ? "Unpin Post" : "Pin Post"}
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    apiRequest(`/api/learn-together/posts/${post.id}`, {
                                      method: "PATCH",
                                      body: JSON.stringify({ isDraft: !post.isDraft }),
                                    })
                                      .then((payload) => {
                                        const updated = payload?.data;
                                        if (updated) {
                                          setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                                        }
                                        setMenuPostId(null);
                                        toast.success(post.isDraft ? "Published Post" : "Converted to Draft");
                                      })
                                      .catch((err) => {
                                        toast.error(err?.message || "Failed to update post.");
                                      });
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <FileText size={13} className="text-slate-400" /> {post.isDraft ? "Publish Draft" : "Keep in Drafts"}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openDeleteModal(post);
                                    setMenuPostId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                >
                                  <Trash2 size={13} className="text-rose-400" /> Delete Post
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-0 pb-3 space-y-2 flex-1 flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
                        {post.category}
                      </span>
                      <span className="text-[10px] text-slate-400">• {post.readingTime}</span>
                    </div>

                    <h3 className="text-[14px] font-bold text-slate-800 leading-snug line-clamp-2 group-hover/card:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3 flex-1">
                      {post.content}
                    </p>

                    {/* Tags - show max 3 */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold bg-slate-50 border border-slate-200 text-slate-500 rounded-md px-1.5 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </CardContent>

                  {/* Card Footer: Actions + View */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleLike(post.id);
                        }}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold py-1 px-2.5 rounded-lg border transition-all cursor-pointer ${post.isLiked
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        <Heart size={12} className={post.isLiked ? "fill-rose-500 text-rose-500" : ""} />
                        <span>{post.likes}</span>
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          setViewPost(post);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold py-1 px-2.5 rounded-lg bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-50 cursor-pointer"
                      >
                        <MessageSquare size={12} />
                        <span>{post.comments.length}</span>
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleSave(post.id);
                        }}
                        className={`h-7 w-7 flex items-center justify-center rounded-lg border transition-all cursor-pointer ${post.isSaved
                          ? "bg-amber-50 border-amber-200 text-amber-500"
                          : "bg-white border-slate-200/80 text-slate-400 hover:text-slate-700"
                          }`}
                      >
                        <Bookmark size={12} className={post.isSaved ? "fill-amber-500" : ""} />
                      </button>
                    </div>

                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        setViewPost(post);
                      }}
                      variant="outline"
                      className="text-[11px] font-bold px-4 py-1 h-7 rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                    >
                      View <ArrowRight size={12} className="ml-1" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {postsPayload?.meta && postsPayload.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <span className="text-xs font-semibold text-slate-500">
                Page {postsPayload.meta.page} of {postsPayload.meta.totalPages}
              </span>
              <Button
                variant="outline"
                className="rounded-xl text-xs"
                onClick={() => setCurrentPage((prev) => Math.min(postsPayload.meta.totalPages, prev + 1))}
                disabled={currentPage === postsPayload.meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}

        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-3 space-y-6">




        </div>

      </div>

      {/* ─── Category Grid Section ─── */}
      {/* <div className="mt-12 mb-16">
        <h2 className="text-lg font-bold text-slate-800 font-heading mb-6 flex items-center gap-2">
          <Layers size={18} className="text-indigo-500" /> Browse by Professional Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {CATEGORIES.map((cat, idx) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setActiveSubNav("explore");
                  const element = document.getElementById("trending-carousel");
                  if (element) element.scrollIntoView({ behavior: "smooth" });
                }}
                className={`card-hover p-4 rounded-2xl border text-left bg-white transition-all cursor-pointer ${isSelected
                  ? "border-indigo-500 shadow-md ring-2 ring-indigo-500/10"
                  : "border-slate-200/80"
                  }`}
              >
                <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-600">
                  <Icon size={18} />
                </div>
                <h4 className="font-bold text-slate-800 text-xs mb-1 truncate">{cat.name}</h4>
                <p className="text-[10px] text-slate-400">{cat.count} Resources</p>
              </button>
            );
          })}
        </div>
      </div> */}

      {/* ─── VIEW POST DETAIL MODAL ─── */}
      <Dialog open={!!viewPost} onOpenChange={(open) => { if (!open) setViewPost(null); }}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl rounded-2xl border-slate-200 bg-linear-to-br from-white via-slate-50 to-indigo-50 max-h-[72vh] overflow-y-auto">
          {viewPost && (() => {
            const post = posts.find(p => p.id === viewPost.id) || viewPost;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-indigo-700 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                      {post.author.avatar ? (
                        <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        getInitials(post.author.name)
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{post.author.name}</p>
                      <p className="text-[11px] text-slate-500">{post.author.team} • {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md px-1.5 py-0.5">
                      {post.category}
                    </span>
                    <span className="text-[11px] text-slate-400">• {post.readingTime}</span>
                    {post.isPinned && (
                      <Badge className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-md py-0 text-[9px] font-bold flex items-center gap-0.5">
                        <Pin size={9} className="rotate-45" /> Pinned
                      </Badge>
                    )}
                  </div>
                  <DialogTitle className="text-slate-800 font-heading text-xl font-bold leading-snug">
                    {post.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Full Content */}
                  <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-500 rounded-lg px-2 py-0.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all cursor-pointer"
                        onClick={() => { setSearchQuery(tag); setViewPost(null); }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Media */}
                  {post.type === "video" && post.videoUrl && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                          <Video size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">Tutorial Video Attached</p>
                          <p className="text-[10px] text-slate-400">Click to view tutorial source</p>
                        </div>
                      </div>
                      <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                        Watch Video <ArrowRight size={12} />
                      </a>
                    </div>
                  )}

                  {post.type === "image" && post.videoUrl && (
                    <img src={post.videoUrl} alt={post.title} className="w-full max-h-[400px] object-cover rounded-xl border border-slate-200" />
                  )}

                  {post.type === "file" && post.videoUrl && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between hover:bg-slate-100 transition-all duration-200">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 leading-tight">Document Attached</p>
                          <p className="text-[10px] text-slate-400">Click to view or download file</p>
                        </div>
                      </div>
                      <a href={post.videoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline">
                        View File <ArrowRight size={12} />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl border transition-all cursor-pointer ${post.isLiked
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      <Heart size={14} className={post.isLiked ? "fill-rose-500 text-rose-500" : ""} />
                      <span>{post.likes}</span>
                    </button>
                    <button
                      onClick={() => toggleHelpful(post.id)}
                      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl border transition-all cursor-pointer ${post.isHelpful
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-white border-slate-200/80 text-slate-500 hover:bg-slate-50"
                        }`}
                    >
                      <ThumbsUp size={14} className={post.isHelpful ? "fill-emerald-500 text-emerald-500" : ""} />
                      <span>{post.isHelpful ? "Helpful!" : "Helpful"} ({post.helpfulCount})</span>
                    </button>
                    <button
                      onClick={() => toggleSave(post.id)}
                      className={`inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl border transition-all cursor-pointer ${post.isSaved
                        ? "bg-amber-50 border-amber-200 text-amber-500"
                        : "bg-white border-slate-200/80 text-slate-400 hover:text-slate-700"
                        }`}
                    >
                      <Bookmark size={14} className={post.isSaved ? "fill-amber-500" : ""} />
                      <span>{post.isSaved ? "Saved" : "Save"}</span>
                    </button>
                    <button
                      onClick={() => handleShare(post)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl bg-white border border-slate-200/80 text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      <Share2 size={14} /> Share
                    </button>
                    {canManagePost(post) && (
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => { setViewPost(null); openEditModal(post); }}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => { setViewPost(null); openDeleteModal(post); }}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold py-1.5 px-3.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <MessageSquare size={15} className="text-slate-400" /> Comments ({post.comments.length})
                    </h4>

                    {/* Add comment form */}
                    <div className="flex gap-2.5 items-start">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {getInitials(user?.name)}
                      </div>
                      <div className="flex-1 flex gap-2">
                        <Input
                          type="text"
                          placeholder="Add your thoughts or questions..."
                          value={commentsInputs[post.id] || ""}
                          onChange={(e) => setCommentsInputs({ ...commentsInputs, [post.id]: e.target.value })}
                          className="bg-white border-slate-200 rounded-xl text-xs h-8 py-1 focus-visible:ring-indigo-500/25"
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                        />
                        <Button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-8 text-xs font-semibold px-4 cursor-pointer"
                        >
                          Post
                        </Button>
                      </div>
                    </div>

                    {/* Comments list */}
                    {post.comments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-11">No discussions yet. Be the first to comment!</p>
                    ) : (
                      <div className="space-y-3 pl-10">
                        {post.comments.map((comm) => (
                          <div key={comm.id} className="flex gap-2.5 items-start text-xs group">
                            <div className="h-7 w-7 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 overflow-hidden">
                              {comm.avatar ? (
                                <img src={comm.avatar} alt={comm.author} className="w-full h-full object-cover" />
                              ) : (
                                getInitials(comm.author)
                              )}
                            </div>
                            <div className="flex-1 bg-slate-50 border border-slate-200/50 rounded-xl p-2.5">
                              <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-700">{comm.author}</span>
                                  <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-1 rounded-sm">{comm.role}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-400">{formatCommentTime(comm.time)}</span>
                                  {(comm.author === user?.name || user?.role === "SUPER_ADMIN" || user?.role === "admin") && (
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1.5 transition-opacity">
                                      <button
                                        onClick={() => setEditingComment({ postId: post.id, commentId: comm.id, text: comm.content })}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                      >
                                        <Edit3 size={11} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteComment(post.id, comm.id)}
                                        className="text-slate-400 hover:text-rose-600 transition-colors"
                                      >
                                        <Trash2 size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingComment?.commentId === comm.id ? (
                                <div className="flex flex-col gap-2 mt-1">
                                  <Input
                                    autoFocus
                                    value={editingComment.text}
                                    onChange={e => setEditingComment({ ...editingComment, text: e.target.value })}
                                    className="h-8 text-xs bg-white border-slate-200"
                                    onKeyDown={(e) => { if (e.key === "Enter") { handleEditComment(post.id, comm.id, editingComment.text); setEditingComment(null); } }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingComment(null)}
                                      className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleEditComment(post.id, comm.id, editingComment.text);
                                        setEditingComment(null);
                                      }}
                                      className="text-[10px] bg-indigo-600 text-white px-2.5 py-1 rounded-md font-semibold hover:bg-indigo-700"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-slate-600 leading-normal text-[11.5px]">
                                  {comm.content}
                                  {comm.edited && <span className="text-[9px] italic text-slate-400 ml-1">(edited)</span>}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── CREATE POST MODAL ─── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl rounded-2xl border-slate-200 bg-linear-to-br from-white via-slate-50 to-emerald-50 max-h-[72vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-heading text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-emerald-500" /> Share Learning Insight
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Share tutorials, snippets, workflows or project insights with the entire workspace team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 pt-2">

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Insight Title</Label>
              <Input
                type="text"
                placeholder="e.g. How to prevent memory leaks in useEffect callbacks"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20"
                required
              />
            </div>

            {/* Type & Category Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Resource Type</Label>
                <Select value={newPostType} onValueChange={setNewPostType}>
                  <SelectTrigger className="rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="article" className="text-xs">Article/Snippet</SelectItem>
                    <SelectItem value="video" className="text-xs">Video Tutorial</SelectItem>
                    <SelectItem value="workflow" className="text-xs">AI Workflow Template</SelectItem>
                    <SelectItem value="image" className="text-xs">Image</SelectItem>
                    <SelectItem value="file" className="text-xs">File/Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger className="rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.name} value={c.name} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Media Url Input */}
            {["video", "image", "file"].includes(newPostType) && (
              <div className="space-y-1 animate-slide-down">
                <Label className="text-xs font-bold text-slate-700">
                  {newPostType === "video" ? "Video URL (Loom, Youtube, drive)" :
                    newPostType === "image" ? "Image URL (Imgur, Drive, etc.)" : "File URL (Google Drive, Dropbox, etc.)"}
                </Label>
                <Input
                  type="url"
                  placeholder={newPostType === "video" ? "https://loom.com/share/..." : "https://..."}
                  value={newPostVideoUrl}
                  onChange={(e) => setNewPostVideoUrl(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs"
                />
              </div>
            )}

            {/* Content Textarea */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Insight Description & Body</Label>
              <Textarea
                rows={5}
                placeholder="What did you learn today? Provide details, instructions, or paste your code snippet directly..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs leading-relaxed"
                required
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Tags (comma separated)</Label>
              <Input
                type="text"
                placeholder="React, CSS, Performance, API"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs"
              />
            </div>

            {/* Save as Draft option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDraftCheck"
                checked={isDraftCheck}
                onChange={(e) => setIsDraftCheck(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
              />
              <Label htmlFor="isDraftCheck" className="text-xs font-semibold text-slate-600 cursor-pointer">
                Save to drafts for review first (private to you)
              </Label>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border-slate-200 text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-6 cursor-pointer"
              >
                {isDraftCheck ? "Save Draft" : "Publish Insight"}
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* ─── EDIT POST MODAL ─── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl lg:max-w-3xl rounded-2xl border-slate-200 bg-linear-to-br from-white via-slate-50 to-indigo-50 max-h-[72vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-heading text-lg font-bold flex items-center gap-2">
              <Edit3 size={18} className="text-indigo-500" /> Edit Learning Insight
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditPost} className="space-y-4 pt-2">

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Insight Title</Label>
              <Input
                type="text"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20"
                required
              />
            </div>

            {/* Type & Category Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Resource Type</Label>
                <Select value={newPostType} onValueChange={setNewPostType}>
                  <SelectTrigger className="rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    <SelectItem value="article" className="text-xs">Article/Snippet</SelectItem>
                    <SelectItem value="video" className="text-xs">Video Tutorial</SelectItem>
                    <SelectItem value="workflow" className="text-xs">AI Workflow Template</SelectItem>
                    <SelectItem value="image" className="text-xs">Image</SelectItem>
                    <SelectItem value="file" className="text-xs">File/Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Category</Label>
                <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                  <SelectTrigger className="rounded-xl border-slate-200 bg-white text-xs">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 bg-white">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.name} value={c.name} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Media Url Input */}
            {["video", "image", "file"].includes(newPostType) && (
              <div className="space-y-1 animate-slide-down">
                <Label className="text-xs font-bold text-slate-700">
                  {newPostType === "video" ? "Video URL (Loom, Youtube, drive)" :
                    newPostType === "image" ? "Image URL (Imgur, Drive, etc.)" : "File URL (Google Drive, Dropbox, etc.)"}
                </Label>
                <Input
                  type="url"
                  placeholder={newPostType === "video" ? "https://loom.com/share/..." : "https://..."}
                  value={newPostVideoUrl}
                  onChange={(e) => setNewPostVideoUrl(e.target.value)}
                  className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs"
                />
              </div>
            )}

            {/* Content Textarea */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Insight Description & Body</Label>
              <Textarea
                rows={5}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs leading-relaxed"
                required
              />
            </div>

            {/* Tags Input */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Tags (comma separated)</Label>
              <Input
                type="text"
                value={newPostTags}
                onChange={(e) => setNewPostTags(e.target.value)}
                className="rounded-xl border-slate-200 focus-visible:ring-indigo-500/20 text-xs"
              />
            </div>

            {/* Save as Draft option */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isDraftCheckEdit"
                checked={isDraftCheck}
                onChange={(e) => setIsDraftCheck(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
              />
              <Label htmlFor="isDraftCheckEdit" className="text-xs font-semibold text-slate-600 cursor-pointer">
                Save as draft (make post private/unpublished)
              </Label>
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setActivePost(null);
                }}
                className="rounded-xl border-slate-200 text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold px-6 cursor-pointer"
              >
                Save Changes
              </Button>
            </DialogFooter>

          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE ALERT DIALOG ─── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-2xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 font-heading text-lg font-bold flex items-center gap-2">
              <Trash2 size={18} className="text-rose-500 animate-pulse" /> Delete Learning Insight
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 leading-normal">
              Are you sure you want to delete "{activePost?.title}" permanently? This action cannot be undone and the learning index entry will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 pt-2">
            <AlertDialogCancel
              onClick={() => {
                setIsDeleteOpen(false);
                setActivePost(null);
              }}
              className="rounded-xl border-slate-200 text-xs hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold px-6 cursor-pointer"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default LearnTogether;
