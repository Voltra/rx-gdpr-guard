import { describe, expect, it, vi } from "vitest";
import { RxGdprGuard } from "@/RxGdprGuard";
import { GdprGuard, GdprStorage, makeGuard } from "gdpr-guard";
import { wrapTestCases } from "../utils";
import { storageCases } from "../testCases";
import {
	EmptyError,
	firstValueFrom,
	map,
	Observable,
	Subscription,
} from "rxjs";

const guardFactory = ({
	name = "my-guard",
	description = "My guard description",
	storage = GdprStorage.ServerStorage,
	required = false,
	enabled = false,
} = {}): GdprGuard => makeGuard(name, description, storage, required, enabled);

const index = () => map((_, i) => i);

const makeCounterState = (obs$: Observable<unknown>) => {
	const ret = {
		counter: 0,
	} as unknown as {
		counter: number,
		subscription: Subscription,
	};

	ret.subscription = obs$.pipe(
		index(),
	).subscribe(() => {
		ret.counter += 1;
	});

	return ret;
};

const withinCounterState = async (obs$: Observable<unknown>, fn: (state: ReturnType<typeof makeCounterState>) => Promise<unknown>) => {
	const state = makeCounterState(obs$);

	try {
		await fn(state);
	} finally {
		state.subscription.unsubscribe();
	}

	return state;
};

