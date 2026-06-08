import Navbar from "@/app/_components/Navbar";
import Footer from "@/app/_components/Footer";
import CustomOrderForm from "@/app/_components/CustomOrderForm";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CatalogColor, CatalogProduct, CatalogService, CatalogSize } from "@/lib/types";
import FloatingActions from "../_components/FloatingActions";

export const dynamic = "force-dynamic";

export default async function CustomOrderPage() {
  await requireRole(["customer", "admin"]);
  const admin = createAdminClient();
  const [{ data: products }, { data: services }, { data: sizes }, { data: colors }] = await Promise.all([
    admin.from("garment_products").select("id, name, base_price, has_sizes, active").eq("active", true).order("name"),
    admin.from("printing_services").select("id, name, description, tag, price, active").eq("active", true).order("name"),
    admin.from("sizes").select("id, name, sort_order, active").eq("active", true).order("sort_order"),
    admin.from("colors").select("id, name, hex, active").eq("active", true),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--cream)] px-6 py-12 md:px-8 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">Custom Order</p>
            <h1 className="font-display text-[clamp(36px,5vw,62px)] leading-tight text-[var(--text)]">Create your custom printing order</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--muted)]">Choose your product, printing method, quantity, color, design file, and instructions. The system computes the estimated total automatically.</p>
          </div>
          <CustomOrderForm products={(products ?? []) as CatalogProduct[]} services={(services ?? []) as CatalogService[]} sizes={(sizes ?? []) as CatalogSize[]} colors={(colors ?? []) as CatalogColor[]} />
        </div>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
