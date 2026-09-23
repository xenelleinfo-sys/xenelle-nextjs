import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import CartPage from "@/pages_routes/CartPage";

export const metadata: Metadata = { title: "Shopping Bag", robots: NO_INDEX };

// Cart lives in the browser (localStorage); server renders the shell only.
export default function Cart() {
  return <CartPage />;
}
