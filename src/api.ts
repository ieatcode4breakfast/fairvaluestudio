import { supabase } from './lib/supabase';
export { supabase };
import { Scenario } from './types';

/**
 * API functions using Supabase.
 */

export const login = async (email: string, password: string): Promise<{ id: string; username: string; lastActiveValuationId?: string } | null> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Login error:', error.message);
    return null;
  }
  if (!data.user) return null;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username, last_active_valuation_id')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    console.error('Error fetching username:', userError.message);
    return null;
  }

  return { id: data.user.id, username: userData.username, lastActiveValuationId: userData.last_active_valuation_id };
};

export const logout = async (): Promise<void> => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async (): Promise<{ id: string; username: string; lastActiveValuationId?: string } | null> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) return null;

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('username, last_active_valuation_id')
    .eq('id', session.user.id)
    .single();

  if (userError) return null;
  
  return { id: session.user.id, username: userData.username, lastActiveValuationId: userData.last_active_valuation_id };
};


export const getUserValuations = async (userId: string): Promise<{ id: string; valuationName: string }[]> => {
  const { data, error } = await supabase
    .from('valuations')
    .select('id, name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching valuations:', error.message);
    return [];
  }

  return data.map((v: any) => ({ id: v.id, valuationName: v.name }));
};

export const getScenarios = async (valuationId: string): Promise<Scenario[]> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('name, parameters')
    .eq('valuation_id', valuationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching scenarios:', error.message);
    return [];
  }

  return data.map((s: any) => ({
    ...(s.parameters as Scenario),
    scenarioName: s.name || s.parameters?.scenarioName || '',
  }));
};

export const signup = async (email: string, password: string, username: string): Promise<{ id: string; username: string }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });
  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Signup failed');
  }

  // User profile is created automatically by the handle_new_user DB trigger.
  return { id: data.user.id, username };
};

export const createValuation = async (userId: string, name: string, scenarios: Scenario[]): Promise<string> => {
  const { data: valData, error: valError } = await supabase
    .from('valuations')
    .insert({ user_id: userId, name })
    .select('id')
    .single();

  if (valError) throw new Error(valError.message);

  const valuationId = valData.id;

  const scenariosToInsert = scenarios.map((sc) => ({
    valuation_id: valuationId,
    name: sc.scenarioName || 'Untitled',
    parameters: sc
  }));

  const { error: scError } = await supabase
    .from('scenarios')
    .insert(scenariosToInsert);

  if (scError) throw new Error(scError.message);

  return valuationId;
};

export const updateValuation = async (valuationId: string, name: string, scenarios: Scenario[]): Promise<void> => {
  const { error: valError } = await supabase
    .from('valuations')
    .update({ name })
    .eq('id', valuationId);

  if (valError) throw new Error(valError.message);

  // Replace scenarios: delete all existing, insert new ones
  const { error: delError } = await supabase
    .from('scenarios')
    .delete()
    .eq('valuation_id', valuationId);

  if (delError) throw new Error(delError.message);

  const scenariosToInsert = scenarios.map((sc) => ({
    valuation_id: valuationId,
    name: sc.scenarioName || 'Untitled',
    parameters: sc
  }));

  const { error: scError } = await supabase
    .from('scenarios')
    .insert(scenariosToInsert);

  if (scError) throw new Error(scError.message);
};

export const renameValuation = async (valuationId: string, newName: string): Promise<void> => {
  const { error } = await supabase
    .from('valuations')
    .update({ name: newName })
    .eq('id', valuationId);

  if (error) throw new Error(error.message);
};

export const deleteValuation = async (valuationId: string): Promise<void> => {
  const { error } = await supabase
    .from('valuations')
    .delete()
    .eq('id', valuationId);

  if (error) throw new Error(error.message);
};

export const updateLastActiveValuation = async (userId: string, valuationId: string | null): Promise<void> => {
  const { error } = await supabase
    .from('users')
    .update({ last_active_valuation_id: valuationId })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update last active valuation:', error.message);
  }
};

