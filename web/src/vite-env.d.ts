declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare const __BUILD_TIME__: string;
