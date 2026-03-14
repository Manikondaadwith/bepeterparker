-- 002_add_password.sql
-- Run this migration in your Supabase SQL Editor if you already ran 001_initial_schema.sql

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password_hash TEXT;
