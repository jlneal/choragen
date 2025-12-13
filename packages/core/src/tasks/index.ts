/**
 * Task and Chain lifecycle management
 *
 * Tasks are the atomic unit of work. Chains are sequences of tasks
 * managed by a control agent and executed by implementation agents.
 */

export * from "./types.js";
export * from "./task-manager.js";
export * from "./chain-manager.js";
export * from "./task-parser.js";
export * from "./scope-utils.js";
