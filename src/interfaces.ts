import type { GdprGuardRaw, GdprManagerRaw } from "gdpr-guard";
import type { Observable, ObservableInput } from "rxjs";

export interface RxWrapper<Raw extends GdprGuardRaw | GdprManagerRaw> {
	readonly raw$: Observable<Raw>;

	/**
	 * Create a lens into the guard's raw state
	 * @param derive - The function used to derive state from the guard's raw state
	 */
	lens<DerivedState>(derive: (guard: Raw) => DerivedState): Observable<DerivedState>;

	/**
	 * Map into an observable from the guard's raw state
	 * @alias lens
	 * @param mapper - The function used to derive state from the guard's raw state
	 */
	map<T>(mapper: (guard: Raw) => T): Observable<T>;

	/**
	 * Create a lens by passing through the guard's raw state
	 * @param derive - The function used to derive an observable from the guard's raw state
	 */
	lensThrough<DerivedState>(derive: (guard: Raw) => ObservableInput<DerivedState>): Observable<DerivedState>;

	/**
	 * Flat map into an observable from the guard's raw state
	 * @alias lensThrough
	 * @param mapper - The function used to derive an observable from the guard's raw state
	 */
	flatMap<T>(mapper: (guard: Raw) => ObservableInput<T>): Observable<T>;
}
