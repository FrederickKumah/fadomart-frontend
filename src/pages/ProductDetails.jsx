import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProductById } from '../features/products/productsSlice';
import { addToCart } from '../features/cart/cartSlice';
import { StarIcon } from '@heroicons/react/20/solid';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedProduct: product, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    // Check if id is undefined or empty
    if (!id) {
      console.error('Product ID is undefined or empty');
      toast.error('Invalid product ID');
      navigate('/products');
      return;
    }
    
    console.log('Fetching product with ID:', id);
    dispatch(fetchProductById(id));
  }, [dispatch, id, navigate]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to add items to your cart');
      navigate('/login');
      return;
    }

    try {
      // Use the product's _id or id field
      const productId = product._id || product.id || id;
      console.log('Adding to cart:', { productId, quantity });
      const result = await dispatch(addToCart({ productId, quantity })).unwrap();
      console.log('Add to cart result:', result);
      toast.success('Product added to cart successfully');
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.message || 'Failed to add product to cart');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="animate-pulse">
          <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Error loading product</h2>
          <p className="mt-4 text-gray-500">{error}</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-6 inline-block rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Product not found</h2>
          <p className="mt-4 text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/products')}
            className="mt-6 inline-block rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  // Handle the case where category is an object
  const getCategoryName = (category) => {
    if (!category) return 'Uncategorized';
    if (typeof category === 'string') return category;
    if (typeof category === 'object' && category.name) return category.name;
    return 'Uncategorized';
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
      <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
        {/* Image gallery */}
        <div className="flex flex-col">
          <div className="aspect-h-1 aspect-w-1 w-full">
            <img
              src={product.images && product.images[selectedImage] ? product.images[selectedImage] : product.image}
              alt={product.name}
              className="h-full w-full object-cover object-center sm:rounded-lg"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  className={`relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring focus:ring-blue-500 focus:ring-offset-2 ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedImage(index)}
                >
                  <span className="absolute inset-0 overflow-hidden rounded-md">
                    <img src={image} alt="" className="h-full w-full object-cover object-center" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
          <div className="mt-3">
            <h2 className="sr-only">Product information</h2>
            <p className="text-3xl tracking-tight text-gray-900">GHS {product.price}</p>
          </div>

          {/* Reviews */}
          <div className="mt-3">
            <h3 className="sr-only">Reviews</h3>
            <div className="flex items-center">
              <div className="flex items-center">
                {[0, 1, 2, 3, 4].map((rating) => (
                  <StarIcon
                    key={rating}
                    className={`h-5 w-5 flex-shrink-0 ${
                      product.rating > rating ? 'text-yellow-400' : 'text-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="ml-3 text-sm text-gray-500">
                {product.numReviews} {product.numReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="sr-only">Description</h3>
            <div className="space-y-6 text-base text-gray-700">{product.description}</div>
          </div>

          <div className="mt-6">
            <div className="flex items-center">
              <h3 className="text-sm text-gray-900">Category:</h3>
              <p className="ml-2 text-sm text-gray-500">{getCategoryName(product.category)}</p>
            </div>
          </div>

          <div className="mt-10 flex">
            <div className="flex items-center border-gray-200">
              <label htmlFor="quantity" className="sr-only">
                Quantity
              </label>
              <select
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={handleQuantityChange}
                className="rounded-md border-0 py-1.5 text-left text-base font-medium leading-5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="ml-8 flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 