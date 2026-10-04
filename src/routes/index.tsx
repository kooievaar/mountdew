import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { Eye, List, Map, Maximize2, Settings, Terminal, X } from "lucide-react";
import { CHARACTERS, TEAMS } from "@/game/content";
import type { GameHandle, HudState, Quality } from "@/game/engine";
import { bindRelay, connectRelay, onRelayAfk, onRelayAnnounce, onRelayChat, onRelayPings, onRelayRoster, relayBound, sendRelayChat } from "@/game/relay-client";
import { fetchBoard, joinMount, type BoardRow } from "@/lib/mount-api";

export const Route = createFileRoute("/")({ component: Home });

const REMEMBER = "mountdew.gate.v1";
const REG = "mountdew.reg.v1";
const GFX = "mountdew.gfx";
const RELAY = "mountdew.relay";
const PUBLIC_SITE = "https://mountdew.oops.wtf";
const SERVERS = [
  "wss://mountdew.oops.wtf:8888",
  "wss://mountdew.groups.id:8888",
  "wss://mountdew.tantrum.org:8888",
] as const;
const SERVER_LABEL = ["Primary", "Fallback", "Third"];

function ditherPeak(samples: Float32Array) {
  let peak = 1e-8;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]!));
  return peak;
}

function VolumeKnob({ db, onChange }: { db: number; onChange: (db: number) => void }) {
  const drag = useRef<{ y: number; db: number } | null>(null);
  const angle = -140 + ((db + 60) / 66) * 280;
  return (
    <div className="knob-wrap">
      <button
        type="button"
        className="knob"
        role="slider"
        aria-label="Master volume"
        aria-valuemin={-60}
        aria-valuemax={6}
        aria-valuenow={Math.round(db * 10) / 10}
        style={{ transform: `rotate(${angle}deg)` }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, db };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const next = drag.current.db + (drag.current.y - e.clientY) * 0.18;
          onChange(Math.max(-60, Math.min(6, Math.round(next * 10) / 10)));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onDoubleClick={() => onChange(-3.1)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") onChange(Math.min(6, Math.round((db + 0.5) * 10) / 10));
          if (e.key === "ArrowDown" || e.key === "ArrowLeft") onChange(Math.max(-60, Math.round((db - 0.5) * 10) / 10));
        }}
      >
        <span />
      </button>
      <span>Volume</span>
    </div>
  );
}

const ASCII = ` __  __  ___  _   _ _   _ _____
|  \\/  |/ _ \\| | | | \\ | |_   _|
| |\\/| | | | | | | |  \\| | | |
| |  | | |_| | |_| | |\\  | | |
|_|  |_|\\___/ \\___/|_| \\_| |_|
          D E W`;

