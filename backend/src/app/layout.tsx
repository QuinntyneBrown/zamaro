import type { ReactNode } from 'react';

// The backend serves route handlers only (ADR-0027). Next.js still needs a root layout for the
// pages it generates itself, such as its not-found page.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
