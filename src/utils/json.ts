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
