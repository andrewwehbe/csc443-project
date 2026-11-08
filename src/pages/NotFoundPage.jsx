import { Link } from 'react-router';

// Any URL that matches no route lands here (path="*" in App.jsx).
export default function NotFoundPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted">This address does not match any page.</p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium underline">Back to home</Link>
    </section>
  );
}
