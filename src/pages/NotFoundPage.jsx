import { Link } from 'react-router';
import { buttonClass } from '../lib/buttons.js';
import { LogoMark } from '../components/Logo.jsx';

// Any URL that matches no route lands here (path="*" in App.jsx).
export default function NotFoundPage() {
  return (
    <section className="border border-line bg-surface px-6 py-14 text-center sm:px-10">
      <LogoMark className="mx-auto h-16 w-16" />
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink">No room behind this door.</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">This address does not match any page. It may have moved, or the link may be mistyped.</p>
      <Link to="/" className={`mt-8 ${buttonClass('primary')}`}>Back to Today</Link>
    </section>
  );
}
