const fs = require('fs');
const path = require('path');

const frontendSrc = path.resolve(__dirname, '../../farmer_frontend/src');

// 1. Update ProductCard.tsx
const productCardPath = path.join(frontendSrc, 'components/product/ProductCard.tsx');
const productCardContent = `import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '@formerbench/shared';
import { RatingStars } from './RatingStars';
import { Badge } from '../common/Badge';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../hooks/useCart';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const isDiscounted = !product.discountPrice && product.discountPrice < product.price;
  const discountPercent = isDiscounted
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  const handleAddAndGoToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
      navigate('/cart');
    }
  };

  return (
    <div
      className="card card-hover"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Image & Badges Container */}
      <Link
        to={\`/product/\${product.slug || product.id}\`}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          paddingTop: '90%',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-subtle)',
          marginBottom: '0.85rem',
        }}
      >
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'}
          alt={product.title}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        />

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '0.6rem',
            left: '0.6rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            zIndex: 2,
          }}
        >
          {isDiscounted && <Badge variant="danger">-{discountPercent}% OFF</Badge>}
          {product.featured && !isDiscounted && <Badge variant="primary">Featured</Badge>}
          {isLowStock && <Badge variant="warning">Only {product.stock} left</Badge>}
          {isOutOfStock && <Badge variant="neutral">Out of Stock</Badge>}
        </div>
      </Link>

      {/* Category & Title */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {product.category && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--brand-primary)',
              letterSpacing: '0.04em',
              marginBottom: '0.25rem',
            }}
          >
            {product.category.name}
          </span>
        )}

        <Link
          to={\`/product/\${product.slug || product.id}\`}
          style={{
            fontSize: '0.975rem',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--text-primary)',
            marginBottom: '0.4rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.title}
        </Link>

        {/* Rating */}
        <div style={{ marginBottom: '0.75rem' }}>
          <RatingStars rating={product.rating} numReviews={product.numReviews} />
        </div>

        {/* Price & Action */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <div>
            {isDiscounted ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{product.discountPrice?.toFixed(2)}
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'line-through',
                  }}
                >
                  ₹{product.price.toFixed(2)}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{product.price.toFixed(2)}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-icon"
            disabled={isOutOfStock}
            onClick={handleAddAndGoToCart}
            style={{
              borderRadius: 'var(--radius-full)',
              width: '38px',
              height: '38px',
              padding: 0,
            }}
            title={isOutOfStock ? 'Out of stock' : 'Add to cart and view basket'}
            aria-label="Add to cart"
          >
            <ShoppingBag size={17} style={{ color: 'var(--brand-primary)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
`;
fs.writeFileSync(productCardPath, productCardContent, 'utf8');
console.log('✅ Updated ProductCard.tsx to navigate directly to /cart');

// 2. Update ProductDetailPage.tsx
const productDetailPath = path.join(frontendSrc, 'pages/ProductDetailPage.tsx');
let detailContent = fs.readFileSync(productDetailPath, 'utf8');

detailContent = detailContent.replace(
  `  const handleAddToCart = () => {
    addToCart(product, quantity);
  };`,
  `  const handleAddToCart = () => {
    addToCart(product, quantity);
    navigate('/cart');
  };`
);

fs.writeFileSync(productDetailPath, detailContent, 'utf8');
console.log('✅ Updated ProductDetailPage.tsx to navigate directly to /cart');

// 3. Update useCart.ts
const useCartPath = path.join(frontendSrc, 'hooks/useCart.ts');
let useCartContent = fs.readFileSync(useCartPath, 'utf8');

// Replace openDrawer in addToCartMutation onSuccess
useCartContent = useCartContent.replace(
  `    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      openDrawer();
      addToast({ type: 'success', message: 'Added to cart' });
    },`,
  `    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      addToast({ type: 'success', message: 'Added to cart' });
    },`
);

fs.writeFileSync(useCartPath, useCartContent, 'utf8');
console.log('✅ Updated useCart.ts');

// 4. Update cartStore.ts
const cartStorePath = path.join(frontendSrc, 'store/cartStore.ts');
let cartStoreContent = fs.readFileSync(cartStorePath, 'utf8');

cartStoreContent = cartStoreContent.replace(
  `    saveGuestCart(updated);
    set({ guestItems: updated, isDrawerOpen: true });`,
  `    saveGuestCart(updated);
    set({ guestItems: updated });`
);

fs.writeFileSync(cartStorePath, cartStoreContent, 'utf8');
console.log('✅ Updated cartStore.ts');
