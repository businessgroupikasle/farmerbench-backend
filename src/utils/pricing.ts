export const getEffectivePrice = (
  originalPrice: number | null | undefined,
  discountedPrice?: number | null
) => {
  const original = Number(originalPrice) || 0;
  const discounted = Number(discountedPrice) || 0;

  if (original > 0 && discounted > 0) {
    return Math.min(original, discounted);
  }

  return discounted || original;
};
