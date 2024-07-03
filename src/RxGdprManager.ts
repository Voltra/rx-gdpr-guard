import {
	GdprGuardGroup,
	GdprManager,
	GdprManagerRaw,
	GdprStorage,
} from "gdpr-guard";
import {
	BehaviorSubject,
	distinctUntilChanged,
	map,
	mergeMap,
	type Observable,
	ObservableInput,
	ReplaySubject,
	SubscriptionLike,
	takeUntil,
} from "rxjs";
import { RxGdprGuardGroup } from "./RxGdprGuardGroup";
import { RxGdprGuard } from "./RxGdprGuard";
import { RxWrapper } from "./interfaces";
import { deepEquals } from "./utils";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprManager} instance
 * @invariant After construction of an instance: <code>this.underlyingManager.getGroups().every(x => x instanceof RxGdprGuardGroup)</code>
 */
export class RxGdprManager
	extends GdprManager
	implements RxWrapper<GdprManagerRaw, GdprManager>
{
	/**
	 * An observable that emits the new value of {@link GdprManager#bannerWasShown} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly bannerWasShown$: Observable<boolean>;
	/**
	 * An observable that emits the new value of {@link GdprManager#enabled} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly enabled$: Observable<boolean>;
	/**
	 * An observable that emits the new value of {@link GdprManager#required} as it changes
	 * @warning It only emits distinct values
	 */
	public readonly required$: Observable<boolean>;
	/**
	 * An observable that emits the new result of {@link GdprManager#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	public readonly raw$: Observable<GdprManagerRaw>;
	readonly #bannerWasShown$ = new BehaviorSubject(false);
	readonly #enabled$ = new BehaviorSubject(true);
	readonly #required$ = new BehaviorSubject(false);
	readonly #raw$ = new ReplaySubject<GdprManagerRaw>(1);

	/**
	 * @internal
	 * @private
	 */
	readonly #sentinel$ = new ReplaySubject<boolean>(1);

	#subscriptions = [] as SubscriptionLike[];

	/**
	 * @inheritDoc
	 * @param underlyingManager - The manager to wrap/decorate
	 * @protected
	 */
	protected constructor(protected underlyingManager: GdprManager) {
		super();

		// @ts-expect-error TS2540 We want to share the exact same instance
		this.events = this.underlyingManager.events;

		// Here we iterate over all the groups already present in
		// the underlying manager and wrap each of them. Then we
		// insert the wrapped groups back into the underlying manager.
		// This ensures that the groups array is a RxGdprGuardGroup[]
		// instead of a simple GdprGuardGroup[].
		//
		// It's extremely crucial that this invariant is kept throughout the class
		this.underlyingManager.getGroups().forEach(group => {
			const decorated = RxGdprGuardGroup.decorate(group);
			this.underlyingManager.addGroup(decorated);

			this.subscribeToChanges(decorated);
		});

		this.bannerWasShown$ = this.#bannerWasShown$.pipe(
			takeUntil(this.#sentinel$),
			distinctUntilChanged(),
		);

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
	 * Wrap the {@link GdprManager} into an {@link RxGdprManager} instance
	 * @param manager - The manager to wrap
	 */
	public static wrap(manager: GdprManager): RxGdprManager {
		if (manager instanceof RxGdprManager) {
			return manager;
		}

		return new this(manager);
	}

	/**
	 * Wrap the {@link GdprManager} into an {@link RxGdprManager} instance
	 * @alias wrap
	 * @param manager - The manager to decorate
	 */
	public static decorate(manager: GdprManager): RxGdprManager {
		return this.wrap(manager);
	}

	public static override create(
		groups: GdprGuardGroup[] = [],
	): RxGdprManager {
		const manager = GdprManager.create(groups);
		return this.wrap(manager);
	}

	public unwrap(): GdprManager {
		const manager = this.underlyingManager;

		this.getGroups().forEach(group => {
			const unwrapped = group.unwrap();
			manager.addGroup(unwrapped);
		});

		this.#sentinel$.next(true);

		this.#bannerWasShown$.complete();
		this.#enabled$.complete();
		this.#raw$.complete();
		this.#required$.complete();

		this.#subscriptions.forEach(subscription => {
			subscription.unsubscribe();
		});

		this.#subscriptions = [];

		return manager;
	}

	lens<DerivedState>(
		derive: (guard: GdprManagerRaw) => DerivedState,
	): Observable<DerivedState> {
		return this.raw$.pipe(takeUntil(this.#sentinel$), map(derive));
	}

	map<T>(mapper: (guard: GdprManagerRaw) => T): Observable<T> {
		return this.lens(mapper);
	}

	lensThrough<DerivedState>(
		derive: (managerRaw: GdprManagerRaw) => ObservableInput<DerivedState>,
	): Observable<DerivedState> {
		return this.raw$.pipe(takeUntil(this.#sentinel$), mergeMap(derive));
	}

	flatMap<T>(
		mapper: (guard: GdprManagerRaw) => ObservableInput<T>,
	): Observable<T> {
		return this.lensThrough(mapper);
	}

	public override closeBanner() {
		this.underlyingManager.closeBanner();
		this.syncWithUnderlying();
	}

	public override resetAndShowBanner() {
		this.underlyingManager.resetAndShowBanner();
		this.syncWithUnderlying();
	}

	//// Overrides

	public override createGroup(name: string, description?: string): this {
		const group = RxGdprGuardGroup.for(name, description);
		return this.addGroup(group);
	}

	public override addGroup(group: GdprGuardGroup): this {
		const wrapped = RxGdprGuardGroup.wrap(group);
		this.underlyingManager.addGroup(wrapped);
		this.syncWithUnderlying();
		this.subscribeToChanges(wrapped);
		return this;
	}

	public override hasGuard(name: string): boolean {
		return this.underlyingManager.hasGuard(name);
	}

	public override getGuard(
		name: string,
	): RxGdprGuardGroup | RxGdprGuard | null {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying manager is actually an RxGdprGuardGroup.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.

		// From the RxGdprGuardGroup's invariant we know that any GdprGuard
		// in the underlying group is actually an RxGdprGuard.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingManager.getGuard(name) as
			| RxGdprGuardGroup
			| RxGdprGuard
			| null;
	}

	public override hasGroup(name: string): boolean {
		return this.underlyingManager.hasGroup(name);
	}

	public override getGroup(name: string): RxGdprGuardGroup | null {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying manager is actually an RxGdprGuardGroup.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingManager.getGroup(name) as RxGdprGuardGroup | null;
	}

	public override isEnabled(name: string): boolean {
		return this.underlyingManager.isEnabled(name);
	}

	public override enable(): this {
		this.underlyingManager.enable();
		this.syncWithUnderlying();
		return this;
	}

	public override disable(): this {
		this.underlyingManager.disable();
		this.syncWithUnderlying();
		return this;
	}

	public override toggle(): this {
		this.underlyingManager.toggle();
		this.syncWithUnderlying();
		return this;
	}

	public override makeRequired(): this {
		this.underlyingManager.makeRequired();
		this.syncWithUnderlying();
		return this;
	}

	public override enableForStorage(type: GdprStorage): this {
		this.underlyingManager.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override disableForStorage(type: GdprStorage): this {
		this.underlyingManager.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override toggleForStorage(type: GdprStorage): this {
		this.underlyingManager.toggleForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override raw(): GdprManagerRaw {
		return this.underlyingManager.raw();
	}

	public override getGroups(): RxGdprGuardGroup[] {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying manager is actually an RxGdprGuardGroup.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingManager.getGroups() as RxGdprGuardGroup[];
	}

	//// Private overrides

	/**
	 * @internal
	 * @protected
	 */
	protected override reduceGroupsPred(
		pred: (group: GdprGuardGroup) => boolean,
	): boolean {
		for (const group of this.getGroups()) {
			if (pred(group)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @internal
	 * @protected
	 */
	protected override forEachGroup(cb: (group: GdprGuardGroup) => void): this {
		this.getGroups().forEach(cb);
		return this;
	}

	/**
	 * Subscribe to the changes tied to the given {@link RxGdprGuardGroup} to properly keep in sync
	 * @param group
	 * @internal
	 * @private
	 */
	private subscribeToChanges(group: RxGdprGuardGroup) {
		const subscription = group.raw$.subscribe({
			next: () => {
				this.syncWithUnderlying();
			},
		});

		this.#subscriptions.push(subscription);
	}

	/**
	 * @internal
	 * @private
	 */
	private syncWithUnderlying() {
		this.bannerWasShown = this.underlyingManager.bannerWasShown;
		this.enabled = this.underlyingManager.enabled;

		// @ts-expect-error TS2446 We want to share the same instance
		this.groups = this.underlyingManager.groups;

		this.#bannerWasShown$.next(this.bannerWasShown);
		this.#enabled$.next(this.enabled);
	}
}

/**
 * Wrap the {@link GdprManager} into an {@link RxGdprManager} instance
 * @param manager - The manager to wrap
 */
export const rxWrapper = (manager: GdprManager) => RxGdprManager.wrap(manager);
