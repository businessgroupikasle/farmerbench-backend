import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useFilterStore } from '../store/filterStore';
import { ProductGrid } from '../components/product/ProductGrid';
import { ProductFilters } from '../components/product/ProductFilters';
import { ProductHero } from '../components/product/ProductHero';
import { CompareDrawer } from '../components/product/CompareDrawer';
import { Pagination } from '../components/common/Pagination';
import { X, Search, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import './ProductsPage.css';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    filters,
    inStockOnly,
    setCategory,
    setSearch,
    setPriceRange,
    setMinRating,
    setSortBy,
    setLimit,
    setPage,
    setInStockOnly,
    resetFilters,
  } = useFilterStore();

  const { data: apiCategories = [] } = useCategories();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState(filters.search || '');
  const categoryPillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCatalogSearch(filters.search || '');
  }, [filters.search]);

  const scrollCategoryPills = (direction: -1 | 1) => {
    categoryPillsRef.current?.scrollBy({
      left: direction * Math.max(180, categoryPillsRef.current.clientWidth * 0.7),
      behavior: 'smooth',
    });
  };

  // Sync URL query parameters with filterStore on initial load and param change
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlSearch = searchParams.get('search');
    const urlFeatured = searchParams.get('featured') === 'true';
    const urlSort = searchParams.get('sort');
    const urlPage = searchParams.get('page');

    if (urlCategory) {
      setCategory(urlCategory);
    }
    if (urlSearch) {
      setSearch(urlSearch);
    }
    if (urlFeatured) {
      useFilterStore.setState((state) => ({
        filters: { ...state.filters, featured: true, page: 1 },
      }));
    }
    if (urlSort && ['newest', 'price_asc', 'price_desc', 'rating', 'popular'].includes(urlSort)) {
      setSortBy(urlSort as any);
    }
    if (urlPage && !isNaN(Number(urlPage))) {
      setPage(Number(urlPage));
    }
  }, [searchParams]);

  // Handle Hero search submit
  const handleHeroSearch = (term: string) => {
    setSearch(term || undefined);
    const nextParams = new URLSearchParams(searchParams);
    if (term) {
      nextParams.set('search', term);
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Category navigation pill click
  const handleCategoryClick = (catSlug: string) => {
    const nextCat = catSlug || undefined;
    setCategory(nextCat);
    const nextParams = new URLSearchParams(searchParams);
    if (nextCat) {
      nextParams.set('category', nextCat);
    } else {
      nextParams.delete('category');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  // Query database-backed products using existing productService & React Query
  const { data: response, isLoading, isError, refetch } = useProducts(filters);
  const rawProducts = response?.data || [];
  const pagination = response?.pagination;

  // Safe client-side in-stock filter when enabled
  const products = inStockOnly
    ? rawProducts.filter((p) => p.stock > 0)
    : rawProducts;

  // Category quick pills
  const categoryPills = [
    { id: '', name: 'All Products', slug: '' },
    ...apiCategories,
  ];

  // Active filters list for chips
  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];

  if (filters.search) {
    activeChips.push({
      id: 'search',
      label: `Search: "${filters.search}"`,
      onRemove: () => handleHeroSearch(''),
    });
  }

  if (filters.category) {
    const activeCategory = apiCategories.find(
      (c) => c.slug === filters.category || c.id === filters.category
    );
    activeChips.push({
      id: 'category',
      label: `Category: ${activeCategory?.name || filters.category}`,
      onRemove: () => handleCategoryClick(''),
    });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceText =
      filters.minPrice !== undefined && filters.maxPrice !== undefined
        ? `₹${filters.minPrice} - ₹${filters.maxPrice}`
        : filters.minPrice !== undefined
        ? `Min ₹${filters.minPrice}`
        : `Max ₹${filters.maxPrice}`;
    activeChips.push({
      id: 'price',
      label: `Price: ${priceText}`,
      onRemove: () => setPriceRange(undefined, undefined),
    });
  }

  if (filters.minRating !== undefined) {
    activeChips.push({
      id: 'rating',
      label: `Rating: ${filters.minRating}★ & Up`,
      onRemove: () => setMinRating(undefined),
    });
  }

  if (inStockOnly) {
    activeChips.push({
      id: 'instock',
      label: 'In Stock Only',
      onRemove: () => setInStockOnly(false),
    });
  }

  if (filters.featured) {
    activeChips.push({
      id: 'featured',
      label: 'Featured Items',
      onRemove: () => useFilterStore.setState((s) => ({ filters: { ...s.filters, featured: undefined } })),
    });
  }

  return (
    <div className="fb-products-page">
      {/* 1. Promotional Hero Banner matching reference design */}
      <ProductHero
        initialSearch={filters.search || ''}
        onSearch={handleHeroSearch}
        storeName="GREENLA AGRI STORE"
      />

      {/* 2. Catalog Navigation Bar & Quick Filters */}
      <section className="fb-catalog-header" id="products-catalog-section" aria-label="Catalog Navigation">
        {/* Category Pills Bar */}
        <div className="fb-catalog-pills-bar">
          <button type="button" className="fb-category-scroll-btn fb-category-scroll-prev" onClick={() => scrollCategoryPills(-1)} aria-label="Previous product categories">
            <ChevronLeft size={17} />
          </button>
          <div className="fb-category-pills-scroll" ref={categoryPillsRef}>
            {categoryPills.map((cat: any) => {
              const catSlug = cat.slug || cat.id || '';
              const isActive = (!filters.category && !catSlug) || filters.category === catSlug;
              return (
                <button
                  key={catSlug || 'all'}
                  type="button"
                  onClick={() => handleCategoryClick(catSlug)}
                  className={`fb-category-pill ${isActive ? 'active' : ''}`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="fb-category-scroll-btn fb-category-scroll-next" onClick={() => scrollCategoryPills(1)} aria-label="Next product categories">
            <ChevronRight size={17} />
          </button>
        </div>

        {/* Catalog Control Bar (Title, Active Chips, Quick Sort, Mobile Toggle) */}
        <div className="fb-catalog-controls-bar">
          <div className="fb-catalog-summary">
            <h2 className="fb-catalog-title">
              {filters.search
                ? `Results for "${filters.search}"`
                : filters.category
                ? `${apiCategories.find((c) => c.slug === filters.category || c.id === filters.category)?.name || filters.category} Catalog`
                : 'All Agricultural Catalogue'}
            </h2>
            <span className="fb-catalog-count-text">
              {pagination
                ? `Showing ${products.length} of ${pagination.total} genuine products`
                : 'Loading products...'}
            </span>
          </div>

          <div className="fb-catalog-toolbar-actions">
            <form
              className="fb-catalog-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                handleHeroSearch(catalogSearch.trim());
              }}
            >
              <Search size={17} aria-hidden="true" />
              <label className="sr-only" htmlFor="catalog-product-search">Search products</label>
              <input
                id="catalog-product-search"
                type="search"
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                placeholder="Search products..."
                autoComplete="off"
              />
              {catalogSearch && (
                <button
                  type="button"
                  className="fb-catalog-search-clear"
                  aria-label="Clear product search"
                  onClick={() => {
                    setCatalogSearch('');
                    handleHeroSearch('');
                  }}
                >
                  <X size={15} />
                </button>
              )}
              <button type="submit" className="fb-catalog-search-submit">
                Search
              </button>
            </form>

            {/* Quick Sort dropdown */}
            <div className="fb-catalog-quick-sort">
              <ArrowUpDown size={15} className="fb-sort-icon" />
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="fb-quick-sort-select"
                aria-label="Sort products by"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Most Popular</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="fb-mobile-filter-btn hide-desktop"
              aria-label="Toggle filter sidebar"
            >
              <SlidersHorizontal size={16} />
              <span>{showMobileFilters ? 'Hide Filters' : 'Filters'}</span>
              {activeChips.length > 0 && (
                <span className="fb-mobile-filter-badge">{activeChips.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Chips Row */}
        {activeChips.length > 0 && (
          <div className="fb-active-chips-row">
            <span className="fb-chips-label">Active filters:</span>
            {activeChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.onRemove}
                className="fb-filter-chip"
                title={`Remove ${chip.label}`}
              >
                <span>{chip.label}</span>
                <X size={13} />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="fb-clear-all-chips-btn"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* 3. Main Catalog Grid (Sticky Sidebar + Product Grid) */}
      <div className="fb-catalog-main-layout">
        {/* Left Sidebar Filters */}
        <aside
          className={`fb-catalog-sidebar ${showMobileFilters ? 'mobile-open' : ''}`}
          aria-label="Product Filters"
        >
          <div className="fb-sidebar-inner">
            <ProductFilters />
          </div>
        </aside>

        {/* Right Product Grid & Pagination */}
        <main className="fb-catalog-grid-section">
          {isError ? (
            <div className="fb-error-container">
              <p>Unable to load products. Please check your internet connection.</p>
              <button onClick={() => refetch()} className="btn btn-primary btn-sm">
                Retry
              </button>
            </div>
          ) : (
            <ProductGrid
              products={products}
              isLoading={isLoading}
              onResetFilters={resetFilters}
            />
          )}

          {/* Server-Side Pagination with Page Size Options */}
          {pagination && pagination.totalPages > 1 && (
            <div className="fb-pagination-wrapper">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                limit={filters.limit || 12}
                onLimitChange={(newLimit) => setLimit(newLimit)}
                totalItems={pagination.total}
                onPageChange={(page) => {
                  setPage(page);
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.set('page', String(page));
                  setSearchParams(nextParams);
                  const catalogEl = document.getElementById('products-catalog-section');
                  if (catalogEl) {
                    catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* 4. Compare Drawer (Floating bottom bar & modal) */}
      <CompareDrawer />
    </div>
  );
};

export default ProductsPage;
