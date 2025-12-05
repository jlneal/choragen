/**
 * Governance schema enforcement
 *
 * Defines rules for file mutations: allow, approve, deny.
 * Parsed from choragen.governance.yaml in consumer projects.
 */

export * from "./types.js";
export * from "./governance-parser.js";
export * from "./governance-checker.js";
