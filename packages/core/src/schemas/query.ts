import { z } from "zod";
import { FormatSchema } from "./book.js";

/** Normalized search query passed to every adapter. */
export const SearchQuerySchema = z.object({
  text: z.string().min(1),
  author: z.string().optional(),
  category: z.string().optional(),
  language: z.string().optional(),
  format: FormatSchema.optional(),
  year: z.number().int().optional(),
  limit: z.number().int().positive().max(200).default(25),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SortKeySchema = z.enum(["score", "year", "title"]);
export type SortKey = z.infer<typeof SortKeySchema>;
