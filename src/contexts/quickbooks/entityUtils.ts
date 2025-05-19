
/**
 * Gets a nested value from an object using a path string like "user.address.street"
 * 
 * @param obj - The object to extract the value from
 * @param path - The path to the value in dot notation (e.g., "user.address.street") or with array notation (e.g., "line[0].amount")
 * @returns The value at the path or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Handle array access pattern like "items[0].name"
  const arrayPathRegex = /^(.*?)\[(\d+)\](.*)$/;
  const arrayMatch = path.match(arrayPathRegex);
  
  if (arrayMatch) {
    const [, arrayName, index, remainingPath] = arrayMatch;
    
    // Get the array
    const array = arrayName ? getNestedValue(obj, arrayName) : obj;
    if (!Array.isArray(array) || array.length <= parseInt(index, 10)) {
      return undefined;
    }
    
    // Get the item in the array
    const item = array[parseInt(index, 10)];
    
    // If there's a remaining path, continue traversing
    if (remainingPath) {
      // Remove the leading dot if present
      const nextPath = remainingPath.startsWith('.') ? remainingPath.substring(1) : remainingPath;
      return getNestedValue(item, nextPath);
    }
    
    return item;
  }
  
  // Handle regular dot notation
  const parts = path.split('.');
  let value = obj;
  
  for (const part of parts) {
    if (value === undefined || value === null) {
      return undefined;
    }
    
    value = value[part];
  }
  
  return value;
}
