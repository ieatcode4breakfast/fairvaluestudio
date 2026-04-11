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
    sets: [] // Start with no sets
  };

  USER_REGISTRY.push(newUser);
  return newUser;
}