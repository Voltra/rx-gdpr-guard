import { describe, expect, it } from "vitest";
import { GdprManagerBuilder, GdprStorage } from "gdpr-guard";
import { RxGdprManager } from "@/RxGdprManager";
import { RxGdprGuardGroup } from "@/RxGdprGuardGroup";

const managerFactory = () => GdprManagerBuilder.make()
	.startRequiredGroup(GdprStorage.None, "a", "description A")
	.withEnabledGuard("aa", "description AA", GdprStorage.Cookie)
	.withEnabledGuard("ab", "description AB", GdprStorage.LocalStorage)
	.endGroup()
	.startDisabledGroup(GdprStorage.None, "b", "description B")
	.withDisabledGuard("ba", "description BA", GdprStorage.ServerStorage)
	.endGroup()
	.build();

describe("RxGdprManager", () => {
	it("decorates the underlying manager's group with RxGdprGuardGroup", () => {
		expect.hasAssertions();

		const manager = managerFactory();

		expect.assertions(2 * manager.getGroups().length);

		const decorated = RxGdprManager.decorate(manager);

		manager.getGroups().forEach(group => {
			expect(group).toBeInstanceOf(RxGdprGuardGroup);
		});

		decorated.getGroups().forEach(group => {
			expect(group).toBeInstanceOf(RxGdprGuardGroup);
		});
	});
});
