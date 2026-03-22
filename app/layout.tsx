import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full">
      <body className="h-full w-full overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
