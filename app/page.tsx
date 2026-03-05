"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import Header from "@/components/Header";
import HistoryItem from "@/components/HistoryItem";
import { Linkedin, Twitter } from "lucide-react";
import TypingText from "@/components/TypingText";

type Platform = "x" | "linkedin";

type GeneratedContent = {
  linkedin_post: string;
  x_post: string;
  hashtags: string[];
};

type ContentResponse = {
  message: string;
  contentId: string;
  versionId: string;
  versionNumber: number;
  generatedContent: GeneratedContent;
};

type HistoryApiItem = {
  contentId: string;
  title: string;
  rawContent: string;
  status: "draft" | "published" | "archived";
  createdAt?: string;
  versionId?: string | null;
  versionNumber?: number | null;
  generatedContent?: GeneratedContent | null;
};

type UserProfile = {
  _id: string;
  name: string;
  email: string;
};

type StreamPartialPayload = {
  requestId: string;
  partial?: Partial<GeneratedContent>;
};

type StreamDonePayload = {
  requestId: string;
  contentId: string;
  versionId: string;
  versionNumber: number;
  generatedContent: GeneratedContent;
};

type StreamErrorPayload = {
  requestId: string;
  message: string;
};

type Thread = {
  localId: string;
  title: string;
  rawContent: string;
  createdAt?: string;
  contentId?: string;
  versionId?: string;
  versionNumber?: number;
  status: "draft" | "published";
  generatedContent?: GeneratedContent;
  isLoading: boolean;
  isRegenerating: boolean;
  isSaving: boolean;
  isPosting: boolean;
  editMode: {
    x: boolean;
    linkedin: boolean;
  };
  drafts: {
    x: string;
    linkedin: string;
    hashtags: string;
  };
  error?: string;
};

const API_BASE_URL = "http://localhost:5000/api/content";
const FIXED_USER_ID = "69a58d7216b25145a104f1f5";

