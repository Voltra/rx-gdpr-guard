import { GdprGuard, GdprGuardGroup, GdprGuardGroupRaw, GdprStorage } from "gdpr-guard";
import { RxWrapper } from "./interfaces";
import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	mergeMap,
	Observable,
	ObservableInput,
	ReplaySubject, SubscriptionLike,
} from "rxjs";
import deepEquals from "fast-deep-equal";
import { RxGdprGuard } from "./RxGdprGuard";
import type { GdprGuardCollection } from "gdpr-guard/dist/GdprGuardCollection";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprGuardGroup} instance (not one of its derived class)
 * @invariant After construction of an instance: <code>this.underlyingGroup.getGuards().every(x => x instanceof RxGdprGuard || x instanceof RxGdprGuardGroup)</code>
 */
export class RxGdprGuardGroup extends GdprGuardGroup implements RxWrapper<GdprGuardGroupRaw, GdprGuardGroup> {
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
	#raw$ = new ReplaySubject<GdprGuardGroupRaw>(1);
	#enabled$ = new BehaviorSubject(false);
	#required$ = new BehaviorSubject(false);

	#subscriptions = [] as SubscriptionLike[];

	protected constructor(private underlyingGroup: GdprGuardGroup) {
		super(underlyingGroup.name, underlyingGroup.description, underlyingGroup.enabled, underlyingGroup.required);

		// Here we iterate over all the guards already present in
		// the underlying group and wrap each of them. Then we
		// insert the wrapped guards back into the underlying group.
		// This ensures that the guards array is a (RxGdprGuard|RxGdprGuardGroup)[]
		// instead of a simple GdprGuard[].
		//
		// It's extremely crucial that this invariant is kept throughout the class
		this.underlyingGroup.getGuards()
			.forEach(guard => {
				const wrapped = guard instanceof GdprGuardGroup
					? RxGdprGuardGroup.wrap(guard)
					: RxGdprGuard.wrap(guard);
				this.underlyingGroup.addGuard(wrapped);
				this.subscribeToChanges(wrapped);
			});

		this.raw$ = this.#raw$.pipe(
			distinctUntilChanged((a, b) => deepEquals(a, b)),
		);

		this.enabled$ = this.#enabled$.pipe(
			distinctUntilChanged(),
		);

		this.required$ = this.#required$.pipe(
			distinctUntilChanged(),
		);
	}

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

	static override for(name: string, description?: string, enabled?: boolean, required?: boolean): RxGdprGuardGroup {
		return RxGdprGuardGroup.decorate(
			new GdprGuardGroup(name, description, enabled, required),
		);
	}

	public lens<DerivedState>(derive: (groupRaw: GdprGuardGroupRaw) => DerivedState): Observable<DerivedState> {
		return this.raw$.pipe(
			map(derive),
		);
	}

	public map<T>(mapper: (groupRaw: GdprGuardGroupRaw) => T): Observable<T> {
		return this.lens<T>(mapper);
	}

	public lensThrough<DerivedState>(derive: (groupRaw: GdprGuardGroupRaw) => ObservableInput<DerivedState>): Observable<DerivedState> {
		return this.raw$.pipe(
			mergeMap(derive),
		);
	}

	public flatMap<T>(mapper: (groupRaw: GdprGuardGroupRaw) => ObservableInput<T>): Observable<T> {
		return this.lensThrough(mapper);
	}

	public unwrap(): GdprGuardGroup {
		const group = this.underlyingGroup;

		this.getGuards().forEach(guard => {
			const unwrapped = guard.unwrap();
			group.addGuard(unwrapped);
		});

		this.#enabled$.complete();
		this.#raw$.complete();
		this.#required$.complete();

		this.#subscriptions.forEach(subscription => {
			subscription.unsubscribe();
		});

		this.#subscriptions = [];

		return group;
	}

	//// Overrides

	public override addGuard(guard: GdprGuard): this {
		const wrappedGuard = guard instanceof GdprGuardGroup
			? RxGdprGuard.wrap(guard)
			: RxGdprGuard.wrap(guard);
		this.underlyingGroup.addGuard(wrappedGuard);
		this.syncWithUnderlying();
		this.subscribeToChanges(wrappedGuard);
		return this;
	}

	public override hasGuard(name: string): boolean {
		return this.underlyingGroup.hasGuard(name);
	}

	public override getGuard(name: string): RxGdprGuardGroup | RxGdprGuard | null {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying group is actually an RxGdprGuardGroup.
		// From the invariant we know that any GdprGuard in the
		// underlying group is actually an RxGdprGuard.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingGroup.getGuard(name) as (RxGdprGuardGroup | RxGdprGuard | null);
	}

	public override isEnabled(name: string): boolean {
		return this.underlyingGroup.isEnabled(name);
	}

	public override enable(): this {
		this.underlyingGroup.enable();
		this.syncWithUnderlying();
		return this;
	}

	public override disable(): this {
		this.underlyingGroup.disable();
		this.syncWithUnderlying();
		return this;
	}

	public override toggle(): this {
		this.underlyingGroup.toggle();
		this.syncWithUnderlying();
		return this;
	}

	public override makeRequired(): this {
		this.underlyingGroup.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	public override enableForStorage(type: GdprStorage): this {
		this.underlyingGroup.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override disableForStorage(type: GdprStorage): this {
		this.underlyingGroup.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override toggleForStorage(type: GdprStorage): this {
		this.underlyingGroup.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override raw(): GdprGuardGroupRaw {
		return this.underlyingGroup.raw();
	}

	public override getGuards(): (RxGdprGuardGroup | RxGdprGuard)[] {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying group is actually an RxGdprGuardGroup.
		// From the invariant we know that any GdprGuard in the
		// underlying group is actually an RxGdprGuard.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingGroup.getGuards() as (RxGdprGuardGroup | RxGdprGuard)[];
	}

	protected override doForEachGuard(cb: (guard: GdprGuard) => void): this {
		this.getGuards().forEach(cb);
		return this;
	}

	protected override reduceSubGroupsPred(pred: (guard: GdprGuardGroup) => boolean): boolean {
		for (const guard of this.getGuards()) {
			if (guard instanceof GdprGuardGroup && pred(guard)) {
				return true;
			}
		}
		return false;
	}

	//// Private overrides

	protected override reduceSubGroups(extractor: (guard: (GdprGuardCollection & GdprGuard)) => (GdprGuard | null)): GdprGuard | null {
		for (const guard of this.getGuards()) {
			if (!(guard instanceof GdprGuardGroup)) {
				continue;
			}

			const extracted = extractor(guard);

			if (extracted) {
				return extracted;
			}
		}

		return null;
	}

	private subscribeToChanges(guard: RxGdprGuard | RxGdprGuardGroup) {
		const subscription = guard.raw$.subscribe({
			next: () => { this.syncWithUnderlying(); },
		});

		this.#subscriptions.push(subscription);
	}

	private syncWithUnderlying() {
		this.name = this.underlyingGroup.name;
		this.enabled = this.underlyingGroup.enabled;
		this.description = this.underlyingGroup.description;
		this.required = this.underlyingGroup.required;

		// @ts-expect-error TS2446 We want to share the exact same instance
		this.bindings = this.underlyingGroup.bindings;

		this.#enabled$.next(this.enabled);
		this.#required$.next(this.required);
		this.#raw$.next(this.raw());
	}
}
