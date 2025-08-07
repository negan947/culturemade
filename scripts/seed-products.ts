import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// import { generatePlaceholderImage } from '../lib/utils/image-utils'; // Removed - no placeholders
import type {
  CategoryInsert,
  Database,
  ProductImageInsert,
  ProductInsert,
  ProductVariantInsert,
} from '../types/database';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {

  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface SeedCategory {
  name: string;
  slug: string;
  description: string;
  position: number;
  subcategories?: Omit<SeedCategory, 'subcategories'>[];
}

interface SeedProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  cost: number;
  sku: string;
  categorySlug: string;
  featured: boolean;
  images: {
    url: string;
    alt_text: string;
    position: number;
  }[];
  variants: {
    name: string;
    sku: string;
    option1?: string; // Size
    option2?: string; // Color
    option3?: string; // Material/Style
    price?: number;
    quantity: number;
    position: number;
  }[];
}

// Define main categories and subcategories
const categories: SeedCategory[] = [
  {
    name: "Men's Clothing",
    slug: 'mens-clothing',
    description: 'Stylish and comfortable clothing for men',
    position: 1,
    subcategories: [
      {
        name: 'Shirts',
        slug: 'mens-shirts',
        description: "Men's shirts and tops",
        position: 1,
      },
      {
        name: 'Pants',
        slug: 'mens-pants',
        description: "Men's pants and bottoms",
        position: 2,
      },
      {
        name: 'Shoes',
        slug: 'mens-shoes',
        description: "Men's footwear",
        position: 3,
      },
    ],
  },
  {
    name: "Women's Clothing",
    slug: 'womens-clothing',
    description: 'Fashion-forward clothing for women',
    position: 2,
    subcategories: [
      {
        name: 'Shirts',
        slug: 'womens-shirts',
        description: "Women's shirts and tops",
        position: 1,
      },
      {
        name: 'Pants',
        slug: 'womens-pants',
        description: "Women's pants and bottoms",
        position: 2,
      },
      {
        name: 'Shoes',
        slug: 'womens-shoes',
        description: "Women's footwear",
        position: 3,
      },
    ],
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    description: 'Complete your look with our accessories',
    position: 3,
  },
  {
    name: 'Sale',
    slug: 'sale',
    description: 'Discounted items and special offers',
    position: 4,
  },
];

