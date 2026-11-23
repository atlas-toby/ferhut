import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import crypto from "crypto";

interface LocalComment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  createdAt: string;
}

const VIDEO_SEED_MAP: Record<
  string,
  Array<{ author: string; text: string; createdAt: string }>
> = {
  Ferhat067: [
    {
      author: "nehal",
      text: "harbiye acikhava bile bu kadar dolmadi kral mikrofonu yakti",
      createdAt: "2024-12-01T18:12:00.000Z",
    },
    {
      author: "sahne.arkasi_06",
      text: "ses sistemini 1.3 multijet akuyle beslemisler baska aciklamasi yok",
      createdAt: "2024-12-02T20:45:00.000Z",
    },
    {
      author: "biletix.stajyer",
      text: "on sira bileti kargo takip koduyla aliniyormus dogru mu",
      createdAt: "2024-12-04T14:20:00.000Z",
    },
  ],
  ferhatgurses: [
    {
      author: "efkarli.kurye",
      text: "dagitim merkezinde kolileri dizerken aciyorum gozlerim doluyor",
      createdAt: "2024-11-28T21:10:00.000Z",
    },
    {
      author: "bozlak.enjoyer",
      text: "ferhat baba yine baglamayi aglatmis kayip kargo acisi gibi",
      createdAt: "2024-12-01T23:05:00.000Z",
    },
    {
      author: "ferhatgram.arsiv",
      text: "bu kayit devlet arsivlerinde kilitli kasada saklanmali",
      createdAt: "2024-12-05T11:40:00.000Z",
    },
  ],
  ferhatileLCDdersi: [
    {
      author: "inonu.12tr",
      text: "hocam lcd ekranda sadece FERHAT KARGO yaziyor baska kod kabul etmiyor",
      createdAt: "2024-12-02T09:30:00.000Z",
    },
    {
      author: "lehim.ustasi",
      text: "lm555 tahtada duruyor ama benim devre hala isik hizinda yaniyor",
      createdAt: "2024-12-03T15:15:00.000Z",
    },
    {
      author: "pic16f877a",
      text: "dersten sonra mikrodenetleyici kendi kendine egea ilani bakmaya basladi",
      createdAt: "2024-12-06T17:50:00.000Z",
    },
  ],
  ferhatdroid: [
    {
      author: "siber.savunma_v4",
      text: "anti batukhan guvenlik duvari olmasa hepimizi ele gecirmisti",
      createdAt: "2024-12-03T19:00:00.000Z",
    },
    {
      author: "bpthaber.stajyer",
      text: "boston dynamics bu videodan sonra projeyi rafa kaldirmis",
      createdAt: "2024-12-04T22:18:00.000Z",
    },
    {
      author: "ferhugo.datachain",
      text: "yazilim guncellemesi geldi artik sadece kargo teslim edip cay iciyor",
      createdAt: "2024-12-07T08:40:00.000Z",
    },
  ],
  xdersi: [
    {
      author: "arka.sira.notcu",
      text: "x dersinden kaldim ama kargo paketlemede 100 aldim tesekkurler hocam",
      createdAt: "2024-12-01T13:25:00.000Z",
    },
    {
      author: "sinav.haftasi",
      text: "hoca x dedikce siniftaki herkes birbirine bakiyor efsane anlatim",
      createdAt: "2024-12-04T16:10:00.000Z",
    },
    {
      author: "mufredat.disi",
      text: "bu dersi bitiren direkt uzman cavus olarak sahaya iniyormus",
      createdAt: "2024-12-08T10:05:00.000Z",
    },
  ],
  oeisbirligi_V1: [
    {
      author: "v2.bekleyenler",
      text: "v1 boyleyse v2 cikinca internet altyapisi kaldirmaz",
      createdAt: "2024-12-02T19:45:00.000Z",
    },
    {
      author: "kurgu.masasi",
      text: "yilin en beklenmedik isbirligi marvel crossover halt etmis",
      createdAt: "2024-12-05T21:30:00.000Z",
    },
    {
      author: "fht.produksiyon",
      text: "muzede yerini almis bu kurguya oscar vermeyen akademi utansin",
      createdAt: "2024-12-09T12:15:00.000Z",
    },
  ],
  lcdsummon: [
    {
      author: "yercekimi.981",
      text: "newton bu videoyu izlese formulu bastan yazardi",
      createdAt: "2024-12-03T11:20:00.000Z",
    },
    {
      author: "kaygan.zemin_tr",
      text: "lcd cagirayim derken dengesini birakti yine de karizmadan odun yok",
      createdAt: "2024-12-06T14:55:00.000Z",
    },
    {
      author: "kamera.arkasi",
      text: "dusme anini 0.75x hizda izleyin sanatsal bir kareografisi var",
      createdAt: "2024-12-09T20:00:00.000Z",
    },
  ],
  fiategeaileezerhepinizalltakalan: [
    {
      author: "multijet.1300",
      text: "sol seritte selektor yakan beyaz egea gorunce saygi durusuna gectim",
      createdAt: "2024-12-01T16:40:00.000Z",
    },
    {
      author: "kargo.takip_067",
      text: "siparisim isik hizinda geldi kapinin onunde sadece lastik izi vardi",
      createdAt: "2024-12-04T19:12:00.000Z",
    },
    {
      author: "batukhan.stajyer",
      text: "filo gosterimini izledikten sonra kargo sorgulamaya korkar oldum",
      createdAt: "2024-12-08T22:30:00.000Z",
    },
  ],
};

