import type { SourceAdapter } from "@sapientia/core";
import { GutenbergAdapter } from "./gutenberg.js";
import { StandardEbooksAdapter } from "./standard-ebooks.js";

export { GutenbergAdapter } from "./gutenberg.js";
export { StandardEbooksAdapter } from "./standard-ebooks.js";

/** Factory consumed by the CLI to register all bundled open adapters. */
export function createOpenAdapters(): SourceAdapter[] {
  return [new GutenbergAdapter(), new StandardEbooksAdapter()];
}
