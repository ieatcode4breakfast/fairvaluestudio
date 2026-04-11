// src/mocks/db.ts

/**
 * Metadata for a Scenario Set. 
 * This allows the UI to display a list of sets without loading the heavy JSON data first.
 */
export interface ScenarioSetMetadata {
  id: string;      // Matches the filename (e.g., "set_1")
  setName: string; // The display name for the user
}

export interface User {
  id: string;
  username: string;
  password: string; // Plain text for mock purposes only
  sets: ScenarioSetMetadata[];
}

export const USER_REGISTRY: User[] = [
  {
    id: "user_01",
    username: "alice_investor",
    password: "password123",
    sets: [
      { id: "set_1", setName: "Tech Growth 2026" },
      { id: "set_2", setName: "Dividend Aristocrats" },
      { id: "set_3", setName: "Speculative AI" },
    ],
  },
  {
    id: "user_02",
    username: "bob_value",
    password: "password123",
    sets: [
      { id: "set_4", setName: "Retail Turnarounds" },
      { id: "set_5", setName: "Energy Sector" },
      { id: "set_6", setName: "Consumer Staples" },
    ],
  },
  {
    id: "user_03",
    username: "charlie_macro",
    password: "password123",
    sets: [
      { id: "set_7", setName: "Emerging Markets" },
      { id: "set_8", setName: "Treasury Yield Plays" },
      { id: "set_9", setName: "Commodities & Gold" },
    ],
  },
  {
    id: "user_04",
    username: "diana_capital",
    password: "password123",
    sets: [
      { id: "set_10", setName: "SaaS Portfolio" },
      { id: "set_11", setName: "Financial Services" },
      { id: "set_12", setName: "Healthcare Innovations" },
    ],
  },
];