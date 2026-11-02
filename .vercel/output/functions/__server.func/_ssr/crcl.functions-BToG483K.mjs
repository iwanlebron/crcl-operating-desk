import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/crcl.functions-BToG483K.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getSnapshot_createServerFn_handler = createServerRpc({
	id: "0e301c71519080ebf088e6b6f8475bd837b196ccfd3f031c6186064fbeca265e",
	name: "getSnapshot",
	filename: "src/lib/crcl.functions.ts"
}, (opts) => getSnapshot.__executeServer(opts));
var getSnapshot = createServerFn({ method: "GET" }).handler(getSnapshot_createServerFn_handler, async () => {
	const { loadSnapshot } = await import("./crcl.server-Cp3Cgwwh.mjs");
	return loadSnapshot();
});
//#endregion
export { getSnapshot_createServerFn_handler };
