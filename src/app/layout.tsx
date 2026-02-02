import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-tiptap/styles.css";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ConvexClientProvider } from "@/components/convex-client-provider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuillHub",
  description: "QuillHub is a real-time collaborative document editor for teams, enabling rich-text editing, live collaboration, comments, and versioned documents.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ConvexClientProvider>
          <NuqsAdapter>
            <Toaster />
            {children}
          </NuqsAdapter>
        </ConvexClientProvider>
      </body>
    </html>
  );
}