-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.chats;
DROP TABLE IF EXISTS public.user_profiles;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL, -- Clerk user ID as TEXT
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "speechRecognition": true, "aiVoice": "alloy", "dailyGoal": 15}'::jsonb,
    target_languages JSONB DEFAULT '[{"language": "Spanish", "level": "beginner", "progress": 0, "lastPracticed": "2023-01-01T00:00:00Z", "streak": 0, "vocabulary": {"learned": 0, "mastered": 0, "totalAvailable": 1000}, "grammar": {"learned": 0, "mastered": 0, "totalAvailable": 50}}]'::jsonb,
    dynamic_variables JSONB DEFAULT '{"user_name": "there", "subscription_tier": "free", "language_level": "beginner", "target_language": "Spanish", "days_streak": 0, "vocabulary_mastered": 0, "grammar_mastered": 0, "total_progress": 0, "custom_greeting": "Welcome to your language learning journey", "learning_style": "conversational", "feedback_style": "encouraging", "difficulty_preference": "balanced"}'::jsonb
);

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    unread INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    user_id TEXT NOT NULL, -- Clerk user ID as TEXT (not UUID)
    last_message TEXT
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON public.chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Users can view their own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

-- Create policies for chats
CREATE POLICY "Users can view their own chats"
    ON public.chats FOR SELECT
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own chats"
    ON public.chats FOR INSERT
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own chats"
    ON public.chats FOR UPDATE
    USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own chats"
    ON public.chats FOR DELETE
    USING (auth.uid()::text = user_id);

-- Create policies for messages
CREATE POLICY "Users can view messages in their chats"
    ON public.messages FOR SELECT
    USING (
        chat_id IN (
            SELECT id FROM public.chats
            WHERE auth.uid()::text = user_id
        )
    );

CREATE POLICY "Users can insert messages in their chats"
    ON public.messages FOR INSERT
    WITH CHECK (
        chat_id IN (
            SELECT id FROM public.chats
            WHERE auth.uid()::text = user_id
        )
    );

CREATE POLICY "Users can delete messages in their chats"
    ON public.messages FOR DELETE
    USING (
        chat_id IN (
            SELECT id FROM public.chats
            WHERE auth.uid()::text = user_id
        )
    ); 