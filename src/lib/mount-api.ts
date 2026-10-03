import { createServerFn } from "@tanstack/react-start";

export type BoardRow = {
  nick: string;
  xp: number;
  kills: number;
  deaths: number;
  caps: number;
  team: number;
};

export type JoinResult =
  | {
      ok: true;
      token: string;
      profile: {
        nick: string;
        xp: number;
        kills: number;
        deaths: number;
        caps: number;
        team: number;
        charId: string;
      };
      board: BoardRow[];
    }
  | { ok: false; error: string };

export const fetchBoard = createServerFn({ method: "GET" }).handler(async (): Promise<BoardRow[]> => {
  const { getBoard } = await import("./mount-store.server");
  return getBoard();
});

export const joinMount = createServerFn({ method: "POST" })
  .validator((input: { nick: string; password: string; team: number; charId: string }) => ({
    nick: String(input?.nick ?? ""),
    password: String(input?.password ?? ""),
    team: Number(input?.team ?? 0),
    charId: String(input?.charId ?? "angel"),
  }))
  .handler(async ({ data }): Promise<JoinResult> => {
    const { joinAccount } = await import("./mount-store.server");
    return joinAccount(data);
  });

export type PulseResult =
  | {
      ok: true;
      xp: number;
      kills: number;
      deaths: number;
      caps: number;
      humans: {
        nick: string;
        team: number;
        charId: string;
        x: number;
        y: number;
        z: number;
        yaw: number;
        hp: number;
        lvl: number;
        at: number;
      }[];
      shots: {
        id: number;
        nick: string;
        team: number;
        ox: number;
        oy: number;
        oz: number;
        dx: number;
        dy: number;
        dz: number;
        dmg: number;
        at: number;
      }[];
      serverNow: number;
    }
  | { ok: false; error: string };

export const pulseMount = createServerFn({ method: "POST" })
  .validator(
    (input: {
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
    }) => input,
  )
  .handler(async ({ data }): Promise<PulseResult> => {
    const { pulseAccount } = await import("./mount-store.server");
    return pulseAccount(data);
  });
