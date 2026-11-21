/**
 * Recursively sorts the keys of a JSON object alphabetically.
 * Arrays and primitive values are kept in their original form.
 */
export function sortJSONKeys(val: any): any {
  if (Array.isArray(val)) {
    return val.map(sortJSONKeys);
  }
  if (typeof val === "object" && val !== null) {
    const sortedKeys = Object.keys(val).sort();
    const result: any = {};
    for (const key of sortedKeys) {
      result[key] = sortJSONKeys(val[key]);
    }
    return result;
  }
  return val;
}

/**
 * Recursively parses nested stringified JSON objects/arrays and quoted JSON strings.
 */
export function deepParseJSON(val: any): any {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        return deepParseJSON(JSON.parse(trimmed));
      } catch {
        return val;
      }
    }

    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      try {
        return deepParseJSON(JSON.parse(trimmed));
      } catch {
        return val;
      }
    }

    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => deepParseJSON(item));
  }

  if (typeof val === "object" && val !== null) {
    const copy: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      copy[key] = deepParseJSON(val[key]);
    }
    return copy;
  }

  return val;
}

/**
 * Attempts to parse raw JSON text, also unwrapping quoted or `\"`-escaped JSON strings.
 */
export function parseLooseJSON(raw: string): any {
  const trimmed = raw.trim();
  let parsed: any;

  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const unescaped = JSON.parse(trimmed);
    parsed = typeof unescaped === "string" ? JSON.parse(unescaped) : unescaped;
  } else {
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      const replaced = trimmed.replace(/\\"/g, '"');
      parsed = JSON.parse(replaced);
    }
  }

  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }

  return parsed;
}

function hasNestedStringifiedJSON(val: any): boolean {
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return typeof parsed === "object" && parsed !== null;
      } catch {
        return false;
      }
    }
    return false;
  }

  if (Array.isArray(val)) {
    return val.some((item) => hasNestedStringifiedJSON(item));
  }

  if (typeof val === "object" && val !== null) {
    return Object.values(val).some((v) => hasNestedStringifiedJSON(v));
  }

  return false;
}

/**
 * Returns true when raw text contains nested stringified JSON objects/arrays
 * or is a quoted/escaped JSON string that can be unwrapped into an object/array.
 */
export function checkCanDeepParse(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  try {
    const parsed = parseLooseJSON(trimmed);
    if (typeof parsed !== "object" || parsed === null) return false;

    if (hasNestedStringifiedJSON(parsed)) return true;

    try {
      const strict = JSON.parse(trimmed);
      return typeof strict === "string";
    } catch {
      return true;
    }
  } catch {
    return false;
  }
}

export type JSONStatusResult =
  | {
      status: "empty";
      summary: string;
      error: null;
      errorPos: null;
      errorLine?: undefined;
      errorCol?: undefined;
    }
  | {
      status: "valid";
      summary: string;
      error: null;
      errorPos: null;
      value: unknown;
      errorLine?: undefined;
      errorCol?: undefined;
    }
  | {
      status: "invalid";
      summary: string;
      error: string;
      errorPos: number | null;
      errorLine: number | null;
      errorCol: number | null;
    };

function extractJSONErrorLocation(
  raw: string,
  message: string,
): { errorPos: number | null; errorLine: number | null; errorCol: number | null } {
  const posMatch = message.match(/at position (\d+)/);
  if (posMatch) {
    const errorPos = Math.min(Math.max(0, Number(posMatch[1])), raw.length);
    const prefix = raw.slice(0, errorPos);
    const lastNewline = prefix.lastIndexOf("\n");
    const errorLine = prefix.split("\n").length;
    const errorCol = errorPos - lastNewline;
    return { errorPos, errorLine, errorCol };
  }

  const lineColMatch = message.match(/at line (\d+) column (\d+)/);
  if (lineColMatch) {
    const targetLine = Math.max(1, Number(lineColMatch[1]));
    const targetCol = Math.max(1, Number(lineColMatch[2]));
    const lines = raw.split("\n");
    let offset = 0;
    for (let i = 0; i < Math.min(targetLine - 1, lines.length); i++) {
      offset += (lines[i]?.length ?? 0) + 1;
    }
    const errorPos = Math.min(offset + targetCol - 1, raw.length);
    return { errorPos, errorLine: targetLine, errorCol: targetCol };
  }

  return { errorPos: null, errorLine: null, errorCol: null };
}

/**
 * Inspects JSON text for validity, structural summary, and syntax error location.
 */
export function inspectJSONStatus(raw: string): JSONStatusResult {
  if (!raw.trim()) {
    return { status: "empty", summary: "", error: null, errorPos: null };
  }

  try {
    const value = JSON.parse(raw);
    let summary: string;
    if (Array.isArray(value)) {
      summary = `Array · ${value.length} ${value.length === 1 ? "item" : "items"}`;
    } else if (typeof value === "object" && value !== null) {
      const count = Object.keys(value).length;
      summary = `Object · ${count} ${count === 1 ? "key" : "keys"}`;
    } else {
      summary = value === null ? "null" : typeof value;
    }

    return { status: "valid", summary, error: null, errorPos: null, value };
  } catch (e: any) {
    const error = e?.message || "Invalid JSON";
    const { errorPos, errorLine, errorCol } = extractJSONErrorLocation(raw, error);
    return {
      status: "invalid",
      summary: "",
      error,
      errorPos,
      errorLine,
      errorCol,
    };
  }
}
