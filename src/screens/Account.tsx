import { useEffect, useState } from 'react';
import { useT, type StringKey } from '../i18n';
import { deleteAccount, pendingPersonalChanges, sendPasswordReset, signIn, signOut, signUp, updatePassword } from '../lib/auth';
import { backendEnabled, getClient } from '../lib/backend';
import { categoryIcon } from '../lib/data';
import { useStore } from '../lib/store';
import { goBack, navigate } from '../router';
import type { Category } from '../types';
import '../components/reviews.css';

// Messages that are good news rather than errors.
const OK_MESSAGES: StringKey[] = ['checkEmail', 'resetSent', 'passwordUpdated', 'accountDeleted'];

function Message({ msg }: { msg: StringKey | null }) {
  const { t } = useT();
  if (!msg) return null;
  return (
    <p className={'form-msg' + (OK_MESSAGES.includes(msg) ? '' : ' error')} role="status">
      {t(msg)}
    </p>
  );
}

function PasswordInput({ value, onChange, autoComplete }: { value: string; onChange: (v: string) => void; autoComplete: string }) {
  const { t } = useT();
  const [show, setShow] = useState(false);
  return (
    <div className="row">
      <input
        className="input"
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        minLength={6}
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('password')}
      />
      <button type="button" className="btn" style={{ padding: '6px 12px' }} onClick={() => setShow(!show)}>
        {show ? t('hidePassword') : t('showPassword')}
      </button>
    </div>
  );
}

function SignedOut() {
  const { t } = useT();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StringKey | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (password.length < 6) return setMsg('errWeakPassword');
    if (mode === 'up' && !consent) return setMsg('consentNeeded');
    setBusy(true);
    const result = mode === 'in' ? await signIn(email, password) : await signUp(email, password, name);
    setBusy(false);
    setMsg(result);
    if (result === 'checkEmail') setMode('in');
  };

  const forgot = async () => {
    if (!email.includes('@')) return setMsg('enterEmailFirst');
    setBusy(true);
    setMsg(await sendPasswordReset(email));
    setBusy(false);
  };

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <strong>{t('accountGuestTitle')}</strong>
        <p className="muted" style={{ margin: '4px 0 0' }}>
          {t('accountGuestHint')}
        </p>
      </div>

      <div className="segment" role="group" style={{ marginBottom: 16 }}>
        <button aria-pressed={mode === 'in'} onClick={() => (setMode('in'), setMsg(null))}>
          {t('signIn')}
        </button>
        <button aria-pressed={mode === 'up'} onClick={() => (setMode('up'), setMsg(null))}>
          {t('createAccount')}
        </button>
      </div>

      <form className="stack" onSubmit={submit}>
        {mode === 'up' && (
          <label className="field">
            {t('yourName')}
            <input className="input" autoComplete="given-name" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
        )}
        <label className="field">
          {t('email')}
          <input
            className="input"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <div className="field">
          <span>
            {t('password')} <span className="muted small">({t('passwordHint')})</span>
          </span>
          <PasswordInput value={password} onChange={setPassword} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
        </div>

        {mode === 'up' && (
          <label className="row" style={{ alignItems: 'flex-start', gap: 12, fontSize: '0.95rem' }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              style={{ width: 28, height: 28, flex: 'none', marginTop: 2 }}
            />
            <span>{t('consentLabel')}</span>
          </label>
        )}

        <Message msg={msg} />

        <button className="btn btn-big btn-primary" type="submit" disabled={busy}>
          {busy ? t('working') : mode === 'in' ? t('signIn') : t('createAccount')}
        </button>
        {mode === 'in' && (
          <button type="button" className="link-btn" onClick={forgot} disabled={busy}>
            {t('forgotPassword')}
          </button>
        )}
      </form>
    </>
  );
}

