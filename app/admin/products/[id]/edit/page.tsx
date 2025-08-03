'use client';

// TODO: Import icons when implementing form components
// import { Save, Loader2, Plus, Edit3, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';

import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'draft' | 'archived';
  price: string;
  compare_at_price: string | null;
  cost: string | null;
  sku: string | null;
  featured: boolean;
  track_quantity: boolean;
  allow_backorder: boolean;
  created_at: string;
  product_variants: ProductVariant[];
  product_categories: { categories: { id: string; name: string; slug: string } }[];
}

interface ProductVariant {
  id: string;
  title: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string | null;
  compare_at_price: string | null;
  cost_price: string | null;
  sku: string | null;
  quantity: number;
  position: number;
}

// TODO: Implement ProductFormData interface when building the form component

// TODO: Implement EditProductForm component
// This component will be implemented when admin product editing functionality is added

export default function EditProduct({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const supabase = createClient();
        
        // Check admin authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/auth/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (!profile || profile.role !== 'admin') {
          router.push('/');
          return;
        }

        // Load product
        const productResult = await supabase
          .from('products')
          .select(`
            *,
            product_variants(*),
            product_categories(
              categories(id, name, slug)
            )
          `)
          .eq('id', id)
          .single();

        if (productResult.error || !productResult.data) {
          setError('Product not found');
          return;
        }

        setProduct(productResult.data);
      } catch {
        // Error already handled by setting error state
        setError('Failed to load product');
      }
    };

    fetchProduct();
  }, [id, router]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Edit Product: {product.name}</h1>
      {/* TODO: Add product edit form here */}
    </div>
  );
}