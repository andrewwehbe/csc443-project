import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthStage, { AuthField } from '../components/AuthStage.jsx';

// Surface: 08 Register, at /register.
// A new account exists only until the page is reloaded. Phase 1 does not store a password.
export default function RegisterPage({ users, onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', studentId: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const studentId = form.studentId.trim();
    if (!name || !email || !studentId || !form.password) {
      setError('Fill in every field.');
      return;
    }
    if (!email.includes('@')) {
      setError('Enter an email address.');
      return;
    }
    if (form.password.length < 8) {
      setError('Use a password of at least 8 characters.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      setError('An account with this email already exists.');
      return;
    }
    onRegister({ id: `u${Date.now()}`, name, email, studentId });
    navigate('/my-bookings');
  }

  return (
    <AuthStage
      title="Register"
      hint="The new account lasts until you reload. Nothing is saved on this computer."
      links={<><Link to="/sign-in">Sign in</Link><Link to="/">Back to today</Link></>}
    >
      <form noValidate onSubmit={handleSubmit} autoComplete="off">
        <AuthField id="name" name="name" label="Name" type="text" autoComplete="name" placeholder="Lara Haddad" value={form.name} onChange={handleChange} />
        <AuthField id="email" name="email" label="Email" type="email" autoComplete="email" placeholder="lara.haddad@lau.edu" value={form.email} onChange={handleChange} aria-invalid={Boolean(error)} aria-describedby={error ? 'register-error' : undefined} />
        <AuthField id="studentId" name="studentId" label="Student ID" type="text" inputMode="numeric" autoComplete="off" placeholder="202301184" value={form.studentId} onChange={handleChange} />
        <AuthField id="password" name="password" label="Password" type="password" autoComplete="new-password" placeholder="••••••••" note="At least 8 characters. It is not stored in Phase 1." value={form.password} onChange={handleChange} />
        {error && <p id="register-error" className="error" role="alert">{error}</p>}
        <div className="submit">
          <div className="drop" />
          <button type="submit">Create account</button>
        </div>
      </form>
    </AuthStage>
  );
}
