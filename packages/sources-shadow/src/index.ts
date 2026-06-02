import type { SourceAdapter } from "@sapientia/core";

/**
 * Opt-in shadow-library plugin.
 *
 * This package is intentionally NOT bundled with the core distribution and ships
 * no scraping/download implementations in the public repository. It exists to
 * define the integration contract and the legal gate. Operators who choose to
 * implement shadow-library adapters do so under their own jurisdiction and
 * responsibility, and must pass an explicit acknowledgment to obtain adapters.
 *
 * See SECURITY.md and the README "Legal & abuse posture" section.
 */
export interface ShadowPluginOptions {
  /** Must be true — mirrors `config.legal.acknowledgedShadow` / `--accept-legal`. */
  acknowledged: boolean;
}

export class LegalAcknowledgmentRequiredError extends Error {
  constructor() {
    super(
      "Shadow-library sources require explicit legal acknowledgment. " +
        "Enable with `sapientia sources enable --accept-legal` first.",
    );
    this.name = "LegalAcknowledgmentRequiredError";
  }
}

/**
 * Returns shadow adapters only when the caller has recorded legal acknowledgment.
 * The public package returns an empty set; downstream/private builds may supply
 * concrete adapters here.
 */
export function createShadowAdapters(opts: ShadowPluginOptions): SourceAdapter[] {
  if (!opts.acknowledged) throw new LegalAcknowledgmentRequiredError();
  return [];
}
