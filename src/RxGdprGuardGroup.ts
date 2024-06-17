import { GdprGuard, GdprGuardGroup, GdprGuardGroupRaw, GdprGuardRaw, GdprStorage } from "gdpr-guard";
import { RxWrapper } from "./interfaces";
import { BehaviorSubject, distinctUntilChanged, map, mergeMap, Observable, ObservableInput, Subject } from "rxjs";
import deepEquals from "fast-deep-equal";
import { RxGdprGuard } from "./RxGdprGuard";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprGuardGroup} instance (not one of its derived class)
 * @invariant After construction of an instance: this.underlyingGroup.getGuards().every(x => x instanceof RxGdprGuard)
 */
export class RxGdprGuardGroup extends GdprGuardGroup implements RxWrapper<GdprGuardGroupRaw> {
	#raw$ = new Subject<GdprGuardGroupRaw>();
	#enabled$ = new BehaviorSubject(false);
	#required$ = new BehaviorSubject(false);

	/**
	 * An observable that emits the new result of {@link GdprGuardGroup#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	public readonly raw$: Observable<GdprGuardGroupRaw>;

	/**
	 * An observable that emits the new value of {@link GdprGuardGroup#enabled} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly enabled$: Observable<boolean>;

	/**
	 * An observable that emits the new value of {@link GdprGuardGroup#required} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly required$: Observable<boolean>;

	/**
	 * Wrap the {@link GdprGuardGroup} into an {@link RxGdprGuardGroup} instance
	 * @param group - The group to wrap
	 */
	public static wrap(group: GdprGuardGroup): RxGdprGuardGroup {
		if (group instanceof RxGdprGuardGroup) {
			return group;
		}

		return new RxGdprGuardGroup(group);
	}

	/**
	 * Wrap the {@link GdprGuardGroup} into an {@link RxGdprGuardGroup} instance
	 * @alias wrap
	 * @param group - The group to decorate
	 */
	public static decorate(group: GdprGuardGroup): RxGdprGuardGroup {
		return this.wrap(group);
	}

	protected constructor(private underlyingGroup: GdprGuardGroup) {
		super(underlyingGroup.name, underlyingGroup.description, underlyingGroup.enabled, underlyingGroup.required);

		// Here we iterate over all the guards already present in
		// the underlying group and wrap each of them. Then we
		// insert the wrapped guards back into the underlying group.
		// This ensures that the guards array is a RxGdprGuard[]
		// instead of a simple GdprGuard[].
		//
		// It's extremely crucial that this invariant is kept throughout the class
		this.underlyingGroup.getGuards()
			.forEach(guard => {
				const wrapped = guard instanceof GdprGuardGroup
					? RxGdprGuardGroup.wrap(guard)
					: RxGdprGuard.wrap(guard);
				this.underlyingGroup.addGuard(wrapped);
			});

		this.raw$ = this.#raw$.pipe(
			distinctUntilChanged(deepEquals),
		);

		this.enabled$ = this.#enabled$.pipe(
			distinctUntilChanged(),
		);

		this.required$ = this.#required$.pipe(
			distinctUntilChanged(),
		);
	}

	static override for(name: string, description?: string, enabled?: boolean, required?: boolean): RxGdprGuardGroup {
		return RxGdprGuardGroup.decorate(
			new GdprGuardGroup(name, description, enabled, required),
		);
	}

	private syncWithUnderlying() {
		this.name = this.underlyingGroup.name;
		this.enabled = this.underlyingGroup.enabled;
		this.description = this.underlyingGroup.description;
		this.required = this.underlyingGroup.required;

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

	public override addGuard(guard: GdprGuard): RxGdprGuardGroup {
		const wrappedGuard = RxGdprGuard.wrap(guard);
		this.underlyingGroup.addGuard(wrappedGuard);
		this.syncWithUnderlying();
		return this;
	}

	public override hasGuard(name: string): boolean {
		return this.underlyingGroup.hasGuard(name);
	}

	public override getGuard(name: string): RxGdprGuard | null {
		// From the invariant we know that any GdprGuard in the
		// underlying group is actually an RxGdprGuard.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingGroup.getGuard(name) as (RxGdprGuard | null);
	}

	public override isEnabled(name: string): boolean {
		return this.underlyingGroup.isEnabled(name);
	}

	public override enable(): RxGdprGuardGroup {
		this.underlyingGroup.enable();
		this.syncWithUnderlying();
		return this;
	}

	public override disable(): RxGdprGuardGroup {
		this.underlyingGroup.disable();
		this.syncWithUnderlying();
		return this;
	}

	public override toggle(): RxGdprGuardGroup {
		this.underlyingGroup.toggle();
		this.syncWithUnderlying();
		return this;
	}

	public override makeRequired(): RxGdprGuardGroup {
		this.underlyingGroup.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	public override enableForStorage(type: GdprStorage): RxGdprGuardGroup {
		this.underlyingGroup.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override disableForStorage(type: GdprStorage): RxGdprGuardGroup {
		this.underlyingGroup.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override toggleForStorage(type: GdprStorage): RxGdprGuardGroup {
		this.underlyingGroup.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override raw(): GdprGuardGroupRaw {
		return this.underlyingGroup.raw();
	}

	public override getGuards(): GdprGuard[] {
		return this.underlyingGroup.getGuards();
	}
}
