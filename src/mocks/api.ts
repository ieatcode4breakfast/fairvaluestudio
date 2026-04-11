import { supabase } from '../lib/supabase';
import { Scenario } from '../types';

/**
 * API functions using Supabase.
 */

/**
 * Authenticates a user with email and password.
 * @param email - The email to authenticate.
 * @param password - The password to authenticate.
 * @returns The user object with id and username if authentication succeeds, null otherwise.
 */
export const login = async (email: string, password: string): Promise<{ id: string; username: string } | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    return null;
  }
  if (!data.user) return null;

  // Fetch username from public.users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    console.error('Error fetching username:', userError.message);
    return null;
  }

  return { id: data.user.id, username: userData.username };
};

/**
 * Retrieves the valuations for a given user.
 * @param userId - The ID of the user.
 * @returns An array of valuation metadata.
 */
export const getUserValuations = async (userId: string): Promise<{ id: string; valuationName: string }[]> => {
  const { data, error } = await supabase
    .from('valuations')
    .select('id, valuation_name')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching valuations:', error.message);
    return [];
  }

  return data.map((v: any) => ({ id: v.id, valuationName: v.valuation_name }));
};

/**
 * Retrieves the scenarios for a given valuation ID.
 * @param valuationId - The ID of the valuation.
 * @returns A promise that resolves to an array of scenarios.
 */
export const getScenarios = async (valuationId: string): Promise<Scenario[]> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('parameters')
    .eq('valuation_id', valuationId);

  if (error) {
    console.error('Error fetching scenarios:', error.message);
    return [];
  }

  return data.map((s: any) => s.parameters as Scenario);
};

/**
 * Signs up a new user with email and password, and creates a user profile.
 * @param email - The email.
 * @param password - The password.
 * @param username - The username.
 * @returns The user object.
 * @throws Error if validation fails.
 */
export const signup = async (email: string, password: string, username: string): Promise<{ id: string; username: string }> => {
  // First, sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Signup failed');
  }

  // Insert into public.users
  const { error: insertError } = await supabase
    .from('users')
    .insert({ id: data.user.id, username });

  if (insertError) {
    console.error('Error creating user profile:', insertError.message);
    // Optionally, delete the auth user if profile creation fails
    throw new Error('Failed to create user profile');
  }

  return { id: data.user.id, username };
};