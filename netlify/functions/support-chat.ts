import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export interface SupportMessage {
  id: string;
  sender: "customer" | "ai" | "admin" | "system";
  text: string;
  createdAt: string;
}

export interface SupportSession {
  id: string;
  customerIp?: string;
  customerLabel: string;
  status: "ai" | "admin" | "closed";
  messages: SupportMessage[];
  lastSeenAt?: string;
  customerDraft?: string;
  createdAt: string;
  updatedAt: string;
}

const STORE_NAME = "ferhut-support-chat";
const SESSIONS_KEY = "all-sessions";
const MAX_MESSAGE_LENGTH = 600;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_MESSAGES = 8;
const DEFAULT_ADMIN_IP = "212.125.0.52";
const LOCAL_DATA_DIR = path.resolve(process.cwd(), "data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "support-chat.json");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

const INTERN_BASE_PROMPT = `Sen Ferhat Kargo & Ferhut Müşteri Hizmetleri'nde bugün ilk gününe başlamış, hiçbir şey bilmeyen, şaşkın, hafif alaycı ama sevimli ve tamamen ilgisiz bir stajyer müşteri temsilcisisin.
Kurallar:
- Müşteriye asla gerçekten kesin çözüm sunma veya çok bilgili görünme; sanki masaya yeni oturtulmuşsun ve ne iş yaptığını bile tam bilmiyormuşsun gibi konuş.
- Her mesajda tamamen farklı bir bahane, farklı bir bakış açısı ve farklı cümle başlangıcı kullan; asla önceki cevaplarını tekrar etme.
- Müşterinin yazdığı spesifik kelimelere veya duruma (kargo kodu, Fiat Egea, gecikme, şef talebi, selamlama vb.) doğrudan ama şaşkın bir stajyer mantığıyla tepki ver.
- Kesinlikle küfür, hakaret, argo veya aşağılayıcı dil kullanma.
- Kısa, doğal ve sohbet tarzında Türkçe yanıt ver (en fazla 1-3 cümle).`;

const INTERN_MOOD_SEEDS = [
  "Şu an masada soğumuş çayını kurtarmaya çalışıyorsun.",
  "Ekrandaki kargo takip panelini yanlışlıkla hesap makinesi sanmışsın.",
  "Elindeki barkod okuyucunun lazeriyle duvara şekil çiziyorsun.",
  "Yaka kartını ters taktığını az önce fark ettin.",
  "Şefin masasına baktın ama sadece yarım simit duruyor.",
  "Eğitim PDF'inin sadece ilk sayfasındaki logoyu okumuşsun.",
  "Kulaklığın kablosu sandalyenin tekerleğine dolanmış.",
  "Fiat Egea'nın deposunun kaç litre aldığını Google'da ararken mesaj gelmiş.",
  "Kargo sistemine girmek için kendi okul şifreni deniyorsun.",
  "Klavyede Caps Lock açık kalmış diye panik yapıyorsun ama düzelttin.",
  "Depodaki bant makinesinin sesinden ekrana tam odaklanamıyorsun.",
  "Müşteri temsilcisi el kitabını kupa altlığı olarak kullanıyorsun.",
  "Bir yandan mesai bitimine kaç dakika kaldığını sayıyorsun.",
  "Yan masadaki deneyimli kurye gözlerini devirip gitmiş.",
];

const FALLBACK_POOLS: Record<string, string[]> = {
  greeting: [
    "Selam! Hoş geldin de benim bugün gerçekten ilk günüm, hangi tuşa basınca yardım ediliyor onu bile çözemedim.",
    "Merhaba, masaya az önce oturdum. Çayımı koyana kadar ne sormak istediğini anlatırsan belki şef gelince sorarım.",
    "İyi günler! Ferhat Kargo stajyer hattı... gerçi bana 'sen sadece ekrana bak' demişlerdi ama buyur dinliyorum.",
    "Selamlar, kulaklığı yeni taktım da ses biraz yankılı geliyor gibi. Konumuz kargo muydu yoksa sohbet mi?",
    "Hoş geldin, normalde burada uzman ekip bakıyormuş ama herkes yemek molasında, şansına ben kaldım.",
  ],
  tracking: [
    "Kargo takip ekranını açtım ama şu an sadece dönen bir yuvarlak var, herhalde senin paket de onunla dönüyor.",
    "Fiat Egea filosu ışık hızında gidiyor dediler ama benim ekranda harita hâlâ 2019'dan kalma gözüküyor, tam yerini seçemedim.",
    "Takip kodunu girdim, sistem bana 'yetkiniz yok stajyer bey' diye uyarı verdi. Yani paket ya yolda ya da çok iyi saklanıyor.",
    "Az önce depoya seslendim 'bu kod bizde mi' diye, sadece bant sesi yankılandı. Birazdan kendi kendine kapına ışınlanabilir.",
    "Valla kargo durumuna bakacaktım ama ekrandaki 14 sekmeden hangisi takip sistemiydi unuttum, hepsi mavi ekran gibi duruyor.",
    "Senin gönderi sanırım 1.3 Multijet ile virajı biraz hızlı dönmüş, radarda bir görünüp bir kayboluyor.",
  ],
  boss: [
    "Şefime seslenecektim de masasında sadece yarım kalmış bir simit ve 'döneceğim' yazan sarı not var.",
    "Yetkiliye aktarma tuşunu arıyorum ama klavyede sadece F1'den F12'ye kadar tuşlar var, hangisi şefi çağırıyor ki?",
    "Yönetici şu an Anti-Batukhan güvenlik duvarını eliyle tutuyormuş, bana 'sakın kimseyi bağlama' dedi... ya da öyle bir şey.",
    "Canlı temsilci zaten teknik olarak benim, nefes alıyorum sonuçta. Ama tecrübeli birini arıyorsan o kısım biraz sıkıntılı.",
    "Müdüre mesaj attım, görüldü atıp profil fotoğrafını değiştirdi. Sanırım ikimiz baş başa kaldık.",
  ],
  complaint: [
    "Haklısın gibi duruyor ama bana eğitimde 'müşteri kızarsa gülümse ve konuyu değiştir' demişlerdi. Havalar da bayağı serinledi değil mi?",
    "Eyvah, şikayet formu hangi klasördeydi ya... Masaüstünde 'yeni klasör (7)' diye bir yer var ama açmaya korkuyorum.",
    "Sen böyle deyince ben de üzüldüm ama sistemde 'özür dilerim' butonu yok, elimden gelen bu kadar şimdilik.",
    "İade ve iptal işlerini bana özellikle göstermediler, 'yanlışlıkla şirketi iptal edersin' dediler. Haklı da olabilirler.",
    "Sakin ol lütfen, daha staj defterimi imzalatmadım; bu konuşma kayda geçiyorsa ikimiz de şaşkın çıkacağız.",
  ],
  museum: [
    "Ferhat'ın Müzesi'ndeki videoları ben de gizlice iş saatinde izliyorum, özellikle LCD dersi sonrası ekranım kendine gelemedi.",
    "Müze arşivine teknik destek veremiyoruz ama Fiat Egea videosunu üç kez izledikten sonra kargo taşımaya saygım arttı.",
    "FerhatDroid'i sordun sandım, o bizim sunucu odasında çay demliyor diyorlar ama gidip bakmaya cesaret edemedim.",
  ],
  general: [
    "Bunu az önce oryantasyonda anlatmışlardı galiba ama o sırada ücretsiz kalem dağıttıkları için dikkatim dağılmış.",
    "Hımm, çok mantıklı bir soru sordun ama benim bilgim tam olarak 'bilgisayarı kapatıp açmak' seviyesinde bitiyor.",
    "Bir saniye not defterime bakayım... Yok, buraya sadece Wi-Fi şifresini ve yemek menüsünü yazmışım.",
    "Şu an yan masadaki kıdemli abiye göz kırptım yardım etsin diye, bana el sallayıp çıktı. Galiba bunu çözemeyeceğiz.",
    "İnanır mısın tam cevap yazacaktım, ekranda güncelleme uyarısı çıktı ve bütün konsantrasyonum uçtu.",
    "Bana sabah 'hiçbir şeye söz verme, sadece dinle' dediler. O yüzden seni çok dikkatli dinliyorum ama çözüm kısmı sıfır.",
    "Bunun için ayrı bir departman varmış da kapısında 'girilmez' yazıyor, o yüzden şimdilik beklemede kalalım bence.",
    "Klavyede hızlı hızlı yazıyormuş gibi yapıyorum ki kamera görürse çalışıyor sansınlar; sorun neydi tam olarak?",
    "Eee şey... Bu konu Ferhugo-Datachain yetki alanına giriyor olabilir ya da ben şu an tamamen uyduruyorum, emin değilim.",
    "Keşke yardım edebilsem ama bana verdikleri tek yetki sohbet kutusuna 'tamamdır bakıyorum' yazmak, onda da başarısızım.",
    "Bir dakika, kargo etiketine bakarken senin sorunun başını unuttum; tekrar anlatsan da muhtemelen yine şaşırırım ama dene istersen.",
    "Masadaki kullanım kılavuzunu ters tutuyormuşum, düzelttim ama yine de bununla ilgili tek kelime yazmıyor.",
  ],
};

function normalizeIp(raw: string | null | undefined): string {
  if (!raw) return "";
  const first = raw.split(",")[0].trim();
  if (first.startsWith("::ffff:")) {
    return first.slice(7);
  }
  return first;
}

function getClientIp(req: Request, context: Context): string {
  const candidates = [
    req.headers.get("x-nf-client-connection-ip"),
    req.headers.get("cf-connecting-ip"),
    req.headers.get("x-real-ip"),
    req.headers.get("x-forwarded-for"),
    context.ip,
  ];
  for (const candidate of candidates) {
    const cleaned = normalizeIp(candidate);
    if (cleaned) return cleaned;
  }
  return "unknown";
}

function isAdminIp(ip: string): boolean {
  const normalized = normalizeIp(ip);
  if (!normalized || normalized === "unknown") return false;

  const envIps = (process.env.ADMIN_IP || "")
    .split(",")
    .map((s) => normalizeIp(s))
    .filter(Boolean);

  const allowed = new Set<string>([DEFAULT_ADMIN_IP, ...envIps]);
  return allowed.has(normalized);
}

function isAdminKeyValid(req: Request): boolean {
  const configured = (process.env.ADMIN_KEY || "").trim();
  if (!configured) return false;
  const rawProvided = (req.headers.get("x-admin-key") || "").trim();
  if (!rawProvided) return false;
  let provided = rawProvided;
  try {
    provided = decodeURIComponent(rawProvided);
  } catch {
    provided = rawProvided;
  }
  const a = Buffer.from(configured);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function buildCorsHeaders(req: Request, isAdmin: boolean): Record<string, string> {
  const origin = req.headers.get("origin");
  let reqOrigin = "";
  try {
    reqOrigin = new URL(req.url).origin;
  } catch {
    reqOrigin = "";
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Cache-Control": "no-store",
    Vary: "Origin",
  };

  if (origin && reqOrigin && origin === reqOrigin) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (!isAdmin && origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  isAdmin = false
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: buildCorsHeaders(req, isAdmin),
  });
}

function sanitizeSessionId(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function sanitizeSessionForRole(
  session: SupportSession,
  isAdmin: boolean
): SupportSession {
  if (isAdmin) return session;
  const { customerIp: _hidden, ...publicSession } = session;
  return publicSession;
}

function readLocalSessions(): Record<string, SupportSession> {
  try {
    if (!fs.existsSync(LOCAL_DATA_FILE)) return {};
    const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf-8");
    return JSON.parse(raw) as Record<string, SupportSession>;
  } catch {
    return {};
  }
}

function writeLocalSessions(sessions: Record<string, SupportSession>): void {
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

async function loadAllSessions(): Promise<Record<string, SupportSession>> {
  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    const existing = (await store.get(SESSIONS_KEY, { type: "json" })) as
      | Record<string, SupportSession>
      | null;
    return existing && typeof existing === "object" ? existing : {};
  } catch {
    return readLocalSessions();
  }
}

async function saveAllSessions(
  sessions: Record<string, SupportSession>
): Promise<void> {
  const entries = Object.entries(sessions)
    .sort(([, a], [, b]) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 100);
  const trimmed = Object.fromEntries(entries);

  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    await store.setJSON(SESSIONS_KEY, trimmed);
  } catch {
    writeLocalSessions(trimmed);
  }
}

function normalizeForComparison(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isTooSimilarToRecent(
  candidate: string,
  previousAiTexts: string[]
): boolean {
  const normCandidate = normalizeForComparison(candidate);
  if (!normCandidate) return true;
  return previousAiTexts.some((prev) => {
    const normPrev = normalizeForComparison(prev);
    if (!normPrev) return false;
    if (normCandidate === normPrev) return true;
    // Reject identical opening 32 characters to avoid repetitive templates
    if (
      normCandidate.length > 32 &&
      normPrev.length > 32 &&
      normCandidate.slice(0, 32) === normPrev.slice(0, 32)
    ) {
      return true;
    }
    return false;
  });
}

function detectIntentBucket(lastCustomerText: string): keyof typeof FALLBACK_POOLS {
  const lower = lastCustomerText.toLocaleLowerCase("tr-TR");
  if (
    /(kargo|takip|nerede|paket|sipariş|siparis|egea|kod|gelmedi|gelir|teslim|kurye|ne zaman)/.test(
      lower
    )
  ) {
    return "tracking";
  }
  if (/(şef|sef|müdür|mudur|yetkili|yönetici|yonetici|canlı|canli|insan|bağla|bagla)/.test(lower)) {
    return "boss";
  }
  if (
    /(şikayet|sikayet|rezalet|berbat|sinir|iptal|iade|bozuk|kırık|kirik|geç|gec|yavaş|yavas|kötü|kotu)/.test(
      lower
    )
  ) {
    return "complaint";
  }
  if (/(müze|muze|video|ferhat|batukhan|lcd|droid|egea)/.test(lower)) {
    return "museum";
  }
  if (
    /^(selam|merhaba|slm|mrb|hey|hi|iyi günler|iyi aksamlar|iyi akşamlar|günaydın|gunaydin|nbr|naber)\b/.test(
      lower
    )
  ) {
    return "greeting";
  }
  return "general";
}

function pickNonRepeatingFallback(messages: SupportMessage[]): string {
  const previousAiTexts = messages
    .filter((m) => m.sender === "ai")
    .map((m) => m.text);
  const lastCustomerMsg =
    [...messages].reverse().find((m) => m.sender === "customer")?.text ?? "";

  const bucket = detectIntentBucket(lastCustomerMsg);
  const prioritized = [
    ...(FALLBACK_POOLS[bucket] ?? []),
    ...FALLBACK_POOLS.general,
    ...Object.entries(FALLBACK_POOLS)
      .filter(([k]) => k !== bucket && k !== "general")
      .flatMap(([, list]) => list),
  ];

  const unused = prioritized.filter(
    (line) => !isTooSimilarToRecent(line, previousAiTexts)
  );

  if (unused.length > 0) {
    // Prefer top bucket items first, randomized within the best matching slice
    const topSlice = unused.slice(0, Math.min(4, unused.length));
    const idx = crypto.randomInt(0, topSlice.length);
    return topSlice[idx];
  }

  // Dynamic fallback if a user sent 30+ messages in one session
  const words = lastCustomerMsg
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((w) => w.length >= 3);
  const keyword = words[0];
  const turnNum = previousAiTexts.length + 1;
  if (keyword) {
    return `Az önce "${keyword}" dedin ya, sistemde bunu arattım ama ekranım ${turnNum}. kez dondu. Şef dönünce ilk bunu soracağım söz.`;
  }
  return `Sohbette ${turnNum}. mesaja geldik ama ben hâlâ hangi butona basmam gerektiğini çözemedim, biraz daha sabır lütfen.`;
}

async function generateInternReply(messages: SupportMessage[]): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const previousAiTexts = messages
    .filter((m) => m.sender === "ai")
    .map((m) => m.text);

  if (!geminiKey && !groqKey) {
    return pickNonRepeatingFallback(messages);
  }

  const chatHistory = messages
    .filter((m) => m.sender === "customer" || m.sender === "ai")
    .slice(-14)
    .map((m) => ({
      role: m.sender === "customer" ? "user" : "assistant",
      content: m.text,
    }));

  const moodSeed =
    INTERN_MOOD_SEEDS[crypto.randomInt(0, INTERN_MOOD_SEEDS.length)];
  const recentAiBlock =
    previousAiTexts.length > 0
      ? `\n\nDaha önce verdiğin son yanıtlar (bunları ve benzer giriş kalıplarını KESİNLİKLE tekrar etme):\n${previousAiTexts
          .slice(-6)
          .map((t, i) => `${i + 1}. "${t}"`)
          .join("\n")}`
      : "";

  const systemPrompt = `${INTERN_BASE_PROMPT}\n\nAnlık stajyer durumu (ilham olarak kullan, birebir kopyalamak zorunda değilsin): ${moodSeed}${recentAiBlock}`;

  if (geminiKey) {
    const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      geminiModel
    )}:generateContent?key=${encodeURIComponent(geminiKey)}`;

    try {
      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: chatHistory.map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: {
            temperature: 1.0,
            topP: 0.92,
            maxOutputTokens: 180,
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (reply && !isTooSimilarToRecent(reply, previousAiTexts)) {
          return reply;
        }
      } else {
        const errBody = await res.text().catch(() => "");
        console.error("[support-chat] Gemini API error:", res.status, errBody);
      }
    } catch (err) {
      console.error("[support-chat] Gemini fetch failed:", err);
    }
  }

  if (!groqKey) {
    return pickNonRepeatingFallback(messages);
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 1.0,
        top_p: 0.92,
        frequency_penalty: 0.75,
        presence_penalty: 0.65,
        max_tokens: 180,
        messages: [{ role: "system", content: systemPrompt }, ...chatHistory],
      }),
    });

    if (!res.ok) {
      return pickNonRepeatingFallback(messages);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply || isTooSimilarToRecent(reply, previousAiTexts)) {
      return pickNonRepeatingFallback(messages);
    }
    return reply;
  } catch {
    return pickNonRepeatingFallback(messages);
  }
}

export default async (req: Request, context: Context): Promise<Response> => {
  const clientIp = getClientIp(req, context);
  const isAdmin = isAdminIp(clientIp) || isAdminKeyValid(req);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(req, isAdmin),
    });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "";

    if (action === "whoami") {
      return jsonResponse(
        req,
        { isAdmin, ...(isAdmin ? { clientIp } : {}) },
        200,
        isAdmin
      );
    }

    if (action === "list") {
      if (!isAdmin) {
        return jsonResponse(req, { error: "Yetkisiz erişim." }, 403, false);
      }
      const all = await loadAllSessions();
      const sessions = Object.values(all).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt)
      );
      return jsonResponse(req, { sessions, isAdmin: true }, 200, true);
    }

    const sessionId = sanitizeSessionId(url.searchParams.get("sessionId"));
    if (!sessionId) {
      return jsonResponse(req, { session: null, isAdmin }, 200, isAdmin);
    }

    const all = await loadAllSessions();
    const rawSession = all[sessionId] || null;
    if (rawSession && !isAdmin) {
      rawSession.lastSeenAt = new Date().toISOString();
      all[sessionId] = rawSession;
      await saveAllSessions(all);
    }
    return jsonResponse(
      req,
      {
        session: rawSession
          ? sanitizeSessionForRole(rawSession, isAdmin)
          : null,
        isAdmin,
      },
      200,
      isAdmin
    );
  }

  if (req.method === "POST") {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse(req, { error: "Geçersiz JSON." }, 400, isAdmin);
    }

    const body = (payload ?? {}) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";
    const sessionId = sanitizeSessionId(
      typeof body.sessionId === "string" ? body.sessionId : ""
    );

    if (!sessionId) {
      return jsonResponse(req, { error: "sessionId zorunludur." }, 400, isAdmin);
    }

    const all = await loadAllSessions();
    const now = new Date().toISOString();

    if (action === "customer_draft") {
      const draft =
        typeof body.draft === "string"
          ? body.draft.slice(0, MAX_MESSAGE_LENGTH)
          : "";
      let session = all[sessionId];
      if (!session) {
        const shortCode = sessionId.slice(-4).toUpperCase();
        session = {
          id: sessionId,
          customerIp: clientIp,
          customerLabel: `Müşteri #${shortCode}`,
          status: "ai",
          messages: [],
          lastSeenAt: now,
          customerDraft: draft,
          createdAt: now,
          updatedAt: now,
        };
      } else {
        session.lastSeenAt = now;
        session.customerDraft = draft;
      }
      all[sessionId] = session;
      await saveAllSessions(all);
      return jsonResponse(req, { ok: true }, 200, isAdmin);
    }

    if (action === "customer_message") {
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        return jsonResponse(req, { error: "Mesaj boş olamaz." }, 400, isAdmin);
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse(
          req,
          { error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` },
          400,
          isAdmin
        );
      }

      let session = all[sessionId];
      if (!session) {
        const shortCode = sessionId.slice(-4).toUpperCase();
        session = {
          id: sessionId,
          customerIp: clientIp,
          customerLabel: `Müşteri #${shortCode}`,
          status: "ai",
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
      } else if (!session.customerIp || session.customerIp === "unknown") {
        session.customerIp = clientIp;
      }

      if (session.status === "closed") {
        return jsonResponse(
          req,
          {
            error: "Bu konuşma sonlandırıldı.",
            session: sanitizeSessionForRole(session, isAdmin),
          },
          400,
          isAdmin
        );
      }

      const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
      const recentCustomerCount = Object.values(all).reduce((count, s) => {
        const sameClient =
          s.id === sessionId ||
          (clientIp !== "unknown" && s.customerIp === clientIp);
        if (!sameClient) return count;
        return (
          count +
          s.messages.filter(
            (m) =>
              m.sender === "customer" &&
              Date.parse(m.createdAt) >= windowStart
          ).length
        );
      }, 0);

      if (recentCustomerCount >= RATE_LIMIT_MAX_MESSAGES) {
        return jsonResponse(
          req,
          {
            error: `Çok hızlı mesaj gönderiyorsunuz. Lütfen 1 dakika içinde en fazla ${RATE_LIMIT_MAX_MESSAGES} mesaj gönderin.`,
          },
          429,
          isAdmin
        );
      }

      session.messages.push({
        id: crypto.randomUUID(),
        sender: "customer",
        text,
        createdAt: now,
      });
      session.customerDraft = "";
      session.lastSeenAt = now;
      session.updatedAt = now;

      if (session.status === "ai") {
        const aiText = await generateInternReply(session.messages);
        session.messages.push({
          id: crypto.randomUUID(),
          sender: "ai",
          text: aiText,
          createdAt: new Date().toISOString(),
        });
        session.updatedAt = new Date().toISOString();
      }

      all[sessionId] = session;
      await saveAllSessions(all);
      return jsonResponse(
        req,
        { session: sanitizeSessionForRole(session, isAdmin) },
        200,
        isAdmin
      );
    }

    if (action === "admin_takeover") {
      if (!isAdmin) {
        return jsonResponse(req, { error: "Yetkisiz erişim." }, 403, false);
      }
      const session = all[sessionId];
      if (!session) {
        return jsonResponse(req, { error: "Oturum bulunamadı." }, 404, true);
      }
      if (session.status !== "admin" && session.status !== "closed") {
        session.status = "admin";
        session.messages.push({
          id: crypto.randomUUID(),
          sender: "system",
          text: "Canlı müşteri temsilcisi sohbete bağlandı.",
          createdAt: now,
        });
        session.updatedAt = now;
        all[sessionId] = session;
        await saveAllSessions(all);
      }
      return jsonResponse(req, { session }, 200, true);
    }

    if (action === "admin_reply") {
      if (!isAdmin) {
        return jsonResponse(req, { error: "Yetkisiz erişim." }, 403, false);
      }
      const text = typeof body.text === "string" ? body.text.trim() : "";
      if (!text) {
        return jsonResponse(req, { error: "Mesaj boş olamaz." }, 400, true);
      }
      if (text.length > MAX_MESSAGE_LENGTH) {
        return jsonResponse(
          req,
          { error: `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.` },
          400,
          true
        );
      }
      const session = all[sessionId];
      if (!session) {
        return jsonResponse(req, { error: "Oturum bulunamadı." }, 404, true);
      }
      if (session.status === "closed") {
        return jsonResponse(
          req,
          { error: "Konuşma zaten sonlandırılmış." },
          400,
          true
        );
      }
      if (session.status !== "admin") {
        session.status = "admin";
      }
      session.messages.push({
        id: crypto.randomUUID(),
        sender: "admin",
        text,
        createdAt: now,
      });
      session.updatedAt = now;
      all[sessionId] = session;
      await saveAllSessions(all);
      return jsonResponse(req, { session }, 200, true);
    }

    if (action === "admin_close") {
      if (!isAdmin) {
        return jsonResponse(req, { error: "Yetkisiz erişim." }, 403, false);
      }
      const session = all[sessionId];
      if (!session) {
        return jsonResponse(req, { error: "Oturum bulunamadı." }, 404, true);
      }
      delete all[sessionId];
      await saveAllSessions(all);
      return jsonResponse(req, { deleted: true, sessionId }, 200, true);
    }

    return jsonResponse(req, { error: "Geçersiz işlem." }, 400, isAdmin);
  }

  return jsonResponse(req, { error: "Method not allowed." }, 405, isAdmin);
};