describe("RxGdprGuard", () => {
	const expectToBeInSync = (guard: GdprGuard, decorated: RxGdprGuard) => {
		expect(decorated.name).toStrictEqual(guard.name);
		expect(decorated.description).toStrictEqual(guard.description);
		expect(decorated.storage).toStrictEqual(guard.storage);
		expect(decorated.required).toStrictEqual(guard.required);
		expect(decorated.enabled).toStrictEqual(guard.enabled);
	};

	const expectInvariantsToBeMaintained = (
		guard: GdprGuard,
		decorated: RxGdprGuard,
	) => {
		expectToBeInSync(guard, decorated);
	};

	const decorateTests = (factoryName: "decorate" | "wrap") => {
		it("returns an RxGdprGuard instance", () => {
			const guard = guardFactory();
			const decorated = RxGdprGuard[factoryName](guard);

			expect(decorated).toBeInstanceOf(RxGdprGuard);
		});
	};

	it("shares the same publicly visible state as the underlying guard", () => {
		const guard = guardFactory();
		const decorated = RxGdprGuard.decorate(guard);

		expectInvariantsToBeMaintained(guard, decorated);
	});

	describe(".wrap(guard)", () => {
		decorateTests("wrap");
	});
	describe(".decorate(guard)", () => {
		decorateTests("decorate");
	});

	describe("#enable()", () => {
		it("calls the underlying guard's GdprGuard#enable()", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "enable");

			decorated.enable();

			expect(spy).toHaveBeenCalledOnce();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the guard", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.enable();

			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the underlying guard", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.enable();

			expect(guard.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("does nothing if the guard was already enabled", () => {
			const guard = guardFactory({
				enabled: true,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.enable();

			expect(guard.enabled).toBeTruthy();
			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});
	});

	describe("#disable()", () => {
		it("calls the underlying guard's GdprGuard#disable()", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "disable");

			decorated.disable();

			expect(spy).toHaveBeenCalledOnce();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("disables the guard if it's not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.disable();

			expect(decorated.enabled).toBeFalsy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("disables the underlying guard if it's not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.disable();

			expect(guard.enabled).toBeFalsy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("does not disable the guard if it's required", () => {
			const guard = guardFactory({
				enabled: true,
				required: true,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.disable();

			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("does not disable the underlying guard if it's required", () => {
			const guard = guardFactory({
				enabled: true,
				required: true,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.disable();

			expect(guard.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});
	});

	describe("#isEnabled(name)", () => {
		it("calls the underlying guard's GdprGuard#isEnabled(name)", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "isEnabled");

			const name = "SomeRandomName";

			decorated.isEnabled(name);

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(name);
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("returns the same result as GdprGuard#isEnabled(name)", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			const name = "SomeRandomName";
			expect(decorated.isEnabled(name)).toStrictEqual(
				guard.isEnabled(name),
			);
			expect(decorated.isEnabled(guard.name)).toStrictEqual(
				guard.isEnabled(guard.name),
			);

			decorated.enable();
			expect(decorated.isEnabled(guard.name)).toStrictEqual(
				guard.isEnabled(guard.name),
			);

			decorated.disable();
			expect(decorated.isEnabled(guard.name)).toStrictEqual(
				guard.isEnabled(guard.name),
			);
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it.each(wrapTestCases(["some randome name", "gdpr-guard", "guard"]))(
			"returns false for any guard name that isn't this guard's name",
			name => {
				const guard = guardFactory({
					enabled: true,
				});
				const decorated = RxGdprGuard.decorate(guard);

				expect(decorated.isEnabled(name)).toBeFalsy();
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it("returns the value of guard.enabled if name is this guard's name", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			expect(decorated.isEnabled(guard.name)).toBeFalsy();
			expect(decorated.isEnabled(guard.name)).toStrictEqual(
				guard.enabled,
			);
			expectInvariantsToBeMaintained(guard, decorated);

			decorated.enable();

			expect(decorated.isEnabled(guard.name)).toBeTruthy();
			expect(decorated.isEnabled(guard.name)).toStrictEqual(
				guard.enabled,
			);
			expectInvariantsToBeMaintained(guard, decorated);
		});
	});

	describe("#toggle()", () => {
		it("calls the underlying guard's GdprGuard#toggle()", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "toggle");

			decorated.toggle();

			expect(spy).toHaveBeenCalledOnce();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the guard if it was disabled", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the underlying guard if it was disabled", () => {
			const guard = guardFactory({
				enabled: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(guard.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("disables the guard if it was enabled but not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(decorated.enabled).toBeFalsy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("disables the underlying guard if it was enabled but not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(guard.enabled).toBeFalsy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("does not disable the guard if it was enabled but not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: true,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("does not disable the underlying guard if it was enabled but not required", () => {
			const guard = guardFactory({
				enabled: true,
				required: true,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.toggle();

			expect(guard.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});
	});

	describe("#makeRequired()", () => {
		it("calls the underlying guard's GdprGuard#makeRequired()", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "makeRequired");

			decorated.makeRequired();

			expect(spy).toHaveBeenCalledOnce();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("makes the guard required if it wasn't already", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.makeRequired();

			expect(decorated.required).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("makes the underlying guard required if it wasn't already", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.makeRequired();

			expect(guard.required).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the guard if it wasn't already", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.makeRequired();

			expect(decorated.required).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it("enables the underlying guard if it wasn't already", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);

			decorated.makeRequired();

			expect(guard.required).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});
	});

	describe("#enableForStorage(storage)", () => {
		it("calls the underlying guard's GdprGuard#enableForStorage(storage)", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "enableForStorage");
			const storage = GdprStorage.FileSystem;

			decorated.enableForStorage(storage);

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(storage);
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it.each(storageCases)(
			"does nothing if storage is different from the guard's storage, and is not GdprStorage.All",
			storage => {
				const guard = guardFactory({
					enabled: false,
					storage:
						storage === GdprStorage.ServerStorage
							? GdprStorage.None
							: GdprStorage.ServerStorage,
				});

				const decorated = RxGdprGuard.decorate(guard);

				const expected = decorated.raw();

				decorated.enableForStorage(storage);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"does nothing if the guard is already enabled",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: true,
				});

				const decorated = RxGdprGuard.decorate(guard);

				const expected = decorated.raw();

				decorated.enableForStorage(storage);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"enables if storage is the guard's storage and the guard wasn't already enabled",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: false,
				});

				const decorated = RxGdprGuard.decorate(guard);

				decorated.enableForStorage(storage);

				expect(decorated.enabled).toBeTruthy();
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		//TODO: Enable this test case once the following issues have been fixed in gdpr-guard
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprGuard.ts#L161
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprStorage.ts#L45
		/*it.each(storageCases)("enables if storage is GdprStorage.All and the guard wasn't already enabled", storage => {
			const guard = guardFactory({
				storage,
				enabled: false,
			});

			const decorated = RxGdprGuard.decorate(guard);

			decorated.enableForStorage(GdprStorage.All);

			expect(decorated.enabled).toBeTruthy();
			expectInvariantsToBeMaintained(guard, decorated);
		});*/
	});

	describe("#disableForStorage(storage)", () => {
		it("calls the underlying guard's GdprGuard#disableForStorage(storage)", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "disableForStorage");
			const storage = GdprStorage.FileSystem;

			decorated.disableForStorage(storage);

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(storage);
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it.each(storageCases)(
			"does nothing if storage is different from the guard's storage, and is not GdprStorage.All",
			storage => {
				const guard = guardFactory({
					enabled: false,
					storage:
						storage === GdprStorage.ServerStorage
							? GdprStorage.None
							: GdprStorage.ServerStorage,
				});

				const decorated = RxGdprGuard.decorate(guard);

				const expected = decorated.raw();

				decorated.disableForStorage(storage);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"does nothing if the guard is already disabled",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: false,
				});

				const decorated = RxGdprGuard.decorate(guard);

				const expected = decorated.raw();

				decorated.disableForStorage(storage);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"disables if storage is the guard's storage and the guard wasn't already disabled",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: true,
				});

				const decorated = RxGdprGuard.decorate(guard);

				decorated.disableForStorage(storage);

				expect(decorated.enabled).toBeFalsy();
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		//TODO: Enable this test case once the following issues have been fixed in gdpr-guard
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprGuard.ts#L161
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprStorage.ts#L45
		/*it.each(storageCases)("disables if storage is GdprStorage.All and the guard wasn't already disabled", storage => {
			const guard = guardFactory({
				storage,
				enabled: false,
			});

			const decorated = RxGdprGuard.decorate(guard);

			decorated.disableForStorage(GdprStorage.All);

			expect(decorated.enabled).toBeFalsy();
			expectInvariantsToBeMaintained(guard, decorated);
		});*/
	});

	describe("#toggleForStorage(storage)", () => {
		it("calls the underlying guard's GdprGuard#toggleForStorage(storage)", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "toggleForStorage");
			const storage = GdprStorage.FileSystem;

			decorated.toggleForStorage(storage);

			expect(spy).toHaveBeenCalledOnce();
			expect(spy).toHaveBeenCalledWith(storage);
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it.each(storageCases)(
			"does nothing if storage is different from the guard's storage, and is not GdprStorage.All",
			storage => {
				const guard = guardFactory({
					enabled: false,
					storage:
						storage === GdprStorage.ServerStorage
							? GdprStorage.None
							: GdprStorage.ServerStorage,
				});

				const decorated = RxGdprGuard.decorate(guard);

				const expected = decorated.raw();

				decorated.toggleForStorage(storage);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"disables the guard if it is enabled and storage is the guard's storage",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: true,
				});

				const decorated = RxGdprGuard.decorate(guard);

				decorated.toggleForStorage(storage);

				expect(decorated.enabled).toBeFalsy();
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		it.each(storageCases)(
			"enables the guard if storage is the guard's storage and the guard wasn't enabled",
			storage => {
				const guard = guardFactory({
					storage,
					enabled: false,
				});

				const decorated = RxGdprGuard.decorate(guard);

				decorated.toggleForStorage(storage);

				expect(decorated.enabled).toBeTruthy();
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);

		//TODO: Enable this test case once the following issues have been fixed in gdpr-guard
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprGuard.ts#L161
		// https://github.com/Voltra/gdpr-guard/blob/413b053321b3eea940a1328ccfd025841d67926d/src/GdprStorage.ts#L45
		/*it.each(storageCases)("toggles if storage is GdprStorage.All and the guard wasn't already enabled", storage => {
			//TODO: Write the two  tests for toggle and GdprStorage.All
		});*/
	});

	describe("#raw()", () => {
		it("calls the underlying guard's GdprGuard#raw()", () => {
			const guard = guardFactory({
				enabled: false,
				required: false,
			});
			const decorated = RxGdprGuard.decorate(guard);
			const spy = vi.spyOn(guard, "raw");

			decorated.raw();

			expect(spy).toHaveBeenCalledOnce();
			expectInvariantsToBeMaintained(guard, decorated);
		});

		it.each(
			wrapTestCases([
				guardFactory({
					enabled: false,
					required: false,
				}),
			]),
		)(
			"returns the result of the underlying guard's GdprGuard#raw(): %p",
			guard => {
				const expected = guard.raw();

				const decorated = RxGdprGuard.decorate(guard);

				const result = decorated.raw();

				expect(result).toStrictEqual(expected);
				expectInvariantsToBeMaintained(guard, decorated);
			},
		);
	});

	describe("#enabled$", () => {
		it("emits the initial value of RxGdprGuard#enabled as its first value", async () => {
			expect.hasAssertions();
			const guard = guardFactory();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.enabled$, async state => {
				const isEnabled = await firstValueFrom(wrapped.enabled$);

				expect(isEnabled).toStrictEqual(wrapped.enabled);
				expect(state.counter).toBe(1);
			});
		});

		it("stop emitting values after RxGdprGuard#unwrap() has been called", async () => {
			expect.hasAssertions();
			const guard = guardFactory();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.enabled$, async state => {
				await firstValueFrom(wrapped.enabled$);

				wrapped.unwrap();

				wrapped.toggle();

				await expect(() => firstValueFrom(wrapped.enabled$)).rejects.toThrow(EmptyError);
				expect(state.counter).toBe(1);
			});
		});

		it.each([
			{
				guard: guardFactory({ enabled: false }),
				method: "enable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "disable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "toggle",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "toggle",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "makeRequired",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.Cookie }),
				method: "enableForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.Cookie }),
				method: "disableForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.Cookie }),
				method: "toggleForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.Cookie }),
				method: "toggleForStorage",
				args: [GdprStorage.Cookie],
			},
		] as const)("emits a new value when RxGdprGuard#enabled changes: %p", async ({ guard, method, args }) => {
			expect.hasAssertions();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.enabled$, async state => {
				await firstValueFrom(wrapped.enabled$);

				// @ts-expect-error TS2556 I know what I'm doing with the args
				wrapped[method](...args);

				const isEnabled = await firstValueFrom(wrapped.enabled$);

				expect(isEnabled).toStrictEqual(wrapped.enabled);
				expect(state.counter).toBe(2);
			});
		});

		it.each([
			{
				guard: guardFactory({ enabled: false }),
				method: "disable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "enable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "makeRequired",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "raw",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "raw",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.FileSystem }),
				method: "disableForStorage",
				args: [GdprStorage.FileSystem],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.ServerStorage }),
				method: "enableForStorage",
				args: [GdprStorage.ServerStorage],
			},
			{
				guard: guardFactory({ enabled: true, name: "not-rando" }),
				method: "isEnabled",
				args: ["rando"],
			},
			{
				guard: guardFactory({ enabled: true, name: "not-rando" }),
				method: "isEnabled",
				args: ["not-rando"],
			},
		] as const)("does not emit a new value when RxGdprGuard#enabled doesn't change: %p", async ({ guard, method, args }) => {
			expect.hasAssertions();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.enabled$, async state => {
				await firstValueFrom(wrapped.enabled$);

				// @ts-expect-error TS2556 I know what I'm doing with the args
				wrapped[method](...args);

				await firstValueFrom(wrapped.enabled$);

				expect(state.counter).toBe(1);
			});
		});
	});

	describe("#raw", () => {
		it("emits the initial value of RxGdprGuard#raw() as its first value", async () => {
			expect.hasAssertions();
			const guard = guardFactory();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.raw$, async state => {
				const isEnabled = await firstValueFrom(wrapped.raw$);

				expect(isEnabled).toStrictEqual(wrapped.raw());
				expect(state.counter).toBe(1);
			});
		});

		it("stop emitting values after RxGdprGuard#unwrap() has been called", async () => {
			expect.hasAssertions();
			const guard = guardFactory();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.raw$, async state => {
				await firstValueFrom(wrapped.raw$);

				wrapped.unwrap();

				wrapped.toggle();

				await expect(() => firstValueFrom(wrapped.raw$)).rejects.toThrow(EmptyError);
				expect(state.counter).toBe(1);
			});
		});

		//TODO: Customize the test cases below

		it.each([
			{
				guard: guardFactory({ enabled: false }),
				method: "enable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "disable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "toggle",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "toggle",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "makeRequired",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.Cookie }),
				method: "enableForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.Cookie }),
				method: "disableForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.Cookie }),
				method: "toggleForStorage",
				args: [GdprStorage.Cookie],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.Cookie }),
				method: "toggleForStorage",
				args: [GdprStorage.Cookie],
			},
		] as const)("emits a new value when RxGdprGuard#raw() changes: %p", async ({ guard, method, args }) => {
			expect.hasAssertions();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.raw$, async state => {
				await firstValueFrom(wrapped.raw$);

				// @ts-expect-error TS2556 I know what I'm doing with the args
				wrapped[method](...args);

				const isEnabled = await firstValueFrom(wrapped.raw$);

				expect(isEnabled).toStrictEqual(wrapped.raw());
				expect(state.counter).toBe(2);
			});
		});

		it.each([
			{
				guard: guardFactory({ enabled: false }),
				method: "disable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "enable",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false }),
				method: "raw",
				args: [],
			},
			{
				guard: guardFactory({ enabled: true }),
				method: "raw",
				args: [],
			},
			{
				guard: guardFactory({ enabled: false, storage: GdprStorage.FileSystem }),
				method: "disableForStorage",
				args: [GdprStorage.FileSystem],
			},
			{
				guard: guardFactory({ enabled: true, storage: GdprStorage.ServerStorage }),
				method: "enableForStorage",
				args: [GdprStorage.ServerStorage],
			},
			{
				guard: guardFactory({ enabled: true, name: "not-rando" }),
				method: "isEnabled",
				args: ["rando"],
			},
			{
				guard: guardFactory({ enabled: true, name: "not-rando" }),
				method: "isEnabled",
				args: ["not-rando"],
			},
		] as const)("does not emit a new value when RxGdprGuard#raw() doesn't change: %p", async ({ guard, method, args }) => {
			expect.hasAssertions();
			const wrapped = RxGdprGuard.wrap(guard);

			await withinCounterState(wrapped.raw$, async state => {
				await firstValueFrom(wrapped.raw$);

				// @ts-expect-error TS2556 I know what I'm doing with the args
				wrapped[method](...args);

				await firstValueFrom(wrapped.raw$);

				expect(state.counter).toBe(1);
			});
		});
	});
});
