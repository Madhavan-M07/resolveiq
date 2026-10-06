import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolvIQ - Enterprise SRE Incident Console",
  description: "Autonomous SRE Incident Resolution Platform powered by LangGraph, Pinecone RAG, and Human-in-the-Loop controls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
