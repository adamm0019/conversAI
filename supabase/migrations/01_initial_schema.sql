-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  unread INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  user_id TEXT NOT NULL,
  last_message TEXT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system'))
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  preferences JSONB DEFAULT '{}'::jsonb,
  target_languages JSONB DEFAULT '[]'::jsonb,
  dynamic_variables JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performant queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);

-- Row Level Security Policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for chats
CREATE POLICY chats_select ON chats 
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY chats_insert ON chats 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY chats_update ON chats 
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY chats_delete ON chats 
  FOR DELETE USING (auth.uid()::text = user_id);

-- Policies for messages
CREATE POLICY messages_select ON messages 
  FOR SELECT USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()::text)
  );

CREATE POLICY messages_insert ON messages 
  FOR INSERT WITH CHECK (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()::text)
  );

CREATE POLICY messages_update ON messages 
  FOR UPDATE USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()::text)
  );

CREATE POLICY messages_delete ON messages 
  FOR DELETE USING (
    chat_id IN (SELECT id FROM chats WHERE user_id = auth.uid()::text)
  );

-- Policies for user_profiles
CREATE POLICY profiles_select ON user_profiles 
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY profiles_insert ON user_profiles 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY profiles_update ON user_profiles 
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY profiles_delete ON user_profiles 
  FOR DELETE USING (auth.uid()::text = user_id); 