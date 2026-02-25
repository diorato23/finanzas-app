-- Migration to change 'categoria' from ENUM to TEXT in 'transacciones' table

-- Alter the column type to text
ALTER TABLE public.transacciones ALTER COLUMN categoria TYPE text USING categoria::text;

-- Optional: If the enum_categoria type is no longer needed anywhere else, you can drop it
-- DROP TYPE IF EXISTS public.enum_categoria;
