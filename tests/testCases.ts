import { wrapTestCases } from "./utils";
import { GdprStorage } from "gdpr-guard";

export const storageCases = wrapTestCases([
	GdprStorage.None,
	GdprStorage.ServerStorage,
	GdprStorage.Cookie,
	GdprStorage.SessionStorage,
	GdprStorage.LocalStorage,
	GdprStorage.IndexedDb,
	GdprStorage.FileSystem,
]);