// Define products with variants
const products: SeedProduct[] = [
  // SHIRT PRODUCTS
  {
    name: 'Classic White T-Shirt',
    slug: 'classic-white-t-shirt',
    description:
      'A timeless essential made from premium 100% cotton. Perfect for everyday wear or layering. Features a comfortable fit and durable construction.',
    price: 24.99,
    cost: 12.5,
    sku: 'TSHIRT-CLASSIC',
    categorySlug: 'mens-shirts',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'White / Small',
        sku: 'TSHIRT-WHITE-S',
        option1: 'S',
        option2: 'White',
        quantity: 25,
        position: 1,
      },
      {
        name: 'White / Medium',
        sku: 'TSHIRT-WHITE-M',
        option1: 'M',
        option2: 'White',
        quantity: 40,
        position: 2,
      },
      {
        name: 'White / Large',
        sku: 'TSHIRT-WHITE-L',
        option1: 'L',
        option2: 'White',
        quantity: 35,
        position: 3,
      },
      {
        name: 'White / XL',
        sku: 'TSHIRT-WHITE-XL',
        option1: 'XL',
        option2: 'White',
        quantity: 30,
        position: 4,
      },
      {
        name: 'Black / Small',
        sku: 'TSHIRT-BLACK-S',
        option1: 'S',
        option2: 'Black',
        quantity: 20,
        position: 5,
      },
      {
        name: 'Black / Medium',
        sku: 'TSHIRT-BLACK-M',
        option1: 'M',
        option2: 'Black',
        quantity: 35,
        position: 6,
      },
      {
        name: 'Black / Large',
        sku: 'TSHIRT-BLACK-L',
        option1: 'L',
        option2: 'Black',
        quantity: 30,
        position: 7,
      },
      {
        name: 'Gray / Medium',
        sku: 'TSHIRT-GRAY-M',
        option1: 'M',
        option2: 'Gray',
        quantity: 25,
        position: 8,
      },
      {
        name: 'Gray / Large',
        sku: 'TSHIRT-GRAY-L',
        option1: 'L',
        option2: 'Gray',
        quantity: 30,
        position: 9,
      },
    ],
  },
  {
    name: 'Vintage Denim Jacket',
    slug: 'vintage-denim-jacket',
    description:
      'Classic denim jacket with vintage wash and premium construction. Features button closure, chest pockets, and timeless styling.',
    price: 89.99,
    compare_at_price: 119.99,
    cost: 45.0,
    sku: 'JACKET-DENIM',
    categorySlug: 'mens-shirts',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Light Blue / Small',
        sku: 'JACKET-LIGHTBLUE-S',
        option1: 'S',
        option2: 'Light Blue',
        quantity: 15,
        position: 1,
      },
      {
        name: 'Light Blue / Medium',
        sku: 'JACKET-LIGHTBLUE-M',
        option1: 'M',
        option2: 'Light Blue',
        quantity: 20,
        position: 2,
      },
      {
        name: 'Light Blue / Large',
        sku: 'JACKET-LIGHTBLUE-L',
        option1: 'L',
        option2: 'Light Blue',
        quantity: 18,
        position: 3,
      },
      {
        name: 'Dark Blue / Small',
        sku: 'JACKET-DARKBLUE-S',
        option1: 'S',
        option2: 'Dark Blue',
        quantity: 12,
        position: 4,
      },
      {
        name: 'Dark Blue / Medium',
        sku: 'JACKET-DARKBLUE-M',
        option1: 'M',
        option2: 'Dark Blue',
        quantity: 25,
        position: 5,
      },
      {
        name: 'Dark Blue / Large',
        sku: 'JACKET-DARKBLUE-L',
        option1: 'L',
        option2: 'Dark Blue',
        quantity: 20,
        position: 6,
      },
    ],
  },
  {
    name: 'Cotton Hoodie',
    slug: 'cotton-hoodie',
    description:
      'Comfortable cotton blend hoodie with drawstring hood and kangaroo pocket. Perfect for casual wear and layering.',
    price: 54.99,
    cost: 27.5,
    sku: 'HOODIE-COTTON',
    categorySlug: 'mens-shirts',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Black / Small',
        sku: 'HOODIE-BLACK-S',
        option1: 'S',
        option2: 'Black',
        quantity: 30,
        position: 1,
      },
      {
        name: 'Black / Medium',
        sku: 'HOODIE-BLACK-M',
        option1: 'M',
        option2: 'Black',
        quantity: 45,
        position: 2,
      },
      {
        name: 'Black / Large',
        sku: 'HOODIE-BLACK-L',
        option1: 'L',
        option2: 'Black',
        quantity: 40,
        position: 3,
      },
      {
        name: 'Gray / Medium',
        sku: 'HOODIE-GRAY-M',
        option1: 'M',
        option2: 'Gray',
        quantity: 35,
        position: 4,
      },
      {
        name: 'Gray / Large',
        sku: 'HOODIE-GRAY-L',
        option1: 'L',
        option2: 'Gray',
        quantity: 30,
        position: 5,
      },
      {
        name: 'Navy / Medium',
        sku: 'HOODIE-NAVY-M',
        option1: 'M',
        option2: 'Navy',
        quantity: 25,
        position: 6,
      },
      {
        name: 'Red / Large',
        sku: 'HOODIE-RED-L',
        option1: 'L',
        option2: 'Red',
        quantity: 20,
        position: 7,
      },
    ],
  },
  {
    name: 'Polo Shirt',
    slug: 'polo-shirt',
    description:
      'Business casual polo shirt made from breathable cotton pique fabric. Features three-button placket and classic collar.',
    price: 39.99,
    cost: 20.0,
    sku: 'POLO-CLASSIC',
    categorySlug: 'mens-shirts',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'White / Small',
        sku: 'POLO-WHITE-S',
        option1: 'S',
        option2: 'White',
        quantity: 20,
        position: 1,
      },
      {
        name: 'White / Medium',
        sku: 'POLO-WHITE-M',
        option1: 'M',
        option2: 'White',
        quantity: 30,
        position: 2,
      },
      {
        name: 'Navy / Medium',
        sku: 'POLO-NAVY-M',
        option1: 'M',
        option2: 'Navy',
        quantity: 25,
        position: 3,
      },
      {
        name: 'Navy / Large',
        sku: 'POLO-NAVY-L',
        option1: 'L',
        option2: 'Navy',
        quantity: 28,
        position: 4,
      },
      {
        name: 'Green / Large',
        sku: 'POLO-GREEN-L',
        option1: 'L',
        option2: 'Green',
        quantity: 15,
        position: 5,
      },
      {
        name: 'Red / Medium',
        sku: 'POLO-RED-M',
        option1: 'M',
        option2: 'Red',
        quantity: 18,
        position: 6,
      },
    ],
  },
  {
    name: 'Long Sleeve Henley',
    slug: 'long-sleeve-henley',
    description:
      'Casual long sleeve henley shirt with button placket. Made from soft cotton blend for comfort and style.',
    price: 34.99,
    cost: 17.5,
    sku: 'HENLEY-LS',
    categorySlug: 'mens-shirts',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Gray / Small',
        sku: 'HENLEY-GRAY-S',
        option1: 'S',
        option2: 'Gray',
        quantity: 22,
        position: 1,
      },
      {
        name: 'Gray / Medium',
        sku: 'HENLEY-GRAY-M',
        option1: 'M',
        option2: 'Gray',
        quantity: 35,
        position: 2,
      },
      {
        name: 'Black / Medium',
        sku: 'HENLEY-BLACK-M',
        option1: 'M',
        option2: 'Black',
        quantity: 30,
        position: 3,
      },
      {
        name: 'Black / Large',
        sku: 'HENLEY-BLACK-L',
        option1: 'L',
        option2: 'Black',
        quantity: 25,
        position: 4,
      },
      {
        name: 'Navy / Large',
        sku: 'HENLEY-NAVY-L',
        option1: 'L',
        option2: 'Navy',
        quantity: 20,
        position: 5,
      },
    ],
  },

  // PANTS PRODUCTS
  {
    name: 'Slim Fit Jeans',
    slug: 'slim-fit-jeans',
    description:
      'Modern slim fit jeans with stretch denim for comfort and style. Features five-pocket styling and classic rivets.',
    price: 69.99,
    cost: 35.0,
    sku: 'JEANS-SLIM',
    categorySlug: 'mens-pants',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Blue / 30',
        sku: 'JEANS-BLUE-30',
        option1: '30',
        option2: 'Blue',
        quantity: 15,
        position: 1,
      },
      {
        name: 'Blue / 32',
        sku: 'JEANS-BLUE-32',
        option1: '32',
        option2: 'Blue',
        quantity: 25,
        position: 2,
      },
      {
        name: 'Blue / 34',
        sku: 'JEANS-BLUE-34',
        option1: '34',
        option2: 'Blue',
        quantity: 30,
        position: 3,
      },
      {
        name: 'Blue / 36',
        sku: 'JEANS-BLUE-36',
        option1: '36',
        option2: 'Blue',
        quantity: 20,
        position: 4,
      },
      {
        name: 'Black / 32',
        sku: 'JEANS-BLACK-32',
        option1: '32',
        option2: 'Black',
        quantity: 20,
        position: 5,
      },
      {
        name: 'Black / 34',
        sku: 'JEANS-BLACK-34',
        option1: '34',
        option2: 'Black',
        quantity: 25,
        position: 6,
      },
      {
        name: 'Dark Blue / 32',
        sku: 'JEANS-DARKBLUE-32',
        option1: '32',
        option2: 'Dark Blue',
        quantity: 18,
        position: 7,
      },
    ],
  },
  {
    name: 'Chino Pants',
    slug: 'chino-pants',
    description:
      'Versatile chino pants perfect for both casual and business casual wear. Made from comfortable cotton twill.',
    price: 49.99,
    cost: 25.0,
    sku: 'CHINO-CLASSIC',
    categorySlug: 'mens-pants',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Khaki / 30',
        sku: 'CHINO-KHAKI-30',
        option1: '30',
        option2: 'Khaki',
        quantity: 20,
        position: 1,
      },
      {
        name: 'Khaki / 32',
        sku: 'CHINO-KHAKI-32',
        option1: '32',
        option2: 'Khaki',
        quantity: 35,
        position: 2,
      },
      {
        name: 'Khaki / 34',
        sku: 'CHINO-KHAKI-34',
        option1: '34',
        option2: 'Khaki',
        quantity: 30,
        position: 3,
      },
      {
        name: 'Navy / 32',
        sku: 'CHINO-NAVY-32',
        option1: '32',
        option2: 'Navy',
        quantity: 25,
        position: 4,
      },
      {
        name: 'Navy / 34',
        sku: 'CHINO-NAVY-34',
        option1: '34',
        option2: 'Navy',
        quantity: 28,
        position: 5,
      },
      {
        name: 'Black / 32',
        sku: 'CHINO-BLACK-32',
        option1: '32',
        option2: 'Black',
        quantity: 22,
        position: 6,
      },
      {
        name: 'Olive / 34',
        sku: 'CHINO-OLIVE-34',
        option1: '34',
        option2: 'Olive',
        quantity: 15,
        position: 7,
      },
    ],
  },
  {
    name: 'Jogger Pants',
    slug: 'jogger-pants',
    description:
      'Athletic-inspired jogger pants with elastic waistband and cuffs. Perfect for lounging or casual outings.',
    price: 44.99,
    cost: 22.5,
    sku: 'JOGGER-ATHLETIC',
    categorySlug: 'mens-pants',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Gray / Small',
        sku: 'JOGGER-GRAY-S',
        option1: 'S',
        option2: 'Gray',
        quantity: 25,
        position: 1,
      },
      {
        name: 'Gray / Medium',
        sku: 'JOGGER-GRAY-M',
        option1: 'M',
        option2: 'Gray',
        quantity: 40,
        position: 2,
      },
      {
        name: 'Gray / Large',
        sku: 'JOGGER-GRAY-L',
        option1: 'L',
        option2: 'Gray',
        quantity: 35,
        position: 3,
      },
      {
        name: 'Black / Medium',
        sku: 'JOGGER-BLACK-M',
        option1: 'M',
        option2: 'Black',
        quantity: 30,
        position: 4,
      },
      {
        name: 'Black / Large',
        sku: 'JOGGER-BLACK-L',
        option1: 'L',
        option2: 'Black',
        quantity: 25,
        position: 5,
      },
      {
        name: 'Navy / Large',
        sku: 'JOGGER-NAVY-L',
        option1: 'L',
        option2: 'Navy',
        quantity: 20,
        position: 6,
      },
    ],
  },
  {
    name: 'Dress Pants',
    slug: 'dress-pants',
    description:
      'Formal dress pants with flat front and classic fit. Perfect for business and formal occasions.',
    price: 79.99,
    cost: 40.0,
    sku: 'DRESS-FORMAL',
    categorySlug: 'mens-pants',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Black / 30',
        sku: 'DRESS-BLACK-30',
        option1: '30',
        option2: 'Black',
        quantity: 12,
        position: 1,
      },
      {
        name: 'Black / 32',
        sku: 'DRESS-BLACK-32',
        option1: '32',
        option2: 'Black',
        quantity: 20,
        position: 2,
      },
      {
        name: 'Black / 34',
        sku: 'DRESS-BLACK-34',
        option1: '34',
        option2: 'Black',
        quantity: 25,
        position: 3,
      },
      {
        name: 'Navy / 32',
        sku: 'DRESS-NAVY-32',
        option1: '32',
        option2: 'Navy',
        quantity: 18,
        position: 4,
      },
      {
        name: 'Navy / 34',
        sku: 'DRESS-NAVY-34',
        option1: '34',
        option2: 'Navy',
        quantity: 22,
        position: 5,
      },
      {
        name: 'Charcoal / 34',
        sku: 'DRESS-CHARCOAL-34',
        option1: '34',
        option2: 'Charcoal',
        quantity: 15,
        position: 6,
      },
    ],
  },
  {
    name: 'Cargo Shorts',
    slug: 'cargo-shorts',
    description:
      'Practical cargo shorts with multiple pockets. Perfect for summer and outdoor activities.',
    price: 39.99,
    cost: 20.0,
    sku: 'SHORTS-CARGO',
    categorySlug: 'mens-pants',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Khaki / 30',
        sku: 'SHORTS-KHAKI-30',
        option1: '30',
        option2: 'Khaki',
        quantity: 20,
        position: 1,
      },
      {
        name: 'Khaki / 32',
        sku: 'SHORTS-KHAKI-32',
        option1: '32',
        option2: 'Khaki',
        quantity: 30,
        position: 2,
      },
      {
        name: 'Khaki / 34',
        sku: 'SHORTS-KHAKI-34',
        option1: '34',
        option2: 'Khaki',
        quantity: 25,
        position: 3,
      },
      {
        name: 'Black / 32',
        sku: 'SHORTS-BLACK-32',
        option1: '32',
        option2: 'Black',
        quantity: 18,
        position: 4,
      },
      {
        name: 'Olive / 32',
        sku: 'SHORTS-OLIVE-32',
        option1: '32',
        option2: 'Olive',
        quantity: 15,
        position: 5,
      },
    ],
  },

  // SHOE PRODUCTS
  {
    name: 'White Sneakers',
    slug: 'white-sneakers',
    description:
      'Classic white sneakers with leather upper and rubber sole. Versatile and comfortable for everyday wear.',
    price: 79.99,
    cost: 40.0,
    sku: 'SNEAKER-WHITE',
    categorySlug: 'mens-shoes',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'White / 8',
        sku: 'SNEAKER-WHITE-8',
        option1: '8',
        option2: 'White',
        quantity: 15,
        position: 1,
      },
      {
        name: 'White / 9',
        sku: 'SNEAKER-WHITE-9',
        option1: '9',
        option2: 'White',
        quantity: 25,
        position: 2,
      },
      {
        name: 'White / 10',
        sku: 'SNEAKER-WHITE-10',
        option1: '10',
        option2: 'White',
        quantity: 30,
        position: 3,
      },
      {
        name: 'White / 11',
        sku: 'SNEAKER-WHITE-11',
        option1: '11',
        option2: 'White',
        quantity: 20,
        position: 4,
      },
      {
        name: 'Black / 9',
        sku: 'SNEAKER-BLACK-9',
        option1: '9',
        option2: 'Black',
        quantity: 18,
        position: 5,
      },
      {
        name: 'Black / 10',
        sku: 'SNEAKER-BLACK-10',
        option1: '10',
        option2: 'Black',
        quantity: 22,
        position: 6,
      },
      {
        name: 'Gray / 10',
        sku: 'SNEAKER-GRAY-10',
        option1: '10',
        option2: 'Gray',
        quantity: 15,
        position: 7,
      },
    ],
  },
  {
    name: 'Canvas Shoes',
    slug: 'canvas-shoes',
    description:
      'Classic canvas shoes with rubber sole. Lightweight and breathable for casual wear.',
    price: 59.99,
    cost: 30.0,
    sku: 'CANVAS-CLASSIC',
    categorySlug: 'mens-shoes',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'White / 8',
        sku: 'CANVAS-WHITE-8',
        option1: '8',
        option2: 'White',
        quantity: 20,
        position: 1,
      },
      {
        name: 'White / 9',
        sku: 'CANVAS-WHITE-9',
        option1: '9',
        option2: 'White',
        quantity: 25,
        position: 2,
      },
      {
        name: 'Black / 9',
        sku: 'CANVAS-BLACK-9',
        option1: '9',
        option2: 'Black',
        quantity: 22,
        position: 3,
      },
      {
        name: 'Black / 10',
        sku: 'CANVAS-BLACK-10',
        option1: '10',
        option2: 'Black',
        quantity: 25,
        position: 4,
      },
      {
        name: 'Navy / 9',
        sku: 'CANVAS-NAVY-9',
        option1: '9',
        option2: 'Navy',
        quantity: 18,
        position: 5,
      },
      {
        name: 'Red / 10',
        sku: 'CANVAS-RED-10',
        option1: '10',
        option2: 'Red',
        quantity: 12,
        position: 6,
      },
    ],
  },
  {
    name: 'Running Shoes',
    slug: 'running-shoes',
    description:
      'Athletic running shoes with cushioned sole and breathable mesh upper. Perfect for workouts and running.',
    price: 99.99,
    cost: 50.0,
    sku: 'RUNNING-ATHLETIC',
    categorySlug: 'mens-shoes',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Black / 8',
        sku: 'RUNNING-BLACK-8',
        option1: '8',
        option2: 'Black',
        quantity: 15,
        position: 1,
      },
      {
        name: 'Black / 9',
        sku: 'RUNNING-BLACK-9',
        option1: '9',
        option2: 'Black',
        quantity: 25,
        position: 2,
      },
      {
        name: 'Black / 10',
        sku: 'RUNNING-BLACK-10',
        option1: '10',
        option2: 'Black',
        quantity: 30,
        position: 3,
      },
      {
        name: 'White / 9',
        sku: 'RUNNING-WHITE-9',
        option1: '9',
        option2: 'White',
        quantity: 20,
        position: 4,
      },
      {
        name: 'White / 10',
        sku: 'RUNNING-WHITE-10',
        option1: '10',
        option2: 'White',
        quantity: 22,
        position: 5,
      },
      {
        name: 'Blue / 10',
        sku: 'RUNNING-BLUE-10',
        option1: '10',
        option2: 'Blue',
        quantity: 18,
        position: 6,
      },
    ],
  },
  {
    name: 'Leather Boots',
    slug: 'leather-boots',
    description:
      'Premium leather boots with durable construction. Perfect for both casual and semi-formal occasions.',
    price: 149.99,
    cost: 75.0,
    sku: 'BOOTS-LEATHER',
    categorySlug: 'mens-shoes',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Brown / 8',
        sku: 'BOOTS-BROWN-8',
        option1: '8',
        option2: 'Brown',
        quantity: 10,
        position: 1,
      },
      {
        name: 'Brown / 9',
        sku: 'BOOTS-BROWN-9',
        option1: '9',
        option2: 'Brown',
        quantity: 15,
        position: 2,
      },
      {
        name: 'Brown / 10',
        sku: 'BOOTS-BROWN-10',
        option1: '10',
        option2: 'Brown',
        quantity: 18,
        position: 3,
      },
      {
        name: 'Black / 9',
        sku: 'BOOTS-BLACK-9',
        option1: '9',
        option2: 'Black',
        quantity: 12,
        position: 4,
      },
      {
        name: 'Black / 10',
        sku: 'BOOTS-BLACK-10',
        option1: '10',
        option2: 'Black',
        quantity: 15,
        position: 5,
      },
    ],
  },
  {
    name: 'Sandals',
    slug: 'sandals',
    description:
      'Comfortable sandals with adjustable straps. Perfect for summer and beach activities.',
    price: 49.99,
    cost: 25.0,
    sku: 'SANDALS-SUMMER',
    categorySlug: 'mens-shoes',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Brown / 8',
        sku: 'SANDALS-BROWN-8',
        option1: '8',
        option2: 'Brown',
        quantity: 15,
        position: 1,
      },
      {
        name: 'Brown / 9',
        sku: 'SANDALS-BROWN-9',
        option1: '9',
        option2: 'Brown',
        quantity: 20,
        position: 2,
      },
      {
        name: 'Brown / 10',
        sku: 'SANDALS-BROWN-10',
        option1: '10',
        option2: 'Brown',
        quantity: 25,
        position: 3,
      },
      {
        name: 'Black / 9',
        sku: 'SANDALS-BLACK-9',
        option1: '9',
        option2: 'Black',
        quantity: 18,
        position: 4,
      },
      {
        name: 'Black / 10',
        sku: 'SANDALS-BLACK-10',
        option1: '10',
        option2: 'Black',
        quantity: 20,
        position: 5,
      },
    ],
  },

  // ACCESSORY PRODUCTS
  {
    name: 'Baseball Cap',
    slug: 'baseball-cap',
    description:
      'Classic baseball cap with adjustable strap. Made from durable cotton twill with embroidered logo.',
    price: 29.99,
    cost: 15.0,
    sku: 'CAP-BASEBALL',
    categorySlug: 'accessories',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Black / One Size',
        sku: 'CAP-BLACK-OS',
        option1: 'One Size',
        option2: 'Black',
        quantity: 30,
        position: 1,
      },
      {
        name: 'Navy / One Size',
        sku: 'CAP-NAVY-OS',
        option1: 'One Size',
        option2: 'Navy',
        quantity: 25,
        position: 2,
      },
      {
        name: 'Red / One Size',
        sku: 'CAP-RED-OS',
        option1: 'One Size',
        option2: 'Red',
        quantity: 20,
        position: 3,
      },
      {
        name: 'White / One Size',
        sku: 'CAP-WHITE-OS',
        option1: 'One Size',
        option2: 'White',
        quantity: 22,
        position: 4,
      },
    ],
  },
  {
    name: 'Leather Belt',
    slug: 'leather-belt',
    description:
      'Premium leather belt with metal buckle. Classic design suitable for both casual and formal wear.',
    price: 39.99,
    cost: 20.0,
    sku: 'BELT-LEATHER',
    categorySlug: 'accessories',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Brown / 32',
        sku: 'BELT-BROWN-32',
        option1: '32',
        option2: 'Brown',
        quantity: 15,
        position: 1,
      },
      {
        name: 'Brown / 34',
        sku: 'BELT-BROWN-34',
        option1: '34',
        option2: 'Brown',
        quantity: 20,
        position: 2,
      },
      {
        name: 'Brown / 36',
        sku: 'BELT-BROWN-36',
        option1: '36',
        option2: 'Brown',
        quantity: 18,
        position: 3,
      },
      {
        name: 'Black / 32',
        sku: 'BELT-BLACK-32',
        option1: '32',
        option2: 'Black',
        quantity: 18,
        position: 4,
      },
      {
        name: 'Black / 34',
        sku: 'BELT-BLACK-34',
        option1: '34',
        option2: 'Black',
        quantity: 25,
        position: 5,
      },
      {
        name: 'Black / 36',
        sku: 'BELT-BLACK-36',
        option1: '36',
        option2: 'Black',
        quantity: 20,
        position: 6,
      },
    ],
  },
  {
    name: 'Cotton Socks Pack',
    slug: 'cotton-socks-pack',
    description:
      '3-pack of comfortable cotton socks. Breathable fabric with reinforced heel and toe.',
    price: 19.99,
    cost: 10.0,
    sku: 'SOCKS-COTTON-3PK',
    categorySlug: 'accessories',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'White / Small',
        sku: 'SOCKS-WHITE-S',
        option1: 'S',
        option2: 'White',
        quantity: 40,
        position: 1,
      },
      {
        name: 'White / Medium',
        sku: 'SOCKS-WHITE-M',
        option1: 'M',
        option2: 'White',
        quantity: 50,
        position: 2,
      },
      {
        name: 'White / Large',
        sku: 'SOCKS-WHITE-L',
        option1: 'L',
        option2: 'White',
        quantity: 45,
        position: 3,
      },
      {
        name: 'Black / Medium',
        sku: 'SOCKS-BLACK-M',
        option1: 'M',
        option2: 'Black',
        quantity: 35,
        position: 4,
      },
      {
        name: 'Black / Large',
        sku: 'SOCKS-BLACK-L',
        option1: 'L',
        option2: 'Black',
        quantity: 30,
        position: 5,
      },
      {
        name: 'Gray / Medium',
        sku: 'SOCKS-GRAY-M',
        option1: 'M',
        option2: 'Gray',
        quantity: 25,
        position: 6,
      },
    ],
  },
  {
    name: 'Wrist Watch',
    slug: 'wrist-watch',
    description:
      'Classic analog watch with leather strap and water-resistant case. Elegant design suitable for any occasion.',
    price: 149.99,
    cost: 75.0,
    sku: 'WATCH-CLASSIC',
    categorySlug: 'accessories',
    featured: true,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Silver / One Size',
        sku: 'WATCH-SILVER-OS',
        option1: 'One Size',
        option2: 'Silver',
        quantity: 12,
        position: 1,
      },
      {
        name: 'Gold / One Size',
        sku: 'WATCH-GOLD-OS',
        option1: 'One Size',
        option2: 'Gold',
        quantity: 8,
        position: 2,
      },
      {
        name: 'Black / One Size',
        sku: 'WATCH-BLACK-OS',
        option1: 'One Size',
        option2: 'Black',
        quantity: 10,
        position: 3,
      },
    ],
  },
  {
    name: 'Sunglasses',
    slug: 'sunglasses',
    description:
      'Stylish sunglasses with UV protection and durable frame. Perfect for outdoor activities and fashion.',
    price: 79.99,
    cost: 40.0,
    sku: 'SUNGLASSES-STYLE',
    categorySlug: 'accessories',
    featured: false,
    images: [], // No placeholder images - admin should upload real images
    variants: [
      {
        name: 'Black / One Size',
        sku: 'SUNGLASSES-BLACK-OS',
        option1: 'One Size',
        option2: 'Black',
        quantity: 20,
        position: 1,
      },
      {
        name: 'Brown / One Size',
        sku: 'SUNGLASSES-BROWN-OS',
        option1: 'One Size',
        option2: 'Brown',
        quantity: 15,
        position: 2,
      },
      {
        name: 'Blue / One Size',
        sku: 'SUNGLASSES-BLUE-OS',
        option1: 'One Size',
        option2: 'Blue',
        quantity: 12,
        position: 3,
      },
    ],
  },
];

