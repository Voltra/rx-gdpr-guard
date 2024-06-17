import { GdprGuardGroup, GdprManager } from "gdpr-guard";
import { type Observable, BehaviorSubject, distinctUntilChanged } from "rxjs";

export class RxGdprManager extends GdprManager {
	protected readonly _bannerWasShown$ = new BehaviorSubject(false);

	protected readonly _enabled$ = new BehaviorSubject(true);

	/**
	 * An observable that emits the new value of {@link GdprManager#bannerWasShown} as it changes
	 * @warning It only emits distinct values
	 */
	public get bannerWasShown$(): Observable<boolean> {
		return this._bannerWasShown$.pipe(
			distinctUntilChanged(),
		);
	}

	/**
	 * An observable that emits the new value of {@link GdprManager#enabled} as it changes
	 * @warning It only emits distinct values
	 */
	public get enabled$(): Observable<boolean> {
		return this._enabled$.pipe(
			distinctUntilChanged(),
		);
	}

	/**
	 * Wrap the {@link GdprManager} into a {@link RxGdprManager} instance
	 * @param manager - The manager to wrap
	 */
	public static wrap(manager: GdprManager): RxGdprManager {
		if (manager instanceof RxGdprManager) {
			return manager;
		}

		return new this(manager);
	}

	/**
	 * Wrap the {@link GdprManager} into a {@link RxGdprManager} instance
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

		this.syncWithUnderlying();

		this._bannerWasShown$.next(underlyingManager.bannerWasShown);
		this._enabled$.next(underlyingManager.enabled);
		//TODO: Decorate groups etc.
	}

	public static override create(groups: GdprGuardGroup[] = []): GdprManager {
		const manager = GdprManager.create(groups);
		return this.wrap(manager);
	}

	public override closeBanner() {
		this.underlyingManager.closeBanner();
		this.syncWithUnderlying();
		this._bannerWasShown$.next(this.bannerWasShown);
	}

	public override resetAndShowBanner() {
		this.underlyingManager.resetAndShowBanner();
		this.syncWithUnderlying();
		this._bannerWasShown$.next(this.bannerWasShown);
	}

	private syncWithUnderlying() {
		this.bannerWasShown = this.underlyingManager.bannerWasShown;
		this.enabled = this.underlyingManager.enabled;
	}
}
