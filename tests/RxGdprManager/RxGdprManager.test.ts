import { describe, expect, it } from "vitest";
import { GdprManager, GdprManagerBuilder, GdprStorage } from "gdpr-guard";
import { RxGdprManager } from "@/RxGdprManager";
import { RxGdprGuardGroup } from "@/RxGdprGuardGroup";
import { RxGdprGuard } from "@/RxGdprGuard";

const managerFactory = () =>
	GdprManagerBuilder.make()
		.startRequiredGroup(GdprStorage.None, "a", "description A")
		.withEnabledGuard("aa", "description AA", GdprStorage.Cookie)
		.withEnabledGuard("ab", "description AB", GdprStorage.LocalStorage)
		.endGroup()
		.startDisabledGroup(GdprStorage.None, "b", "description B")
		.withDisabledGuard("ba", "description BA", GdprStorage.ServerStorage)
		.endGroup()
		.build();

const extractPublicApiState = (manager: GdprManager) => {
	return {
		bannerWasShown: manager.bannerWasShown,
		name: manager.name,
		description: manager.description,
		enabled: manager.enabled,
		required: manager.required,
	} as const;
};

describe("rxGdprManager", () => {
	const decorateTests = (factoryName: "decorate" | "wrap") => {
		it("decorates the underlying manager's groups with RxGdprGuardGroup", () => {
			expect.hasAssertions();

			const manager = managerFactory();

			expect.assertions(2 * manager.getGroups().length);

			const decorated = RxGdprManager[factoryName](manager);

			manager.getGroups().forEach(group => {
				expect(group).toBeInstanceOf(RxGdprGuardGroup);
			});

			decorated.getGroups().forEach(group => {
				expect(group).toBeInstanceOf(RxGdprGuardGroup);
			});
		});
	};

	it("extends from GdprManager", () => {
		const manager = managerFactory();
		const decorated = RxGdprManager.decorate(manager);

		expect(decorated).toBeInstanceOf(GdprManager);
	});

	it("does not extend from RxGdprGuardGroup", () => {
		const manager = managerFactory();
		const decorated = RxGdprManager.decorate(manager);

		expect(decorated).not.toBeInstanceOf(RxGdprGuardGroup);
	});

	it("does not extend from RxGdprGuard", () => {
		const manager = managerFactory();
		const decorated = RxGdprManager.decorate(manager);

		expect(decorated).not.toBeInstanceOf(RxGdprGuard);
	});

	it("shares the same publicly visible state with the underlying manager", () => {
		expect.hasAssertions();

		const manager = managerFactory();
		const originalState = extractPublicApiState(manager);

		const decorated = RxGdprManager.wrap(manager);
		const decoratedState = extractPublicApiState(decorated);

		expect(decoratedState).toStrictEqual(originalState);
	});

	describe(".decorate(manager)", () => {
		decorateTests("decorate");
	});
	describe(".wrap(manager)", () => {
		decorateTests("wrap");
	});

	describe("#events", () => {
		it("is the same event hub instance as the wrapped manager's", () => {
			const manager = managerFactory();

			const decorated = RxGdprManager.wrap(manager);

			expect(decorated.events).toBe(manager.events);

			expect(decorated.events === manager.events).toBeTruthy();
		});
	});
});
