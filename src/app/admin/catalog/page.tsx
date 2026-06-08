import type { ReactNode } from "react";
import DashboardShell from "@/app/_components/dashboard/DashboardShell";
import { deactivateCatalogItem, saveColor, saveProduct, saveService, saveSize } from "@/app/actions/admin";
import { requireRole } from "@/lib/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils/format";
import type { CatalogColor, CatalogProduct, CatalogService, CatalogSize } from "@/lib/types";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted-2)] focus:border-[#1a1a2e] focus:ring-2 focus:ring-[#1a1a2e]/10";

export default async function AdminCatalogPage() {
  await requireRole(["admin"]);
  const admin = createAdminClient();
  const [{ data: products }, { data: services }, { data: sizes }, { data: colors }] = await Promise.all([
    admin.from("garment_products").select("id,name,base_price,has_sizes,active").order("name"),
    admin.from("printing_services").select("id,name,description,tag,price,active").order("name"),
    admin.from("sizes").select("id,name,sort_order,active").order("sort_order"),
    admin.from("colors").select("id,name,hex,active").order("name"),
  ]);

  const productRows = (products ?? []) as CatalogProduct[];
  const serviceRows = (services ?? []) as CatalogService[];
  const sizeRows = (sizes ?? []) as CatalogSize[];
  const colorRows = (colors ?? []) as CatalogColor[];

  const activeProducts = productRows.filter((i) => i.active).length;
  const activeServices = serviceRows.filter((i) => i.active).length;
  const activeSizes = sizeRows.filter((i) => i.active).length;
  const activeColors = colorRows.filter((i) => i.active).length;

  return (
    <DashboardShell
      role="admin"
      active="catalog"
      title="Products and prices"
      subtitle="Manage the choices customers see when they create a custom order. Keep this page simple: add, edit, or disable catalog items."
    >
      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CatalogCount label="Garments" value={activeProducts} total={productRows.length} tone="dark" />
        <CatalogCount label="Services" value={activeServices} total={serviceRows.length} tone="green" />
        <CatalogCount label="Sizes" value={activeSizes} total={sizeRows.length} tone="blue" />
        <CatalogCount label="Colors" value={activeColors} total={colorRows.length} tone="purple" />
      </section>

      {/* Admin note */}
      <section className="mt-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">Catalog setup</p>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              Click a row to edit it. Disable items that should no longer appear in the customer order form.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-3 md:min-w-[390px]">
            <GuideStep number="1" label="Edit product prices" />
            <GuideStep number="2" label="Update print services" />
            <GuideStep number="3" label="Control choices" />
          </div>
        </div>
      </section>

      {/* Panels */}
      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel
          title="Garment products"
          helper="Base price of each garment before printing service and quantity."
          meta={`${activeProducts} active / ${productRows.length} total`}
        >
          <AddButton label="Add garment">
            <ProductForm />
          </AddButton>
          <ItemList count={productRows.length} empty="No garments yet. Add the first garment above.">
            {productRows.map((item) => (
              <ProductForm key={item.id} item={item} />
            ))}
          </ItemList>
        </Panel>

        <Panel
          title="Printing services"
          helper="Service price is added to the garment base price before multiplying by quantity."
          meta={`${activeServices} active / ${serviceRows.length} total`}
        >
          <AddButton label="Add service">
            <ServiceForm />
          </AddButton>
          <ItemList count={serviceRows.length} empty="No printing services yet. Add the first service above.">
            {serviceRows.map((item) => (
              <ServiceForm key={item.id} item={item} />
            ))}
          </ItemList>
        </Panel>

        <Panel
          title="Sizes"
          helper="Sizes shown in the custom order form. Use sort order to control display order."
          meta={`${activeSizes} active / ${sizeRows.length} total`}
        >
          <AddButton label="Add size">
            <SizeForm />
          </AddButton>
          <ItemList count={sizeRows.length} empty="No sizes yet. Add the first size above.">
            {sizeRows.map((item) => (
              <SizeForm key={item.id} item={item} />
            ))}
          </ItemList>
        </Panel>

        <Panel
          title="Colors"
          helper="Colors shown in the custom order form. Add a hex code when available."
          meta={`${activeColors} active / ${colorRows.length} total`}
        >
          <AddButton label="Add color">
            <ColorForm />
          </AddButton>
          <ItemList count={colorRows.length} empty="No colors yet. Add the first color above.">
            {colorRows.map((item) => (
              <ColorForm key={item.id} item={item} />
            ))}
          </ItemList>
        </Panel>
      </section>
    </DashboardShell>
  );
}

// Sub-components 

function CatalogCount({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "dark" | "green" | "blue" | "purple";
}) {
  const disabled = Math.max(0, total - value);
  const allActive = disabled === 0;
  const dotClass = {
    dark: "bg-[#1a1a2e]",
    green: "bg-emerald-600",
    blue: "bg-sky-600",
    purple: "bg-violet-600",
  }[tone];

  return (
    <article className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-2)]">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
          {label}
        </p>
        <span className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--muted)]">
          {total} total
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold leading-none tracking-[-0.03em] text-[var(--text)]">{value}</p>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {allActive ? "All active" : `${disabled} disabled`}
      </p>
    </article>
  );
}

