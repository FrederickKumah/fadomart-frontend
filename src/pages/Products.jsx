import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, setFilters, clearFilters } from '../features/products/productsSlice';
import ProductCard from '../components/ProductCard';

const sortOptions = [
  { name: 'Newest', value: 'newest' },
  { name: 'Price: Low to High', value: 'price_asc' },
  { name: 'Price: High to Low', value: 'price_desc' },
  { name: 'Most Popular', value: 'popular' },
];

const categories = [
  'All',
  'Electronics',
  'Clothing',
  'Books',
  'Home & Kitchen',
  'Sports',
  'Beauty',
  'Toys',
];

export default function Products() {
  const dispatch = useDispatch();
  const { products = [], loading, filters, totalProducts } = useSelector((state) => state.products);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const handleSortChange = (value) => {
    dispatch(setFilters({ ...filters, sortBy: value }));
  };

  const handleCategoryChange = (category) => {
    dispatch(setFilters({ ...filters, category: category === 'All' ? '' : category }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ ...filters, search: searchQuery }));
  };

  // Use all products without filtering
  const validProducts = products;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">All Products</h1>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 sm:max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              />
            </form>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="block rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <div className="w-full sm:w-64">
            <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
            <div className="mt-4 space-y-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`block w-full text-left px-3 py-2 text-sm rounded-md ${
                    (category === 'All' && !filters.category) || filters.category === category
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {filters.category && (
              <button
                onClick={() => dispatch(clearFilters())}
                className="mt-4 text-sm text-blue-600 hover:text-blue-500"
              >
                Clear filters
              </button>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-500">
              Showing {validProducts.length} of {totalProducts} products
            </p>
            {loading ? (
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : validProducts.length === 0 ? (
              <div className="mt-6 text-center">
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {validProducts.map((product) => {
                  console.log('Product ID:', product._id || product.id);
                  return (
                    <ProductCard 
                      key={product._id || product.id || Math.random()} 
                      product={product} 
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 