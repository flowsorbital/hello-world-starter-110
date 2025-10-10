-- Create minutes_transactions table for audit trail
CREATE TABLE IF NOT EXISTS minutes_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    batch_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deduction', 'refund', 'purchase', 'bonus')),
    minutes INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_minutes_transactions_user_id ON minutes_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_minutes_transactions_campaign_id ON minutes_transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_minutes_transactions_created_at ON minutes_transactions(created_at);

-- Enable RLS
ALTER TABLE minutes_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own transactions" ON minutes_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions" ON minutes_transactions
    FOR ALL USING (auth.role() = 'service_role');
