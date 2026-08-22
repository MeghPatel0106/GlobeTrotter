"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: "#141C2C",
              border: "1px solid rgba(201, 151, 63, 0.3)",
              color: "#F6F1E4",
              fontFamily: "var(--font-sans)",
              borderRadius: "10px",
              boxShadow: "0 10px 30px -10px rgba(14, 20, 32, 0.7)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