function GuideStep({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-[var(--surface-soft)] px-3 py-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1a1a2e] text-[10px] font-semibold text-white">
        {number}
      </span>
      <span className="font-medium text-[var(--text)]">{label}</span>
    </div>
  );
}

function Panel({
  title,
  helper,
  meta,
  children,
}: {
  title: string;
  helper: string;
  meta: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--muted-2)]">Manage</p>
          <h2 className="mt-1 text-base font-semibold text-[var(--text)]">{title}</h2>
          <p className="mt-1 max-w-xl text-xs leading-5 text-[var(--muted)]">{helper}</p>
        </div>
        <span className="shrink-0 rounded-md bg-[var(--surface-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--muted)]">
          {meta}
        </span>
      </div>
      {children}
    </section>
  );
}

function AddButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="group rounded-[12px] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-3 open:border-[#1a1a2e] open:bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--text)]">
        <span className="flex items-center gap-2">
          <PlusIcon />
          {label}
        </span>
        <ChevronIcon size={13} />
      </summary>
      <div className="mt-3 border-t border-[var(--border)] pt-3">{children}</div>
    </details>
  );
}

function ItemList({ count, empty, children }: { count: number; empty: string; children: ReactNode }) {
  return <div className="mt-3 space-y-2">{count > 0 ? children : <EmptyState>{empty}</EmptyState>}</div>;
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-6 text-center text-xs text-[var(--muted)]">
      {children}
    </div>
  );
}