// Utility functions
function logProgress(message: string): void {

}

function logError(message: string, error?: any): void {

}

// Database operation functions
async function insertCategories(): Promise<Map<string, string>> {
  logProgress('Starting category insertion...');
  const categoryMap = new Map<string, string>();

  try {
    // Insert main categories first
    for (const category of categories) {
      const categoryData: CategoryInsert = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        position: category.position,
      };

      const { data, error } = await supabase
        .from('categories')
        .insert(categoryData)
        .select('id, slug')
        .single();

      if (error) throw error;

      categoryMap.set(data.slug, data.id);
      logProgress(`✓ Inserted category: ${category.name}`);

      // Insert subcategories if they exist
      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          const subcategoryData: CategoryInsert = {
            name: subcategory.name,
            slug: subcategory.slug,
            description: subcategory.description,
            parent_id: data.id,
            position: subcategory.position,
          };

          const { data: subData, error: subError } = await supabase
            .from('categories')
            .insert(subcategoryData)
            .select('id, slug')
            .single();

          if (subError) throw subError;

          categoryMap.set(subData.slug, subData.id);
          logProgress(`  ✓ Inserted subcategory: ${subcategory.name}`);
        }
      }
    }

    logProgress(`✅ Successfully inserted ${categoryMap.size} categories`);
    return categoryMap;
  } catch (error) {
    logError('Error inserting categories:', error);
    throw error;
  }
}
