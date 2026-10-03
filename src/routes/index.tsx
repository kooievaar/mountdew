import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eye, List, Map, Maximize2, Settings, Terminal, X } from "lucide-react";
import { CHARACTERS, TEAMS } from "@/game/content";
import type { GameHandle, HudState, Quality } from "@/game/engine";
import { bindRelay, connectRelay } from "@/game/relay-client";
import { fetchBoard, joinMount, type BoardRow } from "@/lib/mount-api";

export const Route = createFileRoute("/")({ component: Home });

const REMEMBER = "mountdew.gate.v1";
const REG = "mountdew.reg.v1";
const GFX = "mountdew.gfx";
const RELAY = "mountdew.relay";
const PUBLIC_MATCH = "wss://newsfeed.qzz.io:8888";
const PUBLIC_SITE = "https://newsfeed.qzz.io:8888";

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
  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [relay, setRelay] = useState(PUBLIC_MATCH);
  const [pilots, setPilots] = useState<number | null>(null);
  const [team, setTeam] = useState(0);
  const [charId, setCharId] = useState("angel");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"login" | "play">("login");
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [hud, setHud] = useState<HudState | null>(null);
  const [tab, setTab] = useState<"help" | "about" | "graphics">("help");
  const touch = useRef({ x: 0, y: 0, fire: false, jump: false, act: false, cycle: false, dash: false });

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
      if (savedRelay) setRelay(savedRelay);
      else if (window.location.hostname === "newsfeed.qzz.io") setRelay(`wss://${window.location.host}`);
    } catch {
      /* ignore bad local gate */
    }
    if (window.location.port === "8888" || window.location.hostname === "newsfeed.qzz.io") {
      void fetch("/health")
        .then((res) => (res.ok ? res.json() : null))
        .then((body: { pilots?: number } | null) => {
          if (body && typeof body.pilots === "number") setPilots(body.pilots);
        })
        .catch(() => {});
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
      const savedGfx = localStorage.getItem(GFX) as Quality | null;
      if (savedGfx === "low" || savedGfx === "medium" || savedGfx === "high") game.setQuality(savedGfx);
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

  async function enter(game: GameHandle, name: string, pass: string, teamId: number, hero: string, qa = false) {
    setBusy(true);
    setError("");
    const clean = name.trim();
    const address = relay.trim();
    if (address && !qa) {
      try {
        const link = await connectRelay(address);
        const res = await link.join(clean, pass, teamId, hero);
        if (!res.ok) {
          link.close();
          setError(res.error);
          setBusy(false);
          return;
        }
        localStorage.setItem(RELAY, address);
        localStorage.setItem(REMEMBER, JSON.stringify({ nick: clean, password: pass, team: teamId, charId: hero }));
        bindRelay(link);
        setBoard(res.board);
        game.deploy({ nick: res.profile.nick, team: teamId, charId: hero, token: res.token, xp: res.profile.xp, qa });
        game.pushLine("match server linked");
        setPhase("play");
      } catch {
        setError("Match server didn't answer. Check the address, or leave it blank to play in this browser.");
      }
      setBusy(false);
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
        <div className="login">
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
            <section className="hero">
              <div className="hero-copy">
                <p className="kicker">{PUBLIC_SITE}</p>
                <h1>Mount Dew</h1>
                <p className="lede">One desert. Three flags. A hill that pays if you hold it. The match stays up, and you can drop in from this page.</p>
                <img className="cast" src="/game/cast.jpg" alt="Seraph Doll, Bluebelle, Noir Nyx, and Bestie Bea in the desert arena" />
                <p className="handle">@sugoimeg</p>
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
                <div className="chars" aria-label="Pilots">
                  {CHARACTERS.map((c) => (
                    <button key={c.id} className={charId === c.id ? "choice on" : "choice"} onClick={() => setCharId(c.id)} type="button">
                      <span className="swatch" style={{ background: `#${c.hair.toString(16).padStart(6, "0")}` }} />
                      {c.name}
                      <small>{c.abilityName}</small>
                    </button>
                  ))}
                </div>
                <p className="muted">{CHARACTERS.find((c) => c.id === charId)?.blurb}</p>
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
                  {pilots === null
                    ? "The live match is already filled in. Clear the address to play alone in this browser."
                    : `${pilots} of 100 pilots linked on the public match.`}
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
                The public address is {PUBLIC_SITE}. On the machine that answers for newsfeed.qzz.io, start the site and the relay together with node host/server.mjs. It listens on port 8888. A certificate in host/certs keeps the lock trusted. Until then, the browser may ask you to continue once.
              </p>
              <p className="credit">MADE BY DAN</p>
            </section>
            <pre className="ascii">{ASCII}</pre>
          </div>
        </div>
      ) : null}
      {play ? (
        <div className="hud">
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
            {hud.feed.map((line) => (
              <p key={line.id} style={{ opacity: Math.max(0.35, 1 - (hud.now - line.at) / 6000) }}>
                {line.text}
              </p>
            ))}
          </div>
          <div className="bottombar" style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
            <div className="chip hp">
              <div>
                {hud.hp} hp · {hud.weapon}
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
                <h2>Scoreboard</h2>
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
                          <div className={r.me ? "pilot me" : "pilot"} key={`${t.id}-${r.name}`}>
                            <span className="rank">{r.rank}</span>
                            <span>{r.name}</span>
                            <span>L{r.lvl}</span>
                            <span>
                              {r.k}/{r.d}
                            </span>
                            <span>{r.xp}</span>
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
                    {(["low", "medium", "high"] as Quality[]).map((q) => (
                      <button
                        key={q}
                        className={hud.graphics === q ? "choice on" : "choice"}
                        type="button"
                        onClick={() => {
                          localStorage.setItem(GFX, q);
                          gameRef.current?.setQuality(q);
                        }}
                      >
                        {q === "low" ? "Low" : q === "medium" ? "Medium" : "High"}
                        <small>{q === "low" ? "Older laptop GPU" : q === "medium" ? "4 cores and up" : "Flagship GPU"}</small>
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
                    <span>Weapons. Right mouse scopes the glass rifle.</span>
                    <span>Tab / M / `</span>
                    <span>Scoreboard, map, console. Esc options.</span>
                    <span>V</span>
                    <span>Spectator camera. WASD flies, Space up, Ctrl down, Shift boosts. World voices and shots fade as you fly away. V returns you to your pilot.</span>
                    <span>Voices</span>
                    <span>You hear your pilot, the announcer, and a commentator. Other pilots and guns only if they are close, so a full field does not turn into noise.</span>
                    <span>Server</span>
                    <span>The live match is wss://newsfeed.qzz.io:8888. Clear Match server to play only in this browser. The match PC starts with node host/server.mjs.</span>
                  </div>
                  <p className="credit">MADE BY DAN</p>
                </div>
              ) : null}
              {tab === "about" ? (
                <div>
                  <img className="cast" src="/game/cast.jpg" alt="The four aces: angel doll, blue-haired ace, goth, and her friend" />
                  <p className="handle">@sugoimeg</p>
                  <p className="muted">
                    Mount Dew is a nonstop three-team capture match. Citrus holds the white stone and the coconut desert, Voltage the space decks, Code Red the red stone city. The hill in the middle pays a speed surge if a team keeps it for two minutes. Rise rites pull green mutants out of fallen bodies. An announcer calls the flags and a commentator talks over the nearby fight. Fly the spectator camera and the field goes quiet as you leave it. The match PC can host a hundred pilots. Your nickname stays in this browser. Rank and score updates go through the relay so a refreshed page cannot invent them.
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
