"use client";

import { CartProvider } from "@/components/cart/cart-context";
import { TRPCReactProvider } from "@/trpc/client";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { Toaster } from "sonner";

const Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <TRPCReactProvider>
      <SessionProvider>
        <CartProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </CartProvider>
      </SessionProvider>
    </TRPCReactProvider>
  );
};

export default Provider;
