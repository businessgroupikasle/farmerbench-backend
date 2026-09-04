UPDATE "Product" product
SET
  "numReviews" = aggregate.total,
  "rating" = aggregate.average
FROM (
  SELECT product_row.id, COUNT(review.id)::INTEGER AS total,
    COALESCE(ROUND(AVG(review.rating)::numeric, 1), 0)::DOUBLE PRECISION AS average
  FROM "Product" product_row
  LEFT JOIN "Review" review ON review."productId" = product_row.id
  GROUP BY product_row.id
) aggregate
WHERE product.id = aggregate.id;
