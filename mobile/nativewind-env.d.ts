/// <reference types="nativewind/types" />

// TypeScript 6 (SDK 57) refuses side-effect imports it has no declaration for,
// which breaks `import "./global.css"` in App.tsx. Metro handles the actual
// transform via the NativeWind plugin; this only tells the type checker it exists.
declare module "*.css";
