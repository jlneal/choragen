/**
 * Choragen configuration
 * @type {import('@choragen/core').ChoragenConfig}
 */
export default {
  // Paths relative to project root
  paths: {
    adr: "docs/adr/",
    design: "docs/design/",
    requests: "docs/requests/",
    tasks: "docs/tasks/",
  },

  // Domain names for design docs
  domains: ["core"],

  // Governance schema file
  governance: "choragen.governance.yaml",
};
