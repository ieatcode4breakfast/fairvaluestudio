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
  password: string; // Plain text for mock purposes only
  valuations: ValuationMetadata[];
}

export const USER_REGISTRY: User[] = [
  {
    id: "user_01",
    username: "alice_investor",
    password: "password123",
    valuations: [
      { id: "valuation_1", valuationName: "Tech Growth 2026" },
      { id: "valuation_2", valuationName: "Dividend Aristocrats" },
      { id: "valuation_3", valuationName: "Speculative AI" },
    ],
  },
  {
    id: "user_02",
    username: "bob_value",
    password: "password123",
    valuations: [
      { id: "valuation_4", valuationName: "Retail Turnarounds" },
      { id: "valuation_5", valuationName: "Energy Sector" },
      { id: "valuation_6", valuationName: "Consumer Staples" },
    ],
  },
  {
    id: "user_03",
    username: "charlie_macro",
    password: "password123",
    valuations: [
      { id: "valuation_7", valuationName: "Emerging Markets" },
      { id: "valuation_8", valuationName: "Treasury Yield Plays" },
      { id: "valuation_9", valuationName: "Commodities & Gold" },
    ],
  },
  {
    id: "user_04",
    username: "diana_capital",
    password: "password123",
    valuations: [
      { id: "valuation_10", valuationName: "SaaS Portfolio" },
      { id: "valuation_11", valuationName: "Financial Services" },
      { id: "valuation_12", valuationName: "Healthcare Innovations" },
    ],
  },
];

/**
 * Reserved usernames that cannot be used for sign-up.
 */
const RESERVED_USERNAMES = new Set([
  'admin', 'administrator', 'root',
  'support', 'help', 'contact',
  'moderator', 'mod', 'staff',
  'guest', 'anonymous'
]);

/**
 * Validates a username according to the rules.
 * @param username - The username to validate.
 * @returns An error message if invalid, null if valid.
 */
export function validateUsername(username: string): string | null {
  if (!username) return 'Username is required';

  const trimmed = username.trim();
  if (trimmed !== username) return 'Username cannot have leading or trailing spaces';

  if (trimmed.length < 3) return 'Username must be at least 3 characters long';
  if (trimmed.length > 20) return 'Username must be at most 20 characters long';

  const regex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
  if (!regex.test(trimmed)) return 'Username must start with a letter and contain only letters, numbers, underscores, or hyphens (no consecutive symbols, cannot end with symbol)';

  const lower = trimmed.toLowerCase();
  if (RESERVED_USERNAMES.has(lower)) return 'This username is reserved and cannot be used';

  // Check uniqueness (case-insensitive)
  const exists = USER_REGISTRY.some(user => user.username.toLowerCase() === lower);
  if (exists) return 'This username is already taken';

  return null;
}

/**
 * Adds a new user to the registry after validation.
 * @param username - The username.
 * @param password - The password.
 * @returns The new user object, or throws an error if invalid.
 */
export function addUser(username: string, password: string): User {
  const error = validateUsername(username);
  if (error) throw new Error(error);

  if (!password || password.length < 6) throw new Error('Password must be at least 6 characters long');

  const newUser: User = {
    id: `user_${Date.now()}`, // Simple ID generation
    username,
    password, // In real app, hash this
    valuations: [] // Start with no valuations
  };

  USER_REGISTRY.push(newUser);
  return newUser;
}