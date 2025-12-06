// ADR: ADR-002-governance-schema

/**
 * Simple glob pattern matcher
 * Supports: *, **, ?
 */
export function matchGlob(pattern: string, path: string): boolean {
  // Build regex by processing character by character
  let regex = "";
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const next = pattern[i + 1];

    if (char === "*" && next === "*") {
      // ** - match any path
      if (pattern[i + 2] === "/") {
        // **/ - match zero or more directories
        regex += "(?:.*/)?";
        i += 3;
      } else if (i > 0 && pattern[i - 1] === "/") {
        // /** - match zero or more path segments
        regex += "(?:/.*)?";
        i += 2;
      } else {
        // ** alone - match anything
        regex += ".*";
        i += 2;
      }
    } else if (char === "*") {
      // * - match anything except /
      regex += "[^/]*";
      i++;
    } else if (char === "?") {
      // ? - match single char except /
      regex += "[^/]";
      i++;
    } else if (".+^${}()|[]\\".includes(char)) {
      // Escape regex special chars
      regex += "\\" + char;
      i++;
    } else {
      regex += char;
      i++;
    }
  }

  return new RegExp(`^${regex}$`).test(path);
}
