import type { Metadata } from "next";
import { AppPreferencesProvider } from "./_components/AppPreferencesProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "JNJ Printing",
  description: "Custom prints made simple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AppPreferencesProvider>{children}</AppPreferencesProvider>
      </body>
    </html>
  );
}
