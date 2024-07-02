export const wrapTestCases = <Input>(cases: Input[]): [Input][] => {
	return cases.map(testCase => [testCase]);
}
