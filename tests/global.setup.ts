import { chai, expect, Assertion } from "vitest";
import { PromisifyAssertion } from "@vitest/expect";
import {
	finalize,
	firstValueFrom,
	identity,
	map,
	Observable,
	sequenceEqual,
} from "rxjs";

expect.extend({
	toStrictEqualVia(received: unknown, expectedFactory: () => unknown) {
		const result = received;
		const expected = expectedFactory();
		// expect(result).toStrictEqual(expected);

		return {
			pass: this.equals(result, expected, [], true),
			message: () => "",
			actual: result,
			expected,
		};
	},
});

chai.util.addProperty(
	chai.Assertion.prototype,
	"rx",
	function __VITEST_RX__(this: Assertion) {
		const error = new Error("rx");
		chai.util.flag(this, "rx", true);
		chai.util.flag(this, "error", error);
		// const test = chai.util.flag(this, "vitest-test");
		const obj = chai.util.flag(this, "object") as unknown;

		if (!(obj instanceof Observable)) {
			throw new TypeError(
				`You must provide an Observable to expect() when using .rx, not '${typeof obj}'.`,
			);
		}

		return {
			async toStrictEqual(
				this: PromisifyAssertion<unknown>,
				rhs: unknown,
			) {
				if (!(rhs instanceof Observable)) {
					throw new TypeError(
						`You must provide an Observable to .toStrictEqual() when using .rx, not '${typeof obj}'.`,
					);
				}

				const copy = obj.pipe(map(identity));

				/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return */
				// @ts-expect-error TS2339: `complete` does not exist on the interface, but does on the object
				const eq = copy.pipe(
					sequenceEqual(rhs.pipe(finalize(() => copy.complete()))),
				);
				/* eslint-enable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return */
				const sub = eq.subscribe();

				try {
					const result = await firstValueFrom(eq);
					expect(result, "Observables don't match").toBeTruthy();
				} finally {
					sub.unsubscribe();
				}
			},
			async toStrictEqualVia(
				this: PromisifyAssertion<unknown>,
				rhsFactory: () => unknown,
			) {
				const rhs = rhsFactory();
				return this.toStrictEqual(rhs);
			},
		};
	},
);
