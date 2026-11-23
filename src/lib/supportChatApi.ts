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

const ENDPOINT = "/api/support-chat";
const ADMIN_KEY_STORAGE = "ferhut_support_admin_key";

function getStoredAdminKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("admin")?.trim();
    if (fromUrl) {
      window.localStorage.setItem(ADMIN_KEY_STORAGE, fromUrl);
      params.delete("admin");
      const nextSearch = params.toString();
      const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
      window.history.replaceState({}, "", nextUrl);
      return fromUrl;
    }
    return window.localStorage.getItem(ADMIN_KEY_STORAGE)?.trim() || "";
  } catch {
    return "";
  }
}

function buildHeaders(withJson = false): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (withJson) {
    headers["Content-Type"] = "application/json";
  }
  const adminKey = getStoredAdminKey();
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }
  return headers;
}

export async function checkSupportRole(): Promise<{
  isAdmin: boolean;
  clientIp?: string;
}> {
  const res = await fetch(`${ENDPOINT}?action=whoami`, {
    method: "GET",
    headers: buildHeaders(false),
  });
  if (!res.ok) return { isAdmin: false };
  const data = (await res.json()) as { isAdmin?: boolean; clientIp?: string };
  return {
    isAdmin: Boolean(data.isAdmin),
    clientIp: typeof data.clientIp === "string" ? data.clientIp : undefined,
  };
}

export async function fetchSupportSession(
  sessionId: string
): Promise<{ session: SupportSession | null; isAdmin: boolean }> {
  const res = await fetch(
    `${ENDPOINT}?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
      headers: buildHeaders(false),
    }
  );
  if (!res.ok) {
    throw new Error("Sohbet yüklenemedi.");
  }
  return (await res.json()) as {
    session: SupportSession | null;
    isAdmin: boolean;
  };
}

export async function fetchAllSupportSessions(): Promise<SupportSession[]> {
  const res = await fetch(`${ENDPOINT}?action=list`, {
    method: "GET",
    headers: buildHeaders(false),
  });
  if (!res.ok) {
    throw new Error("Oturumlar alınamadı.");
  }
  const data = (await res.json()) as { sessions?: SupportSession[] };
  return Array.isArray(data.sessions) ? data.sessions : [];
}

export async function sendCustomerMessage(
  sessionId: string,
  text: string
): Promise<SupportSession> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      action: "customer_message",
      sessionId,
      text,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    session?: SupportSession;
    error?: string;
  };
  if (!res.ok || !data.session) {
    throw new Error(data.error || "Mesaj gönderilemedi.");
  }
  return data.session;
}

export async function sendCustomerDraft(
  sessionId: string,
  draft: string
): Promise<void> {
  await fetch(ENDPOINT, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      action: "customer_draft",
      sessionId,
      draft,
    }),
  }).catch(() => undefined);
}

export async function adminTakeoverSession(
  sessionId: string
): Promise<SupportSession> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      action: "admin_takeover",
      sessionId,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    session?: SupportSession;
    error?: string;
  };
  if (!res.ok || !data.session) {
    throw new Error(data.error || "Sohbet devralınamadı.");
  }
  return data.session;
}

export async function sendAdminReply(
  sessionId: string,
  text: string
): Promise<SupportSession> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      action: "admin_reply",
      sessionId,
      text,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    session?: SupportSession;
    error?: string;
  };
  if (!res.ok || !data.session) {
    throw new Error(data.error || "Yanıt gönderilemedi.");
  }
  return data.session;
}

export async function adminCloseSession(sessionId: string): Promise<void> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify({
      action: "admin_close",
      sessionId,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    deleted?: boolean;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Konuşma sonlandırılamadı.");
  }
}
