import fastDeepEquals from "fast-deep-equal";

export const deepEquals = <T>(lhs: T, rhs: T) => fastDeepEquals(lhs, rhs);