const normalizeGeneratedContent = (value?: Partial<GeneratedContent> | null): GeneratedContent => ({
  linkedin_post: String(value?.linkedin_post || "").trim(),
  x_post: String(value?.x_post || "").trim(),
  hashtags: Array.isArray(value?.hashtags)
    ? value.hashtags.map((tag) => String(tag || "").trim().replace(/^#/, "")).filter(Boolean)
    : [],
});

const buildHashtagText = (hashtags: string[]) => hashtags.join(", ");

const parseHashtagText = (text: string) =>
  text
    .split(",")
    .map((tag) => tag.trim().replace(/^#/, ""))
    .filter(Boolean);

const mergeGeneratedContent = (
  currentValue: GeneratedContent | undefined,
  nextValue?: Partial<GeneratedContent> | null
): GeneratedContent => {
  const current = currentValue || {
    linkedin_post: "",
    x_post: "",
    hashtags: [],
  };

  return normalizeGeneratedContent({
    linkedin_post: nextValue?.linkedin_post ?? current.linkedin_post,
    x_post: nextValue?.x_post ?? current.x_post,
    hashtags: Array.isArray(nextValue?.hashtags) ? nextValue.hashtags : current.hashtags,
  });
};

const SkeletonCard = ({ platform }: { platform: "X" | "LinkedIn" }) => {
  const isX = platform === "X";

  return (
    <div
      className={`animate-pulse rounded-xl border p-5 shadow-sm transition-all
      ${
        isX
          ? "bg-black border-slate-800"
          : "bg-blue-50 border-blue-200"
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-slate-300/40" />

        <span
          className={`rounded-md px-2 py-1 text-xs font-medium
          ${
            isX
              ? "bg-slate-800 text-slate-300"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {platform}
        </span>
      </div>

      {/* Content lines */}
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-slate-300/40" />
        <div className="h-3 w-11/12 rounded bg-slate-300/40" />
        <div className="h-3 w-10/12 rounded bg-slate-300/40" />
        <div className="h-3 w-4/5 rounded bg-slate-300/40" />
      </div>

      {/* Hashtag placeholders */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="h-6 w-20 rounded-md bg-slate-300/40" />
        <div className="h-6 w-24 rounded-md bg-slate-300/40" />
        <div className="h-6 w-16 rounded-md bg-slate-300/40" />
      </div>

      {/* Buttons */}
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-16 rounded-md bg-slate-300/40" />
        <div className="h-8 w-16 rounded-md bg-slate-300/40" />
        <div className="h-8 w-16 rounded-md bg-slate-300/40" />
        <div className="h-8 w-20 rounded-md bg-slate-300/40" />
      </div>
    </div>
  );
};

const mapHistoryToThread = (item: HistoryApiItem, index: number): Thread => {
  const generated = item.generatedContent ? normalizeGeneratedContent(item.generatedContent) : undefined;
  const localId = item.contentId ? String(item.contentId) : `history-${index}`;

  return {
    localId,
    title: String(item.title || "Untitled"),
    rawContent: String(item.rawContent || ""),
    createdAt: item.createdAt,
    contentId: item.contentId ? String(item.contentId) : undefined,
    versionId: item.versionId ? String(item.versionId) : undefined,
    versionNumber: item.versionNumber || undefined,
    status: item.status === "published" ? "published" : "draft",
    generatedContent: generated,
    isLoading: false,
    isRegenerating: false,
    isSaving: false,
    isPosting: false,
    editMode: { x: false, linkedin: false },
    drafts: {
      x: generated?.x_post || "",
      linkedin: generated?.linkedin_post || "",
      hashtags: buildHashtagText(generated?.hashtags || []),
    },
  };
};

export default function Home() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isComposerVisible, setIsComposerVisible] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [socketId, setSocketId] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(
    () => title.trim().length > 0 && body.trim().length > 0 && !isSending,
    [title, body, isSending]
  );

  const filteredThreads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return threads;

    return threads.filter((thread) => {
      const hashtags = thread.generatedContent?.hashtags.join(" ").toLowerCase() || "";
      return (
        thread.title.toLowerCase().includes(query) ||
        thread.rawContent.toLowerCase().includes(query) ||
        (thread.generatedContent?.x_post || "").toLowerCase().includes(query) ||
        (thread.generatedContent?.linkedin_post || "").toLowerCase().includes(query) ||
        hashtags.includes(query)
      );
    });
  }, [threads, searchQuery]);

  const scrollToChatBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsBootstrapping(true);
      setInitialError(null);

      try {
        const [userResponse, historyResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/user/${FIXED_USER_ID}`),
          fetch(`${API_BASE_URL}/history/${FIXED_USER_ID}`),
        ]);

        const userPayload: { message?: string; user?: UserProfile } = await userResponse.json();
        const historyPayload: { message?: string; history?: HistoryApiItem[] } = await historyResponse.json();

        if (!userResponse.ok) {
          throw new Error(userPayload.message || "Failed to load user profile.");
        }

        if (!historyResponse.ok) {
          throw new Error(historyPayload.message || "Failed to load chat history.");
        }

        setUserProfile(userPayload.user || null);

        const historyItems = Array.isArray(historyPayload.history) ? historyPayload.history : [];
        setThreads(historyItems.map((item, index) => mapHistoryToThread(item, index)));
      } catch (error) {
        setInitialError(error instanceof Error ? error.message : "Failed to load initial data.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    void loadInitialData();
  }, []);

  useEffect(() => {
    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketId(socket.id || "");
    });

    socket.on("disconnect", () => {
      setSocketId("");
    });

    socket.on("content:stream", (payload: StreamPartialPayload) => {
      if (!payload?.requestId) return;

      setThreads((prev) =>
        prev.map((thread) =>
          thread.localId === payload.requestId
            ? {
                ...thread,
                generatedContent: mergeGeneratedContent(thread.generatedContent, payload.partial),
              }
            : thread
        )
      );

      requestAnimationFrame(scrollToChatBottom);
    });

    socket.on("content:done", (payload: StreamDonePayload) => {
      if (!payload?.requestId) return;

      setThreads((prev) =>
        prev.map((thread) =>
          thread.localId === payload.requestId
            ? {
                ...thread,
                contentId: payload.contentId,
                versionId: payload.versionId,
                versionNumber: payload.versionNumber,
                generatedContent: normalizeGeneratedContent(payload.generatedContent),
                isLoading: false,
              }
            : thread
        )
      );

      requestAnimationFrame(scrollToChatBottom);
    });

    socket.on("content:error", (payload: StreamErrorPayload) => {
      if (!payload?.requestId) return;

      setThreads((prev) =>
        prev.map((thread) =>
          thread.localId === payload.requestId
            ? {
                ...thread,
                isLoading: false,
                error: payload.message || "Failed to generate content.",
              }
            : thread
        )
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const updateThread = (localId: string, updater: (thread: Thread) => Thread) => {
    setThreads((prev) => prev.map((thread) => (thread.localId === localId ? updater(thread) : thread)));
  };

  const getActiveSocketId = async (): Promise<string> => {
    const immediate = socketRef.current?.id || socketId;
    if (immediate) {
      return immediate;
    }

    const socket = socketRef.current;
    if (!socket) {
      return "";
    }

    return await new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        resolve(socket.id || "");
      }, 2000);

      socket.once("connect", () => {
        clearTimeout(timeoutId);
        resolve(socket.id || "");
      });

      if (!socket.connected) {
        socket.connect();
      }
    });
  };

  const sendGenerateRequest = async () => {
    if (!canSend) return;

    const localId = `local-${Date.now()}`;
    const nextThread: Thread = {
      localId,
      title: title.trim(),
      rawContent: body.trim(),
      createdAt: new Date().toISOString(),
      status: "draft",
      generatedContent: {
        linkedin_post: "",
        x_post: "",
        hashtags: [],
      },
      isLoading: true,
      isRegenerating: false,
      isSaving: false,
      isPosting: false,
      editMode: { x: false, linkedin: false },
      drafts: { x: "", linkedin: "", hashtags: "" },
    };

    setThreads((prev) => [...prev, nextThread]);
    setIsSending(true);
    requestAnimationFrame(scrollToChatBottom);

    try {
      const activeSocketId = await getActiveSocketId();

      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: FIXED_USER_ID,
          title: nextThread.title,
          rawContent: nextThread.rawContent,
          socketId: activeSocketId,
          requestId: localId,
        }),
      });

      const data: ContentResponse | { message?: string } = await response.json();

      if (!response.ok || !("generatedContent" in data)) {
        throw new Error(data.message || "Failed to generate content.");
      }

      const generated = normalizeGeneratedContent(data.generatedContent);

      updateThread(localId, (thread) => ({
        ...thread,
        contentId: data.contentId,
        versionId: data.versionId,
        versionNumber: data.versionNumber,
        generatedContent: generated,
        drafts: {
          x: generated.x_post,
          linkedin: generated.linkedin_post,
          hashtags: buildHashtagText(generated.hashtags),
        },
        isLoading: false,
        error: undefined,
      }));

      setTitle("");
      setBody("");
      requestAnimationFrame(scrollToChatBottom);
    } catch (error) {
      updateThread(localId, (thread) => ({
        ...thread,
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to generate content.",
      }));
    } finally {
      setIsSending(false);
    }
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendGenerateRequest();
    }
  };

  const setEditMode = (localId: string, platform: Platform, enabled: boolean) => {
    updateThread(localId, (thread) => {
      const generated = thread.generatedContent ? normalizeGeneratedContent(thread.generatedContent) : undefined;
      return {
        ...thread,
        editMode: {
          ...thread.editMode,
          [platform]: enabled,
        },
        drafts: {
          ...thread.drafts,
          x: thread.drafts.x || generated?.x_post || "",
          linkedin: thread.drafts.linkedin || generated?.linkedin_post || "",
          hashtags: thread.drafts.hashtags || buildHashtagText(generated?.hashtags || []),
        },
      };
    });
  };

  const updateDraft = (localId: string, key: "x" | "linkedin" | "hashtags", value: string) => {
    updateThread(localId, (thread) => ({
      ...thread,
      drafts: {
        ...thread.drafts,
        [key]: value,
      },
    }));
  };

  const saveEditedVersion = async (localId: string) => {
    const thread = threads.find((item) => item.localId === localId);
    if (!thread || !thread.contentId || !thread.generatedContent) return;

    const payload: GeneratedContent = {
      x_post: thread.drafts.x.trim() || thread.generatedContent.x_post,
      linkedin_post: thread.drafts.linkedin.trim() || thread.generatedContent.linkedin_post,
      hashtags: parseHashtagText(thread.drafts.hashtags),
    };

    updateThread(localId, (current) => ({ ...current, isSaving: true, error: undefined }));

    try {
      const response = await fetch(`${API_BASE_URL}/save/${thread.contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generatedContent: payload }),
      });

      const data: ContentResponse | { message?: string } = await response.json();

      if (!response.ok || !("generatedContent" in data)) {
        throw new Error(data.message || "Failed to save content.");
      }

      const generated = normalizeGeneratedContent(data.generatedContent);

      updateThread(localId, (current) => ({
        ...current,
        generatedContent: generated,
        versionId: data.versionId,
        versionNumber: data.versionNumber,
        editMode: { x: false, linkedin: false },
        drafts: {
          x: generated.x_post,
          linkedin: generated.linkedin_post,
          hashtags: buildHashtagText(generated.hashtags),
        },
        isSaving: false,
      }));
    } catch (error) {
      updateThread(localId, (current) => ({
        ...current,
        isSaving: false,
        error: error instanceof Error ? error.message : "Failed to save content.",
      }));
    }
  };

  const regenerateContent = async (localId: string) => {
    const thread = threads.find((item) => item.localId === localId);
    if (!thread || !thread.contentId) return;

    updateThread(localId, (current) => ({
      ...current,
      isRegenerating: true,
      editMode: { x: false, linkedin: false },
      error: undefined,
    }));

    try {
      const response = await fetch(`${API_BASE_URL}/regenerate/${thread.contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data: ContentResponse | { message?: string } = await response.json();

      if (!response.ok || !("generatedContent" in data)) {
        throw new Error(data.message || "Failed to regenerate content.");
      }

      const generated = normalizeGeneratedContent(data.generatedContent);

      updateThread(localId, (current) => ({
        ...current,
        generatedContent: generated,
        versionId: data.versionId,
        versionNumber: data.versionNumber,
        drafts: {
          x: generated.x_post,
          linkedin: generated.linkedin_post,
          hashtags: buildHashtagText(generated.hashtags),
        },
        isRegenerating: false,
      }));
    } catch (error) {
      updateThread(localId, (current) => ({
        ...current,
        isRegenerating: false,
        error: error instanceof Error ? error.message : "Failed to regenerate content.",
      }));
    }
  };

  const postContent = async (localId: string) => {
    const thread = threads.find((item) => item.localId === localId);
    if (!thread || !thread.contentId) return;

    updateThread(localId, (current) => ({ ...current, isPosting: true, error: undefined }));

    try {
      const response = await fetch(`${API_BASE_URL}/post/${thread.contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: thread.versionId }),
      });

      const data: { status?: "draft" | "published"; message?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to post content.");
      }

      updateThread(localId, (current) => ({
        ...current,
        status: data.status === "published" ? "published" : current.status,
        isPosting: false,
      }));
    } catch (error) {
      updateThread(localId, (current) => ({
        ...current,
        isPosting: false,
        error: error instanceof Error ? error.message : "Failed to post content.",
      }));
    }
  };

  const scrollToThread = (localId: string) => {
    setActiveThreadId(localId);
    const target = document.getElementById(`thread-${localId}`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (threads.length === 0) {
      setActiveThreadId(null);
      return;
    }

    if (activeThreadId && threads.some((thread) => thread.localId === activeThreadId)) {
      return;
    }

    setActiveThreadId(threads[threads.length - 1].localId);
  }, [threads, activeThreadId]);

  return (
    <div className="h-screen bg-slate-50 text-slate-900">
      <Header
        query={searchQuery}
        onQueryChange={setSearchQuery}
        isHistoryOpen={isHistoryOpen}
        onToggleHistory={() => setIsHistoryOpen((prev) => !prev)}
        user={
          userProfile
            ? {
                name: userProfile.name,
                email: userProfile.email,
                username: `@${userProfile.email.split("@")[0] || "user"}`,
              }
            : null
        }
      />

      <div className="flex h-[calc(100vh-4rem)] min-h-0">
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-72 pt-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsComposerVisible((prev) => !prev)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {isComposerVisible ? "Hide Input" : "Show Input"}
              </button>
            </div>

            {initialError ? (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {initialError}
              </div>
            ) : null}

            {isBootstrapping ? (
              <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SkeletonCard platform="X" />
                <SkeletonCard platform="LinkedIn" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
                No chats found yet. Enter a heading and body below to generate your first post.
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {filteredThreads.map((thread) => {
                  const hasLivePreview = Boolean(
                    thread.generatedContent &&
                      (thread.generatedContent.x_post ||
                        thread.generatedContent.linkedin_post ||
                        (thread.generatedContent.hashtags || []).length)
                  );

                  return (
                    <section
                      key={thread.localId}
                      id={`thread-${thread.localId}`}
                      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{thread.title || "Untitled"}</h2>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 capitalize">
                            {thread.status}
                          </span>
                          <span className="rounded-md bg-blue-100 px-2 py-1 text-blue-700">
                            v{thread.versionNumber || 1}
                          </span>
                        </div>
                      </div>

                      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User Input</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Heading</p>
                        <p className="mt-1 text-sm text-slate-700">{thread.title}</p>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Content</p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{thread.rawContent}</p>
                      </div>

                      {thread.error ? (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {thread.error}
                        </div>
                      ) : null}

                      {(thread.isLoading || thread.isRegenerating) && !hasLivePreview ? (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                          <SkeletonCard platform="X" />
                          <SkeletonCard platform="LinkedIn" />
                        </div>
                      ) : thread.generatedContent ? (
                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                          {(["x", "linkedin"] as Platform[]).map((platform) => {
                            const isLinkedIn = platform === "linkedin";
                            const isEditing = thread.editMode[platform];
                            const label = isLinkedIn ? "LinkedIn" : "X";
                            const contentText = isLinkedIn
                              ? thread.generatedContent?.linkedin_post || ""
                              : thread.generatedContent?.x_post || "";
                            const draftValue = isLinkedIn ? thread.drafts.linkedin : thread.drafts.x;

                            return (
                              <article
                                key={`${thread.localId}-${platform}`}
                                className={`rounded-lg border p-5 shadow-sm ${
                                  isLinkedIn ? "border-blue-200 bg-blue-50" : "border-slate-800 bg-black text-white"
                                }`}
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {isLinkedIn ? <Linkedin size={16} /> : <Twitter size={16} />}
                                    <span className="text-xs font-semibold uppercase">AI Generated</span>
                                    <span
                                      className={`rounded-md px-2 py-1 text-xs ${
                                        isLinkedIn ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"
                                      }`}
                                    >
                                      {label}
                                    </span>
                                  </div>
                                  <span className="text-xs opacity-70">v{thread.versionNumber || 1}</span>
                                </div>

                                {isEditing ? (
                                  <textarea
                                    value={draftValue}
                                    onChange={(event) => updateDraft(thread.localId, platform, event.target.value)}
                                    className={`mb-4 h-40 w-full resize-none rounded-md border px-3 py-2 text-sm outline-none ${
                                      isLinkedIn
                                        ? "border-blue-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                        : "border-slate-700 bg-slate-900 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                    }`}
                                  />
                                ) : (
                                  <TypingText text={contentText} />
                                )}

                                <div className="mb-4 mt-4">
                                  <label
                                    className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${
                                      isLinkedIn ? "text-blue-700" : "text-slate-300"
                                    }`}
                                  >
                                    Hashtags
                                  </label>
                                  {isEditing ? (
                                    <input
                                      value={thread.drafts.hashtags}
                                      onChange={(event) => updateDraft(thread.localId, "hashtags", event.target.value)}
                                      className={`w-full rounded-md border px-3 py-2 text-sm outline-none ${
                                        isLinkedIn
                                          ? "border-blue-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                          : "border-slate-700 bg-slate-900 text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                                      }`}
                                      placeholder="BrandStrategy, BusinessGrowth"
                                    />
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {(thread.generatedContent?.hashtags || []).length === 0 ? (
                                        <span className={`text-xs ${isLinkedIn ? "text-slate-500" : "text-slate-400"}`}>
                                          No hashtags
                                        </span>
                                      ) : (
                                        (thread.generatedContent?.hashtags || []).map((tag) => (
                                          <span
                                            key={`${thread.localId}-${platform}-tag-${tag}`}
                                            className={`rounded-md px-2 py-1 text-xs ${
                                              isLinkedIn ? "bg-blue-100 text-blue-700" : "bg-slate-800 text-slate-300"
                                            }`}
                                          >
                                            #{tag.replace(/^#/, "")}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void saveEditedVersion(thread.localId)}
                                    disabled={!isEditing || thread.isSaving || thread.isLoading}
                                    className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {thread.isSaving ? "Saving..." : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void postContent(thread.localId)}
                                    disabled={thread.isPosting || thread.isLoading}
                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {thread.isPosting ? "Posting..." : "Post"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditMode(thread.localId, platform, !isEditing)}
                                    disabled={thread.isSaving || thread.isLoading}
                                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isEditing ? "Cancel" : "Modify"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => void regenerateContent(thread.localId)}
                                    disabled={thread.isRegenerating || thread.isLoading}
                                    className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {thread.isRegenerating ? "Regenerating..." : "Regenerate"}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          No generated content available for this request.
                        </div>
                      )}
                    </section>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>
        </main>

        {isHistoryOpen ? (
          <aside className="hidden w-80 shrink-0 border-l border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 lg:flex lg:flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">History</h2>
              <span className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2 py-1 text-xs text-blue-300">
                {filteredThreads.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {filteredThreads.length === 0 ? (
                <p className="rounded-md border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-300">
                  No history yet.
                </p>
              ) : (
                filteredThreads.map((thread) => (
                  <HistoryItem
                    key={`history-${thread.localId}`}
                    onClick={() => scrollToThread(thread.localId)}
                    active={thread.localId === activeThreadId}
                    theme="dark"
                    item={{
                      title: thread.title || "Untitled",
                      createdAt: thread.createdAt || new Date().toISOString(),
                    }}
                  />
                ))
              )}
            </div>
          </aside>
        ) : null}
      </div>

      {isComposerVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-5xl rounded-xl border border-blue-900/70 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-5 shadow-lg shadow-blue-950/40">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-white">Composer</p>
              <button
                type="button"
                onClick={() => setIsComposerVisible(false)}
                className="rounded-md border border-blue-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-blue-200 transition hover:bg-slate-800"
              >
                Hide Input
              </button>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Enter heading"
              className="mb-3 w-full rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder="Enter content body"
              className="h-[120px] w-full resize-none rounded-md border border-blue-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-blue-200">Press Enter to generate content</p>
              <button
                type="button"
                onClick={() => void sendGenerateRequest()}
                disabled={!canSend}
                className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:text-blue-200"
              >
                {isSending ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsComposerVisible(true)}
          className="fixed bottom-6 right-6 z-40 rounded-full border border-blue-500/40 bg-gradient-to-br from-slate-900 to-blue-700 p-4 text-white shadow-lg shadow-blue-900/40 transition hover:from-slate-800 hover:to-blue-600"
          aria-label="Show input"
        >
          +
        </button>
      )}
    </div>
  );
}
