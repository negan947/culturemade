/**
 * Update Product Images Script
 * Updates the seeded products with Supabase storage image URLs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Database } from '../types/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error(
    'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Product image mappings - update these with your actual uploaded image paths
const productImageMap: Record<string, string> = {
  // Shirts
  'classic-white-tshirt': 'shirts/classic-white-tshirt.jpg',
  'vintage-denim-jacket': 'shirts/vintage-denim-jacket.jpg',
  'cotton-hoodie': 'shirts/cotton-hoodie.jpg',
  'polo-shirt': 'shirts/polo-shirt.jpg',
  'long-sleeve-henley': 'shirts/long-sleeve-henley.jpg',

  // Pants
  'slim-fit-jeans': 'pants/slim-fit-jeans.jpg',
  'chino-pants': 'pants/chino-pants.jpg',
  'jogger-pants': 'pants/jogger-pants.jpg',
  'dress-pants': 'pants/dress-pants.jpg',
  'cargo-shorts': 'pants/cargo-shorts.jpg',

  // Shoes
  'white-sneakers': 'shoes/white-sneakers.jpg',
  'canvas-shoes': 'shoes/canvas-shoes.jpg',
  'running-shoes': 'shoes/running-shoes.jpg',
  'leather-boots': 'shoes/leather-boots.jpg',
  sandals: 'shoes/sandals.jpg',

  // Accessories
  'baseball-cap': 'accessories/baseball-cap.jpg',
  'leather-belt': 'accessories/leather-belt.jpg',
  'cotton-socks-pack': 'accessories/cotton-socks-pack.jpg',
  'wrist-watch': 'accessories/wrist-watch.jpg',
  sunglasses: 'accessories/sunglasses.jpg',
};

async function updateProductImages() {
  try {
    console.log('🖼️  Starting product image updates...');

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, slug, name');

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    if (!products || products.length === 0) {
      throw new Error('No products found in database');
    }

    console.log(`📦 Found ${products.length} products to update`);

    let updatedCount = 0;
    let errorCount = 0;

    // Update each product with image URLs
    for (const product of products) {
      try {
        const imagePath = productImageMap[product.slug];

        if (!imagePath) {
          console.warn(
            `⚠️  No image mapping found for product: ${product.slug}`
          );
          errorCount++;
          continue;
        }

        // Generate image URLs
        const baseImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`;
        const thumbnailUrl = `${supabaseUrl}/storage/v1/render/image/public/product-images/${imagePath}?width=200&height=200&quality=80&format=webp&resize=cover`;
        const mediumUrl = `${supabaseUrl}/storage/v1/render/image/public/product-images/${imagePath}?width=400&height=400&quality=85&format=webp&resize=cover`;
        const largeUrl = `${supabaseUrl}/storage/v1/render/image/public/product-images/${imagePath}?width=800&height=800&quality=90&format=webp&resize=cover`;

        // Insert or update product image record
        const { error: imageError } = await supabase
          .from('product_images')
          .upsert(
            {
              product_id: product.id,
              url: baseImageUrl,
              alt_text: `${product.name} product image`,
              position: 1,
              thumbnail_url: thumbnailUrl,
              medium_url: mediumUrl,
              large_url: largeUrl,
            },
            {
              onConflict: 'product_id,position',
              ignoreDuplicates: false,
            }
          );

        if (imageError) {
          console.error(
            `❌ Failed to update image for ${product.name}: ${imageError.message}`
          );
          errorCount++;
          continue;
        }

        console.log(`✅ Updated image for: ${product.name}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Error processing ${product.name}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} products`);
    console.log(`❌ Errors: ${errorCount} products`);

    if (updatedCount > 0) {
      console.log('\n🎉 Product images updated successfully!');
      console.log('\n🔗 Test image URLs:');
      console.log(
        `Original: ${supabaseUrl}/storage/v1/object/public/product-images/shirts/classic-white-tshirt.jpg`
      );
      console.log(
        `Thumbnail: ${supabaseUrl}/storage/v1/render/image/public/product-images/shirts/classic-white-tshirt.jpg?width=200&height=200&quality=80&format=webp&resize=cover`
      );
    }
  } catch (error) {
    console.error('❌ Failed to update product images:', error);
    process.exit(1);
  }
}

// Run the update
updateProductImages();
