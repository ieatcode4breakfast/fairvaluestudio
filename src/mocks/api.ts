import { USER_REGISTRY, User, ValuationMetadata, validateUsername, addUser } from './db';
import { Scenario } from '../types';

/**
 * Mock API functions for the application.
 */

/**
 * Authenticates a user with username and password.
 * @param username - The username to authenticate.
 * @param password - The password to authenticate.
 * @returns The user object if authentication succeeds, null otherwise.
 */
export const login = (username: string, password: string): User | null => {
  return USER_REGISTRY.find(user => user.username === username && user.password === password) || null;
};

/**
 * Retrieves the valuations for a given user.
 * @param userId - The ID of the user.
 * @returns An array of valuation metadata.
 */
export const getUserValuations = (userId: string): ValuationMetadata[] => {
  const user = USER_REGISTRY.find(u => u.id === userId);
  return user ? user.valuations : [];
};

/**
 * Retrieves the scenarios for a given valuation ID by loading the corresponding JSON file.
 * @param valuationId - The ID of the valuation (e.g., 'valuation_1').
 * @returns A promise that resolves to an array of scenarios.
 */
export const getScenarios = async (valuationId: string): Promise<Scenario[]> => {
  try {
    const module = await import(`./data/${valuationId}.json`);
    return module.default;
  } catch (error) {
    console.error(`Failed to load scenarios for valuation ${valuationId}`, error);
    return [];
  }
};

/**
 * Validates a username.
 * @param username - The username to validate.
 * @returns An error message if invalid, null if valid.
 */
export { validateUsername };

/**
 * Signs up a new user.
 * @param username - The username.
 * @param password - The password.
 * @param confirmPassword - The password confirmation.
 * @returns The new user object.
 * @throws Error if validation fails.
 */
export const signup = (username: string, password: string, confirmPassword: string): User => {
  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }
  return addUser(username, password);
};