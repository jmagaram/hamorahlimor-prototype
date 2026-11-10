import { useState } from 'react';
import { signIn } from '../model/session';
import { useDb } from '../model/store';
import { resetToHome } from '../nav/nav';
import { MenuDrawer } from '../ui/Drawer';
import { useDrawer } from '../ui/drawerContext';
import { Footer } from '../ui/Footer';
import { ActionLink } from '../ui/rows';

/** Shown instead of the whole app when nobody is signed in. */
export function SignIn() {
  const db = useDb();
  const drawer = useDrawer();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const go = (c: string) => {
    if (!signIn(c)) return setError('No one has that code.');
    resetToHome();
  };
  return (
    <main>
      <h2>Sign in</h2>
      <p>What is your code to use this? If you forgot, ask your teacher.</p>
      <input className="wide" value={code} autoFocus autoCapitalize="characters" autoComplete="off" spellCheck={false}
        aria-label="Your code" onChange={e => { setCode(e.target.value); setError(''); }}
        onKeyDown={e => { if (e.key === 'Enter' && code.trim()) go(code); }} />
      {error && <p className="err">{error}</p>}

      {/* Prototype only: skip typing a code. */}
      <p className="prototype"><small>Prototype: sign in as{' '}
        <ActionLink onClick={() => go(db.teacher.securityCode)}>Teacher</ActionLink>
        {' · '}
        <ActionLink onClick={() => drawer.open(
          <MenuDrawer title="Sign in as a student"
            options={[...db.students].sort((a, b) => a.name.localeCompare(b.name)).map(s => ({ label: s.name, sub: s.securityCode, value: s.securityCode }))}
            onPick={go} />)}>Student</ActionLink>
      </small></p>

      <Footer buttons={[{ label: 'Sign in', onClick: () => go(code), disabled: !code.trim() }]} />
    </main>
  );
}
