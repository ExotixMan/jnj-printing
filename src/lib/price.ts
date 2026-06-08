export function calculateOrderTotal({
  garmentBasePrice,
  printingServicePrice,
  quantity,
}: {
  garmentBasePrice: number;
  printingServicePrice: number;
  quantity: number;
}) {
  const total = (Number(garmentBasePrice) + Number(printingServicePrice)) * Number(quantity);
  return Math.round(total * 100) / 100;
}
