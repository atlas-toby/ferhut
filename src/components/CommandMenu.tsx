import {
  ArrowUpRight,
  Award,
  Film,
  Home,
  Moon,
  PackageSearch,
  Play,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { MUSEUM_VIDEOS } from "@/data/videos";
import { useTheme } from "@/context/ThemeContext";
import { useAmbient } from "@/context/AmbientContext";
import { usePageTransition } from "@/context/TransitionContext";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const { navigateWithTransition } = usePageTransition();
  const { theme, toggleTheme } = useTheme();
  const {
    commandOpen,
    setCommandOpen,
    audioPlaying,
    toggleAudio,
    snowEnabled,
    toggleSnow,
    clearSnow,
    setHallOfFameOpen,
  } = useAmbient();

  const runAction = (fn: () => void) => {
    setCommandOpen(false);
    fn();
  };

  return (
    <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
      <CommandInput placeholder="Sayfa, video veya ayar ara..." />
      <CommandList>
        <CommandEmpty>Eşleşen bir sonuç bulunamadı.</CommandEmpty>

        <CommandGroup heading="Gezinme">
          <CommandItem
            value="ana sayfa ferhat kargo"
            onSelect={() =>
              runAction(() => {
                navigateWithTransition("/", "Ana Sayfa");
              })
            }
          >
            <Home className="text-muted-foreground" />
            <span>Ana Sayfa</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="sipariş sorgula takip kodu jumpscare"
            onSelect={() =>
              runAction(() => {
                navigateWithTransition("/", "Sipariş Sorgula");
                window.setTimeout(() => {
                  const input = document.getElementById("siparisInput");
                  if (input) {
                    input.scrollIntoView({ behavior: "smooth", block: "center" });
                    input.focus();
                  }
                }, 620);
              })
            }
          >
            <PackageSearch className="text-muted-foreground" />
            <span>Sipariş Sorgula</span>
            <CommandShortcut>Takip</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="operasyon standartları neden ferhat kargo özellikler"
            onSelect={() =>
              runAction(() => {
                navigateWithTransition("/#ozellikler", "Operasyon Standartları");
              })
            }
          >
            <ShieldCheck className="text-muted-foreground" />
            <span>Operasyon Standartları</span>
          </CommandItem>

          <CommandItem
            value="ferhatın müzesi galeri video arşivi"
            onSelect={() =>
              runAction(() =>
                navigateWithTransition("/ferhatmuze", "Ferhat'ın Müzesi")
              )
            }
          >
            <Film className="text-muted-foreground" />
            <span>Ferhat'ın Müzesi</span>
            <CommandShortcut>/ferhatmuze</CommandShortcut>
          </CommandItem>

          <CommandItem
            value="hall of fame onur tablosu galeri"
            onSelect={() => runAction(() => setHallOfFameOpen(true))}
          >
            <Award className="text-muted-foreground" />
            <span>Hall of Fame</span>
          </CommandItem>

          <CommandItem
            value="ferhat patlak zeka ai yapay zeka sohbet"
            onSelect={() =>
              runAction(() => {
                const link = document.createElement("a");
                link.href = "https://ferchat.vercel.app/chat.html";
                link.target = "_blank";
                link.rel = "noreferrer";
                link.click();
              })
            }
          >
            <ArrowUpRight className="text-muted-foreground" />
            <span>Ferhat Patlak Zeka AI</span>
            <CommandShortcut>Dış Bağlantı</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Müze Videoları">
          {MUSEUM_VIDEOS.map((video) => (
            <CommandItem
              key={video.id}
              value={`${video.title} ${video.handle} ${video.tag} ${video.category}`}
              onSelect={() =>
                runAction(() =>
                  navigateWithTransition(
                    `/ferhatmuze?video=${video.id}`,
                    "Ferhat'ın Müzesi"
                  )
                )
              }
            >
              <Play className="text-muted-foreground" />
              <span className="truncate">{video.title}</span>
              <CommandShortcut>{video.tag}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Görünüm ve Ortam">
          <CommandItem
            value="tema değiştir karanlık açık dark light mod"
            onSelect={() =>
              runAction(() => {
                const nextLabel = theme === "dark" ? "Açık Mod" : "Karanlık Mod";
                toggleTheme();
                toast(`${nextLabel} etkinleştirildi`);
              })
            }
          >
            {theme === "dark" ? (
              <Sun className="text-muted-foreground" />
            ) : (
              <Moon className="text-muted-foreground" />
            )}
            <span>
              {theme === "dark" ? "Açık Moda Geç" : "Karanlık Moda Geç"}
            </span>
          </CommandItem>

          <CommandItem
            value="müzik ses arka plan deviricem oynat duraklat"
            onSelect={() =>
              runAction(() => {
                toggleAudio();
              })
            }
          >
            {audioPlaying ? (
              <VolumeX className="text-muted-foreground" />
            ) : (
              <Volume2 className="text-muted-foreground" />
            )}
            <span>
              {audioPlaying ? "Arka Plan Müziğini Duraklat" : "Arka Plan Müziğini Başlat"}
            </span>
          </CommandItem>

          <CommandItem
            value="kar yağışı aç kapat snow"
            onSelect={() =>
              runAction(() => {
                toggleSnow();
                toast(
                  snowEnabled ? "Kar yağışı kapatıldı" : "Kar yağışı açıldı"
                );
              })
            }
          >
            <Snowflake className="text-muted-foreground" />
            <span>{snowEnabled ? "Kar Yağışını Kapat" : "Kar Yağışını Aç"}</span>
          </CommandItem>

          <CommandItem
            value="kar temizle sıfırla erit"
            onSelect={() =>
              runAction(() => {
                clearSnow();
                toast("Biriken kar temizlendi");
              })
            }
          >
            <RotateCcw className="text-muted-foreground" />
            <span>Biriken Karı Temizle</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
