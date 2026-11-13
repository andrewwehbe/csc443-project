import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import AuthStage, { AuthField } from '../components/AuthStage.jsx';

// Surface: 08 Sign in, at /sign-in.
// A known demo email and any password signs that student in.
export default function SignInPage({ users, onUserChange }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const email = form.email.trim();
    if (!email || !form.password) {
      setError('Enter your email and password.');
      return;
    }
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      setError('No account uses that email.');
      return;
    }
    onUserChange(user);
    navigate('/my-bookings');
  }

  return (
    <AuthStage
      title="Sign in"
      hint="Use a demo email. Any password works in Phase 1."
      links={<><Link to="/register">Register</Link><Link to="/">Back to today</Link></>}
    >
      <form noValidate onSubmit={handleSubmit} autoComplete="off">
        <AuthField id="email" name="email" label="Email" type="email" autoComplete="email" placeholder="lara.haddad@lau.edu" value={form.email} onChange={handleChange} aria-invalid={Boolean(error)} aria-describedby={error ? 'sign-in-error' : undefined} />
        <AuthField id="password" name="password" label="Password" type="password" autoComplete="current-password" placeholder="••••••••" value={form.password} onChange={handleChange} />
        {error && <p id="sign-in-error" className="error" role="alert">{error}</p>}
        <div className="submit">
          <div className="drop" />
          <button type="submit">Sign in</button>
        </div>
      </form>
    </AuthStage>
  );
}
