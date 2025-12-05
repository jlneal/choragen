/**
 * File locking and collision detection
 *
 * Advisory locks to prevent parallel chains from colliding.
 * Stored in .choragen/locks.json in consumer projects.
 */

export * from "./types.js";
export * from "./lock-manager.js";
