/*
  # Add manual_access column to subscriptions table

  1. Changes
    - Add `manual_access` boolean column to `subscriptions` table
    - Set default value to FALSE
    - Add index for better query performance

  2. Security
    - No changes to existing RLS policies needed
    - Column inherits existing table permissions
*/

-- Add manual_access column to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS manual_access BOOLEAN DEFAULT FALSE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_manual_access ON subscriptions(manual_access);

-- Update existing records to have manual_access = false if null
UPDATE subscriptions SET manual_access = FALSE WHERE manual_access IS NULL;