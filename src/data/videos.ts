export type VideoCategory =
  | "Tümü"
  | "Konser"
  | "Akustik"
  | "Ders"
  | "Haber"
  | "Arşiv"
  | "Canlı"
  | "Filo";

export interface MuseumVideo {
  id: string;
  src: string;
  title: string;
  handle: string;
  accent: string;
  tag: string;
  category: Exclude<VideoCategory, "Tümü">;
  description: string;
  year: string;
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  "Tümü",
  "Konser",
  "Akustik",
  "Ders",
  "Haber",
  "Arşiv",
  "Canlı",
  "Filo",
];

export const MUSEUM_VIDEOS: MuseumVideo[] = [
  {
    id: "Ferhat067",
    src: "/mp4/Ferhat067.mp4",
    title: "FerhatC5 Konser",
    handle: "@NEGA_nehal",
    accent: "#E85D04",
    tag: "Konser",
    category: "Konser",
    description: "FerhatC5 sahne performansından unutulmaz canlı kayıt.",
    year: "2024",
  },
  {
    id: "ferhatgurses",
    src: "/mp4/ferhatgurses.mp4",
    title: "Ferhat Türkü Söylüyor..",
    handle: "@FerhatGram",
    accent: "#0D9488",
    tag: "Akustik",
    category: "Akustik",
    description: "Nadir bulunan akustik arşiv kaydı, özel koleksiyon parçası.",
    year: "2024",
  },
  {
    id: "ferhatileLCDdersi",
    src: "/mp4/ferhatileLCDdersi.mp4",
    title: "Ferhat Korkmaz Mikrodenetleyiciler",
    handle: "@INONU_MTAL12TR",
    accent: "#D97706",
    tag: "Ders 01",
    category: "Ders",
    description: "LCD ekran kontrolü ve mikrodenetleyici temelleri üzerine özel ders.",
    year: "2024",
  },
  {
    id: "ferhatdroid",
    src: "/mp4/ferhatdroid.mp4",
    title: "FerhatN100 AI Droid Büyük Bir Tehdit..",
    handle: "@bpthaber_fht2233",
    accent: "#DC2626",
    tag: "Haber",
    category: "Haber",
    description: "FerhatN100 otonom yapay zeka birimi hakkında son dakika bülteni.",
    year: "2024",
  },
  {
    id: "xdersi",
    src: "/mp4/xdersi.mp4",
    title: "Ferhat Bayraktar ile X Dersi",
    handle: "@INONU_MTAL12TR",
    accent: "#2563EB",
    tag: "Ders 02",
    category: "Ders",
    description: "İleri seviye pratik anlatım ve saha notlarıyla ikinci bölüm.",
    year: "2024",
  },
  {
    id: "oeisbirligi_V1",
    src: "/mp4/oeisbirligi_V1.mp4",
    title: "OE İşbirliği",
    handle: "@fht_news",
    accent: "#64748B",
    tag: "Arşiv",
    category: "Arşiv",
    description: "Özel prodüksiyon V1 kurgusuyla yüksek öncelikli arşiv kaydı.",
    year: "2024",
  },
  {
    id: "lcdsummon",
    src: "/mp4/lcdsummon.mp4",
    title: "Ferhat'ın Ayağı Kayıyor!!",
    handle: "@fht_news",
    accent: "#CA8A04",
    tag: "Canlı",
    category: "Canlı",
    description: "Stüdyo çekimleri sırasında kayda geçen beklenmedik canlı an.",
    year: "2024",
  },
  {
    id: "fiategeaileezerhepinizalltakalan",
    src: "/mp4/fiategeaileezerhepinizalltakalan.mp4",
    title: "Fiat Egea ile Ezer Hepinizi Altta Kalan",
    handle: "@fht_news",
    accent: "#16A34A",
    tag: "Filo",
    category: "Filo",
    description: "Ferhat Kargo 1.3 Multijet filosunun resmi saha gösterimi.",
    year: "2024",
  },
];
