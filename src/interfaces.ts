import type {
	GdprGuard,
	GdprGuardRaw,
	GdprManager,
	GdprManagerRaw,
} from "gdpr-guard";
import type { Observable, ObservableInput } from "rxjs";

export interface RxWrapper<
	Raw extends GdprGuardRaw | GdprManagerRaw,
	Guard extends GdprGuard | GdprManager,
	Wrapped,
> {
	readonly raw$: Observable<Raw>;

	readonly $: Observable<Wrapped>;

	/**
	 * Create a lens into the guard's state
	 * @param derive - The function used to derive state from the guard's state
	 */
	lens<DerivedState>(
		derive: (guard: Wrapped) => DerivedState,
	): Observable<DerivedState>;

	/**
	 * Map into an observable from the guard's state
	 * @alias lens
	 * @param mapper - The function used to derive state from the guard's state
	 */
	map<T>(mapper: (guard: Wrapped) => T): Observable<T>;

	/**
	 * Create a lens by passing through the guard's state
	 * @param derive - The function used to derive an observable from the guard's state
	 */
	lensThrough<DerivedState>(
		derive: (guard: Wrapped) => ObservableInput<DerivedState>,
	): Observable<DerivedState>;

	/**
	 * Flat map into an observable from the guard's state
	 * @alias lensRawThrough
	 * @param mapper - The function used to derive an observable from the guard's state
	 */
	flatMap<T>(mapper: (guard: Wrapped) => ObservableInput<T>): Observable<T>;

	/**
	 * Create a lens into the guard's raw state
	 * @param derive - The function used to derive state from the guard's raw state
	 */
	lensRaw<DerivedState>(
		derive: (guard: Raw) => DerivedState,
	): Observable<DerivedState>;

	/**
	 * Map into an observable from the guard's raw state
	 * @alias lensRaw
	 * @param mapper - The function used to derive state from the guard's raw state
	 */
	mapRaw<T>(mapper: (guard: Raw) => T): Observable<T>;

	/**
	 * Create a lens by passing through the guard's raw state
	 * @param derive - The function used to derive an observable from the guard's raw state
	 */
	lensRawThrough<DerivedState>(
		derive: (guard: Raw) => ObservableInput<DerivedState>,
	): Observable<DerivedState>;

	/**
	 * Flat map into an observable from the guard's raw state
	 * @alias lensRawThrough
	 * @param mapper - The function used to derive an observable from the guard's raw state
	 */
	flatMapRaw<T>(mapper: (guard: Raw) => ObservableInput<T>): Observable<T>;

	/**
	 * Undo the RX wrapping and restore the guard/group/manager to a non-wrapped state
	 * @description It also cancels all subscriptions and terminates all observables.
	 *  Useful for cleanup and interoperability with frameworks like Vue or React.
	 */
	unwrap(): Guard;
}
