-- Add invoice numbering system
-- This creates a sequential invoice number for each enrollment

-- Step 1: Add invoice_number column to enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS invoice_number TEXT;

-- Step 2: Create invoice_settings table for configuration
CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL DEFAULT 'INV',
  current_number INTEGER NOT NULL DEFAULT 0,
  number_length INTEGER NOT NULL DEFAULT 6,
  format TEXT NOT NULL DEFAULT '{prefix}-{year}-{number}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One settings row per tenant
  CONSTRAINT invoice_settings_tenant_unique UNIQUE (tenant_id)
);

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_settings_tenant_id ON public.invoice_settings(tenant_id);

-- Step 4: Enable RLS
ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Admin users can view their tenant invoice settings"
  ON public.invoice_settings
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can insert their tenant invoice settings"
  ON public.invoice_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admin users can update their tenant invoice settings"
  ON public.invoice_settings
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Step 6: Create function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings RECORD;
  v_next_number INTEGER;
  v_invoice_number TEXT;
  v_year TEXT;
  v_padded_number TEXT;
BEGIN
  -- Get or create settings for this tenant
  SELECT * INTO v_settings
  FROM invoice_settings
  WHERE tenant_id = p_tenant_id
  FOR UPDATE; -- Lock the row for update

  -- If no settings exist, create default
  IF NOT FOUND THEN
    INSERT INTO invoice_settings (tenant_id, prefix, current_number, number_length, format)
    VALUES (p_tenant_id, 'INV', 0, 6, '{prefix}-{year}-{number}')
    RETURNING * INTO v_settings;
  END IF;

  -- Increment the counter
  v_next_number := v_settings.current_number + 1;

  -- Update the counter
  UPDATE invoice_settings
  SET current_number = v_next_number,
      updated_at = NOW()
  WHERE tenant_id = p_tenant_id;

  -- Get current year
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;

  -- Pad number with zeros
  v_padded_number := LPAD(v_next_number::TEXT, v_settings.number_length, '0');

  -- Format the invoice number according to template
  v_invoice_number := REPLACE(v_settings.format, '{prefix}', v_settings.prefix);
  v_invoice_number := REPLACE(v_invoice_number, '{year}', v_year);
  v_invoice_number := REPLACE(v_invoice_number, '{number}', v_padded_number);

  RETURN v_invoice_number;
END;
$$;

-- Step 7: Create trigger function to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only generate if invoice_number is null
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number(NEW.tenant_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Step 8: Create trigger on enrollments
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_number ON public.enrollments;
CREATE TRIGGER trigger_auto_generate_invoice_number
  BEFORE INSERT ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_number();

-- Step 9: Backfill invoice numbers for existing enrollments
-- This will generate invoice numbers for enrollments that don't have one yet
DO $$
DECLARE
  enrollment_record RECORD;
BEGIN
  FOR enrollment_record IN
    SELECT id, tenant_id
    FROM enrollments
    WHERE invoice_number IS NULL
    ORDER BY enrolled_at ASC
  LOOP
    UPDATE enrollments
    SET invoice_number = generate_invoice_number(enrollment_record.tenant_id)
    WHERE id = enrollment_record.id;
  END LOOP;
END $$;

-- Step 10: Add helpful comment
COMMENT ON TABLE public.invoice_settings IS 'Configuration for automatic invoice number generation per tenant';
COMMENT ON FUNCTION generate_invoice_number(UUID) IS 'Generates the next sequential invoice number for a tenant';
