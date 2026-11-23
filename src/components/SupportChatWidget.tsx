import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Globe,
  Headphones,
  MessageSquare,
  PhoneOff,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminCloseSession,
  adminTakeoverSession,
  checkSupportRole,
  fetchAllSupportSessions,
  fetchSupportSession,
  sendAdminReply,
  sendCustomerDraft,
  sendCustomerMessage,
  type SupportMessage,
  type SupportSession,
} from "@/lib/supportChatApi";
import { Magnetic } from "@/components/Magnetic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const SESSION_STORAGE_KEY = "ferhut_support_session_id";

const QUICK_PROMPTS = [
  "Kargom nerede kaldı?",
  "Fiat Egea ne zaman gelir?",
  "Takip kodum çalışmıyor",
  "Şefinle görüşebilir miyim?",
] as const;

type StatusFilter = "all" | "ai" | "admin" | "closed";

const APPLE_SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.85,
};

const MESSAGE_SPRING = {
  type: "spring" as const,
  stiffness: 440,
  damping: 34,
  mass: 0.7,
};

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const created = `sess_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return `sess_${Date.now().toString(36)}`;
  }
}

function createFreshSessionId(): string {
  const created = `sess_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 6)}`;
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, created);
  } catch {
    // ignore storage errors
  }
  return created;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: SupportSession["status"]): string {
  if (status === "admin") return "Canlı Temsilci";
  if (status === "closed") return "Sonlandırıldı";
  return "Stajyer AI";
}

function shortStatusLabel(status: SupportSession["status"]): string {
  if (status === "admin") return "Canlı";
  if (status === "closed") return "Kapalı";
  return "AI";
}

function AppleTypingBubble({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.96 }}
      transition={MESSAGE_SPRING}
      className="flex items-start"
      aria-live="polite"
      aria-label="Stajyer temsilci yazıyor"
    >
      <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border/75 bg-secondary/75 px-3.5 py-2.5 shadow-apple-sm dark:shadow-apple-dark-sm">
        {[0, 1, 2].map((dot) => (
          <motion.span
            key={dot}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/80"
            animate={
              reduced
                ? { opacity: [0.45, 0.95, 0.45] }
                : {
                    y: [0, -3.5, 0],
                    opacity: [0.4, 1, 0.4],
                  }
            }
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: dot * 0.16,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function SupportChatWidget() {
  const prefersReduced = Boolean(useReducedMotion());

  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminClientIp, setAdminClientIp] = useState<string | null>(null);
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "customer">(
    "admin"
  );

  // Customer state
  const [sessionId, setSessionId] = useState<string>(() =>
    getOrCreateSessionId()
  );
  const [customerSession, setCustomerSession] = useState<SupportSession | null>(
    null
  );
  const [optimisticMessage, setOptimisticMessage] =
    useState<SupportMessage | null>(null);
  const [customerInput, setCustomerInput] = useState("");

  useEffect(() => {
    if (!isOpen || isAdmin) return;
    const timer = window.setTimeout(() => {
      sendCustomerDraft(sessionId, customerInput);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [customerInput, isOpen, isAdmin, sessionId]);
  const [customerSending, setCustomerSending] = useState(false);

  // Admin state
  const [allSessions, setAllSessions] = useState<SupportSession[]>([]);
  const [selectedAdminSessionId, setSelectedAdminSessionId] = useState<
    string | null
  >(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adminInput, setAdminInput] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminRefreshing, setAdminRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Check if caller IP is admin on mount (server-verified)
  useEffect(() => {
    checkSupportRole()
      .then(({ isAdmin: admin, clientIp }) => {
        setIsAdmin(admin);
        setAdminClientIp(clientIp ?? null);
      })
      .catch(() => {
        setIsAdmin(false);
        setAdminClientIp(null);
      });
  }, []);

  const refreshCustomer = useCallback(async () => {
    try {
      const { session } = await fetchSupportSession(sessionId);
      setCustomerSession(session);
    } catch {
      // silent polling failure
    }
  }, [sessionId]);

  const refreshAdminSessions = useCallback(
    async (manual = false) => {
      if (!isAdmin) return;
      if (manual) setAdminRefreshing(true);
      try {
        const list = await fetchAllSupportSessions();
        setAllSessions(list);
        setSelectedAdminSessionId((prev) => {
          if (prev && list.some((s) => s.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      } catch {
        if (manual) toast("Oturumlar yenilenemedi.");
      } finally {
        if (manual) setAdminRefreshing(false);
      }
    },
    [isAdmin]
  );

  // Poll active view
  useEffect(() => {
    if (!isOpen && !isAdmin) return;

    if (isAdmin && adminViewMode === "admin") {
      refreshAdminSessions();
      const timer = window.setInterval(() => refreshAdminSessions(false), 1500);
      return () => window.clearInterval(timer);
    }

    if (isOpen) {
      refreshCustomer();
      const timer = window.setInterval(refreshCustomer, 1500);
      return () => window.clearInterval(timer);
    }
  }, [
    isOpen,
    isAdmin,
    adminViewMode,
    refreshAdminSessions,
    refreshCustomer,
  ]);

  // Close panel cleanly on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const filteredAdminSessions = useMemo(() => {
    const q = adminSearch.trim().toLocaleLowerCase("tr-TR");
    return allSessions.filter((sess) => {
      if (statusFilter !== "all" && sess.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const ipMatch = (sess.customerIp || "")
        .toLocaleLowerCase("tr-TR")
        .includes(q);
      const labelMatch = sess.customerLabel
        .toLocaleLowerCase("tr-TR")
        .includes(q);
      const messageMatch = sess.messages.some((m) =>
        m.text.toLocaleLowerCase("tr-TR").includes(q)
      );
      return ipMatch || labelMatch || messageMatch;
    });
  }, [allSessions, adminSearch, statusFilter]);

  const selectedAdminSession =
    allSessions.find((s) => s.id === selectedAdminSessionId) ?? null;

  const customerMessages = useMemo(() => {
    const base = customerSession?.messages ?? [];
    if (!optimisticMessage) return base;
    return [...base, optimisticMessage];
  }, [customerSession, optimisticMessage]);

  const activeMessageCount =
    isAdmin && adminViewMode === "admin"
      ? selectedAdminSession?.messages.length ?? 0
      : customerMessages.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
    });
  }, [
    activeMessageCount,
    customerSending,
    isOpen,
    selectedAdminSessionId,
    prefersReduced,
  ]);

  const dispatchCustomerMessage = useCallback(
    async (rawText: string) => {
      const trimmed = rawText.trim();
      if (!trimmed || customerSending) return;

      const tempMsg: SupportMessage = {
        id: `optimistic-${Date.now()}`,
        sender: "customer",
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      setCustomerSending(true);
      setCustomerInput("");
      setOptimisticMessage(tempMsg);

      try {
        const updated = await sendCustomerMessage(sessionId, trimmed);
        setCustomerSession(updated);
        setOptimisticMessage(null);
      } catch (err) {
        setOptimisticMessage(null);
        setCustomerInput(trimmed);
        toast(err instanceof Error ? err.message : "Mesaj gönderilemedi.");
      } finally {
        setCustomerSending(false);
      }
    },
    [customerSending, sessionId]
  );

  const handleCustomerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await dispatchCustomerMessage(customerInput);
  };

  const handleStartNewCustomerChat = () => {
    const nextId = createFreshSessionId();
    setSessionId(nextId);
    setCustomerSession(null);
    setOptimisticMessage(null);
    setCustomerInput("");
  };

  const handleAdminTakeover = async () => {
    if (!selectedAdminSession || adminBusy) return;
    setAdminBusy(true);
    try {
      const updated = await adminTakeoverSession(selectedAdminSession.id);
      setAllSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
      toast("Sohbet devralındı, artık müşteriyle doğrudan konuşabilirsin.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Devralma başarısız.");
    } finally {
      setAdminBusy(false);
    }
  };

  const handleAdminReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedAdminSession || adminBusy) return;
    const trimmed = adminInput.trim();
    if (!trimmed) return;

    const targetId = selectedAdminSession.id;
    const tempId = `optimistic-admin-${Date.now()}`;
    const optimisticMsg: SupportMessage = {
      id: tempId,
      sender: "admin",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    setAdminBusy(true);
    setAdminInput("");
    setAllSessions((prev) =>
      prev.map((s) =>
        s.id === targetId
          ? {
              ...s,
              status: "admin",
              messages: [...s.messages, optimisticMsg],
              updatedAt: optimisticMsg.createdAt,
            }
          : s
      )
    );

    try {
      const updated = await sendAdminReply(targetId, trimmed);
      setAllSessions((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } catch (err) {
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? { ...s, messages: s.messages.filter((m) => m.id !== tempId) }
            : s
        )
      );
      toast(err instanceof Error ? err.message : "Yanıt gönderilemedi.");
      setAdminInput(trimmed);
    } finally {
      setAdminBusy(false);
    }
  };

  const handleAdminClose = async () => {
    if (!selectedAdminSession || adminBusy) return;
    const closedId = selectedAdminSession.id;
    setAdminBusy(true);
    try {
      await adminCloseSession(closedId);
      setAllSessions((prev) => prev.filter((s) => s.id !== closedId));
      setSelectedAdminSessionId(null);
      toast("Konuşma sonlandırıldı ve silindi.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Konuşma sonlandırılamadı.");
    } finally {
      setAdminBusy(false);
    }
  };

  const statusCounts = useMemo(() => {
    let ai = 0;
    let admin = 0;
    let closed = 0;
    for (const s of allSessions) {
      if (s.status === "admin") admin++;
      else if (s.status === "closed") closed++;
      else ai++;
    }
    return { all: allSessions.length, ai, admin, closed };
  }, [allSessions]);

  const activeSessionsCount = statusCounts.ai + statusCounts.admin;
  const showingAdminPanel = isAdmin && adminViewMode === "admin";

  const filterTabs: Array<{ value: StatusFilter; label: string; count: number }> =
    [
      { value: "all", label: "Tümü", count: statusCounts.all },
      { value: "ai", label: "AI", count: statusCounts.ai },
      { value: "admin", label: "Canlı", count: statusCounts.admin },
      { value: "closed", label: "Kapalı", count: statusCounts.closed },
    ];

  return (
    <>
      {/* Magnetic floating launcher positioned cleanly above AmbientDock */}
      <div className="fixed bottom-[72px] right-6 z-50">
        <Magnetic strength={0.3} maxOffset={8}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border/80 glass-dock px-3.5 text-xs font-medium text-foreground shadow-apple-md dark:shadow-apple-dark-md transition-colors duration-200 hover:border-foreground/20 hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 whitespace-nowrap shrink-0"
            aria-expanded={isOpen}
            aria-label={
              isAdmin
                ? "Müşteri Hizmetleri Yönetici Paneli"
                : "Müşteri Hizmetleri"
            }
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.span
                    key="close-icon"
                    initial={
                      prefersReduced
                        ? { opacity: 0 }
                        : { opacity: 0, rotate: -65, scale: 0.7 }
                    }
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={
                      prefersReduced
                        ? { opacity: 0 }
                        : { opacity: 0, rotate: 65, scale: 0.7 }
                    }
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center justify-center"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="open-icon"
                    initial={
                      prefersReduced
                        ? { opacity: 0 }
                        : { opacity: 0, rotate: 65, scale: 0.7 }
                    }
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={
                      prefersReduced
                        ? { opacity: 0 }
                        : { opacity: 0, rotate: -65, scale: 0.7 }
                    }
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center justify-center"
                  >
                    {isAdmin ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <Headphones className="h-4 w-4 text-primary" />
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>

            <span>{isAdmin ? "Yönetici Paneli" : "Müşteri Hizmetleri"}</span>

            {isAdmin && activeSessionsCount > 0 && (
              <span className="font-mono text-[11px] font-semibold text-primary tabular-nums">
                {activeSessionsCount}
              </span>
            )}
          </button>
        </Magnetic>
      </div>

      {/* Apple-style Spring Snap Chat / Admin Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="support-chat-panel"
            layout={!prefersReduced}
            initial={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.84, y: 18, filter: "blur(6px)" }
            }
            animate={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
            }
            exit={
              prefersReduced
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.88, y: 14, filter: "blur(4px)" }
            }
            transition={
              prefersReduced
                ? { duration: 0.15 }
                : {
                    ...APPLE_SNAP_SPRING,
                    layout: { type: "spring", stiffness: 380, damping: 34 },
                  }
            }
            className={`fixed bottom-[122px] right-6 z-50 flex origin-bottom-right flex-col overflow-hidden rounded-2xl border border-border/80 bg-card text-card-foreground shadow-apple-lg dark:shadow-apple-dark-lg ${
              showingAdminPanel
                ? "h-[min(560px,calc(100vh-10rem))] w-[min(760px,calc(100vw-2rem))]"
                : "h-[min(500px,calc(100vh-10rem))] w-[min(380px,calc(100vw-2rem))]"
            }`}
            role="dialog"
            aria-label={
              showingAdminPanel
                ? "Müşteri Hizmetleri Yönetici Konsolu"
                : "Müşteri Hizmetleri"
            }
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border/80 bg-card/80 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {showingAdminPanel ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <Headphones className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {showingAdminPanel
                      ? "Yönetici Konsolu"
                      : "Müşteri Hizmetleri"}
                  </p>
                  <div className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    {showingAdminPanel ? (
                      <>
                        {adminClientIp && (
                          <>
                            <span className="font-mono tabular-nums text-foreground/80">
                              {adminClientIp}
                            </span>
                            <span aria-hidden="true">·</span>
                          </>
                        )}
                        <span className="tabular-nums">
                          {activeSessionsCount} aktif
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {allSessions.length} kayıt
                        </span>
                      </>
                    ) : (
                      <span>
                        {customerSession
                          ? statusLabel(customerSession.status)
                          : "Stajyer Destek Hattı"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-[11px]"
                    onClick={() =>
                      setAdminViewMode((m) =>
                        m === "admin" ? "customer" : "admin"
                      )
                    }
                  >
                    {showingAdminPanel ? "Müşteri Görünümü" : "Yönetici Paneli"}
                  </Button>
                )}
                {showingAdminPanel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => refreshAdminSessions(true)}
                    disabled={adminRefreshing}
                    aria-label="Oturumları yenile"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${
                        adminRefreshing ? "animate-spin" : ""
                      }`}
                    />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsOpen(false)}
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ADMIN VIEW (212.125.0.52) */}
            {showingAdminPanel ? (
              <div className="grid min-h-0 flex-1 grid-cols-12">
                {/* Left pane: IP history list + search + status filters */}
                <div className="col-span-5 flex min-h-0 flex-col border-r border-border/80 bg-secondary/20">
                  <div className="space-y-2 border-b border-border/70 p-2.5">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="IP veya mesaj ara..."
                        className="h-8 pl-8 pr-7 text-xs"
                        aria-label="IP veya mesaj ara"
                      />
                      {adminSearch && (
                        <button
                          type="button"
                          onClick={() => setAdminSearch("")}
                          className="absolute right-1.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          aria-label="Aramayı temizle"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Interactive segmented filter tabs */}
                    <div
                      className="grid grid-cols-4 gap-0.5 rounded-lg bg-secondary/80 p-0.5"
                      role="tablist"
                      aria-label="Durum filtresi"
                    >
                      {filterTabs.map((tab) => {
                        const active = statusFilter === tab.value;
                        return (
                          <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setStatusFilter(tab.value)}
                            className={`inline-flex items-center justify-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                              active
                                ? "bg-card text-foreground shadow-apple-sm dark:shadow-apple-dark-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <span>{tab.label}</span>
                            <span className="font-mono text-[10px] opacity-70 tabular-nums">
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Scrollable IP session rows */}
                  <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                    {allSessions.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-5 text-center text-xs text-muted-foreground">
                        <Globe className="mb-2 h-5 w-5 opacity-45" />
                        <p className="font-medium text-foreground/80">
                          Henüz ziyaretçi mesajı yok
                        </p>
                        <p className="mt-1 text-[11px]">
                          Kullanıcılar yazdıkça IP adresleri ve geçmişleri
                          burada listelenir.
                        </p>
                      </div>
                    ) : filteredAdminSessions.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center p-5 text-center text-xs text-muted-foreground">
                        <p>Filtreye uyan IP bulunamadı.</p>
                        <button
                          type="button"
                          onClick={() => {
                            setAdminSearch("");
                            setStatusFilter("all");
                          }}
                          className="mt-2 font-medium text-primary hover:underline"
                        >
                          Filtreleri Temizle
                        </button>
                      </div>
                    ) : (
                      filteredAdminSessions.map((sess) => {
                        const lastMsg = sess.messages[sess.messages.length - 1];
                        const active = sess.id === selectedAdminSessionId;
                        const displayIp =
                          sess.customerIp && sess.customerIp !== "unknown"
                            ? sess.customerIp
                            : sess.customerLabel;
                        const isOnline =
                          Boolean(sess.lastSeenAt) &&
                          Date.now() - Date.parse(sess.lastSeenAt!) < 20_000;
                        const hasDraft = Boolean(sess.customerDraft?.trim());

                        return (
                          <button
                            key={sess.id}
                            type="button"
                            onClick={() => setSelectedAdminSessionId(sess.id)}
                            className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 ${
                              active
                                ? "border-primary/45 bg-card shadow-apple-sm dark:shadow-apple-dark-sm"
                                : "border-transparent hover:bg-secondary/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-semibold text-foreground tabular-nums">
                                <span
                                  className={`h-2 w-2 shrink-0 rounded-full ${
                                    isOnline ? "bg-emerald-500" : "bg-zinc-400"
                                  }`}
                                  title={isOnline ? "Çevrimiçi" : "Çevrimdışı"}
                                />
                                <span className="truncate">{displayIp}</span>
                              </span>
                              <span
                                className={`shrink-0 text-[10px] font-semibold ${
                                  isOnline
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {isOnline ? "Çevrimiçi" : "Çevrimdışı"} · {shortStatusLabel(sess.status)}
                              </span>
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                              <span className="truncate">
                                {sess.customerLabel}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums shrink-0">
                                {sess.messages.length} mesaj
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums shrink-0">
                                {formatDateTime(sess.updatedAt)}
                              </span>
                            </div>

                            {hasDraft ? (
                              <p className="mt-1.5 truncate text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                Yazıyor: &ldquo;{sess.customerDraft}&rdquo;
                              </p>
                            ) : (
                              lastMsg && (
                                <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                                  {lastMsg.sender === "customer"
                                    ? "Müşteri: "
                                    : lastMsg.sender === "admin"
                                      ? "Sen: "
                                      : ""}
                                  {lastMsg.text}
                                </p>
                              )
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Right pane: Selected IP conversation history & live controls */}
                <div className="col-span-7 flex min-h-0 flex-col bg-card/40">
                  {!selectedAdminSession ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
                      <MessageSquare className="mb-2 h-6 w-6 opacity-45" />
                      <p className="font-medium text-foreground/80">
                        Geçmişi incelemek için soldan bir IP seç
                      </p>
                      <p className="mt-1 max-w-xs text-[11px]">
                        Seçilen kullanıcının tüm mesaj geçmişini görebilir ve
                        dilediğin anda sohbeti canlı devralabilirsin.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs font-semibold text-foreground tabular-nums">
                            {selectedAdminSession.customerIp &&
                            selectedAdminSession.customerIp !== "unknown"
                              ? selectedAdminSession.customerIp
                              : selectedAdminSession.customerLabel}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span>{selectedAdminSession.customerLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {selectedAdminSession.messages.length} mesaj
                            </span>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 text-[11px] font-medium ${
                            selectedAdminSession.status === "admin"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {statusLabel(selectedAdminSession.status)}
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
                        {selectedAdminSession.messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={
                              prefersReduced
                                ? false
                                : { opacity: 0, y: 6, scale: 0.98 }
                            }
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={MESSAGE_SPRING}
                            className={`flex flex-col ${
                              msg.sender === "system"
                                ? "items-center"
                                : msg.sender === "customer"
                                  ? "items-start"
                                  : "items-end"
                            }`}
                          >
                            {msg.sender === "system" ? (
                              <span className="rounded-lg bg-secondary/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                                {msg.text}
                              </span>
                            ) : (
                              <div
                                className={`max-w-[86%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                  msg.sender === "admin"
                                    ? "rounded-br-md bg-primary text-primary-foreground"
                                    : msg.sender === "ai"
                                      ? "rounded-br-md border border-border/80 bg-secondary/65 text-foreground"
                                      : "rounded-bl-md bg-secondary text-foreground"
                                }`}
                              >
                                <div className="mb-0.5 flex items-center justify-between gap-3 text-[10px] opacity-75">
                                  <span className="font-semibold">
                                    {msg.sender === "customer"
                                      ? selectedAdminSession.customerIp &&
                                        selectedAdminSession.customerIp !==
                                          "unknown"
                                        ? `Müşteri (${selectedAdminSession.customerIp})`
                                        : "Müşteri"
                                      : msg.sender === "admin"
                                        ? "Sen (Yönetici)"
                                        : "Stajyer AI"}
                                  </span>
                                  <span className="font-mono tabular-nums">
                                    {formatTime(msg.createdAt)}
                                  </span>
                                </div>
                                <p className="break-words">{msg.text}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>

                      <Separator />

                      {/* Admin action footer */}
                      <div className="bg-card/80 p-3 space-y-2">
                        {selectedAdminSession.status === "closed" ? (
                          <p className="py-1 text-center text-xs text-muted-foreground">
                            Bu konuşma sonlandırıldı.
                          </p>
                        ) : selectedAdminSession.status === "ai" ? (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="flex-1 gap-1.5 text-xs"
                              disabled={adminBusy}
                              onClick={handleAdminTakeover}
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              <span>Müşteri ile İletişime Geç</span>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="gap-1.5 text-xs"
                              disabled={adminBusy}
                              onClick={handleAdminClose}
                            >
                              <PhoneOff className="h-3.5 w-3.5" />
                              <span>Sonlandır</span>
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <form
                              onSubmit={handleAdminReply}
                              className="flex items-center gap-2"
                            >
                              <Input
                                type="text"
                                value={adminInput}
                                onChange={(e) => setAdminInput(e.target.value)}
                                placeholder="Müşteriye doğrudan yaz..."
                                maxLength={600}
                                disabled={adminBusy}
                                className="h-9 text-xs"
                              />
                              <Button
                                type="submit"
                                size="icon"
                                disabled={adminBusy || !adminInput.trim()}
                                className="h-9 w-9 shrink-0"
                                aria-label="Yanıt gönder"
                              >
                                <Send className="h-3.5 w-3.5" />
                              </Button>
                            </form>
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="h-7 gap-1.5 px-2.5 text-[11px]"
                                disabled={adminBusy}
                                onClick={handleAdminClose}
                              >
                                <PhoneOff className="h-3 w-3" />
                                <span>Konuşmayı Sonlandır</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* CUSTOMER VIEW */
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-2.5">
                  {customerMessages.length === 0 ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl rounded-bl-md border border-border/75 bg-secondary/50 p-3.5 text-xs leading-relaxed text-foreground">
                        <p className="mb-1 font-semibold">Stajyer Temsilci</p>
                        <p className="text-muted-foreground">
                          Selam, benim bugün ilk günüm de... bir şey mi lazım
                          oldu? Gerçi sorsan da tam bilmiyorum ama yaz bakalım.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="px-0.5 text-[11px] font-medium text-muted-foreground">
                          Hızlı soru önerileri
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_PROMPTS.map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              disabled={customerSending}
                              onClick={() => dispatchCustomerMessage(prompt)}
                              className="rounded-xl border border-border/80 bg-card px-2.5 py-1.5 text-left text-[11px] font-medium text-foreground/90 transition-all duration-150 hover:border-primary/45 hover:bg-secondary/70 active:scale-[0.98] disabled:opacity-50"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    customerMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={
                          prefersReduced
                            ? false
                            : { opacity: 0, y: 8, scale: 0.96 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={MESSAGE_SPRING}
                        className={`flex flex-col ${
                          msg.sender === "system"
                            ? "items-center"
                            : msg.sender === "customer"
                              ? "items-end"
                              : "items-start"
                        }`}
                      >
                        {msg.sender === "system" ? (
                          <span className="rounded-lg bg-secondary/70 px-2.5 py-1 text-center text-[11px] text-muted-foreground">
                            {msg.text}
                          </span>
                        ) : (
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              msg.sender === "customer"
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md border border-border/80 bg-secondary/65 text-foreground"
                            }`}
                          >
                            <div className="mb-0.5 flex items-center justify-between gap-3 text-[10px] opacity-75">
                              <span className="font-semibold">
                                {msg.sender === "customer"
                                  ? "Sen"
                                  : msg.sender === "admin"
                                    ? "Canlı Temsilci"
                                    : "Müşteri Hizmetleri"}
                              </span>
                              <span className="font-mono tabular-nums">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                            <p className="break-words">{msg.text}</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}

                  <AnimatePresence>
                    {customerSending && (
                      <AppleTypingBubble reduced={prefersReduced} />
                    )}
                  </AnimatePresence>

                  <div ref={messagesEndRef} />
                </div>

                <Separator />

                {customerSession?.status === "closed" ? (
                  <div className="space-y-2 p-3 text-center">
                    <p className="text-xs text-muted-foreground">
                      Bu konuşma sonlandırıldı.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={handleStartNewCustomerChat}
                    >
                      Yeni Sohbet Başlat
                    </Button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleCustomerSubmit}
                    className="flex items-center gap-2 bg-card/80 p-3"
                  >
                    <Input
                      type="text"
                      value={customerInput}
                      onChange={(e) => setCustomerInput(e.target.value)}
                      placeholder="Sorununu yaz..."
                      maxLength={600}
                      disabled={customerSending}
                      className="h-9 text-xs"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={customerSending || !customerInput.trim()}
                      className="h-9 w-9 shrink-0"
                      aria-label="Mesaj gönder"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
