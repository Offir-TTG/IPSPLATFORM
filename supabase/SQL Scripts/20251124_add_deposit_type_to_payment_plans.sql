-- Migration: Add deposit_type field to payment_plans table
-- Allows choosing between percentage-based or fixed amount deposit

ALTER TABLE public.payment_plans
ADD COLUMN IF NOT EXISTS deposit_type TEXT CHECK (deposit_type IN ('percentage', 'fixed'));

-- Add comment for documentation
COMMENT ON COLUMN public.payment_plans.deposit_type IS 'Type of deposit: percentage (%) or fixed (amount)';
