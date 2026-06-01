import '../styles/globals.css';

export const metadata = {
  title: 'AI Education Coach',
  description: 'Yapay zeka destekli eğitim koçu',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
