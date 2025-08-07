/**
 * Clean Placeholder Images Script
 * Removes placeholder and non-existent image URLs from the database
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import { Database } from '../types/database';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

function isPlaceholderUrl(url: string): boolean {
  const placeholderPatterns = [
    'placeholder',
    'picsum.photos',
    'via.placeholder',
    'placehold',
    'dummyimage',
    'lorempixel',
    'fakeimg'
  ];
  
  return placeholderPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

async function cleanPlaceholderImages() {
  try {
    console.log('🧹 Starting placeholder image cleanup...');

    // Get all product images
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*');

    if (imagesError) {
      throw new Error(`Failed to fetch images: ${imagesError.message}`);
    }

    if (!images || images.length === 0) {
      console.log('ℹ️  No images found in database');
      return;
    }

    console.log(`📦 Found ${images.length} images to check`);

    let deletedCount = 0;
    let keptCount = 0;

    // Check each image
    for (const image of images) {
      if (isPlaceholderUrl(image.url)) {
        console.log(`🗑️  Deleting placeholder image: ${image.url.substring(0, 50)}...`);
        
        const { error: deleteError } = await supabase
          .from('product_images')
          .delete()
          .eq('id', image.id);

        if (deleteError) {
          console.error(`❌ Failed to delete image ${image.id}: ${deleteError.message}`);
        } else {
          deletedCount++;
        }
      } else {
        keptCount++;
      }
    }

    console.log(`✅ Cleanup completed:`);
    console.log(`   - Deleted: ${deletedCount} placeholder images`);
    console.log(`   - Kept: ${keptCount} real images`);

  } catch (error) {
    console.error('Error cleaning placeholder images:', error);
    throw error;
  }
}

// Run the cleanup
cleanPlaceholderImages()
  .then(() => {
    console.log('✨ Placeholder image cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });