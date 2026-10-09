import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Churn Shield",
  description: "Recover failed payments before they become churn.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
