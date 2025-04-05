/**
 * Utility functions to help debug cart issues
 */

/**
 * Logs detailed information about a cart item
 * @param {Object} item - The cart item to log
 * @param {string} prefix - Optional prefix for log messages
 */
export const logCartItem = (item, prefix = '') => {
  if (!item) {
    console.error(`${prefix} Item is null or undefined`);
    return;
  }
  
  console.log(`${prefix} Item structure:`, item);
  console.log(`${prefix} Item ID:`, item._id);
  console.log(`${prefix} Item product ID:`, item.product?._id);
  console.log(`${prefix} Item product name:`, item.product?.productName);
  console.log(`${prefix} Item quantity:`, item.quantity);
  console.log(`${prefix} Item price:`, item.product?.price);
};

/**
 * Finds an item in the cart by ID
 * @param {Array} items - The cart items array
 * @param {string} itemId - The ID to search for
 * @returns {Object|null} - The found item or null
 */
export const findCartItemById = (items, itemId) => {
  if (!items || !Array.isArray(items) || !itemId) {
    console.error('Invalid parameters for findCartItemById:', { items, itemId });
    return null;
  }
  
  // Convert itemId to string for consistent comparison
  const itemIdString = String(itemId);
  
  // Try to find the item by different possible ID properties
  const foundItem = items.find(item => 
    String(item._id) === itemIdString || 
    String(item.id) === itemIdString || 
    String(item.product?._id) === itemIdString
  );
  
  if (foundItem) {
    console.log('Found item by ID:', itemIdString, foundItem);
  } else {
    console.error('Item not found with ID:', itemIdString);
    console.log('Available items:', items);
  }
  
  return foundItem;
};

/**
 * Validates an item ID for cart operations
 * @param {string} itemId - The ID to validate
 * @returns {boolean} - Whether the ID is valid
 */
export const isValidItemId = (itemId) => {
  if (!itemId) {
    console.error('Invalid item ID: null or undefined');
    return false;
  }
  
  // Convert to string and check if it's not empty
  const itemIdString = String(itemId);
  const isValid = itemIdString.trim() !== '';
  
  if (!isValid) {
    console.error('Invalid item ID: empty string');
  }
  
  return isValid;
}; 