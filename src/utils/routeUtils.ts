
// Simple route utilities without staging complexity
export const getRoutePath = (pathname: string) => {
  return pathname;
};

// Check if current path matches a route pattern
export const matchesRoute = (pathname: string, pattern: string) => {
  return pathname === pattern || pathname.startsWith(pattern + '/');
};
