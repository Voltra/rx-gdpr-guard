import { GdprGuard, GdprGuardGroup, GdprGuardGroupRaw, GdprGuardRaw, GdprStorage } from "gdpr-guard";
import { RxWrapper } from "./interfaces";
import { distinctUntilChanged, map, mergeMap, Observable, ObservableInput, Subject } from "rxjs";
import deepEquals from "fast-deep-equal";
import { RxGdprGuard } from "./RxGdprGuard";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprGuardGroup} instance (not one of its derived class)
 */
export class RxGdprGuardGroup extends GdprGuardGroup implements RxWrapper<GdprGuardGroupRaw> {
	protected _raw$ = new Subject<GdprGuardGroupRaw>();

	/**
	 * An observable that emits the new value of {@link GdprGuardGroup#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	public get raw$(): Observable<GdprGuardGroupRaw> {
		return this._raw$.pipe(
			distinctUntilChanged(deepEquals),
		);
	}

	protected constructor(private underlyingGroup: GdprGuardGroup) {
		super(underlyingGroup.name, underlyingGroup.description, underlyingGroup.enabled, underlyingGroup.required);
	}

	private syncWithUnderlying() {
		this.name = this.underlyingGroup.name;
		this.enabled = this.underlyingGroup.enabled;
		this.description = this.underlyingGroup.description;
		this.required = this.underlyingGroup.required;

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


	public override addGuard(guard: GdprGuard): GdprGuardGroup {
		const wrappedGuard = RxGdprGuard.wrap(guard);
		this.underlyingGroup.addGuard(wrappedGuard);
		this.syncWithUnderlying();
		return this;
	}

	public override hasGuard(name: string): boolean {
		return this.underlyingGroup.hasGuard(name);
	}

	public override getGuard(name: string): GdprGuard | null {
		const guard = this.underlyingGroup.getGuard(name);

		if (guard === null) {
			return guard;
		}

		return RxGdprGuard.wrap(guard);
	}

	public override isEnabled(name: string): boolean {
		return this.underlyingGroup.isEnabled(name);
	}

	public override enable(): GdprGuardGroup {
		this.underlyingGroup.enable();
		this.syncWithUnderlying();
		return this;
	}

	public override disable(): GdprGuardGroup {
		return super.disable();
	}

	public override toggle(): GdprGuardGroup {
		return super.toggle();
	}

	public override makeRequired(): GdprGuardGroup {
		return super.makeRequired();
	}

	public override enableForStorage(type: GdprStorage): GdprGuardGroup {
		return super.enableForStorage(type);
	}

	public override disableForStorage(type: GdprStorage): GdprGuardGroup {
		return super.disableForStorage(type);
	}

	public override toggleForStorage(type: GdprStorage): GdprGuardGroup {
		return super.toggleForStorage(type);
	}

	public override raw(): GdprGuardGroupRaw {
		return super.raw();
	}

	public override getGuards(): GdprGuard[] {
		return super.getGuards();
	}
}
