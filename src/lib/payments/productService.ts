/**
 * Product Service
 * Handles product registration and management for the payment system
 */

import { createClient } from '@/lib/supabase/server';
import type { Product, RegisterProductRequest } from '@/types/payments';
import { logAuditEvent } from '@/lib/audit/logger';

/**
 * Register a new product in the payment system
 * This links courses, programs, workshops, etc. to the payment system
 */
export async function registerProduct(
  request: RegisterProductRequest & { tenant_id: string }
): Promise<Product> {
  const supabase = await createClient();

  const {
    tenant_id,
    product_type,
    product_id,
    product_name,
    price,
    currency = 'USD',
    auto_assign_payment_plan = true,
    default_payment_plan_id,
    forced_payment_plan_id,
    metadata = {},
  } = request;

  // Validate required fields
  if (!product_type || !product_id || !product_name) {
    throw new Error('product_type, product_id, and product_name are required');
  }

  if (price < 0) {
    throw new Error('price must be greater than or equal to 0');
  }

  // Check if product already exists
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('tenant_id', tenant_id)
    .eq('product_type', product_type)
    .eq('product_id', product_id)
    .single();

  if (existing) {
    throw new Error(`Product already registered: ${product_type}/${product_id}`);
  }

  // Insert product
  const { data, error } = await supabase
    .from('products')
    .insert({
      tenant_id,
      product_type,
      product_id,
      product_name,
      price,
      currency,
      auto_assign_payment_plan,
      default_payment_plan_id,
      forced_payment_plan_id,
      metadata,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering product:', error);
    throw new Error(`Failed to register product: ${error.message}`);
  }

  console.log(`[ProductService] Registered product: ${product_name} (${product_type}/${product_id})`);

  return data;
}

/**
 * Update an existing product
 */
export async function updateProduct(
  productId: string,
  tenantId: string,
  updates: Partial<RegisterProductRequest>
): Promise<Product> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  console.log(`[ProductService] Updated product: ${productId}`);

  return data;
}

/**
 * Get product by ID
 */
export async function getProduct(
  productId: string,
  tenantId: string
): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

/**
 * Get product by type and ID (e.g., course ID, program ID)
 */
export async function getProductByTypeAndId(
  productType: string,
  productId: string,
  tenantId: string
): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('product_type', productType)
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching product:', error);
    return null;
  }

  return data;
}

/**
 * List all products for a tenant
 */
export async function listProducts(
  tenantId: string,
  filters?: {
    product_type?: string;
    is_active?: boolean;
    search?: string;
  }
): Promise<Product[]> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters?.product_type) {
    query = query.eq('product_type', filters.product_type);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.search) {
    query = query.ilike('product_name', `%${filters.search}%`);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error listing products:', error);
    throw new Error(`Failed to list products: ${error.message}`);
  }

  return data || [];
}

/**
 * Delete a product
 * Only allowed if no enrollments exist
 */
export async function deleteProduct(
  productId: string,
  tenantId: string
): Promise<void> {
  const supabase = await createClient();

  // Check if product has any enrollments
  const { count } = await supabase
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);

  if (count && count > 0) {
    throw new Error('Cannot delete product with existing enrollments');
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  console.log(`[ProductService] Deleted product: ${productId}`);
}

/**
 * Activate/deactivate a product
 */
export async function toggleProductActive(
  productId: string,
  tenantId: string,
  isActive: boolean
): Promise<Product> {
  return updateProduct(productId, tenantId, { is_active: isActive });
}

/**
 * Get product statistics
 */
export async function getProductStats(
  productId: string,
  tenantId: string
): Promise<{
  total_enrollments: number;
  total_revenue: number;
  paid_enrollments: number;
  pending_enrollments: number;
}> {
  const supabase = await createClient();

  // Get enrollment stats
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('payment_status, total_amount, paid_amount')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId);

  if (!enrollments) {
    return {
      total_enrollments: 0,
      total_revenue: 0,
      paid_enrollments: 0,
      pending_enrollments: 0,
    };
  }

  const total_enrollments = enrollments.length;
  const paid_enrollments = enrollments.filter(e => e.payment_status === 'paid').length;
  const pending_enrollments = enrollments.filter(e => e.payment_status === 'pending' || e.payment_status === 'partial').length;
  const total_revenue = enrollments.reduce((sum, e) => sum + (e.paid_amount || 0), 0);

  return {
    total_enrollments,
    total_revenue,
    paid_enrollments,
    pending_enrollments,
  };
}
