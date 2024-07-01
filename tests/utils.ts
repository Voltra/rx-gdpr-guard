export const wrapTestCases = <Input>(cases: Input[]): Array<[Input]> => {
	return cases.map(testCase => [testCase]);
}
