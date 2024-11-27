/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
import type { Assertion, AsymmetricMatchersContaining } from "vitest";
import { PromisifyAssertion } from "@vitest/expect";

interface CustomMatchers<R = unknown> {

	/**
	 * Check whether the value is strictly equal to the expected one, which is obtained via the given factory
	 * @param expectedFactory - The factory to get the expected value
	 */
	toStrictEqualVia(expectedFactory: () => unknown): R;

	rx: Pick<PromisifyAssertion<R>, "toStrictEqual" | "toStrictEqualVia">;
}

declare module "vitest" {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
	interface Assertion<T = any> extends CustomMatchers<T> {}

	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface AsymmetricMatchersContaining extends CustomMatchers {}
}
