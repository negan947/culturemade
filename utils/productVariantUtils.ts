// Note: This utility file demonstrates variant logic structure
// In actual implementation, SQL queries should be executed via MCP tools
// at the application level (API routes or server components)

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  sku: string;
  barcode?: string;
  quantity: number;
  weight?: number;
  option1: string; // Size
  option2: string; // Color
  option3?: string; // Additional option
  position: number;
  created_at: string;
  updated_at: string;
}

export interface VariantAvailability {
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  is_available: boolean;
  is_low_stock: boolean;
}

export interface VariantMatrix {
  sizes: string[];
  colors: string[];
  availableCombinations: Array<{
    size: string;
    color: string;
    variant_id: string;
    available: boolean;
    quantity: number;
  }>;
}

export interface VariantError {
  type: 'inventory' | 'selection' | 'network' | 'validation';
  message: string;
  retryable: boolean;
  productId: string;
  variantId?: string;
}

/**
 * Fetch all variants for a product from Supabase
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const query = `
      SELECT 
        id,
        product_id,
        name,
        price,
        sku,
        barcode,
        quantity,
        weight,
        option1,
        option2,
        option3,
        position,
        created_at,
        updated_at
      FROM product_variants 
      WHERE product_id = $1 
      ORDER BY position ASC;
    `;

    // Note: MCP functions are only available to Claude, not in application runtime
    // const result = await mcp__supabasecm__execute_sql({ query: query.replace('$1', `'${productId}'`) });
    // Application should use standard Supabase client
    const result: any = null; // Placeholder for actual implementation
    throw new Error('This utility requires application-level database implementation');
  } catch (_error) {

    throw new Error(`Failed to fetch variants for product ${productId}`);
  }
}

/**
 * Check variant availability and inventory status
 */
export async function checkVariantAvailability(variantId: string): Promise<VariantAvailability> {
  try {
    const query = `
      SELECT 
        id as variant_id,
        quantity,
        0 as reserved_quantity,
        quantity as available_quantity
      FROM product_variants
      WHERE id = '${variantId}';
    `;

    // const result = await mcp__supabasecm__execute_sql({ query });
    // const result: any = null; // Placeholder for actual implementation
    throw new Error('This utility requires application-level database implementation');
    
    // Unreachable code after throw - kept for reference
    /*
    if (!result || typeof result !== 'string') {
      throw new Error('Invalid response from database');
    }

    const data = JSON.parse(result.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
    const variant = data[0];

    if (!variant) {
      throw new Error('Variant not found');
    }

    const available_quantity = variant.available_quantity;
    
    return {
      variant_id: variantId,
      quantity: variant.quantity,
      reserved_quantity: variant.reserved_quantity,
      available_quantity,
      is_available: available_quantity > 0,
      is_low_stock: available_quantity <= 5 && available_quantity > 0
    };
    */
  } catch (_error) {

    throw new Error('Variant error: ' + JSON.stringify({
      type: 'inventory',
      message: 'Failed to check variant availability',
      retryable: true,
      productId: 'unknown',
      variantId
    }));
  }
}

/**
 * Build variant selection matrix for size/color combinations
 */
export function buildVariantMatrix(variants: ProductVariant[]): VariantMatrix {
  const sizes = [...new Set(variants.map(v => v.option1))].filter(Boolean);
  const colors = [...new Set(variants.map(v => v.option2))].filter(Boolean);

  const availableCombinations = variants.map(variant => ({
    size: variant.option1,
    color: variant.option2,
    variant_id: variant.id,
    available: variant.quantity > 0,
    quantity: variant.quantity
  }));

  return {
    sizes,
    colors,
    availableCombinations
  };
}

/**
 * Find variant by size and color combination
 */
export function findVariantBySizeColor(
  variants: ProductVariant[], 
  size: string, 
  color: string
): ProductVariant | null {
  return variants.find(v => v.option1 === size && v.option2 === color) || null;
}

/**
 * Get available sizes for a selected color
 */
export function getAvailableSizes(variants: ProductVariant[], selectedColor?: string): string[] {
  let filteredVariants = variants;
  
  if (selectedColor) {
    filteredVariants = variants.filter(v => v.option2 === selectedColor);
  }
  
  return [...new Set(filteredVariants.filter(v => v.quantity > 0).map(v => v.option1))];
}

/**
 * Get available colors for a selected size
 */
export function getAvailableColors(variants: ProductVariant[], selectedSize?: string): string[] {
  let filteredVariants = variants;
  
  if (selectedSize) {
    filteredVariants = variants.filter(v => v.option1 === selectedSize);
  }
  
  return [...new Set(filteredVariants.filter(v => v.quantity > 0).map(v => v.option2))];
}

/**
 * Check if a specific size/color combination is available
 */
export function isCombinationAvailable(
  variants: ProductVariant[],
  size: string,
  color: string
): boolean {
  const variant = findVariantBySizeColor(variants, size, color);
  return variant ? variant.quantity > 0 : false;
}

/**
 * Get variant pricing information
 */
export function getVariantPricing(variants: ProductVariant[]) {
  if (variants.length === 0) {
    return { minPrice: 0, maxPrice: 0, hasVariablePricing: false };
  }

  const prices = variants.map(v => v.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    minPrice,
    maxPrice,
    hasVariablePricing: minPrice !== maxPrice
  };
}

/**
 * Bulk fetch variants for multiple products (performance optimization)
 */
export async function getBulkProductVariants(productIds: string[]): Promise<Map<string, ProductVariant[]>> {
  try {
    if (productIds.length === 0) return new Map();

    const query = `
      SELECT 
        id,
        product_id,
        name,
        price,
        sku,
        barcode,
        quantity,
        weight,
        option1,
        option2,
        option3,
        position,
        created_at,
        updated_at
      FROM product_variants 
      WHERE product_id IN (${productIds.map(id => `'${id}'`).join(',')})
      ORDER BY product_id, position ASC;
    `;

    // const result = await mcp__supabasecm__execute_sql({ query });
    // const result: any = null; // Placeholder for actual implementation
    throw new Error('This utility requires application-level database implementation');
    
    // Unreachable code after throw - kept for reference
    /*
    if (!result || typeof result !== 'string') {
      throw new Error('Invalid response from database');
    }

    const variants = JSON.parse(result.split('<untrusted-data-')[1].split('>')[1].split('</untrusted-data-')[0]);
    
    const variantMap = new Map<string, ProductVariant[]>();
    
    variants.forEach((variant: any) => {
      const productId = variant.product_id;
      if (!variantMap.has(productId)) {
        variantMap.set(productId, []);
      }
      variantMap.get(productId)!.push({
        ...variant,
        price: parseFloat(variant.price)
      });
    });

    return variantMap;
    */
  } catch (_error) {

    throw new Error('Variant error: ' + JSON.stringify({
      type: 'network',
      message: 'Failed to fetch bulk product variants',
      retryable: true,
      productId: 'multiple'
    }));
  }
}

/**
 * Cache for variant data (in-memory for current session)
 */
const variantCache = new Map<string, { data: ProductVariant[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get variants with caching for performance
 */
export async function getCachedProductVariants(productId: string): Promise<ProductVariant[]> {
  const cached = variantCache.get(productId);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  const variants = await getProductVariants(productId);
  variantCache.set(productId, { data: variants, timestamp: now });
  
  return variants;
}

/**
 * Clear variant cache (useful for testing or when data changes)
 */
export function clearVariantCache(productId?: string): void {
  if (productId) {
    variantCache.delete(productId);
  } else {
    variantCache.clear();
  }
}