export const productTypes = ["T-Shirt", "Polo Shirt", "Hoodie", "Tote Bag", "Lanyard"] as const;
export const services = ["DTF Print", "Silkscreen", "Rubberized", "Sublimation", "Vinyl"] as const;
export const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"] as const;
export const colors = ["White", "Black", "Navy Blue", "Red", "Gray", "Cream", "Other"] as const;
export const productsWithSizes = ["T-Shirt", "Polo Shirt", "Hoodie"] as const;

export type ProductType = (typeof productTypes)[number];
export type ServiceType = (typeof services)[number];
export type ColorType = (typeof colors)[number];
export type SizeType = (typeof sizes)[number];

export const serviceDescriptions: Record<ServiceType, { description: string; tag: string }> = {
  "DTF Print": { description: "Best for colorful artwork, gradients, and detailed custom prints.", tag: "Full color" },
  Silkscreen: { description: "Best for bulk shirts, uniforms, teams, and organization orders.", tag: "Bulk orders" },
  Rubberized: { description: "Best for bold, thick, raised designs with strong coverage.", tag: "Raised finish" },
  Sublimation: { description: "Best for jerseys, sportswear, polyester, and all-over prints.", tag: "Sportswear" },
  Vinyl: { description: "Best for names, numbers, short text, and simple single-color designs.", tag: "Names & numbers" },
};

export function isValidProduct(product: string): product is ProductType { return (productTypes as readonly string[]).includes(product); }
export function isValidService(service: string): service is ServiceType { return (services as readonly string[]).includes(service); }
export function isValidColor(color: string): color is ColorType { return (colors as readonly string[]).includes(color); }
