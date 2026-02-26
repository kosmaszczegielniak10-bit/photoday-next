import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'PhotoDay — Cyfrowy Pamiętnik',
  description: 'Twój prywatny dziennik fotograficzny',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
