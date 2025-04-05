import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../features/products/productsSlice';
import ProductCard from '../components/ProductCard';
import toast from 'react-hot-toast';

export default function Home() {
  const dispatch = useDispatch();
  const { products = [], loading, error } = useSelector((state) => state.products);

  useEffect(() => {
    console.log('Fetching products...'); // Debug log
    dispatch(fetchProducts({ limit: 8 }))
      .unwrap()
      .then((result) => {
        console.log('Products fetched successfully:', result); // Debug log
      })
      .catch((error) => {
        console.error('Error fetching products:', error); // Debug log
      });
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error('Products error:', error); // Debug log
      toast.error(error);
    }
  }, [error]);

  // Use all products without filtering
  const validProducts = products;

  return (
    <div className="bg-white">
      <div className="relative">
        <div className="mx-auto max-w-7xl">
          <div className="relative z-10 pt-14 lg:w-full lg:max-w-2xl">
            <div className="relative px-6 py-32 sm:py-40 lg:px-8 lg:py-56 lg:pr-0">
              <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Welcome to FadoMart
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Discover amazing products at great prices. Shop the latest trends and find everything you need, all in one place.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <a
                    href="/products"
                    className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Shop Now
                  </a>
                  <a href="/categories" className="text-sm font-semibold leading-6 text-gray-900">
                    Browse Categories <span aria-hidden="true">→</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Featured Products</h2>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-6 text-center">
            <p className="text-red-600">Failed to load products. Please try again later.</p>
          </div>
        ) : validProducts.length === 0 ? (
          <div className="mt-6 text-center">
            <p className="text-gray-500">No products available at the moment.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {validProducts.map((product) => (
              <ProductCard key={product._id || product.id || Math.random()} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 