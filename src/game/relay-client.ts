import { pulseMount, type BoardRow, type JoinResult, type PulseResult } from "@/lib/mount-api";

export type RelayHandle = {
  join: (nick: string, password: string, team: number, charId: string) => Promise<JoinResult>;
  close: () => void;
};

type PulseIn = {
  token: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  dxp: number;
  dk: number;
  dd: number;
  dc: number;
  shots: { ox: number; oy: number; oz: number; dx: number; dy: number; dz: number; dmg: number }[];
  fix?: boolean;
};

export type ChatLine = { nick: string; team: number; text: string };

export type RosterPilot = {
  nick: string;
  team: number;
  charId: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  hp: number;
  lvl: number;
  kills: number;
  deaths: number;
  xp: number;
  caps: number;
  ping?: number;
};

type RelayLink = {
  pulse: (body: PulseIn) => Promise<PulseResult>;
  close: () => void;
  chat: (text: string) => void;
  announce: (text: string) => void;
  nop: () => void;
  untilClose: () => Promise<void>;
};

let bound: RelayLink | null = null;
const chatFns = new Set<(line: ChatLine) => void>();
const announceFns = new Set<(text: string) => void>();
const rosterFns = new Set<(pilots: RosterPilot[]) => void>();
const afkFns = new Set<(action: "spawn" | "kill") => void>();
const pingFns = new Set<(rows: { nick: string; ms: number }[]) => void>();

export function bindRelay(next: RelayLink | null) {
  bound?.close();
  bound = next;
}

export function relayBound() {
  return !!bound;
}

export function sendRelayChat(text: string) {
  bound?.chat(text);
}

export function sendRelayAnnounce(text: string) {
  bound?.announce(text);
}

export function onRelayRoster(fn: (pilots: RosterPilot[]) => void) {
  rosterFns.add(fn);
  return () => {
    rosterFns.delete(fn);
  };
}

export function sendRelayNop() {
  bound?.nop();
}

export function dropRelay() {
  bound?.close();
}

export function onRelayAfk(fn: (action: "spawn" | "kill") => void) {
  afkFns.add(fn);
  return () => {
    afkFns.delete(fn);
  };
}

export function onRelayPings(fn: (rows: { nick: string; ms: number }[]) => void) {
  pingFns.add(fn);
  return () => {
    pingFns.delete(fn);
  };
}

export function onRelayAnnounce(fn: (text: string) => void) {
  announceFns.add(fn);
  return () => {
    announceFns.delete(fn);
  };
}

export function onRelayChat(fn: (line: ChatLine) => void) {
  chatFns.add(fn);
  return () => {
    chatFns.delete(fn);
  };
}

export async function netPulse(body: PulseIn): Promise<PulseResult> {
  if (bound) return bound.pulse(body);
  return pulseMount({ data: body });
}

type Waiter = { ok: (msg: Record<string, unknown>) => void; fail: (err: Error) => void };

export function connectRelay(url: string): Promise<RelayHandle & RelayLink> {
  return new Promise((resolve, reject) => {
    let sock: WebSocket;
    try {
      sock = new WebSocket(url);
    } catch {
      reject(new Error("bad address"));
      return;
    }
    const waiters = new Map<number, Waiter>();
    let seq = 1;
    let token = "";
    let opened = false;
    let openedHandle: RelayLink | null = null;
    let markClosed = () => {};
    const untilClose = new Promise<void>((resolve) => {
      markClosed = resolve;
    });
    const timer = window.setTimeout(() => {
      if (!opened) {
        sock.close();
        reject(new Error("timeout"));
      }
    }, 4000);

    function send(op: string, extra: Record<string, unknown>) {
      const id = seq++;
      const payload = JSON.stringify({ op, id, ...extra });
      const done = new Promise<Record<string, unknown>>((ok, fail) => {
        waiters.set(id, { ok, fail });
      });
      sock.send(payload);
      return done;
    }

    sock.addEventListener("open", () => {
      opened = true;
      window.clearTimeout(timer);
      const handle = {
        async join(nick: string, password: string, team: number, charId: string): Promise<JoinResult> {
          const msg = await send("join", { nick, password, team, charId });
          if (msg.ok !== true) return { ok: false, error: String(msg.error || "Join failed.") };
          token = String(msg.token || "");
          const profile = msg.profile as {
            nick: string;
            xp: number;
            kills: number;
            deaths: number;
            caps: number;
            team: number;
            charId: string;
          };
          return { ok: true, token, profile, board: Array.isArray(msg.board) ? (msg.board as BoardRow[]) : [] };
        },
        async pulse(body: PulseIn): Promise<PulseResult> {
          const msg = await send("pulse", body);
          if (!msg.ok) return { ok: false, error: String(msg.error || "Pulse failed.") };
          return msg as unknown as PulseResult;
        },
        chat(text: string) {
          const clean = text.replace(/\s+/g, " ").trim().slice(0, 160);
          if (!token || !clean) return;
          sock.send(JSON.stringify({ op: "chat", id: seq++, token, text: clean }));
        },
        announce(text: string) {
          const clean = text.replace(/\s+/g, " ").trim().slice(0, 180);
          if (!token || !clean) return;
          sock.send(JSON.stringify({ op: "announce", id: seq++, token, text: clean }));
        },
        nop() {
          if (!token || sock.readyState !== WebSocket.OPEN) return;
          void send("nop", { token }).catch(() => {});
        },
        untilClose() {
          return untilClose;
        },
        close() {
          sock.close();
        },
      };
      openedHandle = handle;
      resolve(handle);
    });

    sock.addEventListener("message", (ev) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(String(ev.data)) as Record<string, unknown>;
      } catch {
        return;
      }
      if (msg.op === "ping") {
        if (sock.readyState === WebSocket.OPEN) sock.send(JSON.stringify({ op: "pong", t: msg.t, token }));
        return;
      }
      if (msg.op === "afk" && (msg.action === "spawn" || msg.action === "kill")) {
        for (const fn of afkFns) fn(msg.action);
        return;
      }
      if (msg.op === "pings" && Array.isArray(msg.rows)) {
        const rows = (msg.rows as { nick: string; ms: number }[]).slice(0, 1000);
        for (const fn of pingFns) fn(rows);
        return;
      }
      if (msg.op === "roster" && Array.isArray(msg.pilots)) {
        const pilots = msg.pilots as RosterPilot[];
        for (const fn of rosterFns) fn(pilots);
        return;
      }
      if (msg.op === "announce" && typeof msg.text === "string") {
        const text = msg.text.slice(0, 180);
        for (const fn of announceFns) fn(text);
        return;
      }
      if (msg.op === "chat" && typeof msg.nick === "string" && typeof msg.text === "string") {
        const line = { nick: msg.nick.slice(0, 16), team: Number(msg.team) || 0, text: msg.text.slice(0, 160) };
        for (const fn of chatFns) fn(line);
        return;
      }
      const id = Number(msg.id);
      const waiter = waiters.get(id);
      if (!waiter) return;
      waiters.delete(id);
      waiter.ok(msg);
    });

    sock.addEventListener("error", () => {
      if (!opened) reject(new Error("unreachable"));
    });

    sock.addEventListener("close", () => {
      for (const waiter of waiters.values()) waiter.fail(new Error("closed"));
      waiters.clear();
      if (bound === openedHandle) bound = null;
      markClosed();
    });
  });
}
