import { useEffect, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Clock,
  Headphones,
  PackageSearch,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useAmbient } from "@/context/AmbientContext";
import { usePageTransition } from "@/context/TransitionContext";
import { smoothScrollTo } from "@/components/SmoothScroll";
import { JumpscareModal } from "@/components/JumpscareModal";
import { FluidReveal } from "@/components/FluidReveal";
import { Magnetic } from "@/components/Magnetic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  const location = useLocation();
  const { pauseAudio, setHallOfFameOpen } = useAmbient();
  const { navigateWithTransition } = usePageTransition();

  const [orderId, setOrderId] = useState("");
  const [orderError, setOrderError] = useState("");
  const [jumpscareOpen, setJumpscareOpen] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  useEffect(() => {
    if (location.hash === "#ozellikler") {
      const timer = window.setTimeout(() => {
        smoothScrollTo("#ozellikler", { offset: -72 });
      }, 120);
      return () => window.clearTimeout(timer);
    }
  }, [location.hash]);

  const handleTrackSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setOrderError("Lütfen geçerli bir sipariş kodu giriniz.");
      return;
    }
    setOrderError("");
    pauseAudio();
    setJumpscareOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Subtle Ambient Top Lighting Gradient */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(ellipse_70%_55%_at_50%_-15%,hsl(var(--primary)/0.11),transparent_70%)] dark:bg-[radial-gradient(ellipse_70%_55%_at_50%_-15%,hsl(var(--primary)/0.14),transparent_70%)]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto w-full max-w-[1240px] px-10 pb-28 pt-28">
        {/* SECTION 1: HERO & ORDER TRACKING */}
        <section className="pt-8 pb-20">
          <div className="grid grid-cols-12 items-stretch gap-12">
            {/* Left Column: Proposition & Order Tracking */}
            <FluidReveal immediate className="col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Ferhat Kargo Lojistik</span>
                <span aria-hidden="true">·</span>
                <span>Türkiye Geneli Dağıtım Ağı</span>
              </div>

              <h1 className="mt-4 font-display text-[54px] font-bold leading-[1.06] tracking-[-0.03em] text-foreground">
                At gibi koşturuyoruz, biz Ferhat Kargo'yuz.
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
                Siparişin hâlâ gelmedi mi? Sipariş kodunu aşağıya girerek
                gönderinin anlık durumunu saniyeler içinde sorgulayabilirsin.
              </p>

              {/* Unified Order Tracking Bar */}
              <form
                onSubmit={handleTrackSubmit}
                className="mt-9 max-w-[540px]"
                noValidate
              >
                <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-apple-md dark:shadow-apple-dark-md transition-all duration-200 focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10">
                  <div className="flex flex-1 items-center gap-3 pl-3">
                    <PackageSearch className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <Input
                      id="siparisInput"
                      type="text"
                      value={orderId}
                      onChange={(e) => {
                        setOrderId(e.target.value);
                        if (orderError) setOrderError("");
                      }}
                      placeholder="Sipariş kodunuzu girin (örn. FHT-067)"
                      className="h-10 border-0 bg-transparent px-0 font-mono text-sm shadow-none focus-visible:ring-0"
                      aria-label="Sipariş kodu"
                    />
                  </div>
                  <Magnetic strength={0.22} maxOffset={5}>
                    <Button type="submit" size="lg" className="h-10 px-6 text-sm">
                      Sorgula
                    </Button>
                  </Magnetic>
                </div>

                <div className="mt-3 flex items-center justify-between px-1">
                  {orderError ? (
                    <p
                      role="alert"
                      className="text-xs font-medium text-destructive"
                    >
                      {orderError}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Hızlı dene:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderId("FHT-067");
                          setOrderError("");
                        }}
                        className="font-mono text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                      >
                        FHT-067
                      </button>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOrderId("EGEA-1300");
                          setOrderError("");
                        }}
                        className="font-mono text-foreground/80 underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                      >
                        EGEA-1300
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </FluidReveal>

            {/* Right Column: Elevated Apple-Style Fleet Showcase Frame */}
            <FluidReveal immediate delay={0.12} className="col-span-5">
              <div className="relative h-full min-h-[400px] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-apple-lg dark:shadow-apple-dark-lg">
                {heroImgError ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-secondary/60 p-8 text-center">
                    <Truck className="h-10 w-10 text-muted-foreground" />
                    <p className="font-display text-lg font-semibold">
                      Fiat Egea 1.3 Multijet Filosu
                    </p>
                  </div>
                ) : (
                  <img
                    src="/img/ferhatkargoegea.png"
                    alt="Ferhat Kargo Fiat Egea filosu"
                    onError={() => setHeroImgError(true)}
                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.02]"
                  />
                )}

                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"
                  aria-hidden="true"
                />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-medium text-white/75">
                    Aktif Operasyon Filosu
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-white">
                    Fiat Egea 1.3 Multijet
                  </h2>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/75">
                    <span>Türkiye Geneli</span>
                    <span aria-hidden="true">·</span>
                    <span>Anti-Batukhan V4</span>
                    <span aria-hidden="true">·</span>
                    <span>Ferhugo-Datachain</span>
                  </div>
                </div>
              </div>
            </FluidReveal>
          </div>

          {/* Quiet Operational Strip below Hero */}
          <FluidReveal immediate delay={0.2}>
            <div className="mt-14 grid grid-cols-3 divide-x divide-border/75 rounded-2xl border border-border/75 bg-card/65 py-5 backdrop-blur-md shadow-apple-sm dark:shadow-apple-dark-sm">
              <div className="px-7">
                <p className="text-xs text-muted-foreground">Aktif Dağıtım Hattı</p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">
                  81 İl Kesintisiz Rota
                </p>
              </div>
              <div className="px-7">
                <p className="text-xs text-muted-foreground">Güvenlik Protokolü</p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">
                  Anti-Batukhan V4 Koruma
                </p>
              </div>
              <div className="px-7">
                <p className="text-xs text-muted-foreground">Saha Destek Birimi</p>
                <p className="mt-1 font-display text-lg font-semibold text-foreground">
                  7/24 Ferhugo-Datachain
                </p>
              </div>
            </div>
          </FluidReveal>
        </section>

        <Separator />

        {/* SECTION 2: OPERASYON STANDARTLARI (ASYMMETRIC BENTO GRID) */}
        <section id="ozellikler" className="scroll-mt-24 py-24">
          <FluidReveal>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-primary">
                  Operasyon Standartları
                </p>
                <h2 className="mt-2 font-display text-[38px] font-bold leading-tight tracking-[-0.025em] text-foreground">
                  Neden Ferhat Kargo
                </h2>
              </div>
              <p className="max-w-sm text-right text-sm leading-relaxed text-muted-foreground">
                Her teslimatta hız, siber savunma ve kesintisiz saha iletişimini
                tek bir çatı altında topluyoruz.
              </p>
            </div>
          </FluidReveal>

          <div className="mt-12 grid grid-cols-12 gap-6">
            {/* Marquee Lead Feature */}
            <FluidReveal delay={0.05} className="col-span-7">
              <Card className="flex h-full flex-col justify-between p-9 hover:-translate-y-0.5 hover:shadow-apple-md dark:hover:shadow-apple-dark-md">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      01 · Hız Protokolü
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="mt-8 font-display text-3xl font-semibold tracking-tight text-foreground">
                    Işık hızında teslimat
                  </h3>
                  <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                    Gönderilerinizi zaman kaybetmeden, en kısa sürede kapınıza
                    ulaştırıyoruz. Şehir içi ve şehirler arası hatlarda
                    kesintisiz Fiat Egea filosu ile durmadan yola çıkıyoruz.
                  </p>
                </div>

                <div className="mt-12 border-t border-border/75 pt-5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ortalama çıkış süresi</span>
                    <span className="font-medium text-foreground">
                      Anında sevk
                    </span>
                  </div>
                </div>
              </Card>
            </FluidReveal>

            {/* Stacked Secondary Features */}
            <div className="col-span-5 flex flex-col gap-6">
              <FluidReveal delay={0.12} className="flex-1">
                <Card className="flex h-full flex-col justify-between p-7 hover:-translate-y-0.5 hover:shadow-apple-md dark:hover:shadow-apple-dark-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      02 · Siber Koruma
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      Güvenlik
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      Anti Batukhan Siber-Attack saldırılarına karşı
                      güvendesiniz. Tüm gönderi kayıtları kapalı devre koruma
                      altındadır.
                    </p>
                  </div>
                </Card>
              </FluidReveal>

              <FluidReveal delay={0.18} className="flex-1">
                <Card className="flex h-full flex-col justify-between p-7 hover:-translate-y-0.5 hover:shadow-apple-md dark:hover:shadow-apple-dark-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      03 · Saha Ekibi
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
                      <Headphones className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      7/24 Destek
                    </h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      Uzman Çavuş Ferhugo-Datachain ekibimiz her an yanınızda,
                      sorularınızı yanıtlamaya hazır.
                    </p>
                  </div>
                </Card>
              </FluidReveal>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION 3: FERHAT EVRENINI KESFET */}
        <section className="py-24">
          <FluidReveal>
            <Card className="relative overflow-hidden p-12 shadow-apple-md dark:shadow-apple-dark-md">
              <div
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative grid grid-cols-12 items-center gap-12">
                <div className="col-span-7">
                  <p className="text-xs font-medium text-primary">
                    Arşiv ve Yapay Zeka
                  </p>
                  <h2 className="mt-2.5 font-display text-[36px] font-bold leading-tight tracking-[-0.025em] text-foreground">
                    Ferhat Evrenini Keşfet
                  </h2>
                  <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                    Ferhat'ın Müzesi'nde tüm video arşivini hover önizleme ile
                    keşfedip anonim yorum bırakabilir, ya da Ferhat Patlak Zeka
                    AI ile doğrudan sohbet edebilirsin.
                  </p>
                </div>

                <div className="col-span-5 flex flex-col gap-3">
                  <Magnetic strength={0.14} maxOffset={5} className="w-full">
                    <Button
                      type="button"
                      size="lg"
                      onClick={() =>
                        navigateWithTransition("/ferhatmuze", "Ferhat'ın Müzesi")
                      }
                      className="h-12 w-full justify-between px-5"
                    >
                      <span>Ferhat'ın Müzesi'ne Gir</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Magnetic>

                  <Magnetic strength={0.14} maxOffset={5} className="w-full">
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="h-12 w-full justify-between px-5"
                    >
                      <a
                        href="https://ferchat.vercel.app/chat.html"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span>Ferhat Patlak Zeka AI</span>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </Button>
                  </Magnetic>

                  <Button
                    type="button"
                    variant="ghost"
                    size="default"
                    onClick={() => setHallOfFameOpen(true)}
                    className="h-10 w-full justify-between px-5 text-muted-foreground hover:text-foreground"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      <span>Hall of Fame Galerisini Aç</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          </FluidReveal>
        </section>

        {/* QUIET APPLE-STYLE FOOTER */}
        <footer className="pt-4">
          <Separator className="mb-8" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">Ferhat Kargo</span>
              <span aria-hidden="true">·</span>
              <span>Ferhat Kargo derler överler.</span>
            </div>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() =>
                  navigateWithTransition("/ferhatmuze", "Ferhat'ın Müzesi")
                }
                className="transition-colors hover:text-foreground"
              >
                Ferhat'ın Müzesi
              </button>
              <button
                type="button"
                onClick={() => setHallOfFameOpen(true)}
                className="transition-colors hover:text-foreground"
              >
                Hall of Fame
              </button>
              <span>Ferhat Kargo Lojistik A.Ş.</span>
            </div>
          </div>
        </footer>
      </main>

      <JumpscareModal
        open={jumpscareOpen}
        onClose={() => setJumpscareOpen(false)}
      />
    </div>
  );
}
