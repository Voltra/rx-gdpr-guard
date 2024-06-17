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

	protected _enabled$ = new BehaviorSubject(false);
	protected _required$ = new BehaviorSubject(false);
	protected _raw$ = new Subject<GdprGuardRaw>();

	/**
	 * An observable that emits the new value of {@link GdprGuard#enabled} as it changes
	 * @warning It only emits distinct values
	 */
	public get enabled$(): Observable<boolean> {
		return this._enabled$.pipe(
			distinctUntilChanged(),
		);
	}

	/**
	 * An observable that emits the new value of {@link GdprGuard#required} as it changes
	 * @warning It only emits distinct values
	 */
	public get required$(): Observable<boolean> {
		return this._required$.pipe(
			distinctUntilChanged(),
		);
	}

	/**
	 * An observable that emits the new value of {@link GdprGuard#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	public get raw$(): Observable<GdprGuardRaw> {
		return this._raw$.pipe(
			distinctUntilChanged(deepEquals),
		);
	}

	public static wrap(guard: GdprGuard): RxGdprGuard {
		if (guard instanceof RxGdprGuard) {
			return guard;
		}

		return new RxGdprGuard(guard);
	}

	public static decorate(guard: GdprGuard): RxGdprGuard {
		return this.wrap(guard);
	}

	protected constructor(
		private underlyingGuard: GdprGuard,
	) {
		this.syncWithUnderlying();
	}

	protected syncWithUnderlying() {
		this.name = this.underlyingGuard.name;
		this.enabled = this.underlyingGuard.enabled;
		this.description = this.underlyingGuard.description;
		this.storage = this.underlyingGuard.storage;
		this.required = this.underlyingGuard.required;


		this._enabled$.next(this.enabled);
		this._required$.next(this.required);
		this._raw$.next(this.raw());
	}

	public lens<DerivedState>(derive: (guard: GdprGuardRaw) => DerivedState): Observable<DerivedState> {
		return this.raw$.pipe(
			map(derive)
		);
	}

	public map<T>(mapper: (guard: GdprGuardRaw) => T): Observable<T> {
		return this.lens<T>(mapper);
	}

	public lensThrough<DerivedState>(derive: (guard: GdprGuardRaw) => ObservableInput<DerivedState>): Observable<DerivedState> {
		return this.raw$.pipe(
			mergeMap(derive)
		);
	}

	public flatMap<T>(mapper: (guard: GdprGuardRaw) => ObservableInput<T>): Observable<T> {
		return this.lensThrough(mapper);
	}

	//// Overrides

	enable(): GdprGuard {
		this.underlyingGuard.enable();
		this.syncWithUnderlying();
		return this;
	}

	disable(): GdprGuard {
		this.underlyingGuard.disable();
		this.syncWithUnderlying();
		return this;
	}

	isEnabled(name: string): boolean {
		return this.underlyingGuard.isEnabled(name);
	}

	toggle(): GdprGuard {
		this.underlyingGuard.toggle();
		this.syncWithUnderlying();
		return this;
	}

	makeRequired(): GdprGuard {
		this.underlyingGuard.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	enableForStorage(type: GdprStorage): GdprGuard {
		this.underlyingGuard.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	disableForStorage(type: GdprStorage): GdprGuard {
		this.underlyingGuard.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	toggleForStorage(type: GdprStorage): GdprGuard {
		this.underlyingGuard.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	raw(): GdprGuardRaw {
		return this.underlyingGuard.raw();
	}
}