function Home() {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameHandle | null>(null);
  const linkStop = useRef<(() => void) | null>(null);
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [relay, setRelay] = useState<string>(SERVERS[0]);
  const [serverLive, setServerLive] = useState<Record<string, number | null>>({});
  const [team, setTeam] = useState(0);
  const [charId, setCharId] = useState("angel");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"login" | "play">("login");
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [hud, setHud] = useState<HudState | null>(null);
  const [tab, setTab] = useState<"help" | "about" | "graphics" | "sound">("help");
  const [chat, setChat] = useState<{ id: number; nick: string; team: number; text: string }[]>([]);
  const [draft, setDraft] = useState("");
  const touch = useRef({ x: 0, y: 0, fire: false, jump: false, act: false, cycle: false, dash: false });
  const chatLogRef = useRef<HTMLDivElement>(null);
  const specRef = useRef<HTMLCanvasElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const meterRefs = useRef<(HTMLElement | null)[]>([]);
  const holdRefs = useRef<(HTMLElement | null)[]>([]);
  const eqRead = useRef<(HTMLElement | null)[]>([]);
  const [strips, setStrips] = useState(
    [0, 1, 2].map(() => ({ fader: 0, pan: 0, trim: 0, hpf: 20, aux: 0, pre: false, mute: false, solo: false, pfl: false, pol: false })),
  );
  const [auxReturn, setAuxReturn] = useState(0);
  const [duck, setDuck] = useState(0.42);
  const [masterDb, setMasterDb] = useState(-3.1);
  const [masterMute, setMasterMute] = useState(false);
  const [eq, setEq] = useState({ hz: 100, low: 0, lowMid: 0, mid: 0, highMid: 0, high: 0 });
  const [eqOn, setEqOn] = useState(true);
  const [desk, setDesk] = useState<"mix" | "tone" | "out">("mix");

  function setMaster(db: number) {
    setMasterDb(db);
    if (!masterMute) gameRef.current?.setVolume(Math.max(0, Math.min(1, 10 ** (db / 20))));
  }

  function toggleMasterMute() {
    const next = !masterMute;
    setMasterMute(next);
    gameRef.current?.setVolume(next ? 0 : Math.max(0, Math.min(1, 10 ** (masterDb / 20))));
  }

  function setEqBand(patch: Partial<typeof eq>) {
    const next = { ...eq, ...patch };
    setEq(next);
    gameRef.current?.setStudio({
      eq: [{ f: next.hz, g: next.low }, { g: next.lowMid }, { g: next.mid }, { g: next.highMid }, { g: next.high }],
      eqOn,
    });
  }

  function toggleEq() {
    const next = !eqOn;
    setEqOn(next);
    gameRef.current?.setStudio({ eqOn: next });
  }

  function sendMix(next = strips, aux = auxReturn, duckTo = duck) {
    const lin = (db: number) => (db <= -60 ? 0 : 10 ** (db / 20));
    gameRef.current?.setMix({
      ch: next.map((s) => ({
        fader: lin(s.fader),
        trim: lin(s.trim),
        pan: s.pan,
        mute: s.mute,
        solo: s.solo,
        pfl: s.pfl,
        pol: s.pol ? -1 : 1,
        hpf: s.hpf < 25 ? 0 : s.hpf,
        aux: s.aux,
        pre: s.pre,
      })),
      auxReturn: aux,
      duck: duckTo,
    });
  }

  function patchStrip(index: number, patch: Partial<(typeof strips)[number]>) {
    const next = strips.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setStrips(next);
    sendMix(next);
  }
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatSeq = useRef(1);

  useEffect(() => {
    if (tab !== "sound" || !hud?.menu) return;
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const viz = gameRef.current?.getStudioViz();
      const meters = gameRef.current?.getMeters();
      if (viz?.centers) {
        viz.centers.forEach((db, i) => {
          const el = eqRead.current[i];
          if (el) el.textContent = `${db >= 0 ? "+" : ""}${db.toFixed(1)} heard`;
        });
      }
      if (meters) {
        for (let i = 0; i < 4; i++) {
          const bar = meterRefs.current[i];
          const hold = holdRefs.current[i];
          if (bar) bar.style.height = `${Math.min(100, meters.peak[i]! * 140)}%`;
          if (hold) hold.style.bottom = `${Math.min(98, meters.hold[i]! * 140)}%`;
        }
      }
      const spec = specRef.current;
      const scope = scopeRef.current;
      if (viz && spec) {
        const g = spec.getContext("2d");
        if (g) {
          const w = spec.width;
          const h = spec.height;
          g.clearRect(0, 0, w, h);
          g.fillStyle = "#140c18";
          g.fillRect(0, 0, w, h);
          const bins = viz.spectrum;
          const nyquist = Math.max(1000, viz.rate / 2);
          const logX = (hz: number) => {
            const min = Math.log(20);
            const max = Math.log(Math.min(20000, nyquist));
            return ((Math.log(Math.min(Math.max(20, hz), nyquist)) - min) / (max - min)) * w;
          };
          if (bins.length) {
            const bars = 64;
            const binHz = nyquist / bins.length;
            g.fillStyle = "#3ec6ff";
            for (let i = 0; i < bars; i++) {
              const hz = 20 * (Math.min(20000, nyquist) / 20) ** (i / (bars - 1));
              const idx = Math.min(bins.length - 1, Math.round(hz / binHz));
              const mag = bins[idx]! / 255;
              const x = logX(hz);
              const bw = Math.max(2, w / bars - 1);
              g.fillRect(x, h - mag * (h - 8), bw, mag * (h - 8));
            }
          }
          g.beginPath();
          g.strokeStyle = viz.eqOn ? "#c6e35a" : "#6a6458";
          g.lineWidth = 2;
          viz.freq.forEach((hz, i) => {
            const db = Math.max(-18, Math.min(18, 20 * Math.log10(Math.max(1e-4, viz.eq[i]!))));
            const x = logX(hz);
            const y = h * 0.5 - (db / 18) * (h * 0.45);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          });
          g.stroke();
        }
      }
      if (viz && scope) {
        const g = scope.getContext("2d");
        if (g) {
          const w = scope.width;
          const h = scope.height;
          g.fillStyle = "#140c18";
          g.fillRect(0, 0, w, h);
          g.strokeStyle = "#ff5a68";
          g.beginPath();
          const step = ditherPeak(viz.dither);
          viz.dither.forEach((s, i) => {
            const x = (i / Math.max(1, viz.dither.length - 1)) * w;
            const y = h * 0.5 - (s / step) * (h * 0.4);
            if (i === 0) g.moveTo(x, y);
            else g.lineTo(x, y);
          });
          g.stroke();
        }
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tab, hud?.menu]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(REMEMBER);
      if (raw) {
        const saved = JSON.parse(raw) as { nick: string; password: string; team: number; charId: string };
        if (saved.nick) setNick(saved.nick);
        if (saved.password) setPassword(saved.password);
        if (saved.team === 0 || saved.team === 1 || saved.team === 2) setTeam(saved.team);
        if (saved.charId) setCharId(saved.charId);
      }
      const savedRelay = localStorage.getItem(RELAY);
      if (savedRelay && (SERVERS as readonly string[]).includes(savedRelay)) setRelay(savedRelay);
      else setRelay(SERVERS[0]);
    } catch {
      /* ignore bad local gate */
    }
    const host = window.location.hostname;
    const onPublic = host === "mountdew.oops.wtf" || host === "mountdew.groups.id" || host === "mountdew.tantrum.org" || window.location.port === "8888";
    if (onPublic) {
      for (const url of SERVERS) {
        const health = url.replace(/^wss:/, "https:") + "/health";
        void fetch(health)
          .then((res) => (res.ok ? res.json() : null))
          .then((body: { pilots?: number } | null) => {
            if (body && typeof body.pilots === "number") setServerLive((prev) => ({ ...prev, [url]: body.pilots as number }));
          })
          .catch(() => {});
      }
    }
    void fetchBoard()
      .then(setBoard)
      .catch(() => setError("Relay quiet. You can still drop in locally."));
    let dead = false;
    let stop = () => {};
    void (async () => {
      const mod = await import("@/game/engine");
      if (dead || !viewRef.current || !overlayRef.current) return;
      const qa = new URLSearchParams(window.location.search).has("qa");
      const game = mod.createGame(viewRef.current, overlayRef.current, { qa });
      gameRef.current = game;
      game.intro();
      const savedGfx = localStorage.getItem(GFX) as Quality | null;
      if (savedGfx === "low" || savedGfx === "medium" || savedGfx === "high" || savedGfx === "ultra") game.setQuality(savedGfx);
      stop = game.subscribe(() => setHud(game.getHud()));
      setHud(game.getHud());
      if (qa) void enter(game, "PilotQA", "qatest", 0, "angel", true);
    })();
    return () => {
      dead = true;
      stop();
      gameRef.current?.destroy();
      bindRelay(null);
      gameRef.current = null;
    };
  }, []);

  useEffect(() => onRelayChat((line) => {
    setChat((prev) => [...prev, { ...line, id: chatSeq.current++ }].slice(-40));
  }), []);

  useEffect(() => onRelayRoster((pilots) => {
    gameRef.current?.applyRoster(pilots);
  }), []);

  useEffect(() => onRelayPings((rows) => {
    gameRef.current?.notePings(rows);
  }), []);

  useEffect(() => onRelayAfk((action) => {
    gameRef.current?.applyAfk(action);
  }), []);

  useEffect(() => {
    const el = chatLogRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chat]);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code !== "Enter") return;
      e.preventDefault();
      document.exitPointerLock();
      chatInputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function submitChat(e: FormEvent) {
    e.preventDefault();
    const text = draft.replace(/\s+/g, " ").trim().slice(0, 160);
    if (!text) return;
    setDraft("");
    if (relayBound()) sendRelayChat(text);
    else setChat((prev) => [...prev, { id: chatSeq.current++, nick: nick.trim() || "You", team, text }].slice(-40));
    chatInputRef.current?.blur();
  }

  async function enter(game: GameHandle, name: string, pass: string, teamId: number, hero: string, qa = false) {
    setBusy(true);
    setError("");
    const clean = name.trim();
    const address = relay.trim();
    if (address && !qa) {
      const known = (SERVERS as readonly string[]).includes(address);
      const order = known ? [address, ...SERVERS.filter((url) => url !== address)] : [address];
      linkStop.current?.();
      let stopped = false;
      let linkedOnce = false;
      const stop = () => {
        stopped = true;
        bindRelay(null);
      };
      linkStop.current = stop;
      let delay = 700;
      while (!stopped) {
        for (const url of order) {
          if (stopped) return;
          try {
            const link = await connectRelay(url);
            if (stopped) {
              link.close();
              return;
            }
            const res = await link.join(clean, pass, teamId, hero);
            if (!res.ok) {
              link.close();
              if (/password|nickname|team|full/i.test(res.error)) {
                setError(res.error);
                setBusy(false);
                stopped = true;
                return;
              }
              continue;
            }
            bindRelay(link);
            localStorage.setItem(RELAY, url);
            localStorage.setItem(REMEMBER, JSON.stringify({ nick: clean, password: pass, team: teamId, charId: hero }));
            setRelay(url);
            setBoard(res.board);
            if (!linkedOnce) {
              game.deploy({ nick: res.profile.nick, team: teamId, charId: hero, token: res.token, xp: res.profile.xp, qa });
              game.pushLine(url === SERVERS[0] ? "match server linked" : `linked ${url}`);
              setPhase("play");
              setError("");
              setBusy(false);
              linkedOnce = true;
            } else {
              game.setToken(res.token);
              game.pushLine("link restored");
            }
            delay = 700;
            await link.untilClose();
            if (stopped) return;
            break;
          } catch {
            /* try the next public server */
          }
        }
        if (stopped) return;
        if (!linkedOnce) {
          setError("Still trying the match servers…");
          setBusy(false);
        } else {
          game.pushLine("reconnecting");
        }
        await new Promise((r) => setTimeout(r, delay));
        delay = Math.min(5000, Math.round(delay * 1.5));
      }
      return;
    }
    if (!address) localStorage.removeItem(RELAY);
    try {
      const res = await joinMount({ data: { nick: clean, password: pass, team: teamId, charId: hero } });
      if (!res.ok) {
        setError(res.error);
        setBusy(false);
        return;
      }
      localStorage.setItem(REMEMBER, JSON.stringify({ nick: clean, password: pass, team: teamId, charId: hero }));
      setBoard(res.board);
      game.deploy({
        nick: res.profile.nick,
        team: teamId,
        charId: hero,
        token: res.token,
        xp: res.profile.xp,
        qa,
      });
      setPhase("play");
    } catch {
      const bag = readReg();
      const key = clean.toLowerCase();
      const existing = bag[key];
      if (existing && existing.password !== pass) {
        setError("Relay unreachable, and that nickname is already saved with another password.");
        setBusy(false);
        return;
      }
      if (!/^[A-Za-z0-9_]{3,16}$/.test(clean) || pass.length < 4) {
        setError("Nickname 3–16 letters or numbers. Password at least 4.");
        setBusy(false);
        return;
      }
      const profile = existing || { password: pass, xp: 0, kills: 0, deaths: 0, caps: 0, team: teamId, charId: hero };
      bag[key] = { ...profile, password: pass, team: teamId, charId: hero };
      localStorage.setItem(REG, JSON.stringify(bag));
      localStorage.setItem(REMEMBER, JSON.stringify({ nick: clean, password: pass, team: teamId, charId: hero }));
      game.deploy({ nick: clean, team: teamId, charId: hero, token: "", xp: profile.xp, qa });
      game.pushLine("relay delayed · local gate");
      setPhase("play");
    }
    setBusy(false);
  }

  function pushTouch(lookX = 0, lookY = 0) {
    const t = touch.current;
    gameRef.current?.setTouch({ ...t, lookX, lookY });
  }

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const play = phase === "play" && hud;
  return (
    <main className="dew">
      <canvas ref={viewRef} className="view" />
      <canvas ref={overlayRef} className="overlay" />
      {phase === "login" ? (
        <div className="login" onPointerDown={() => gameRef.current?.intro()}>
          <div className="site">
            <header className="site-bar">
              <div>
                <p className="kicker">Mount Dew</p>
                <strong className="brand-line">100 seats · three teams</strong>
              </div>
              <nav className="site-nav">
                <button type="button" onClick={() => jump("howto")}>
                  How to play
                </button>
                <button type="button" onClick={() => jump("teams")}>
                  Teams
                </button>
                <button type="button" onClick={() => jump("ledger")}>
                  Ledger
                </button>
                <button className="btn primary" type="button" onClick={() => jump("drop")}>
                  Play
                </button>
              </nav>
            </header>
            <img className="site-banner" src="/x-banner.jpg" alt="Mount Dew banner. Four pilots in the desert." />
            <section className="hero">
              <div className="hero-copy">
                <p className="kicker">{PUBLIC_SITE}</p>
                <h1>Mount Dew</h1>
                <video className="launch" src="/game/launch.mp4" autoPlay muted loop playsInline controls />
                <p className="lede">One desert. Three flags. A hill that pays if you hold it. The match stays up, and you can drop in from this page.</p>
                <div className="posters">
                  <img className="cover" src="/og.jpg" alt="Mount Dew app cover" />
                  <img className="cast" src="/game/cast.jpg" alt="Seraph Doll, Bluebelle, Noir Nyx, and Bestie Bea in the desert" />
                </div>
                <p className="handle">@sugoimeg</p>
                <div className="servers" aria-label="Match servers">
                  <p className="kicker">Match servers</p>
                  {SERVERS.map((url, index) => (
                    <button key={url} type="button" className={relay === url ? "choice on" : "choice"} onClick={() => setRelay(url)}>
                      <span>{SERVER_LABEL[index]}</span>
                      <span className="mono">{url}</span>
                      <span>{serverLive[url] == null ? "quiet" : `${serverLive[url]} pilots`}</span>
                    </button>
                  ))}
                </div>
              </div>
              <section id="drop" className="panel">
                <p className="kicker">Start the match</p>
                <h2>Drop in</h2>
                <div className="teams">
                  {TEAMS.map((t) => (
                    <button key={t.id} className={team === t.id ? "choice on" : "choice"} onClick={() => setTeam(t.id)} type="button">
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="pilot-grid" role="listbox" aria-label="Pilots">
                  {CHARACTERS.map((c) => (
                    <button key={c.id} className={charId === c.id ? "champ on" : "champ"} onClick={() => setCharId(c.id)} type="button" aria-pressed={charId === c.id}>
                      <img src={`/game/pilots/${c.id}.jpg`} alt="" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
                <div className="pilot-pick">
                  <img src={`/game/pilots/${charId}.jpg`} alt="" />
                  <div>
                    <strong>{CHARACTERS.find((c) => c.id === charId)?.name}</strong>
                    <p className="muted">{CHARACTERS.find((c) => c.id === charId)?.blurb}</p>
                  </div>
                </div>
                <label className="field">
                  Nickname
                  <input id="nick" autoComplete="username" value={nick} onChange={(e) => setNick(e.target.value)} maxLength={16} suppressHydrationWarning />
                </label>
                <label className="field">
                  Password
                  <input id="pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} suppressHydrationWarning />
                </label>
                <label className="field">
                  Match server
                  <input
                    id="relay"
                    autoComplete="off"
                    placeholder="Clear to play only in this browser"
                    value={relay}
                    onChange={(e) => setRelay(e.target.value)}
                    suppressHydrationWarning
                  />
                </label>
                <p className="muted">
                  {serverLive[SERVERS[0]] == null
                    ? "Primary is wss://mountdew.oops.wtf:8888. If it is quiet, drop-in tries the fallback, then the third server. Clear the address to play alone in this browser."
                    : `${serverLive[SERVERS[0]]} of 1000 pilots on the primary match.`}
                </p>
                {error ? <p className="err">{error}</p> : null}
                <button
                  className="btn primary"
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const game = gameRef.current;
                    if (!game) return;
                    void enter(game, nick, password, team, charId);
                  }}
                >
                  {busy ? "Linking" : "Drop in"}
                </button>
              </section>
            </section>
            <section id="howto" className="panel">
              <h2>How to start</h2>
              <ol className="steps">
                <li>
                  <strong>Open the site.</strong> The game is this page. Nothing to install.
                </li>
                <li>
                  <strong>Pick a team and a pilot.</strong> Citrus holds the white stone, Voltage the space decks, Code Red the red city.
                </li>
                <li>
                  <strong>Drop in.</strong> A nickname and a password keep your rank. Then click the field to look.
                </li>
              </ol>
              <h2>On the field</h2>
              <div className="help-grid">
                <span>WASD</span>
                <span>Move. A is screen-left. Double-tap dodges.</span>
                <span>Enter</span>
                <span>Chat. Escape leaves the box. Everyone in the match sees it.</span>
                <span>Mouse</span>
                <span>Look and shoot. Shots meet the crosshair.</span>
                <span>Space</span>
                <span>Jump, double jump, wall jump. F climbs a wall.</span>
                <span>Shift</span>
                <span>Dash. Hold into a wall in the air to wallride.</span>
                <span>F / G</span>
                <span>Use the selected action, or cycle blocks, pads, turrets, and traps.</span>
                <span>V</span>
                <span>Fly the spectator camera. Voices fade as you leave.</span>
                <span>Tab / M</span>
                <span>Scoreboard and map. Backtick opens the console.</span>
              </div>
            </section>
            <section id="teams" className="panel">
              <h2>Three cities, one hill</h2>
              <div className="trio">
                {TEAMS.map((t) => (
                  <article key={t.id} className="team-card">
                    <span className="swatch" style={{ background: t.color }} />
                    <h3 style={{ color: t.color }}>{t.name}</h3>
                    <p className="muted">
                      {t.id === 0 ? "Coconut desert and white stone." : t.id === 1 ? "Space decks above the trench." : "Red stone city on the east mesa."}
                    </p>
                  </article>
                ))}
              </div>
              <p className="muted">
                Hold the middle hill for two minutes and your team runs faster. Flags go home if they sit too long. Pinpop, Wrapley, and Bonecaller raise green mutants from fallen bodies. You hear your pilot, nearby guns, an announcer, and a commentator. A full field does not shout all at once.
              </p>
            </section>
            <section id="ledger" className="panel">
              <h2>Season ledger</h2>
              <p className="muted">Scores kept by the relay. Empty seats on the field are match pilots until a person takes them.</p>
              <div className="ledger">
                {board.length === 0 ? <p className="muted">No scores yet. The first drop-in opens the book.</p> : null}
                {board.map((row) => (
                  <div className="row" key={row.nick}>
                    <span className="swatch" style={{ background: TEAMS[row.team]?.color || "#c6e35a" }} />
                    <span>{row.nick}</span>
                    <span>{row.xp} xp</span>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <h2>Match PC</h2>
              <p className="muted">
                The website is https://mountdew.oops.wtf. The match room is the same on wss://mountdew.oops.wtf:8888, then wss://mountdew.groups.id:8888, then wss://mountdew.tantrum.org:8888. Drop-in tries them in that order. Start a match PC with node host/server.mjs.
              </p>
              <p className="credit">MADE BY DAN</p>
            </section>
            <pre className="ascii">{ASCII}</pre>
          </div>
        </div>
      ) : null}
      {play ? (
        <div className={hud.map ? "hud map-open" : "hud"}>
          <div className="topbar">
            <div className="chip scores">
              {hud.teams.map((t) => (
                <span key={t.name} style={{ color: t.color }}>
                  {t.name} {t.caps}
                </span>
              ))}
            </div>
            <div className="chip clock">
              <b>{hud.time}</b>
              <div>{hud.date}</div>
              <div>
                {hud.season} · {hud.weather}
              </div>
            </div>
          </div>
          <div className="feed">
            {hud.banner ? <p className="banner">{hud.banner}</p> : null}
            {hud.heat > 0 ? (
              <div className="heat">
                HEATSTROKE
                <b>{Math.ceil(hud.heat)}</b>
              </div>
            ) : null}
            {hud.feed.map((line) => (
              <p key={line.id} style={{ opacity: Math.max(0.35, 1 - (hud.now - line.at) / 6000) }}>
                {line.text}
              </p>
            ))}
          </div>
          <div className="bottombar" style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
            <div className="chip hp">
              <div>
                {hud.hp} hp
              </div>
              <div className="bar">
                <span className={hud.hp > 60 ? "fill good" : hud.hp > 30 ? "fill mid" : "fill low"} style={{ width: `${hud.hp}%` }} />
              </div>
              <div className="muted">
                F {hud.action}
                {hud.cd > 0 ? ` · ${hud.cd.toFixed(1)}s` : ""} · {hud.hillText}
              </div>
            </div>
            <div className="pad interactive">
              <button className="icon-btn" type="button" aria-label="Scoreboard" onClick={() => gameRef.current?.toggleScore()}>
                <List size={18} />
              </button>
              <button className="icon-btn" type="button" aria-label="Map" onClick={() => gameRef.current?.toggleMap()}>
                <Map size={18} />
              </button>
              <button className="icon-btn" type="button" aria-label="Console" onClick={() => gameRef.current?.toggleConsole()}>
                <Terminal size={18} />
              </button>
              <button className="icon-btn" type="button" aria-label="Spectate" onClick={() => gameRef.current?.toggleSpectate()}>
                <Eye size={18} />
              </button>
              <button className="icon-btn" type="button" aria-label="Options" onClick={() => gameRef.current?.setMenu(true)}>
                <Settings size={18} />
              </button>
            </div>
          </div>
          <section className="chat" aria-label="Match chat">
            <div className="chat-log" ref={chatLogRef}>
              {chat.length === 0 ? <p className="muted">Enter to chat. The match can read it.</p> : null}
              {chat.map((line) => (
                <p key={line.id}>
                  <b style={{ color: TEAMS[line.team]?.color || "#f7f4ea" }}>{line.nick}</b> {line.text}
                </p>
              ))}
            </div>
            <form onSubmit={submitChat}>
              <input
                ref={chatInputRef}
                value={draft}
                maxLength={160}
                placeholder="Chat"
                aria-label="Chat"
                onChange={(e) => setDraft(e.target.value)}
                onFocus={() => document.exitPointerLock()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") e.currentTarget.blur();
                }}
              />
            </form>
          </section>
          {!hud.locked && !hud.menu && !hud.score && !hud.map && !hud.console ? (
            <button className="btn primary look" type="button" onClick={() => gameRef.current?.lock()}>
              Click to look
            </button>
          ) : null}
          {hud.downed ? (
            <button className="btn look" style={{ top: "62%" }} type="button" onClick={() => gameRef.current?.spawnNow()}>
              Spawn
            </button>
          ) : null}
          {hud.score ? (
            <section className="sheet">
              <div className="topbar">
                <h2>Scoreboard · {hud.rows.length}</h2>
                <button className="icon-btn" type="button" aria-label="Close scoreboard" onClick={() => gameRef.current?.toggleScore()}>
                  <X size={18} />
                </button>
              </div>
              <div className="board">
                {TEAMS.map((t) => (
                  <div className="col" key={t.id}>
                    <strong style={{ color: t.color }}>{t.name}</strong>
                    <div className="scroll">
                      {hud.rows
                        .filter((r) => r.team === t.id)
                        .sort((a, b) => b.xp - a.xp)
                        .map((r) => (
                          <div className={r.me ? "pilot me" : "pilot"} key={`${t.id}-${r.kind}-${r.name}`}>
                            <span className={`mark ${r.kind}`} title={r.kind} />
                            {r.charId ? <img className="mini" src={`/game/pilots/${r.charId}.jpg`} alt="" /> : <span className="mini blank" />}
                            <span className="rank">{r.rank}</span>
                            <span>{r.name}</span>
                            <span>L{r.lvl}</span>
                            <span>
                              {r.k}/{r.d}
                            </span>
                            <span className="ms">{r.kind === "human" ? `${r.ping || "–"} ms` : r.kind}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {hud.console ? (
            <section className="sheet">
              <div className="topbar">
                <h2>Console</h2>
                <button className="icon-btn" type="button" aria-label="Close console" onClick={() => gameRef.current?.toggleConsole()}>
                  <X size={18} />
                </button>
              </div>
              <div className="log">{hud.log.map((l) => l.text).join("\n")}</div>
            </section>
          ) : null}
          {hud.menu ? (
            <section className="sheet">
              <img className="menu-banner" src="/x-banner.jpg" alt="Mount Dew" />
              <div className="topbar">
                <h2>Options</h2>
                <button className="icon-btn" type="button" aria-label="Close options" onClick={() => gameRef.current?.setMenu(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="teams">
                <button className={tab === "graphics" ? "choice on" : "choice"} type="button" onClick={() => setTab("graphics")}>
                  Graphics
                </button>
                <button className={tab === "sound" ? "choice on" : "choice"} type="button" onClick={() => setTab("sound")}>
                  Sound
                </button>
                <button className={tab === "help" ? "choice on" : "choice"} type="button" onClick={() => setTab("help")}>
                  Help
                </button>
                <button className={tab === "about" ? "choice on" : "choice"} type="button" onClick={() => setTab("about")}>
                  About
                </button>
              </div>
              {tab === "graphics" ? (
                <div>
                  <div className="teams">
                    {(["low", "medium", "high", "ultra"] as Quality[]).map((q) => (
                      <button
                        key={q}
                        className={hud.graphics === q ? "choice on" : "choice"}
                        type="button"
                        onClick={() => {
                          localStorage.setItem(GFX, q);
                          gameRef.current?.setQuality(q);
                        }}
                      >
                        {q === "low" ? "Low" : q === "medium" ? "Medium" : q === "high" ? "High" : "Ultra"}
                        <small>
                          {q === "low" ? "Older laptop GPU" : q === "medium" ? "4 cores and up" : q === "high" ? "Flagship GPU" : "Pencil shadows and ragdoll"}
                        </small>
                      </button>
                    ))}
                  </div>
                  <label className="field">
                    Look sensitivity
                    <input
                      type="range"
                      min={0.0008}
                      max={0.006}
                      step={0.0001}
                      defaultValue={0.0022}
                      onChange={(e) => gameRef.current?.setSens(Number(e.target.value))}
                    />
                  </label>
                  <label className="field">
                    Volume
                    <input type="range" min={0} max={1} step={0.01} defaultValue={0.7} onChange={(e) => gameRef.current?.setVolume(Number(e.target.value))} />
                  </label>
                  <button className="btn" type="button" onClick={() => gameRef.current?.fullscreen()}>
                    <Maximize2 size={16} /> Fullscreen
                  </button>
                  <button className="btn" type="button" onClick={() => gameRef.current?.toggleSpectate()}>
                    <Eye size={16} /> {hud.spectate ? "Back to pilot" : "Spectate"}
                  </button>
                </div>
              ) : null}
              {tab === "sound" ? (
                <div>
                  <div className="desk-nav">
                    <button className={desk === "mix" ? "pill on" : "pill"} type="button" onClick={() => setDesk("mix")}>Mix</button>
                    <button className={desk === "tone" ? "pill on" : "pill"} type="button" onClick={() => setDesk("tone")}>Tone</button>
                    <button className={desk === "out" ? "pill on" : "pill"} type="button" onClick={() => setDesk("out")}>Output</button>
                  </div>
                  {desk === "mix" ? (
                    <div className="mixer">
                      {["World", "Announce", "You"].map((name, index) => {
                        const s = strips[index]!;
                        return (
                          <div className="strip" key={name}>
                            <strong>{name}</strong>
                            <label>
                              Pan {s.pan === 0 ? "C" : s.pan < 0 ? `L ${Math.abs(s.pan).toFixed(2)}` : `R ${s.pan.toFixed(2)}`}
                              <input aria-label={`${name} pan`} type="range" min={-1} max={1} step={0.01} value={s.pan} onChange={(e) => patchStrip(index, { pan: Number(e.target.value) })} onDoubleClick={() => patchStrip(index, { pan: 0 })} />
                            </label>
                            <label>
                              Trim {s.trim.toFixed(1)}
                              <input aria-label={`${name} trim`} type="range" min={-12} max={12} step={0.1} value={s.trim} onChange={(e) => patchStrip(index, { trim: Number(e.target.value) })} onDoubleClick={() => patchStrip(index, { trim: 0 })} />
                            </label>
                            <label>
                              HPF {s.hpf < 25 ? "off" : `${Math.round(s.hpf)}`}
                              <input aria-label={`${name} high pass`} type="range" min={20} max={400} step={1} value={s.hpf} onChange={(e) => patchStrip(index, { hpf: Number(e.target.value) })} onDoubleClick={() => patchStrip(index, { hpf: 20 })} />
                            </label>
                            <label>
                              Aux {Math.round(s.aux * 100)}
                              <input aria-label={`${name} aux`} type="range" min={0} max={1} step={0.01} value={s.aux} onChange={(e) => patchStrip(index, { aux: Number(e.target.value) })} onDoubleClick={() => patchStrip(index, { aux: 0 })} />
                            </label>
                            <div className="strip-btns">
                              <button className={s.mute ? "pill danger on" : "pill"} type="button" onClick={() => patchStrip(index, { mute: !s.mute })}>Mute</button>
                              <button className={s.solo ? "pill solo on" : "pill"} type="button" onClick={() => patchStrip(index, { solo: !s.solo })}>Solo</button>
                              <button className={s.pfl ? "pill on" : "pill"} type="button" onClick={() => patchStrip(index, { pfl: !s.pfl })}>PFL</button>
                              <button className={s.pre ? "pill on" : "pill"} type="button" onClick={() => patchStrip(index, { pre: !s.pre })}>{s.pre ? "Pre" : "Post"}</button>
                              <button className={s.pol ? "pill on" : "pill"} type="button" onClick={() => patchStrip(index, { pol: !s.pol })}>Phase</button>
                            </div>
                            <div className="strip-body">
                              <input className="fader" aria-label={`${name} fader`} type="range" min={-60} max={12} step={0.1} value={s.fader} onChange={(e) => patchStrip(index, { fader: Number(e.target.value) })} onDoubleClick={() => patchStrip(index, { fader: 0 })} />
                              <div className="meter" aria-hidden="true">
                                <i ref={(el) => { meterRefs.current[index] = el; }} />
                                <b ref={(el) => { holdRefs.current[index] = el; }} />
                              </div>
                            </div>
                            <div className="strip-read">{s.fader <= -60 ? "-inf" : s.fader.toFixed(1)} dB</div>
                          </div>
                        );
                      })}
                      <div className="strip master">
                        <strong>Master</strong>
                        <VolumeKnob db={masterDb} onChange={setMaster} />
                        <button className={masterMute ? "pill danger on" : "pill"} type="button" onClick={toggleMasterMute}>
                          {masterMute ? "Muted" : "Mute"}
                        </button>
                        <button className={eqOn ? "pill on" : "pill"} type="button" onClick={toggleEq}>
                          {eqOn ? "EQ on" : "EQ off"}
                        </button>
                        <label>
                          Low {eq.low.toFixed(1)}
                          <input aria-label="Master low shelf" type="range" min={-12} max={12} step={0.1} value={eq.low} onChange={(e) => setEqBand({ low: Number(e.target.value) })} onDoubleClick={() => setEqBand({ low: 0 })} />
                          <span className="strip-read" ref={(el) => { eqRead.current[0] = el; }} />
                        </label>
                        <label>
                          Low mid {eq.lowMid.toFixed(1)}
                          <input aria-label="Master low mid" type="range" min={-12} max={12} step={0.1} value={eq.lowMid} onChange={(e) => setEqBand({ lowMid: Number(e.target.value) })} onDoubleClick={() => setEqBand({ lowMid: 0 })} />
                          <span className="strip-read" ref={(el) => { eqRead.current[1] = el; }} />
                        </label>
                        <label>
                          Mid {eq.mid.toFixed(1)}
                          <input aria-label="Master mid" type="range" min={-12} max={12} step={0.1} value={eq.mid} onChange={(e) => setEqBand({ mid: Number(e.target.value) })} onDoubleClick={() => setEqBand({ mid: 0 })} />
                          <span className="strip-read" ref={(el) => { eqRead.current[2] = el; }} />
                        </label>
                        <label>
                          High mid {eq.highMid.toFixed(1)}
                          <input aria-label="Master high mid" type="range" min={-12} max={12} step={0.1} value={eq.highMid} onChange={(e) => setEqBand({ highMid: Number(e.target.value) })} onDoubleClick={() => setEqBand({ highMid: 0 })} />
                          <span className="strip-read" ref={(el) => { eqRead.current[3] = el; }} />
                        </label>
                        <label>
                          High {eq.high.toFixed(1)}
                          <input aria-label="Master high shelf" type="range" min={-12} max={12} step={0.1} value={eq.high} onChange={(e) => setEqBand({ high: Number(e.target.value) })} onDoubleClick={() => setEqBand({ high: 0 })} />
                          <span className="strip-read" ref={(el) => { eqRead.current[4] = el; }} />
                        </label>
                        <label>
                          Duck {Math.round(duck * 100)}%
                          <input aria-label="Announcer duck" type="range" min={0.1} max={1} step={0.01} value={duck} onChange={(e) => { const v = Number(e.target.value); setDuck(v); sendMix(strips, auxReturn, v); }} />
                        </label>
                        <label>
                          Aux return {Math.round(auxReturn * 100)}
                          <input aria-label="Aux return" type="range" min={0} max={1} step={0.01} value={auxReturn} onChange={(e) => { const v = Number(e.target.value); setAuxReturn(v); sendMix(strips, v, duck); }} />
                        </label>
                        <div className="strip-body">
                          <input className="fader" aria-label="Master fader" type="range" min={-60} max={6} step={0.1} value={masterDb} onChange={(e) => setMaster(Number(e.target.value))} onDoubleClick={() => setMaster(-3.1)} />
                          <div className="meter" aria-hidden="true">
                            <i ref={(el) => { meterRefs.current[3] = el; }} />
                            <b ref={(el) => { holdRefs.current[3] = el; }} />
                          </div>
                        </div>
                        <div className="strip-read">{masterDb <= -60 ? "-inf" : masterDb.toFixed(1)} dB</div>
                      </div>
                    </div>
                  ) : null}
                  {desk === "tone" ? (
                    <div>
                      <canvas ref={specRef} className="studio-viz" width={640} height={160} />
                      <p className="studio-note">The line is the measured response of the five filters, on a log frequency axis. It is flat while EQ is off. The settings stay put.</p>
                      <div className="desk-grid">
                        <div className="desk-card">
                          <h3>Equaliser</h3>
                          <label className="field">
                            Low shelf Hz
                            <input type="range" min={40} max={240} step={1} value={eq.hz} onChange={(e) => setEqBand({ hz: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Low shelf dB
                            <input type="range" min={-12} max={12} step={0.1} value={eq.low} onChange={(e) => setEqBand({ low: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Low mid dB
                            <input type="range" min={-12} max={12} step={0.1} value={eq.lowMid} onChange={(e) => setEqBand({ lowMid: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Mid dB
                            <input type="range" min={-12} max={12} step={0.1} value={eq.mid} onChange={(e) => setEqBand({ mid: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            High mid dB
                            <input type="range" min={-12} max={12} step={0.1} value={eq.highMid} onChange={(e) => setEqBand({ highMid: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            High shelf dB
                            <input type="range" min={-12} max={12} step={0.1} value={eq.high} onChange={(e) => setEqBand({ high: Number(e.target.value) })} />
                          </label>
                        </div>
                        <div className="desk-card">
                          <h3>Bass phat</h3>
                          <label className="field">
                            Frequency
                            <input type="range" min={40} max={180} step={1} defaultValue={90} onChange={(e) => gameRef.current?.setStudio({ phatFreq: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Drive
                            <input type="range" min={0} max={1} step={0.01} defaultValue={0.4} onChange={(e) => gameRef.current?.setStudio({ phatDrive: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Mix
                            <input type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => gameRef.current?.setStudio({ phatMix: Number(e.target.value) })} />
                          </label>
                          <h3>Amp and air</h3>
                          <label className="field">
                            Amp drive
                            <input type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => gameRef.current?.setStudio({ ampDrive: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Air
                            <input type="range" min={-6} max={8} step={0.1} defaultValue={0} onChange={(e) => gameRef.current?.setStudio({ air: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Width
                            <input type="range" min={0} max={2} step={0.01} defaultValue={1} onChange={(e) => gameRef.current?.setStudio({ width: Number(e.target.value) })} />
                          </label>
                          <label className="field">
                            Exciter
                            <input type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => gameRef.current?.setStudio({ exciter: Number(e.target.value) })} />
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  {desk === "out" ? (
                    <div className="desk-grid">
                      <div className="desk-card">
                        <h3>Loudness</h3>
                        <label className="field">
                          ReplayGain
                          <select defaultValue="none" onChange={(e) => gameRef.current?.setStudio({ replay: e.target.value as "none" | "gain" | "prevent" })}>
                            <option value="none">None</option>
                            <option value="gain">Apply gain</option>
                            <option value="prevent">Apply gain and prevent clipping</option>
                          </select>
                        </label>
                        <label className="field">
                          Preamp dB
                          <input type="range" min={-12} max={12} step={0.1} defaultValue={0} onChange={(e) => gameRef.current?.setStudio({ preamp: Number(e.target.value) })} />
                        </label>
                        <label className="field">
                          Target loudness dB
                          <input type="range" min={-24} max={-6} step={0.1} defaultValue={-12} onChange={(e) => gameRef.current?.setStudio({ target: Number(e.target.value) })} />
                        </label>
                        <label className="field">
                          Peak ceiling %
                          <input type="range" min={20} max={100} step={1} defaultValue={50} onChange={(e) => gameRef.current?.setStudio({ peak: Number(e.target.value) })} />
                        </label>
                      </div>
                      <div className="desk-card">
                        <h3>Dither</h3>
                        <canvas ref={scopeRef} className="dither-viz" width={640} height={80} />
                        <label className="field">
                          Shape
                          <select defaultValue="tpdf" onChange={(e) => gameRef.current?.setDither({ shape: e.target.value as "off" | "rpdf" | "tpdf" | "floyd" })}>
                            <option value="tpdf">Triangular</option>
                            <option value="rpdf">Rectangular</option>
                            <option value="floyd">Floyd-Steinberg</option>
                            <option value="off">Off</option>
                          </select>
                        </label>
                        <label className="field">
                          Bits
                          <select defaultValue="24" onChange={(e) => gameRef.current?.setDither({ bits: Number(e.target.value) as 16 | 24 | 32 })}>
                            <option value="16">16</option>
                            <option value="24">24</option>
                            <option value="32">32</option>
                          </select>
                        </label>
                        <label className="field">
                          Amount
                          <input type="range" min={0} max={2} step={0.01} defaultValue={1} onChange={(e) => gameRef.current?.setDither({ amount: Number(e.target.value) })} />
                        </label>
                        <label className="field">
                          Noise shaping
                          <input type="range" min={0} max={0.98} step={0.01} defaultValue={0} onChange={(e) => gameRef.current?.setDither({ shaping: Number(e.target.value) })} />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {tab === "help" ? (
                <div>
                  <div className="help-grid">
                    <span>WASD</span>
                    <span>Move. Double-tap dodges.</span>
                    <span>Mouse</span>
                    <span>Look and shoot. Shots meet the crosshair. No spread.</span>
                    <span>Space</span>
                    <span>Jump, double jump, wall jump. Hold near a wall with F to climb.</span>
                    <span>Q / E</span>
                    <span>Turn. Double-tap sidesteps.</span>
                    <span>Shift</span>
                    <span>Dash. Wallride by holding into a wall in the air.</span>
                    <span>F / G</span>
                    <span>F does the selected action. G cycles signature, blocks, pads, turret, mine, tangle, telepad.</span>
                    <span>Rise</span>
                    <span>Pinpop, Wrapley, and Bonecaller turn a nearby body into a green mutant. Mutants shamble and claw. They can still carry a flag. Sixteen per team.</span>
                    <span>1–4</span>
                    <span>Weapons. The wheel shows the gun you hold large, and the others smaller beside it. Scroll switches. Right mouse scopes the glass rifle.</span>
                    <span>Tab / M / `</span>
                    <span>Scoreboard, map, console. Esc options.</span>
                    <span>V</span>
                    <span>Spectator camera. WASD flies, Space up, Ctrl down, Shift boosts. World voices and shots fade as you fly away. V returns you to your pilot.</span>
                    <span>Enter</span>
                    <span>Chat. Escape leaves the box. The line goes to every pilot in the match.</span>
                    <span>Voices</span>
                    <span>You hear your pilot, the announcer, and a commentator. Other pilots and guns only if they are close, so a full field does not turn into noise.</span>
                    <span>Server</span>
                    <span>The website is https://mountdew.oops.wtf. The match tries wss://mountdew.oops.wtf:8888, then wss://mountdew.groups.id:8888, then wss://mountdew.tantrum.org:8888. Clear Match server to play only in this browser.</span>
                  </div>
                  <p className="credit">MADE BY DAN</p>
                </div>
              ) : null}
              {tab === "about" ? (
                <div>
                  <div className="posters">
                    <img className="cover" src="/og.jpg" alt="Mount Dew app cover" />
                    <img className="cast" src="/game/cast.jpg" alt="Seraph Doll, Bluebelle, Noir Nyx, and Bestie Bea in the desert" />
                  </div>
                  <p className="handle">@sugoimeg</p>
                  <p className="muted">
                    Mount Dew is a nonstop three-team capture match. Citrus holds the white stone and the coconut desert, Voltage the space decks, Code Red the red stone city. The hill in the middle pays a speed surge if a team keeps it for two minutes. Rise rites pull green mutants out of fallen bodies. An announcer calls the flags and a commentator talks over the nearby fight. Fly the spectator camera and the field goes quiet as you leave it. The match PC can host a thousand pilots in one room. Your nickname stays in this browser. Rank and score updates go through the relay so a refreshed page cannot invent them.
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
          <div className="touch">
            <div
              className="stick"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                moveStick(e);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId)) moveStick(e);
              }}
              onPointerUp={(e) => {
                touch.current.x = 0;
                touch.current.y = 0;
                pushTouch();
                e.currentTarget.releasePointerCapture(e.pointerId);
              }}
            />
            <div className="pad">
              <button className="icon-btn" type="button" onPointerDown={() => { touch.current.jump = true; pushTouch(); }} onPointerUp={() => { touch.current.jump = false; pushTouch(); }}>
                Jump
              </button>
              <button className="icon-btn" type="button" onPointerDown={() => { touch.current.fire = true; pushTouch(); }} onPointerUp={() => { touch.current.fire = false; pushTouch(); }}>
                Fire
              </button>
              <button className="icon-btn" type="button" onPointerDown={() => { touch.current.act = true; pushTouch(); }} onPointerUp={() => { touch.current.act = false; pushTouch(); }}>
                F
              </button>
              <button className="icon-btn" type="button" onClick={() => { touch.current.cycle = true; pushTouch(); touch.current.cycle = false; }}>
                G
              </button>
            </div>
            <div
              className="lookpad"
              onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
              onPointerMove={(e) => {
                if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                pushTouch(e.movementX, e.movementY);
              }}
            />
          </div>
        </div>
      ) : null}
    </main>
  );

  function moveStick(e: PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    touch.current.x = Math.max(-1, Math.min(1, x));
    touch.current.y = Math.max(-1, Math.min(1, y));
    pushTouch();
  }
}

function readReg(): Record<string, { password: string; xp: number; kills: number; deaths: number; caps: number; team: number; charId: string }> {
  try {
    return JSON.parse(localStorage.getItem(REG) || "{}") as Record<string, { password: string; xp: number; kills: number; deaths: number; caps: number; team: number; charId: string }>;
  } catch {
    return {};
  }
}
