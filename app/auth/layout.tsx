// app/auth/layout.tsx
// Wraps all /auth/* pages in the custom-CSS design system shell.
// The `data-page="app"` attribute activates the non-Tailwind body styles
// defined in globals.css without affecting the landing page.

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-page="app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
}
