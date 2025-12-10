// ADR: ADR-011-web-api-architecture

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ProjectProvider } from "@/hooks";
import { TRPCProvider } from "@/lib/trpc/provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Choragen Dashboard",
  description: "Web dashboard for Choragen agentic development framework",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProjectProvider>
            <TRPCProvider>
              <div className="flex min-h-screen">
                {/* Desktop sidebar - fixed left */}
                <Sidebar />

                {/* Main content area */}
                <div className="flex flex-1 flex-col">
                  {/* Header - sticky top */}
                  <Header />

                  {/* Scrollable content */}
                  <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </TRPCProvider>
          </ProjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
