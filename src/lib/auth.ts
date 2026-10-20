import type { StringKey } from '../i18n';
import { appUrl, getClient } from './backend';
import { getState, setState } from './store';
import { clearPersonalData, flush } from './sync';

/** Result of an account action: null on success, otherwise a message key to show. */
type Result = StringKey | null;

function errorKey(error: { code?: string; message?: string; status?: number } | null): Result {
  if (!error) return null;
  if (!navigator.onLine || error.status === 0 || /fetch/i.test(error.message ?? '')) return 'errOffline';
  switch (error.code) {
    case 'invalid_credentials':
      return 'errLogin';
    case 'email_not_confirmed':
      return 'checkEmail';
    case 'user_already_exists':
    case 'email_exists':
      return 'errEmailTaken';
    case 'weak_password':
      return 'errWeakPassword';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'errTooMany';
    default:
      return 'errGeneric';
  }
}

export async function signIn(email: string, password: string): Promise<Result> {
  try {
    const sb = await getClient();
    const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    return errorKey(error);
  } catch {
    return 'errOffline';
  }
}

/** Returns 'checkEmail' when the project requires email confirmation before first sign-in. */
export async function signUp(email: string, password: string, displayName: string): Promise<Result> {
  try {
    const sb = await getClient();
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: appUrl(), data: { display_name: displayName.trim() } },
    });
    if (error) return errorKey(error);
    return data.session ? null : 'checkEmail';
  } catch {
    return 'errOffline';
  }
}

export async function sendPasswordReset(email: string): Promise<Result> {
  try {
    const sb = await getClient();
    const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() });
    return errorKey(error) ?? 'resetSent';
  } catch {
    return 'errOffline';
  }
}

export async function updatePassword(password: string): Promise<Result> {
  try {
    const sb = await getClient();
    const { error } = await sb.auth.updateUser({ password });
    if (error) return errorKey(error);
    setState((s) => ({ ...s, passwordRecovery: false }));
    return 'passwordUpdated';
  } catch {
    return 'errOffline';
  }
}

/** Number of personal changes not yet backed up (e.g. made offline). */
export function pendingPersonalChanges(): number {
  return getState().outbox.filter((o) => o.t !== 'event').length;
}

/** Sends what it can, then signs out and removes personal data from this phone. */
export async function signOut(): Promise<void> {
  await flush();
  try {
    const sb = await getClient();
    await sb.auth.signOut({ scope: 'local' });
  } catch {
    // Even offline, forget the account on this phone.
  }
  clearPersonalData();
}

export async function deleteAccount(): Promise<Result> {
  try {
    const sb = await getClient();
    const { error } = await sb.rpc('delete_my_account');
    if (error) return errorKey(error);
    await sb.auth.signOut({ scope: 'local' });
    clearPersonalData();
    return null;
  } catch {
    return 'errOffline';
  }
}
