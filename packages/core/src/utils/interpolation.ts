// ADR: ADR-001-task-file-format

export interface TaskPromptContext {
  taskId?: string;
  taskTitle?: string;
  chainId?: string;
  requestId?: string;
  domain?: string;
  acceptanceCriteria?: string | string[];
  objective?: string;
  context?: string | string[];
}

const VARIABLES: (keyof TaskPromptContext)[] = [
  "taskId",
  "taskTitle",
  "chainId",
  "requestId",
  "domain",
  "acceptanceCriteria",
  "objective",
  "context",
];

function normalizeValue(value: string | string[] | undefined): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.join("\n");
  }
  return value;
}

/**
 * Replace {{variable}} placeholders in a template string with values from the context.
 * Unknown or missing variables are left untouched so prompts remain readable.
 */
export function interpolateTaskPrompt(template: string, context: TaskPromptContext): string {
  const lookup = VARIABLES.reduce<Record<string, string | undefined>>((acc, key) => {
    const value = normalizeValue(context[key]);
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    const value = lookup[key];
    return value !== undefined ? value : match;
  });
}
