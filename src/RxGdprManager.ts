import { GdprGuardGroup, GdprManager, GdprManagerRaw, GdprStorage } from "gdpr-guard";
import { BehaviorSubject, distinctUntilChanged, type Observable, Subject } from "rxjs";
import { RxGdprGuardGroup } from "./RxGdprGuardGroup";
import { RxGdprGuard } from "./RxGdprGuard";
import deepEquals from "fast-deep-equal";

/**
 * A wrapper/decorator class for rxjs around a {@link GdprManager} instance
 * @invariant After construction of an instance: this.underlyingManager.getGroups().every(x => x instanceof RxGdprGuardGroup)
 */
export class RxGdprManager extends GdprManager {
	readonly #bannerWasShown$ = new BehaviorSubject(false);

	readonly #enabled$ = new BehaviorSubject(true);

	/**
	 * An observable that emits the new result of {@link GdprManager#raw} as it changes
	 * @warning It only emits (deeply) distinct values
	 */
	readonly #raw$ = new Subject<GdprManagerRaw>();

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

	public readonly raw$: Observable<GdprManagerRaw>;

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

	//// Overrides

	/**
	 * @inheritDoc
	 * @param underlyingManager - The manager to wrap/decorate
	 * @protected
	 */
	protected constructor(protected underlyingManager: GdprManager) {
		super();

		// Here we iterate over all the groups already present in
		// the underlying manager and wrap each of them. Then we
		// insert the wrapped groups back into the underlying manager.
		// This ensures that the groups array is a RxGdprGuardGroup[]
		// instead of a simple GdprGuardGroup[].
		//
		// It's extremely crucial that this invariant is kept throughout the class
		this.underlyingManager.getGroups()
			.forEach(group => {
				const decorated = RxGdprGuardGroup.decorate(group);
				this.underlyingManager.addGroup(decorated);
			});

		this.bannerWasShown$ = this.#bannerWasShown$.pipe(
			distinctUntilChanged(),
		);

		this.enabled$ = this.#enabled$.pipe(
			distinctUntilChanged(),
		);

		this.raw$ = this.#raw$.pipe(
			distinctUntilChanged(deepEquals),
		);

		this.syncWithUnderlying();

	}

	private syncWithUnderlying() {
		this.bannerWasShown = this.underlyingManager.bannerWasShown;
		this.enabled = this.underlyingManager.enabled;

		this.#bannerWasShown$.next(this.bannerWasShown);
		this.#enabled$.next(this.enabled);
	}

	//// Overrides

	public static override create(groups: GdprGuardGroup[] = []): RxGdprManager {
		const manager = GdprManager.create(groups);
		return this.wrap(manager);
	}

	public override closeBanner() {
		this.underlyingManager.closeBanner();
		this.syncWithUnderlying();
	}

	public override resetAndShowBanner() {
		this.underlyingManager.resetAndShowBanner();
		this.syncWithUnderlying();
	}

	public override createGroup(name: string, description?: string): RxGdprManager {
		const group = RxGdprGuardGroup.for(name, description);
		return this.addGroup(group);
	}

	public override addGroup(group: GdprGuardGroup): RxGdprManager {
		const wrapped = RxGdprGuardGroup.wrap(group);
		this.underlyingManager.addGroup(wrapped);
		this.syncWithUnderlying();
		return this;
	}

	public override hasGuard(name: string): boolean {
		return this.underlyingManager.hasGuard(name);
	}

	public override getGuard(name: string): RxGdprGuard | null {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying manager is actually an RxGdprGuardGroup.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.

		// From the RxGdprGuardGroup's invariant we know that any GdprGuard
		// in the underlying group is actually an RxGdprGuard.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingManager.getGuard(name) as (RxGdprGuard | null);
	}

	public override hasGroup(name: string): boolean {
		return this.underlyingManager.hasGroup(name);
	}

	public override getGroup(name: string): RxGdprGuardGroup | null {
		// From the invariant we know that any GdprGuardGroup in the
		// underlying manager is actually an RxGdprGuardGroup.
		// Therefore, this cast is absolutely safe as long as
		// the invariant is maintained.
		return this.underlyingManager.getGroup(name) as (RxGdprGuardGroup | null);
	}

	public override isEnabled(name: string): boolean {
		return this.underlyingManager.isEnabled(name);
	}

	public override enable(): RxGdprManager {
		this.underlyingManager.enable();
		this.syncWithUnderlying();
		return this;
	}

	public override disable(): RxGdprManager {
		this.underlyingManager.disable();
		this.syncWithUnderlying();
		return this;
	}

	public override toggle(): RxGdprManager {
		this.underlyingManager.toggle();
		this.syncWithUnderlying();
		return this;
	}

	public override enableForStorage(type: GdprStorage): RxGdprManager {
		this.underlyingManager.enableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override disableForStorage(type: GdprStorage): RxGdprManager {
		this.underlyingManager.disableForStorage(type);
		this.syncWithUnderlying();
		return this;
	}

	public override toggleForStorage(type: GdprStorage): RxGdprManager {
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
}

/**
 * Wrap the {@link GdprManager} into an {@link RxGdprManager} instance
 * @param manager - The manager to wrap
 */
export const rxWrapper = (manager: GdprManager) => RxGdprManager.wrap(manager);
