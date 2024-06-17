import type { GdprGuard, GdprGuardRaw, GdprStorage } from "gdpr-guard";
import { BehaviorSubject, distinctUntilChanged, map, mergeMap, Observable, ObservableInput, Subject } from "rxjs";
import deepEquals from "fast-deep-equal";
import { RxWrapper } from "./interfaces";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprGuard} instance (not one of its derived class)
 */
export class RxGdprGuard implements GdprGuard, RxWrapper<GdprGuardRaw> {
	// @ts-ignore TS2564
	public name: string;

	// @ts-ignore TS2564
	public enabled: boolean;

	// @ts-ignore TS2564
	public description: string;

	// @ts-ignore TS2564
	public storage: GdprStorage;

	// @ts-ignore TS2564
	public required: boolean;

	#enabled$ = new BehaviorSubject(false);
	#required$ = new BehaviorSubject(false);
	#raw$ = new Subject<GdprGuardRaw>();

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

	protected constructor(
		private underlyingGuard: GdprGuard,
	) {
		this.enabled$ = this.#enabled$.pipe(
			distinctUntilChanged(),
		);

		this.required$ = this.#required$.pipe(
			distinctUntilChanged(),
		);

		this.raw$ = this.#raw$.pipe(
			distinctUntilChanged(deepEquals),
		);

		this.syncWithUnderlying();
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

	public lens<DerivedState>(derive: (guard: GdprGuardRaw) => DerivedState): Observable<DerivedState> {
		return this.raw$.pipe(
			map(derive),
		);
	}

	public map<T>(mapper: (guard: GdprGuardRaw) => T): Observable<T> {
		return this.lens<T>(mapper);
	}

	public lensThrough<DerivedState>(derive: (guard: GdprGuardRaw) => ObservableInput<DerivedState>): Observable<DerivedState> {
		return this.raw$.pipe(
			mergeMap(derive),
		);
	}

	public flatMap<T>(mapper: (guard: GdprGuardRaw) => ObservableInput<T>): Observable<T> {
		return this.lensThrough(mapper);
	}

	//// Overrides

	enable(): RxGdprGuard {
		this.underlyingGuard.enable();
		this.syncWithUnderlying();
		return this;
	}

	disable(): RxGdprGuard {
		this.underlyingGuard.disable();
		this.syncWithUnderlying();
		return this;
	}

	isEnabled(name: string): boolean {
		return this.underlyingGuard.isEnabled(name);
	}

	toggle(): RxGdprGuard {
		this.underlyingGuard.toggle();
		this.syncWithUnderlying();
		return this;
	}

	makeRequired(): RxGdprGuard {
		this.underlyingGuard.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	enableForStorage(type: GdprStorage): RxGdprGuard {
		this.underlyingGuard.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	disableForStorage(type: GdprStorage): RxGdprGuard {
		this.underlyingGuard.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	toggleForStorage(type: GdprStorage): RxGdprGuard {
		this.underlyingGuard.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	raw(): GdprGuardRaw {
		return this.underlyingGuard.raw();
	}
}
