import fastDeepEquals from "fast-deep-equal";

/**
 * Check that two values are deeply equal to each other
 * @param lhs - The left-hand side of the operation
 * @param rhs - The right-hand side of the operation
 */
export const deepEquals = <T>(lhs: T, rhs: T) => fastDeepEquals(lhs, rhs);

/**
 * Converts an N+1-ary function into a unary function
 * @param fn - The function to convert
 */
export const asUnaryFn =
	<Arg, R>(fn: (arg: Arg, ...args: unknown[]) => R) =>
	(arg: Arg) =>
		fn(arg);