function CatalogRow({
  summary,
  meta,
  active,
  children,
}: {
  summary: ReactNode;
  meta?: ReactNode;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-[12px] border border-[var(--border)] bg-[var(--surface-soft)] open:border-[#1a1a2e] open:bg-[var(--surface)]">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5">
        <ChevronIcon size={13} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-[var(--text)]">{summary}</span>
          {meta && <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{meta}</span>}
        </span>
        <StatusPill active={active} />
        <span className="hidden rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] font-semibold text-[var(--muted)] sm:inline-flex">
          Edit
        </span>
      </summary>
      <div className="border-t border-[var(--border)] px-3 pb-3 pt-3">{children}</div>
    </details>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {active ? "Active" : "Disabled"}
    </span>
  );
}

// Forms 

function ProductForm({ item }: { item?: CatalogProduct }) {
  const inner = (
    <form action={saveProduct} className="grid gap-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="kind" value="product" />

      <Field label="Product name">
        <input name="name" defaultValue={item?.name} placeholder="e.g. T-Shirt" className={inputClass} required />
      </Field>

      <div className="grid gap-3 sm:grid-cols-[1fr_150px]">
        <Field label="Base price">
          <input
            name="basePrice"
            defaultValue={item?.base_price ?? 0}
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            required
          />
        </Field>
        <label className="flex items-center gap-2 self-end rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--surface-soft)]">
          <input type="checkbox" name="hasSizes" defaultChecked={item?.has_sizes ?? true} className="h-4 w-4 accent-[#1a1a2e]" />
          Has sizes
        </label>
      </div>

      <FormActions isExisting={Boolean(item)} active={item?.active ?? true} label={item ? "Save changes" : "Add garment"} />
    </form>
  );

  if (!item) return inner;
  return (
    <CatalogRow
      summary={item.name}
      meta={`${formatCurrency(item.base_price ?? 0)} base price · ${item.has_sizes ? "Has sizes" : "No sizes"}`}
      active={item.active}
    >
      {inner}
    </CatalogRow>
  );
}

function ServiceForm({ item }: { item?: CatalogService }) {
  const inner = (
    <form action={saveService} className="grid gap-3">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="kind" value="service" />

      <Field label="Service name">
        <input name="name" defaultValue={item?.name} placeholder="e.g. DTF Print" className={inputClass} required />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tag">
          <input name="tag" defaultValue={item?.tag} placeholder="e.g. Full color" className={inputClass} required />
        </Field>
        <Field label="Service price">
          <input
            name="price"
            defaultValue={item?.price ?? 0}
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field label="Short description">
        <textarea
          name="description"
          defaultValue={item?.description}
          placeholder="Best for colorful artwork..."
          rows={3}
          className={`${inputClass} min-h-[84px] resize-y`}
          required
        />
      </Field>

      <FormActions isExisting={Boolean(item)} active={item?.active ?? true} label={item ? "Save changes" : "Add service"} />
    </form>
  );

  if (!item) return inner;
  return (
    <CatalogRow summary={item.name} meta={`${item.tag} · ${formatCurrency(item.price ?? 0)}`} active={item.active}>
      {inner}
    </CatalogRow>
  );
}

function SizeForm({ item }: { item?: CatalogSize }) {
  const inner = (
    <form action={saveSize} className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="kind" value="size" />
      <input name="name" defaultValue={item?.name} placeholder="e.g. Medium" className={inputClass} required />
      <input name="sortOrder" type="number" defaultValue={item?.sort_order ?? 0} className={inputClass} placeholder="Sort" />
      <FormActions isExisting={Boolean(item)} active={item?.active ?? true} label={item ? "Save" : "Add"} compact />
    </form>
  );

  if (!item) return inner;
  return (
    <CatalogRow summary={item.name} meta={`Sort order: ${item.sort_order ?? 0}`} active={item.active}>
      {inner}
    </CatalogRow>
  );
}

function ColorForm({ item }: { item?: CatalogColor }) {
  const inner = (
    <form action={saveColor} className="grid gap-3 sm:grid-cols-[1fr_130px_auto]">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="kind" value="color" />
      <input name="name" defaultValue={item?.name} placeholder="e.g. Black" className={inputClass} required />
      <input name="hex" defaultValue={item?.hex ?? ""} placeholder="#000000" className={inputClass} />
      <FormActions isExisting={Boolean(item)} active={item?.active ?? true} label={item ? "Save" : "Add"} compact />
    </form>
  );

  const colorSummary = item ? (
    <span className="flex min-w-0 items-center gap-2">
      {item.hex && (
        <span
          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--border)]"
          style={{ background: item.hex }}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{item.name}</span>
    </span>
  ) : null;

  if (!item) return inner;
  return (
    <CatalogRow summary={colorSummary} meta={item.hex || "No hex code"} active={item.active}>
      {inner}
    </CatalogRow>
  );
}

function FormActions({
  isExisting,
  active,
  label,
  compact = false,
}: {
  isExisting: boolean;
  active: boolean;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "self-end" : ""}`}>
      <button className="rounded-md bg-[#1a1a2e] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#2d2d4e]">
        {label}
      </button>
      {isExisting && active && (
        <button
          formAction={deactivateCatalogItem}
          className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          Disable
        </button>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--text)]">{label}</span>
      {children}
    </label>
  );
}

function PlusIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[var(--muted)]"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ChevronIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-[var(--muted)] transition-transform duration-200 group-open:rotate-90"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
