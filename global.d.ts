// Global type declarations to fix `process` not found when @types/node is unavailable
declare const process: {
  env: Record<string, string | undefined>;
};
