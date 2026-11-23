import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Film,
  MessageSquare,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  MUSEUM_VIDEOS,
  VIDEO_CATEGORIES,
  type MuseumVideo,
  type VideoCategory,
} from "@/data/videos";
import {
  deleteComment,
  fetchComments,
  postComment,
  type VideoComment,
} from "@/lib/commentsApi";
import { useAmbient } from "@/context/AmbientContext";
import { usePageTransition } from "@/context/TransitionContext";
import { FluidReveal } from "@/components/FluidReveal";
import { Magnetic } from "@/components/Magnetic";
import { VideoPreviewCard } from "@/components/VideoPreviewCard";
import { CinemaVideoPlayer } from "@/components/CinemaVideoPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MuseumPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { pauseAudio, setHallOfFameOpen } = useAmbient();
  const { navigateWithTransition } = usePageTransition();

  const [selectedCategory, setSelectedCategory] =
    useState<VideoCategory>("Tümü");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<MuseumVideo | null>(null);

  const [comments, setComments] = useState<VideoComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Deep-link support from Cmd+K CommandMenu (?video=<id>)
  useEffect(() => {
    const videoIdParam = searchParams.get("video");
    if (!videoIdParam) return;
    const match = MUSEUM_VIDEOS.find((v) => v.id === videoIdParam);
    if (match) {
      pauseAudio();
      setSelectedVideo(match);
    }
  }, [searchParams, pauseAudio]);

  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase("tr-TR");
    return MUSEUM_VIDEOS.filter((video) => {
      const categoryOk =
        selectedCategory === "Tümü" || video.category === selectedCategory;
      if (!categoryOk) return false;
      if (!q) return true;
      return (
        video.title.toLocaleLowerCase("tr-TR").includes(q) ||
        video.handle.toLocaleLowerCase("tr-TR").includes(q) ||
        video.tag.toLocaleLowerCase("tr-TR").includes(q) ||
        video.description.toLocaleLowerCase("tr-TR").includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const handleOpenVideo = (video: MuseumVideo) => {
    pauseAudio();
    setSelectedVideo(video);
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
    if (searchParams.has("video")) {
      const next = new URLSearchParams(searchParams);
      next.delete("video");
      setSearchParams(next, { replace: true });
    }
  };

  const activeIndex = useMemo(() => {
    if (!selectedVideo) return -1;
    return MUSEUM_VIDEOS.findIndex((v) => v.id === selectedVideo.id);
  }, [selectedVideo]);

  const handleStepVideo = (direction: -1 | 1) => {
    if (activeIndex < 0) return;
    const nextIdx =
      (activeIndex + direction + MUSEUM_VIDEOS.length) % MUSEUM_VIDEOS.length;
    setSelectedVideo(MUSEUM_VIDEOS[nextIdx]);
  };

  useEffect(() => {
    if (!selectedVideo) {
      setComments([]);
      setCommentText("");
      setErrorMsg("");
      return;
    }

    let cancelled = false;
    setLoadingComments(true);
    setErrorMsg("");

    fetchComments(selectedVideo.id)
      .then((list) => {
        if (!cancelled) {
          setComments(list);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMsg("Yorumlar yüklenemedi. Lütfen tekrar deneyin.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingComments(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedVideo]);

  const [username, setUsername] = useState<string>(() => {
    try {
      return localStorage.getItem("ferhut_username") || "";
    } catch {
      return "";
    }
  });
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [pendingComment, setPendingComment] = useState("");

  const submitComment = async (trimmedText: string, authorName: string) => {
    if (!selectedVideo) return;
    setPosting(true);
    setErrorMsg("");

    try {
      const created = await postComment(selectedVideo.id, trimmedText, authorName);
      setComments((prev) => [...prev, created]);
      setCommentText("");
      toast("Yorumun paylaşıldı");
    } catch {
      setErrorMsg("Yorum gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setPosting(false);
    }
  };

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) return;

    const trimmed = commentText.trim();
    if (!trimmed) {
      setErrorMsg("Boş yorum gönderilemez.");
      return;
    }

    if (!username.trim()) {
      setPendingComment(trimmed);
      setNameInput("");
      setNameError("");
      setNameModalOpen(true);
      return;
    }

    await submitComment(trimmed, username);
  };

  const handleSaveUsername = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setNameError("Lütfen geçerli bir isim gir.");
      return;
    }

    try {
      localStorage.setItem("ferhut_username", trimmedName);
    } catch {
      // ignore storage errors
    }

    setUsername(trimmedName);
    setNameModalOpen(false);
    setNameError("");

    if (pendingComment) {
      const toSend = pendingComment;
      setPendingComment("");
      await submitComment(toSend, trimmedName);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedVideo) return;
    try {
      await deleteComment(selectedVideo.id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast("Yorum silindi");
    } catch {
      toast("Yorum silinemedi");
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_65%_50%_at_50%_-15%,hsl(var(--primary)/0.09),transparent_70%)]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto w-full max-w-[1280px] px-10 pb-28 pt-28">
        {/* Curatorial Museum Header */}
        <FluidReveal immediate>
          <div className="flex items-end justify-between gap-8 pb-8">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>FerhatGram Video Arşivi</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {MUSEUM_VIDEOS.length} kayıt
                </span>
                <span aria-hidden="true">·</span>
                <span>Klip önizleme için kartın üzerine gel</span>
              </div>
              <h1 className="mt-3 font-display text-[44px] font-bold leading-[1.08] tracking-[-0.03em] text-foreground">
                Ferhat'ın Müzesi
              </h1>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Magnetic strength={0.22} maxOffset={5}>
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setHallOfFameOpen(true)}
                >
                  <Award className="h-4 w-4 text-primary" />
                  <span>Hall of Fame</span>
                </Button>
              </Magnetic>
              <Magnetic strength={0.22} maxOffset={5}>
                <Button
                  type="button"
                  variant="secondary"
                  size="default"
                  onClick={() => navigateWithTransition("/", "Ana Sayfa")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Ana Sayfa</span>
                </Button>
              </Magnetic>
            </div>
          </div>
        </FluidReveal>

        <Separator />

        {/* Filter Tabs + Instant Search Bar */}
        <FluidReveal immediate delay={0.08}>
          <div className="mt-7 flex items-center justify-between gap-6">
            <Tabs
              value={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v as VideoCategory)}
            >
              <TabsList>
                {VIDEO_CATEGORIES.map((category) => (
                  <TabsTrigger key={category} value={category}>
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="relative w-[300px] shrink-0">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Video, hesap veya etiket ara..."
                className="h-10 pl-10 pr-9 text-sm"
                aria-label="Müzede video ara"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Aramayı temizle"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </FluidReveal>

        {/* Filtered Count Notice */}
        {(selectedCategory !== "Tümü" || searchQuery.trim()) && (
          <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {filteredVideos.length} video gösteriliyor
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("Tümü");
                setSearchQuery("");
              }}
              className="font-medium text-primary transition-opacity hover:opacity-80"
            >
              Filtreleri sıfırla
            </button>
          </div>
        )}

        {/* 4-Column Desktop Video Gallery Grid */}
        {filteredVideos.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center rounded-2xl border border-border/75 bg-card/70 py-20 text-center shadow-apple-sm dark:shadow-apple-dark-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <Film className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
              Aramanla eşleşen kayıt bulunamadı
            </h2>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Farklı bir anahtar kelime deneyebilir veya tüm müze kategorilerini
              yeniden görüntüleyebilirsin.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => {
                setSelectedCategory("Tümü");
                setSearchQuery("");
              }}
            >
              Tüm Videoları Göster
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-4 gap-6">
            {filteredVideos.map((video, index) => (
              <FluidReveal
                key={video.id}
                immediate
                delay={0.04 * Math.min(index, 7)}
                y={12}
              >
                <VideoPreviewCard
                  video={video}
                  index={index}
                  onSelect={handleOpenVideo}
                />
              </FluidReveal>
            ))}
          </div>
        )}
      </main>

      {/* Cinema Video Player & Anonymous Comments Dialog */}
      <Dialog
        open={Boolean(selectedVideo)}
        onOpenChange={(open) => {
          if (!open) handleCloseDialog();
        }}
      >
        <DialogContent className="max-w-[1080px] gap-0 overflow-hidden p-0">
          {selectedVideo && (
            <div className="grid h-[min(640px,calc(100vh-5rem))] grid-cols-12 overflow-hidden">
              {/* Left 7 Columns: Custom Apple Cinema Video Player (strictly height-constrained) */}
              <div className="col-span-7 h-full min-h-0 overflow-hidden">
                <CinemaVideoPlayer
                  src={selectedVideo.src}
                  title={selectedVideo.title}
                  activeIndex={activeIndex}
                  totalCount={MUSEUM_VIDEOS.length}
                  onPrev={() => handleStepVideo(-1)}
                  onNext={() => handleStepVideo(1)}
                />
              </div>

              {/* Right 5 Columns: Curated Details & Anonymous Comments */}
              <div className="col-span-5 flex h-full min-h-0 flex-col overflow-hidden border-l border-border/80 bg-card">
                <DialogHeader className="border-b border-border/75 p-6 pr-14">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>{selectedVideo.tag}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedVideo.handle}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{selectedVideo.year}</span>
                  </div>
                  <DialogTitle className="mt-1 text-xl leading-snug">
                    {selectedVideo.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs leading-relaxed">
                    {selectedVideo.description}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex items-center justify-between px-6 py-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Anonim Yorumlar</span>
                  </span>
                  <span className="font-mono text-[11px] tabular-nums">
                    {loadingComments ? "—" : comments.length}
                  </span>
                </div>

                <Separator />

                <ScrollArea className="flex-1 px-6 py-4">
                  {loadingComments ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="rounded-xl border border-border/60 bg-secondary/40 p-3.5"
                        >
                          <div className="h-3 w-24 rounded-md bg-secondary" />
                          <div className="mt-2.5 h-3.5 w-4/5 rounded-md bg-secondary/80" />
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center text-center">
                      <p className="text-sm font-medium text-foreground">
                        Henüz yorum yok
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        İlk anonim yorumu aşağıdan sen bırakabilirsin.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-2">
                      {comments.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-border/70 bg-secondary/35 p-3.5 transition-colors hover:bg-secondary/55"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground">
                              {c.author}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                {formatTimestamp(c.createdAt)}
                              </span>
                              {c.canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-muted-foreground transition-colors hover:text-destructive"
                                  aria-label="Yorumu sil"
                                  title="Yorumu sil"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1.5 break-words text-sm leading-relaxed text-foreground/90">
                            {c.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                <form onSubmit={handleCommentSubmit} className="p-4">
                  {errorMsg && (
                    <p className="mb-2 text-xs font-medium text-destructive">
                      {errorMsg}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={commentText}
                      onChange={(e) => {
                        setCommentText(e.target.value);
                        if (errorMsg) setErrorMsg("");
                      }}
                      placeholder="Anonim yorum yaz..."
                      maxLength={500}
                      disabled={posting}
                      className="h-10 text-sm"
                    />
                    <Button
                      type="submit"
                      disabled={posting}
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      aria-label="Yorumu paylaş"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Username Required Dialog */}
      <Dialog open={nameModalOpen} onOpenChange={setNameModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adını Belirle</DialogTitle>
            <DialogDescription>
              Yorum yapabilmek için bir kullanıcı adı girmelisin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUsername} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Kullanıcı adın..."
                maxLength={30}
                autoFocus
              />
              {nameError && (
                <p className="text-xs font-medium text-destructive">{nameError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNameModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit">Kaydet ve Paylaş</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
