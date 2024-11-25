import { TestScheduler } from "rxjs/testing";
import { expect } from "vitest";

export const wrapTestCases = <Input>(cases: Input[]): [Input][] => {
	return cases.map(testCase => [testCase]);
};

export const rxTestScheduler = () =>
	new TestScheduler((actual, expected) => {
		expect(actual).deep.equals(expected);
	});
