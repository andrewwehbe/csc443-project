import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import App from './App.jsx';
import './index.css';

// A data router (createBrowserRouter) instead of <BrowserRouter>: only a data router can hold back a
// route change, and the booking form needs that to warn about unsaved changes (useBlocker).
// Its one route hands every address to App, which keeps the list of pages in its own <Routes>.
// basename = the base from vite.config.js, so routes work under /csc443-project/.
const router = createBrowserRouter([{ path: '*', element: <App /> }], {
  basename: import.meta.env.BASE_URL,
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
