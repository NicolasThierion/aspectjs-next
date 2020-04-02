/**
 * Hold the original function,
 * bound to its execution context and it original parameters.
 * - Call this method without parameters to call the original function with its original parameters.
 * - Call this method with an array of new parameters to call the original function with the given parameters.
 * - Call this method with an empty array to call the original function with the given parameters.
 * **/
export type JoinPoint = (args?: any[]) => any;