function createSeedComments(videoId: string): LocalComment[] {
  const entries = VIDEO_SEED_MAP[videoId] ?? [
    {
      author: "ferhat.arsiv",
      text: "muze kataloguna yeni eklenen nadir parca",
      createdAt: "2024-12-05T18:00:00.000Z",
    },
    {
      author: "egea.lojistik",
      text: "kalite tesaduf degildir ferhat kargo farki",
      createdAt: "2024-12-07T20:15:00.000Z",
    },
  ];

  return entries.map((entry, idx) => ({
    id: `seed-v2-${videoId}-${idx + 1}`,
    videoId,
    author: entry.author,
    text: entry.text,
    createdAt: entry.createdAt,
  }));
}

function sanitizeVideoId(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120);
}

function localCommentsApiPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, "data");
  const dataFile = path.join(dataDir, "comments.json");

  const readStore = (): Record<string, LocalComment[]> => {
    try {
      if (!fs.existsSync(dataFile)) {
        return {};
      }
      const raw = fs.readFileSync(dataFile, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, LocalComment[]>;
      }
      return {};
    } catch {
      return {};
    }
  };

  const writeStore = (store: Record<string, LocalComment[]>) => {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf-8");
  };

  const loadForVideo = (videoId: string): LocalComment[] => {
    const store = readStore();
    const current = store[videoId];

    // Migrate old generic seeds ("seed-${videoId}-...") to video-specific v2 parody seeds while keeping user comments
    if (Array.isArray(current) && current.length > 0) {
      const hasLegacySeeds = current.some(
        (c) => c.id.startsWith(`seed-${videoId}-`)
      );
      if (!hasLegacySeeds) {
        return current;
      }
      const userComments = current.filter(
        (c) => !c.id.startsWith(`seed-${videoId}-`)
      );
      const upgraded = [...createSeedComments(videoId), ...userComments];
      store[videoId] = upgraded;
      writeStore(store);
      return upgraded;
    }

    const seeded = createSeedComments(videoId);
    store[videoId] = seeded;
    writeStore(store);
    return seeded;
  };

  return {
    name: "local-comments-api",
    configureServer(server) {
      server.middlewares.use("/api/comments", (req, res, next) => {
        if (req.method === "GET") {
          const url = new URL(req.url || "/", "http://localhost");
          const videoId = sanitizeVideoId(url.searchParams.get("videoId"));
          if (!videoId) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(
              JSON.stringify({ error: "videoId query parameter is required." })
            );
            return;
          }
          const comments = loadForVideo(videoId);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ comments }));
          return;
        }

        if (req.method === "POST") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", () => {
            try {
              const payload = JSON.parse(body || "{}");
              const videoId = sanitizeVideoId(
                typeof payload.videoId === "string" ? payload.videoId : ""
              );
              const rawText =
                typeof payload.text === "string"
                  ? payload.text
                  : typeof payload.message === "string"
                    ? payload.message
                    : "";
              const text = rawText.trim().slice(0, 500);

              if (!videoId) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ error: "videoId is required." }));
                return;
              }

              if (!text) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json; charset=utf-8");
                res.end(JSON.stringify({ error: "Comment text is required." }));
                return;
              }

              const digits = crypto.randomInt(1000, 10000);
              const comment: LocalComment = {
                id: crypto.randomUUID(),
                videoId,
                author: `Anonim #${digits}`,
                text,
                createdAt: new Date().toISOString(),
              };

              const existing = loadForVideo(videoId);
              const store = readStore();
              store[videoId] = [...existing, comment];
              writeStore(store);

              res.statusCode = 201;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ comment }));
            } catch {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify({ error: "Invalid JSON payload." }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

function localSupportChatApiPlugin(): Plugin {
  return {
    name: "local-support-chat-api",
    configureServer(server) {
      server.middlewares.use("/api/support-chat", async (req, res, next) => {
        try {
          const mod = await server.ssrLoadModule(
            "/netlify/functions/support-chat.ts"
          );
          const handler = mod.default as (
            request: Request,
            context: { ip?: string }
          ) => Promise<Response>;

          const host = req.headers.host || "localhost:3000";
          const fullUrl = new URL(
            `/api/support-chat${req.url || ""}`,
            `http://${host}`
          );

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === "string") {
              headers.set(key, value);
            } else if (Array.isArray(value)) {
              headers.set(key, value.join(", "));
            }
          }

          let bodyBuffer: Buffer | undefined;
          if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            bodyBuffer = Buffer.concat(chunks);
          }

          const webReq = new Request(fullUrl.toString(), {
            method: req.method || "GET",
            headers,
            body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
          });

          const socketIp = req.socket?.remoteAddress || "127.0.0.1";
          const webRes = await handler(webReq, { ip: socketIp });

          res.statusCode = webRes.status;
          webRes.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          if (webRes.status === 204) {
            res.end();
            return;
          }

          const text = await webRes.text();
          res.end(text);
        } catch (err) {
          console.error("[local-support-chat-api]", err);
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), localCommentsApiPlugin(), localSupportChatApiPlugin()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
