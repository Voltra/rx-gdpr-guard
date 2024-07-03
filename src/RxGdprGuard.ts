import type { GdprGuard, GdprGuardRaw, GdprStorage } from "gdpr-guard";
import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	mergeMap,
	Observable,
	ObservableInput,
	ReplaySubject, takeUntil,
} from "rxjs";
import { RxWrapper } from "./interfaces";
import { deepEquals } from "./utils";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprGuard} instance (not one of its derived class)
 */
export class RxGdprGuard implements GdprGuard, RxWrapper<GdprGuardRaw, GdprGuard> {
	// @ts-expect-error TS2564 We know it's properly initialized
	public name: string;

	// @ts-expect-error TS2564 We know it's properly initialized
	public enabled: boolean;

	// @ts-expect-error TS2564 We know it's properly initialized
	public description: string;

	// @ts-expect-error TS2564 We know it's properly initialized
	public storage: GdprStorage;

	// @ts-expect-error TS2564 We know it's properly initialized
	public required: boolean;
	/**
	 * An observable that emits the new value of {@link GdprGuard#enabled} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly enabled$: Observable<boolean>;
	/**
	 * An observable that emits the new value of {@link GdprGuard#required} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly required$: Observable<boolean>;
	/**
	 * An observable that emits the new result of {@link GdprGuard#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	public readonly raw$: Observable<GdprGuardRaw>;
	#enabled$ = new BehaviorSubject(false);
	#required$ = new BehaviorSubject(false);
	#raw$ = new ReplaySubject<GdprGuardRaw>(1);

	/**
	 * @internal
	 * @private
	 */
	#sentinel$ = new ReplaySubject<boolean>(1);

	protected constructor(
		private underlyingGuard: GdprGuard,
	) {
		this.enabled$ = this.#enabled$.pipe(
			takeUntil(this.#sentinel$),
			distinctUntilChanged(),
		);

		this.required$ = this.#required$.pipe(
			takeUntil(this.#sentinel$),
			distinctUntilChanged(),
		);

		this.raw$ = this.#raw$.pipe(
			takeUntil(this.#sentinel$),
			distinctUntilChanged(deepEquals),
		);

		this.syncWithUnderlying();
	}

	/**
	 * Wrap the {@link GdprGuard} into a {@link RxGdprGuard} instance
	 * @param guard - The guard to wrap
	 */
	public static wrap(guard: GdprGuard): RxGdprGuard {
		if (guard instanceof RxGdprGuard) {
			return guard;
		}

		return new RxGdprGuard(guard);
	}

	/**
	 * Wrap the {@link GdprGuard} into a {@link RxGdprGuard} instance
	 * @alias wrap
	 * @param guard - The guard to decorate
	 */
	public static decorate(guard: GdprGuard): RxGdprGuard {
		return this.wrap(guard);
	}

	public unwrap(): GdprGuard {
		const guard = this.underlyingGuard;

		this.#sentinel$.next(true);
		this.#enabled$.complete();
		this.#raw$.complete();
		this.#required$.complete();

		return guard;
	}

	public lens<DerivedState>(derive: (guardRaw: GdprGuardRaw) => DerivedState): Observable<DerivedState> {
		return this.raw$.pipe(
			takeUntil(this.#sentinel$),
			map(derive),
		);
	}

	public map<T>(mapper: (guardRaw: GdprGuardRaw) => T): Observable<T> {
		return this.lens<T>(mapper);
	}

	public lensThrough<DerivedState>(derive: (guardRaw: GdprGuardRaw) => ObservableInput<DerivedState>): Observable<DerivedState> {
		return this.raw$.pipe(
			takeUntil(this.#sentinel$),
			mergeMap(derive),
		);
	}

	public flatMap<T>(mapper: (guardRaw: GdprGuardRaw) => ObservableInput<T>): Observable<T> {
		return this.lensThrough(mapper);
	}

	//// Overrides

	enable(): this {
		this.underlyingGuard.enable();
		this.syncWithUnderlying();
		return this;
	}

	disable(): this {
		this.underlyingGuard.disable();
		this.syncWithUnderlying();
		return this;
	}

	isEnabled(name: string): boolean {
		return this.underlyingGuard.isEnabled(name);
	}

	toggle(): this {
		this.underlyingGuard.toggle();
		this.syncWithUnderlying();
		return this;
	}

	makeRequired(): this {
		this.underlyingGuard.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	enableForStorage(type: GdprStorage): this {
		this.underlyingGuard.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	disableForStorage(type: GdprStorage): this {
		this.underlyingGuard.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	toggleForStorage(type: GdprStorage): this {
		this.underlyingGuard.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	raw(): GdprGuardRaw {
		return this.underlyingGuard.raw();
	}

	protected syncWithUnderlying() {
		this.name = this.underlyingGuard.name;
		this.enabled = this.underlyingGuard.enabled;
		this.description = this.underlyingGuard.description;
		this.storage = this.underlyingGuard.storage;
		this.required = this.underlyingGuard.required;


		this.#enabled$.next(this.enabled);
		this.#required$.next(this.required);
		this.#raw$.next(this.raw());
	}
}
