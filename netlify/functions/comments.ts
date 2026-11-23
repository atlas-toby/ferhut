import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface VideoComment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  createdAt: string;
  ownerIpHash?: string;
  canDelete?: boolean;
}

const MAX_AUTHOR_LENGTH = 30;

function getClientIp(req: Request, context: Context): string {
  const nfIp = req.headers.get("x-nf-client-connection-ip");
  if (nfIp) return nfIp.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return context.ip || "unknown";
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function toClientComment(comment: VideoComment, callerIpHash: string): VideoComment {
  const { ownerIpHash, ...rest } = comment;
  return {
    ...rest,
    canDelete: Boolean(ownerIpHash && ownerIpHash === callerIpHash),
  };
}

const STORE_NAME = "ferhut-comments";
const MAX_TEXT_LENGTH = 500;
const LOCAL_DATA_DIR = path.resolve(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "comments.json");

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

function createSeedComments(videoId: string): VideoComment[] {
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

function upgradeLegacySeeds(
  videoId: string,
  existing: VideoComment[]
): { comments: VideoComment[]; changed: boolean } {
  const hasLegacy = existing.some((c) => c.id.startsWith(`seed-${videoId}-`));
  if (!hasLegacy) {
    return { comments: existing, changed: false };
  }
  const userComments = existing.filter(
    (c) => !c.id.startsWith(`seed-${videoId}-`)
  );
  return {
    comments: [...createSeedComments(videoId), ...userComments],
    changed: true,
  };
}

function generateAnonymousAuthor(): string {
  const digits = crypto.randomInt(1000, 10000);
  return `Anonim #${digits}`;
}

function sanitizeVideoId(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 120);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function readLocalStore(): Record<string, VideoComment[]> {
  try {
    if (!fs.existsSync(LOCAL_DATA_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, VideoComment[]>;
    }
    return {};
  } catch {
    return {};
  }
}

function writeLocalStore(store: Record<string, VideoComment[]>): void {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

async function loadComments(videoId: string): Promise<VideoComment[]> {
  try {
    const store = getStore(STORE_NAME);
    const existing = (await store.get(videoId, { type: "json" })) as
      | VideoComment[]
      | null;
    if (Array.isArray(existing) && existing.length > 0) {
      const upgraded = upgradeLegacySeeds(videoId, existing);
      if (upgraded.changed) {
        await store.setJSON(videoId, upgraded.comments);
      }
      return upgraded.comments;
    }
    const seeded = createSeedComments(videoId);
    await store.setJSON(videoId, seeded);
    return seeded;
  } catch {
    const local = readLocalStore();
    if (Array.isArray(local[videoId]) && local[videoId].length > 0) {
      const upgraded = upgradeLegacySeeds(videoId, local[videoId]);
      if (upgraded.changed) {
        local[videoId] = upgraded.comments;
        writeLocalStore(local);
      }
      return upgraded.comments;
    }
    const seeded = createSeedComments(videoId);
    local[videoId] = seeded;
    writeLocalStore(local);
    return seeded;
  }
}

async function saveComments(
  videoId: string,
  comments: VideoComment[]
): Promise<void> {
  try {
    const store = getStore(STORE_NAME);
    await store.setJSON(videoId, comments);
  } catch {
    const local = readLocalStore();
    local[videoId] = comments;
    writeLocalStore(local);
  }
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const callerIpHash = hashIp(getClientIp(req, context));

  if (req.method === "GET") {
    const url = new URL(req.url);
    const videoId = sanitizeVideoId(url.searchParams.get("videoId"));
    if (!videoId) {
      return jsonResponse({ error: "videoId query parameter is required." }, 400);
    }

    const comments = (await loadComments(videoId)).map((c) =>
      toClientComment(c, callerIpHash)
    );
    return jsonResponse({ comments }, 200);
  }

  if (req.method === "POST") {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body." }, 400);
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const videoId = sanitizeVideoId(
      typeof body.videoId === "string" ? body.videoId : ""
    );
    const rawAuthor = typeof body.author === "string" ? body.author : "";
    const author = rawAuthor.trim();
    const rawText = typeof body.text === "string" ? body.text : "";
    const text = rawText.trim();

    if (!videoId) {
      return jsonResponse({ error: "videoId is required." }, 400);
    }

    if (!author) {
      return jsonResponse({ error: "Yorum yapmak için isim girmelisiniz." }, 400);
    }

    if (author.length > MAX_AUTHOR_LENGTH) {
      return jsonResponse(
        { error: `İsim en fazla ${MAX_AUTHOR_LENGTH} karakter olabilir.` },
        400
      );
    }

    if (!text) {
      return jsonResponse({ error: "Comment text cannot be empty." }, 400);
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return jsonResponse(
        { error: `Comment text cannot exceed ${MAX_TEXT_LENGTH} characters.` },
        400
      );
    }

    const existing = await loadComments(videoId);
    const comment: VideoComment = {
      id: crypto.randomUUID(),
      videoId,
      author,
      text,
      createdAt: new Date().toISOString(),
      ownerIpHash: callerIpHash,
    };

    const updated = [...existing, comment];
    await saveComments(videoId, updated);

    return jsonResponse({ comment: toClientComment(comment, callerIpHash) }, 201);
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const videoId = sanitizeVideoId(url.searchParams.get("videoId"));
    const commentId = (url.searchParams.get("commentId") || "").trim();

    if (!videoId || !commentId) {
      return jsonResponse(
        { error: "videoId and commentId query parameters are required." },
        400
      );
    }

    const existing = await loadComments(videoId);
    const target = existing.find((c) => c.id === commentId);

    if (!target) {
      return jsonResponse({ error: "Yorum bulunamadı." }, 404);
    }

    if (!target.ownerIpHash || target.ownerIpHash !== callerIpHash) {
      return jsonResponse(
        { error: "Bu yorumu sadece yazıldığı IP adresi silebilir." },
        403
      );
    }

    const updated = existing.filter((c) => c.id !== commentId);
    await saveComments(videoId, updated);

    return jsonResponse({ deletedId: commentId }, 200);
  }

  return jsonResponse({ error: "Method not allowed." }, 405);
};
