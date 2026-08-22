"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { AuthProvider } from "../lib/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className: "border border-border bg-surface text-foreground font-sans rounded-[10px] shadow-lg",
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </NextThemesProvider>
  );
}
