'use client';

import { Save, Loader2, Plus, Trash2, Upload, X, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';

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
  barcode: string | null;
  featured: boolean;
  track_quantity: boolean;
  allow_backorder: boolean;
  weight: string | null;
  created_at: string;
  product_variants: ProductVariant[];
  product_categories: { categories: { id: string; name: string; slug: string } }[];
  product_images: ProductImage[];
}

interface ProductVariant {
  id?: string;
  name: string;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  price: string | null;
  sku: string | null;
  quantity: number;
  position: number;
  _action?: 'create' | 'update' | 'delete';
}

interface ProductImage {
  id?: string;
  url: string;
  alt_text: string | null;
  position: number;
  _action?: 'create' | 'update' | 'delete';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FormData {
  name: string;
  description: string;
  status: 'active' | 'draft' | 'archived';
  price: string;
  compare_at_price: string;
  cost: string;
  sku: string;
  barcode: string;
  featured: boolean;
  track_quantity: boolean;
  allow_backorder: boolean;
  weight: string;
  category_ids: string[];
  variants: ProductVariant[];
  images: ProductImage[];
}


export default function EditProduct({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    variants: true,
    images: true,
    categories: true,
    inventory: false,
    seo: false
  });

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    status: 'draft',
    price: '',
    compare_at_price: '',
    cost: '',
    sku: '',
    barcode: '',
    featured: false,
    track_quantity: true,
    allow_backorder: false,
    weight: '',
    category_ids: [],
    variants: [],
    images: []
  });

  // Helper functions
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}`,
      name: '',
      option1: null,
      option2: null,
      option3: null,
      price: null,
      sku: null,
      quantity: 0,
      position: formData.variants.length + 1,
      _action: 'create'
    };
    updateFormData('variants', [...formData.variants, newVariant]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[index];
    if (!variant) return;
    
    if (variant.id?.startsWith('temp-')) {
      variant._action = 'create';
    } else if (variant._action !== 'create') {
      variant._action = 'update';
    }
    updatedVariants[index] = { ...variant, [field]: value };
    updateFormData('variants', updatedVariants);
  };

  const deleteVariant = (index: number) => {
    const updatedVariants = [...formData.variants];
    const variant = updatedVariants[index];
    if (!variant) return;
    
    if (variant.id?.startsWith('temp-')) {
      // Remove temp variants immediately
      updatedVariants.splice(index, 1);
    } else {
      // Mark existing variants for deletion
      updatedVariants[index] = { ...variant, _action: 'delete' };
    }
    updateFormData('variants', updatedVariants);
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) {
      console.log('Upload - No files provided');
      return;
    }
    
    console.log('=== IMAGE UPLOAD DEBUG START ===');
    console.log('Upload - Files to upload:', files.length);
    Array.from(files).forEach((file, index) => {
      console.log(`Upload - File ${index}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
    });
    console.log('Upload - Product ID:', id);
    
    setIsUploading(true);
    try {
      const uploadFormData = new FormData();
      Array.from(files).forEach(file => {
        uploadFormData.append('files', file);
      });
      uploadFormData.append('productId', id);
      
      console.log('Upload - FormData created, sending request...');
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: uploadFormData
      });
      
      console.log('Upload - Response status:', response.status);
      console.log('Upload - Response headers:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('Upload - Response data:', result);
      
      if (result.success) {
        console.log('Upload - Success! Processing uploaded images...');
        console.log('Upload - Result data:', result.data);
        
        // Add uploaded images to form data (already created in database by upload API)
        const newImages = result.data.map((img: any) => ({
          id: img.imageId,
          url: img.imageUrl,
          alt_text: '',
          position: img.position
          // No _action needed since images are already created in database
        }));
        
        console.log('Upload - New images to add:', newImages);
        console.log('Upload - Current formData images:', formData.images);
        
        const updatedImages = [...formData.images, ...newImages];
        console.log('Upload - Updated images array:', updatedImages);
        
        updateFormData('images', updatedImages);
        toast.success(`${result.data.length} image(s) uploaded successfully`);
      } else {
        console.error('Upload - Failed:', result);
        toast.error(result.error || 'Failed to upload images');
        if (result.details) {
          console.error('Upload - Error details:', result.details);
        }
      }
    } catch (error) {
      console.error('Upload - Exception:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
      console.log('=== IMAGE UPLOAD DEBUG END ===');
    }
  };

  const deleteImage = (index: number) => {
    const updatedImages = [...formData.images];
    const image = updatedImages[index];
    if (!image) return;
    
    if (image._action === 'create') {
      // Remove newly added images immediately
      updatedImages.splice(index, 1);
    } else {
      // Mark existing images for deletion
      updatedImages[index] = { ...image, _action: 'delete' };
    }
    updateFormData('images', updatedImages);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    if (!formData.price || isNaN(Number(formData.price))) {
      toast.error('Valid price is required');
      return;
    }
    
    // Validate variants
    for (let i = 0; i < formData.variants.length; i++) {
      const variant = formData.variants[i];
      if (variant && variant._action !== 'delete' && !variant.name.trim()) {
        toast.error(`Variant ${i + 1} name is required`);
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // Clean the data before sending - ensure proper types and remove extra fields
      const cleanedVariants = formData.variants.map(variant => ({
        // Only include fields expected by the API validation schema
        id: variant.id,
        name: variant.name,
        option1: variant.option1 || null,
        option2: variant.option2 || null,
        option3: variant.option3 || null,
        price: variant.price ? String(variant.price) : null, // Convert to string
        sku: variant.sku || null,
        quantity: Number(variant.quantity), // Ensure it's a number
        position: Number(variant.position), // Ensure it's a number
        _action: variant._action
        // Remove extra fields like created_at, updated_at, product_id
      }));
      
      const cleanedImages = formData.images.map(image => ({
        // Only include fields expected by the API validation schema
        id: image.id,
        url: image.url,
        alt_text: image.alt_text || null,
        position: Number(image.position), // Ensure it's a number
        _action: image._action
        // Remove extra fields like created_at, product_id, variant_id
      }));
      
      const requestData = {
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
        price: String(formData.price), // Convert to string
        compare_at_price: formData.compare_at_price ? String(formData.compare_at_price) : null,
        cost: formData.cost ? String(formData.cost) : null,
        sku: formData.sku || null,
        barcode: formData.barcode || null,
        featured: formData.featured,
        track_quantity: formData.track_quantity,
        allow_backorder: formData.allow_backorder,
        weight: formData.weight ? String(formData.weight) : null,
        category_ids: formData.category_ids,
        variants: cleanedVariants,
        images: cleanedImages
      };
      
      console.log('=== FRONTEND DEBUG START ===');
      console.log('Frontend - Sending request data (full):', JSON.stringify(requestData, null, 2));
      console.log('Frontend - Request data structure:', {
        hasName: 'name' in requestData,
        hasImages: 'images' in requestData,
        imagesCount: requestData.images?.length || 0,
        hasVariants: 'variants' in requestData,
        variantsCount: requestData.variants?.length || 0,
        allKeys: Object.keys(requestData)
      });
      
      if (requestData.images) {
        console.log('Frontend - Images details:');
        requestData.images.forEach((img, index) => {
          console.log(`Frontend - Image ${index}:`, {
            id: img.id,
            url: img.url,
            urlLength: img.url?.length,
            urlPreview: img.url?.substring(0, 100) + (img.url?.length > 100 ? '...' : ''),
            alt_text: img.alt_text,
            position: img.position,
            _action: img._action,
            allImageKeys: Object.keys(img)
          });
        });
      }
      
      if (requestData.variants) {
        console.log('Frontend - Variants details:');
        requestData.variants.forEach((variant, index) => {
          console.log(`Frontend - Variant ${index}:`, {
            id: variant.id,
            name: variant.name,
            quantity: variant.quantity,
            quantityType: typeof variant.quantity,
            position: variant.position,
            positionType: typeof variant.position,
            _action: variant._action,
            allVariantKeys: Object.keys(variant)
          });
        });
      }
      
      console.log('=== FRONTEND DEBUG END ===');
      
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      if (result.success) {
        toast.success('Product updated successfully');
        router.push('/admin/products');
      } else {
        console.error('API Error:', result);
        console.error('=== DETAILED ERROR ANALYSIS ===');
        if (result.details && Array.isArray(result.details)) {
          result.details.forEach((detail, index) => {
            console.error(`Error ${index + 1}:`, {
              path: detail.path,
              message: detail.message,
              code: detail.code,
              received: detail.received
            });
          });
        }
        console.error('=== END ERROR ANALYSIS ===');
        toast.error(result.error || 'Failed to update product');
        if (result.details) {
          console.error('Error details (raw):', result.details);
        }
      }
    } catch (error) {
      // console.error('Save error:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
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

        // Load product and categories in parallel
        const [productResult, categoriesResult] = await Promise.all([
          supabase
            .from('products')
            .select(`
              *,
              product_variants(*),
              product_categories(
                categories(id, name, slug)
              ),
              product_images(*)
            `)
            .eq('id', id)
            .single(),
          supabase
            .from('categories')
            .select('id, name, slug')
            .order('name')
        ]);

        if (productResult.error || !productResult.data) {
          setError('Product not found');
          return;
        }

        if (categoriesResult.data) {
          setCategories(categoriesResult.data);
        }

        const productData = productResult.data;
        setProduct(productData);
        
        // Populate form data
        setFormData({
          name: productData.name,
          description: productData.description || '',
          status: productData.status as 'active' | 'draft' | 'archived',
          price: productData.price,
          compare_at_price: productData.compare_at_price || '',
          cost: productData.cost || '',
          sku: productData.sku || '',
          barcode: productData.barcode || '',
          featured: productData.featured,
          track_quantity: productData.track_quantity,
          allow_backorder: productData.allow_backorder,
          weight: productData.weight || '',
          category_ids: productData.product_categories?.map((pc: any) => pc.categories.id) || [],
          variants: productData.product_variants || [],
          images: productData.product_images || []
        });
      } catch {
        setError('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-admin-error mb-2">Error</h1>
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-admin-accent mx-auto mb-4" />
          <p className="text-admin-light-text-secondary dark:text-admin-text-secondary">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-admin-light-text-primary dark:text-admin-text-primary">
              Edit Product: {formData.name || product?.name}
            </h1>
            <p className="mt-1 text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
              Product ID: {product?.id}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => router.back()}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-admin-light-text-secondary dark:text-admin-text-secondary border border-admin-light-border dark:border-admin-border rounded-lg hover:bg-admin-light-bg-hover dark:hover:bg-admin-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-admin-accent hover:bg-admin-accent-hover rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer"
          onClick={() => toggleSection('basic')}
        >
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Basic Information
          </h2>
          {expandedSections.basic ? (
            <ChevronUp className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          )}
        </div>
        
        {expandedSections.basic && (
          <div className="px-6 pb-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value as 'active' | 'draft' | 'archived')}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Compare at Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.compare_at_price}
                  onChange={(e) => updateFormData('compare_at_price', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Cost
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => updateFormData('cost', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateFormData('sku', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="Enter SKU"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-admin-light-text-primary dark:text-admin-text-primary mb-2">
                  Weight
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  className="w-full px-3 py-2 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary focus:ring-2 focus:ring-admin-accent focus:border-transparent"
                  placeholder="0.0 kg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => updateFormData('featured', e.target.checked)}
                  className="mr-2 rounded border-admin-light-border dark:border-admin-border text-admin-accent focus:ring-admin-accent"
                />
                <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">Featured Product</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.track_quantity}
                  onChange={(e) => updateFormData('track_quantity', e.target.checked)}
                  className="mr-2 rounded border-admin-light-border dark:border-admin-border text-admin-accent focus:ring-admin-accent"
                />
                <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">Track Quantity</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allow_backorder}
                  onChange={(e) => updateFormData('allow_backorder', e.target.checked)}
                  className="mr-2 rounded border-admin-light-border dark:border-admin-border text-admin-accent focus:ring-admin-accent"
                />
                <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">Allow Back Orders</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer"
          onClick={() => toggleSection('categories')}
        >
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Categories
          </h2>
          {expandedSections.categories ? (
            <ChevronUp className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          )}
        </div>
        
        {expandedSections.categories && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.category_ids.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateFormData('category_ids', [...formData.category_ids, category.id]);
                      } else {
                        updateFormData('category_ids', formData.category_ids.filter(id => id !== category.id));
                      }
                    }}
                    className="mr-2 rounded border-admin-light-border dark:border-admin-border text-admin-accent focus:ring-admin-accent"
                  />
                  <span className="text-sm text-admin-light-text-primary dark:text-admin-text-primary">
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Images */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer"
          onClick={() => toggleSection('images')}
        >
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Product Images ({formData.images.filter(img => img._action !== 'delete').length})
          </h2>
          {expandedSections.images ? (
            <ChevronUp className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          )}
        </div>
        
        {expandedSections.images && (
          <div className="px-6 pb-6 space-y-4">
            {/* Image Upload */}
            <div className="border-2 border-dashed border-admin-light-border dark:border-admin-border rounded-lg p-8 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-admin-light-text-disabled dark:text-admin-text-disabled mx-auto mb-4" />
                <p className="text-admin-light-text-primary dark:text-admin-text-primary font-medium mb-2">
                  {isUploading ? 'Uploading...' : 'Upload product images'}
                </p>
                <p className="text-sm text-admin-light-text-secondary dark:text-admin-text-secondary">
                  Drag and drop or click to select multiple images
                </p>
                <p className="text-xs text-admin-light-text-disabled dark:text-admin-text-disabled mt-2">
                  Maximum 5MB per image. Supports JPG, PNG, WebP
                </p>
              </label>
            </div>

            {/* Existing Images */}
            {formData.images.filter(img => img._action !== 'delete').length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => {
                  if (image._action === 'delete') return null;
                  
                  return (
                    <div key={image.id || index} className="relative group">
                      <div className="relative w-full h-32 border border-admin-light-border dark:border-admin-border rounded-lg overflow-hidden">
                        <Image
                          src={image.url || '/api/placeholder/200x128'}
                          alt={image.alt_text || 'Product image'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                          onError={(e) => {
                            // Fallback to a placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = '/api/placeholder/200x128';
                          }}
                        />
                      </div>
                      <button
                        onClick={() => deleteImage(index)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="mt-2">
                        <input
                          type="text"
                          value={image.alt_text || ''}
                          onChange={(e) => {
                            const updatedImages = [...formData.images];
                            const currentImage = updatedImages[index];
                            if (currentImage) {
                              updatedImages[index] = { 
                                ...currentImage, 
                                alt_text: e.target.value,
                                _action: currentImage._action || 'update'
                              };
                            }
                            updateFormData('images', updatedImages);
                          }}
                          placeholder="Alt text"
                          className="w-full px-2 py-1 text-xs border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-main dark:bg-admin-bg-main text-admin-light-text-primary dark:text-admin-text-primary"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Variants */}
      <div className="bg-admin-light-bg-surface dark:bg-admin-bg-surface rounded-lg shadow-admin-soft border border-admin-light-border dark:border-admin-border">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer"
          onClick={() => toggleSection('variants')}
        >
          <h2 className="text-lg font-semibold text-admin-light-text-primary dark:text-admin-text-primary">
            Product Variants ({formData.variants.filter(v => v._action !== 'delete').length})
          </h2>
          {expandedSections.variants ? (
            <ChevronUp className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-admin-light-text-secondary dark:text-admin-text-secondary" />
          )}
        </div>
        
        {expandedSections.variants && (
          <div className="px-6 pb-6 space-y-4">
            <button
              onClick={addVariant}
              className="flex items-center space-x-2 px-4 py-2 text-sm bg-admin-accent text-white rounded-lg hover:bg-admin-accent-hover transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Variant</span>
            </button>

            {formData.variants.map((variant, index) => {
              if (variant._action === 'delete') return null;
              
              return (
                <div
                  key={variant.id}
                  className="p-4 border border-admin-light-border dark:border-admin-border rounded-lg bg-admin-light-bg-main dark:bg-admin-bg-main space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-admin-light-text-primary dark:text-admin-text-primary">
                      Variant {index + 1}
                    </h4>
                    <button
                      onClick={() => deleteVariant(index)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Name *
                      </label>
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => updateVariant(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="e.g. Small / Red"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Size
                      </label>
                      <input
                        type="text"
                        value={variant.option1 || ''}
                        onChange={(e) => updateVariant(index, 'option1', e.target.value || null)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="e.g. S, M, L"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Color
                      </label>
                      <input
                        type="text"
                        value={variant.option2 || ''}
                        onChange={(e) => updateVariant(index, 'option2', e.target.value || null)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="e.g. Red, Blue"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Style
                      </label>
                      <input
                        type="text"
                        value={variant.option3 || ''}
                        onChange={(e) => updateVariant(index, 'option3', e.target.value || null)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={variant.price || ''}
                        onChange={(e) => updateVariant(index, 'price', e.target.value || null)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="Use product price"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={variant.sku || ''}
                        onChange={(e) => updateVariant(index, 'sku', e.target.value || null)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-admin-light-text-secondary dark:text-admin-text-secondary mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm border border-admin-light-border dark:border-admin-border rounded bg-admin-light-bg-surface dark:bg-admin-bg-surface text-admin-light-text-primary dark:text-admin-text-primary focus:ring-1 focus:ring-admin-accent focus:border-transparent"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}