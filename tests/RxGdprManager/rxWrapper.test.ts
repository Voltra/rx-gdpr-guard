import { describe, it, expect } from "vitest";
import { GdprManagerBuilder, GdprStorage } from "gdpr-guard";
import { RxGdprManager, rxWrapper } from "../../src";

const managerFactory = () => GdprManagerBuilder.make()
	.startRequiredGroup(GdprStorage.None, "a", "description A")
	.withEnabledGuard("aa", "description AA", GdprStorage.Cookie)
	.withEnabledGuard("ab", "description AB", GdprStorage.LocalStorage)
	.endGroup()
	.startDisabledGroup(GdprStorage.None, "b", "description B")
	.withDisabledGuard("ba", "description BA", GdprStorage.ServerStorage)
	.endGroup()
	.build();

describe("rxWrapper(manager)", () => {
	it("returns an RxGdprManager", () => {
		const manager = managerFactory();
		const result = rxWrapper(manager);

		expect(result).toBeInstanceOf(RxGdprManager);
	});
});
