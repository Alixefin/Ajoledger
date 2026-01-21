-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Group Settings (single row for the whole group)
CREATE TABLE IF NOT EXISTS group_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_contribution INTEGER NOT NULL DEFAULT 10000,
  group_name TEXT NOT NULL DEFAULT 'My Ajo Group',
  cycle_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  passport_url TEXT,
  join_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'left')),
  notes TEXT,
  rotation_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  amount_paid INTEGER NOT NULL,
  expected_amount INTEGER NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, month_year)
);

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  amount INTEGER NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_rotation_order ON members(rotation_order);
CREATE INDEX IF NOT EXISTS idx_contributions_member_id ON contributions(member_id);
CREATE INDEX IF NOT EXISTS idx_contributions_month_year ON contributions(month_year);
CREATE INDEX IF NOT EXISTS idx_payouts_member_id ON payouts(member_id);
CREATE INDEX IF NOT EXISTS idx_payouts_month_year ON payouts(month_year);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- Policies for group_settings
CREATE POLICY "Authenticated users can view group_settings"
  ON group_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert group_settings"
  ON group_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update group_settings"
  ON group_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Policies for members
CREATE POLICY "Authenticated users can view members"
  ON members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert members"
  ON members FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update members"
  ON members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete members"
  ON members FOR DELETE TO authenticated USING (true);

-- Policies for contributions
CREATE POLICY "Authenticated users can view contributions"
  ON contributions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert contributions"
  ON contributions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update contributions"
  ON contributions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contributions"
  ON contributions FOR DELETE TO authenticated USING (true);

-- Policies for payouts
CREATE POLICY "Authenticated users can view payouts"
  ON payouts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payouts"
  ON payouts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update payouts"
  ON payouts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete payouts"
  ON payouts FOR DELETE TO authenticated USING (true);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO group_settings (monthly_contribution, group_name, cycle_start_date)
SELECT 10000, 'My Ajo Group', CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM group_settings);

