// src/mocks/db.ts

/**
 * Metadata for a Valuation. 
 * This allows the UI to display a list of valuations without loading the heavy JSON data first.
 */
export interface ValuationMetadata {
  id: string;      // Matches the filename (e.g., "valuation_1")
  valuationName: string; // The display name for the user
}

export interface User {
  id: string;
  username: string;
}