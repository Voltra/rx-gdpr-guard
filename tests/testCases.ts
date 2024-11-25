import { wrapTestCases } from "./utils";
import { GdprStorage } from "gdpr-guard";
import { ObservableInput, of } from "rxjs";

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */

export const assignableStorageCases = wrapTestCases([
	GdprStorage.None,
	GdprStorage.ServerStorage,
	GdprStorage.Cookie,
	GdprStorage.SessionStorage,
	GdprStorage.LocalStorage,
	GdprStorage.IndexedDb,
	GdprStorage.FileSystem,
]);

export const guardStorageCases = wrapTestCases([
	GdprStorage.ServerStorage,
	GdprStorage.Cookie,
	GdprStorage.SessionStorage,
	GdprStorage.LocalStorage,
	GdprStorage.IndexedDb,
	GdprStorage.FileSystem,
]);

export const lensCases = <T>() =>
	wrapTestCases([
		(guard: T) => guard,
		(guard: T) => [guard, guard],
		() => [1, 6],
		() => 420,
	] as ((guard: T) => unknown)[]);

export const lensThroughCases = <T>() =>
	wrapTestCases([
		(guard: T) => [guard, guard],
		() => of(420, 69),
		() => Promise.resolve(69),
	] as ((guard: T) => ObservableInput<unknown>)[]);


/* eslint-enable @typescript-eslint/no-unnecessary-type-parameters */
