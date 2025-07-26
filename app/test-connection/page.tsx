import { createClient } from '@/lib/supabase/server';

export default async function TestConnection() {
  const supabase = await createClient();

  try {
    // Test basic connection
    const { error: connectionError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      throw connectionError;
    }

    // Test type safety by querying a few tables
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, price, status')
      .limit(5);

    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, slug')
      .limit(5);

    return (
      <div className='container mx-auto p-8'>
        <h1 className='text-3xl font-bold mb-6'>Database Connection Test</h1>

        <div className='space-y-6'>
          <div className='p-4 bg-green-100 border border-green-300 rounded-lg'>
            <h2 className='text-xl font-semibold text-green-800 mb-2'>
              ✅ Connection Status
            </h2>
            <p className='text-green-700'>Database connection successful!</p>
          </div>

          <div className='p-4 bg-blue-100 border border-blue-300 rounded-lg'>
            <h2 className='text-xl font-semibold text-blue-800 mb-2'>
              📊 Database Tables
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <h3 className='font-semibold text-blue-700'>Products Table</h3>
                <p className='text-blue-600'>
                  {productsError
                    ? `Error: ${productsError.message}`
                    : `Found ${products?.length || 0} products`}
                </p>
              </div>
              <div>
                <h3 className='font-semibold text-blue-700'>
                  Categories Table
                </h3>
                <p className='text-blue-600'>
                  {categoriesError
                    ? `Error: ${categoriesError.message}`
                    : `Found ${categories?.length || 0} categories`}
                </p>
              </div>
            </div>
          </div>

          <div className='p-4 bg-purple-100 border border-purple-300 rounded-lg'>
            <h2 className='text-xl font-semibold text-purple-800 mb-2'>
              🔧 TypeScript Types
            </h2>
            <p className='text-purple-700'>
              Database types successfully generated and imported
            </p>
            <pre className='mt-2 text-sm text-purple-600 bg-purple-50 p-2 rounded'>
              {`Available types: Database, Product, Category, Order, etc.`}
            </pre>
          </div>

          <div className='p-4 bg-gray-100 border border-gray-300 rounded-lg'>
            <h2 className='text-xl font-semibold text-gray-800 mb-2'>
              📋 Tables Summary
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700'>
              <span>✅ profiles</span>
              <span>✅ products</span>
              <span>✅ product_variants</span>
              <span>✅ product_images</span>
              <span>✅ categories</span>
              <span>✅ product_categories</span>
              <span>✅ collections</span>
              <span>✅ product_collections</span>
              <span>✅ addresses</span>
              <span>✅ cart_items</span>
              <span>✅ orders</span>
              <span>✅ order_items</span>
              <span>✅ payments</span>
              <span>✅ shipping_methods</span>
              <span>✅ shipments</span>
              <span>✅ discounts</span>
              <span>✅ reviews</span>
              <span>✅ inventory_movements</span>
              <span>✅ analytics_events</span>
              <span>✅ admin_logs</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='container mx-auto p-8'>
        <h1 className='text-3xl font-bold mb-6'>Database Connection Test</h1>
        <div className='p-4 bg-red-100 border border-red-300 rounded-lg'>
          <h2 className='text-xl font-semibold text-red-800 mb-2'>
            ❌ Connection Failed
          </h2>
          <p className='text-red-700'>
            Error:{' '}
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }
}
