import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/mount-api-Bw8sNWEq.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var fetchBoard_createServerFn_handler = createServerRpc({
	id: "38de277d04ff73509a671fe012d752d1ca5fd2e381741a4062895e2889124e63",
	name: "fetchBoard",
	filename: "src/lib/mount-api.ts"
}, (opts) => fetchBoard.__executeServer(opts));
var fetchBoard = createServerFn({ method: "GET" }).handler(fetchBoard_createServerFn_handler, async () => {
	const { getBoard } = await import("./mount-store.server-DjxfEP8v.mjs");
	return getBoard();
});
var joinMount_createServerFn_handler = createServerRpc({
	id: "7f0f5192eafa87df62a9a26a998e8b403257215abb90756e135fc90ee16d8925",
	name: "joinMount",
	filename: "src/lib/mount-api.ts"
}, (opts) => joinMount.__executeServer(opts));
var joinMount = createServerFn({ method: "POST" }).validator((input) => ({
	nick: String(input?.nick ?? ""),
	password: String(input?.password ?? ""),
	team: Number(input?.team ?? 0),
	charId: String(input?.charId ?? "angel")
})).handler(joinMount_createServerFn_handler, async ({ data }) => {
	const { joinAccount } = await import("./mount-store.server-DjxfEP8v.mjs");
	return joinAccount(data);
});
var pulseMount_createServerFn_handler = createServerRpc({
	id: "1287837d9f5e5647a3b5b13e52250686e368193d74072347df5a97c9c571f25c",
	name: "pulseMount",
	filename: "src/lib/mount-api.ts"
}, (opts) => pulseMount.__executeServer(opts));
var pulseMount = createServerFn({ method: "POST" }).validator((input) => input).handler(pulseMount_createServerFn_handler, async ({ data }) => {
	const { pulseAccount } = await import("./mount-store.server-DjxfEP8v.mjs");
	return pulseAccount(data);
});
//#endregion
export { fetchBoard_createServerFn_handler, joinMount_createServerFn_handler, pulseMount_createServerFn_handler };
