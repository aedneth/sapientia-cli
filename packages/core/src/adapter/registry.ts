import type { SourceAdapter } from "./types.js";

/** In-process registry of available source adapters, keyed by id. */
export class SourceRegistry {
  private readonly adapters = new Map<string, SourceAdapter>();

  register(adapter: SourceAdapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Duplicate source adapter id: ${adapter.id}`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): SourceAdapter | undefined {
    return this.adapters.get(id);
  }

  list(): SourceAdapter[] {
    return [...this.adapters.values()];
  }
}