function NewPassword() {
  const { t } = useT();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StringKey | null>(null);
  return (
    <form
      className="card stack"
      style={{ marginBottom: 16 }}
      onSubmit={async (e) => {
        e.preventDefault();
        if (password.length < 6) return setMsg('errWeakPassword');
        setBusy(true);
        setMsg(await updatePassword(password));
        setBusy(false);
      }}
    >
      <strong>{t('newPassword')}</strong>
      <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
      <Message msg={msg} />
      <button className="btn btn-big btn-primary" type="submit" disabled={busy}>
        {busy ? t('working') : t('setPassword')}
      </button>
    </form>
  );
}

interface Suggestion {
  id: string;
  name: string;
  category: Category;
  status: 'pending' | 'approved' | 'rejected';
}

function MySuggestions({ userId }: { userId: string }) {
  const { t } = useT();
  const [items, setItems] = useState<Suggestion[] | null>(null);

  useEffect(() => {
    if (!navigator.onLine) return;
    getClient()
      .then((sb) =>
        sb.from('place_suggestions').select('id,name,category,status').eq('user_id', userId).order('created_at', { ascending: false }),
      )
      .then(({ data }) => setItems((data as Suggestion[]) ?? []))
      .catch(() => setItems(null));
  }, [userId]);

  return (
    <>
      <h2>{t('mySuggestions')}</h2>
      {items && items.length > 0 && (
        <ul className="review-list">
          {items.map((s) => (
            <li key={s.id} className="card row">
              <span aria-hidden="true">{categoryIcon[s.category]}</span>
              <span style={{ flex: 1, fontWeight: 600 }}>{s.name}</span>
              <span className={'status-pill ' + s.status}>{t(`status_${s.status}`)}</span>
            </li>
          ))}
        </ul>
      )}
      <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/suggest')}>
        {t('suggestPlace')}
      </button>
    </>
  );
}

function SignedIn() {
  const { t } = useT();
  const account = useStore((s) => s.account)!;
  const recovering = useStore((s) => s.passwordRecovery);
  const pending = useStore((s) => s.outbox.filter((o) => o.t !== 'event').length);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StringKey | null>(null);

  const doSignOut = async () => {
    if (pendingPersonalChanges() > 0 && !navigator.onLine && !window.confirm(t('signOutPendingConfirm'))) return;
    setBusy(true);
    await signOut();
    setBusy(false);
  };

  const doDelete = async () => {
    if (!window.confirm(t('deleteConfirm'))) return;
    setBusy(true);
    const result = await deleteAccount();
    setBusy(false);
    setMsg(result ?? 'accountDeleted');
  };

  return (
    <>
      {recovering && <NewPassword />}
      <div className="card stack">
        <strong style={{ overflowWrap: 'anywhere' }}>{t('signedInAs', { email: account.email })}</strong>
        <p style={{ margin: 0 }} className={pending ? '' : 'walk'}>
          {pending ? t('syncPending', { n: pending }) : t('syncedOk')}
        </p>
      </div>

      <MySuggestions userId={account.userId} />

      <h2>{t('settings')}</h2>
      <Message msg={msg} />
      <div className="stack">
        <button className="btn btn-big" onClick={doSignOut} disabled={busy}>
          {t('signOut')}
        </button>
        <button
          className="btn"
          style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
          onClick={doDelete}
          disabled={busy}
        >
          {t('deleteAccount')}
        </button>
      </div>
    </>
  );
}

export default function Account() {
  const { t } = useT();
  const account = useStore((s) => s.account);
  return (
    <div className="screen">
      <div className="topbar">
        <button className="icon-btn" onClick={() => goBack('/help')} aria-label={t('back')}>
          ←
        </button>
        <h1>{t('account')}</h1>
      </div>
      {!backendEnabled ? <p className="empty">{t('accountsOff')}</p> : account ? <SignedIn /> : <SignedOut />}
      {backendEnabled && <PrivacyNote />}
    </div>
  );
}

export function PrivacyNote() {
  const { t } = useT();
  return (
    <section className="card small" style={{ marginTop: 20 }}>
      <strong>{t('privacyTitle')}</strong>
      <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
        <li>{t('privacyGuest')}</li>
        <li>{t('privacyAccount')}</li>
        <li>{t('privacyDelete')}</li>
      </ul>
    </section>
  );
}
