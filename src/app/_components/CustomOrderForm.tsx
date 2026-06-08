"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { formatCurrency, safeFileName } from "@/lib/utils/format";
import type { CatalogColor, CatalogProduct, CatalogService, CatalogSize } from "@/lib/types";

const MAX_TOTAL_QUANTITY = 200;

const placementOptionsByProduct: Record<string, string[]> = {
  hoodie: [
    "Front",
    "Back",
    "Left Chest",
    "Sleeve",
    "Front and Back",
    "Name and Number",
  ],

  lanyard: [
    "One Side",
    "Both Sides",
    "Full Length",
    "Logo Repeat",
  ],

  "polo shirt": [
    "Left Chest",
    "Right Chest",
    "Back",
    "Sleeve",
    "Name and Number",
  ],

  "t-shirt": [
    "Front",
    "Back",
    "Left Chest",
    "Sleeve",
    "Front and Back",
    "Full Print",
    "Name and Number",
  ],

  "tote bag": [
    "Front Side",
    "Back Side",
    "Both Sides",
    "Center Print",
    "Full Front Print",
  ],
};

export default function CustomOrderForm({ products, services, sizes, colors }: { products: CatalogProduct[]; services: CatalogService[]; sizes: CatalogSize[]; colors: CatalogColor[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [colorId, setColorId] = useState(colors[0]?.id ?? "");
  const [colorCustom, setColorCustom] = useState("");
  const [placement, setPlacement] = useState("Front");
  const [instructions, setInstructions] = useState("");
  const [generalQuantity, setGeneralQuantity] = useState(1);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const product = products.find((item) => item.id === productId);
  const service = services.find((item) => item.id === serviceId);
  const color = colors.find((item) => item.id === colorId);

  const availablePlacements = useMemo(() => {
    const productName = product?.name.toLowerCase() ?? "";

    return (
      placementOptionsByProduct[productName] ?? [
        "Front",
        "Back",
        "Left Chest",
      ]
    );
  }, [product?.name]);

  const selectedPlacement = availablePlacements.includes(placement)
  ? placement
  : availablePlacements[0] ?? "";

  const quantity = useMemo(() => {
    if (!product?.has_sizes) return Math.max(0, Math.floor(generalQuantity));
    return Object.values(sizeQuantities).reduce((sum, qty) => sum + Math.max(0, Math.floor(qty || 0)), 0);
  }, [generalQuantity, product?.has_sizes, sizeQuantities]);

  const estimatedTotal = product && service ? (Number(product.base_price) + Number(service.price)) * quantity : 0;

  function updateSize(sizeId: string, value: string) {
    const nextQty = Math.max(0, Math.floor(Number(value) || 0));

    setSizeQuantities((prev) => {
      const otherSizesTotal = Object.entries(prev).reduce((sum, [id, qty]) => {
        if (id === sizeId) return sum;
        return sum + Math.max(0, Math.floor(qty || 0));
      }, 0);

      const remainingQty = Math.max(0, MAX_TOTAL_QUANTITY - otherSizesTotal);

      return {
        ...prev,
        [sizeId]: Math.min(nextQty, remainingQty),
      };
    });
  }

  function validateFile(file: File | null) {
    if (!file) return "Please upload your design image.";
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as never)) return "Only standard image files are allowed.";
    if (file.size > MAX_UPLOAD_BYTES) return "Maximum file size is 300MB.";
    return "";
  }

  async function handleSubmit() {
    setError("");
    const fileError = validateFile(designFile);
    if (!product || !service) return setError("Please select a product and printing service.");
    if (quantity <= 0) return setError("Please enter a valid quantity.");
    if (quantity > MAX_TOTAL_QUANTITY) {
      return setError(`Maximum total quantity is ${MAX_TOTAL_QUANTITY} items.`);
    }
    if (color?.name === "Other" && !colorCustom.trim()) return setError("Please specify the custom color.");
    if (fileError) return setError(fileError);

    setLoading(true);
    try {
      const items = product.has_sizes
        ? Object.entries(sizeQuantities).filter(([, qty]) => Number(qty) > 0).map(([sizeId, qty]) => ({ sizeId, quantity: Number(qty) }))
        : [{ sizeId: null, quantity }];

      const createResponse = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentProductId: product.id,
          printingServiceId: service.id,
          colorId: color?.name === "Other" ? null : colorId,
          colorCustom: color?.name === "Other" ? colorCustom : null,
          placement: selectedPlacement,
          specialInstructions: instructions,
          items,
        }),
      });

      const created = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok) throw new Error(created.error || "Failed to create order.");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !designFile) throw new Error("Your session expired. Please sign in again.");

      const path = `${user.id}/${created.orderId}/designs/${safeFileName(designFile.name)}`;
      const { error: uploadError } = await supabase.storage.from("design-files").upload(path, designFile, {
        contentType: designFile.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const metadataResponse = await fetch(`/api/orders/${encodeURIComponent(created.orderNumber)}/design-upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: path, fileName: designFile.name, mimeType: designFile.type, sizeBytes: designFile.size }),
      });
      const metadata = await metadataResponse.json().catch(() => ({}));
      if (!metadataResponse.ok) throw new Error(metadata.error || "Failed to save design metadata.");

      router.push(`/custom-order/success?orderNumber=${encodeURIComponent(created.orderNumber)}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(13,13,20,0.06)] md:p-8">
        <div className="space-y-9">
          <Fieldset number="1" title="Choose garment" description="Select the item you want to customize.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((item) => (
                <button key={item.id} type="button" onClick={() => setProductId(item.id)} className={`rounded-2xl border p-4 text-left transition ${productId === item.id ? "border-[var(--purple)] bg-[rgba(75,0,110,0.08)]" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}>
                  <span className="block font-bold text-[var(--text)]">{item.name}</span>
                  <span className="mt-1 block text-sm text-[var(--muted)]">Base: {formatCurrency(item.base_price)}</span>
                </button>
              ))}
            </div>
          </Fieldset>

          <Fieldset number="2" title="Choose printing service" description="The service price is added to the garment base price.">
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((item) => (
                <button key={item.id} type="button" onClick={() => setServiceId(item.id)} className={`rounded-2xl border p-4 text-left transition ${serviceId === item.id ? "border-[var(--purple)] bg-[rgba(75,0,110,0.08)]" : "border-[var(--border)] hover:bg-[var(--cream)]"}`}>
                  <span className="block font-bold text-[var(--text)]">{item.name}</span>
                  <span className="mt-1 inline-flex rounded-full bg-[var(--cream)] px-3 py-1 text-xs font-bold text-[var(--purple)]">{item.tag}</span>
                  <span className="mt-2 block text-sm text-[var(--muted)]">{item.description}</span>
                  <span className="mt-2 block text-sm font-bold text-[var(--text)]">Service: {formatCurrency(item.price)}</span>
                </button>
              ))}
            </div>
          </Fieldset>

          <Fieldset number="3" title="Details" description="Pick color, placement, and quantity.">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Color</span>
                <select value={colorId} onChange={(e) => setColorId(e.target.value)} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--purple)]">
                  {colors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Placement</span>
                <select value={selectedPlacement} onChange={(e) => setPlacement(e.target.value)} className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--purple)]">
                  {availablePlacements.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>

            {color?.name === "Other" && (
              <label className="mt-4 block">
                <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Specify color</span>
                <input value={colorCustom} onChange={(e) => setColorCustom(e.target.value)} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--purple)]" placeholder="Example: pastel pink" />
              </label>
            )}

            {product?.has_sizes ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {sizes.map((size) => (
                  <label key={size.id} className="rounded-2xl border border-[var(--border)] bg-[var(--cream)] p-3">
                    <span className="block text-xs font-bold text-[var(--muted)]">{size.name}</span>
                    <input type="number" min="0" max={MAX_TOTAL_QUANTITY} value={sizeQuantities[size.id] ?? 0} onChange={(e) => updateSize(size.id, e.target.value)} className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--purple)]" />
                  </label>
                ))}
              </div>
            ) : (
              <label className="mt-4 block max-w-xs">
                <span className="mb-2 block text-sm font-semibold text-[var(--text)]">Quantity</span>
                <input type="number" min="1" max={MAX_TOTAL_QUANTITY} value={generalQuantity} onChange={(e) => setGeneralQuantity(Number(e.target.value))} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--purple)]" />
              </label>
            )}
          </Fieldset>

          <Fieldset number="4" title="Upload design" description="Upload a standard image file. Maximum file size: 300MB.">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--cream)] p-8 text-center transition hover:bg-[var(--surface-muted)]">
              <span className="font-bold text-[var(--text)]">{designFile ? designFile.name : "Click to upload your design image"}</span>
              <span className="mt-2 text-sm text-[var(--muted)]">PNG, JPG, WEBP, GIF, HEIC/HEIF</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setDesignFile(e.target.files?.[0] ?? null)} />
            </label>
          </Fieldset>

          <Fieldset number="5" title="Special instructions" description="Optional notes for the staff.">
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={5} className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[var(--purple)]" placeholder="Example: Please center the design on the front." />
          </Fieldset>
        </div>
      </section>

      <aside className="h-fit rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_18px_50px_rgba(13,13,20,0.06)] lg:sticky lg:top-24 md:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--gold)]">Estimated price</p>
        <h2 className="mt-3 font-display text-5xl font-semibold text-[var(--text)]">{formatCurrency(estimatedTotal)}</h2>
        <div className="mt-6 space-y-3 rounded-[22px] bg-[var(--cream)] p-5 text-sm">
          <Line label="Garment" value={product ? `${product.name} (${formatCurrency(product.base_price)})` : "—"} />
          <Line label="Service" value={service ? `${service.name} (${formatCurrency(service.price)})` : "—"} />
          <Line label="Quantity" value={`${quantity} item/s`} />
          <Line label="Formula" value="(Garment + Printing) × Quantity" />
        </div>
        {error && <p role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <button type="button" onClick={handleSubmit} disabled={loading} className="mt-6 w-full rounded-full bg-[var(--purple2)] px-6 py-4 text-sm font-bold text-white transition hover:bg-[var(--purple)] disabled:opacity-60">
          {loading ? "Submitting order..." : "Submit Custom Order"}
        </button>
        <p className="mt-4 text-xs leading-5 text-[var(--muted)]">After submission, staff will review the design and update your order status.</p>
      </aside>
    </div>
  );
}

function Fieldset({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(75,0,110,0.08)] text-sm font-bold text-[var(--purple)]">{number}</span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-[var(--text)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">{label}</span><span className="text-right font-bold text-[var(--text)]">{value}</span></div>;
}
