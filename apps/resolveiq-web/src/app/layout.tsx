import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResolveIQ - Autonomous SRE Incident Command Center",
  description: "Enterprise Autonomous Incident Resolution Platform powered by LangGraph, Pinecone RAG, and Human-in-the-Loop controls",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#070a12] text-slate-100 min-h-screen antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
