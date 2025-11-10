-- Drop existing tables and triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_updated ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP TABLE IF EXISTS public.linked_accounts;
DROP TABLE IF EXISTS public.users;

-- Create public.users table (main account)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create linked_accounts table (social login connections)
CREATE TABLE public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'kakao', 'naver', 'email'
  provider_user_id TEXT NOT NULL, -- provider's unique user id
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Supabase auth.users id
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_linked_accounts_user_id ON public.linked_accounts(user_id);
CREATE INDEX idx_linked_accounts_provider ON public.linked_accounts(provider, provider_user_id);
CREATE INDEX idx_linked_accounts_auth_user_id ON public.linked_accounts(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.linked_accounts WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (
    id IN (
      SELECT user_id FROM public.linked_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- RLS Policies for linked_accounts table
CREATE POLICY "Users can view their own linked accounts"
  ON public.linked_accounts
  FOR SELECT
  USING (auth_user_id = auth.uid() OR user_id IN (
    SELECT user_id FROM public.linked_accounts WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own linked accounts"
  ON public.linked_accounts
  FOR ALL
  USING (user_id IN (
    SELECT user_id FROM public.linked_accounts WHERE auth_user_id = auth.uid()
  ));

-- Function to get or create user account
CREATE OR REPLACE FUNCTION public.get_or_create_user_account(
  p_email TEXT,
  p_username TEXT,
  p_name TEXT,
  p_avatar_url TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user by email
  SELECT id INTO v_user_id FROM public.users WHERE email = p_email;

  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO public.users (username, email, name, avatar_url)
    VALUES (p_username, p_email, p_name, p_avatar_url)
    RETURNING id INTO v_user_id;
  END IF;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link social account
CREATE OR REPLACE FUNCTION public.link_social_account(
  p_user_id UUID,
  p_provider TEXT,
  p_provider_user_id TEXT,
  p_auth_user_id UUID,
  p_email TEXT,
  p_name TEXT,
  p_avatar_url TEXT
)
RETURNS UUID AS $$
DECLARE
  v_linked_account_id UUID;
BEGIN
  -- Check if this provider account is already linked
  SELECT id INTO v_linked_account_id
  FROM public.linked_accounts
  WHERE provider = p_provider AND provider_user_id = p_provider_user_id;

  -- If already exists, update it
  IF v_linked_account_id IS NOT NULL THEN
    UPDATE public.linked_accounts
    SET
      user_id = p_user_id,
      auth_user_id = p_auth_user_id,
      email = p_email,
      name = p_name,
      avatar_url = p_avatar_url
    WHERE id = v_linked_account_id;
  ELSE
    -- Create new linked account
    INSERT INTO public.linked_accounts (
      user_id, provider, provider_user_id, auth_user_id,
      email, name, avatar_url
    )
    VALUES (
      p_user_id, p_provider, p_provider_user_id, p_auth_user_id,
      p_email, p_name, p_avatar_url
    )
    RETURNING id INTO v_linked_account_id;
  END IF;

  RETURN v_linked_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at on users table
CREATE TRIGGER on_user_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to get user by auth_user_id
CREATE OR REPLACE FUNCTION public.get_user_by_auth_id(p_auth_user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.email, u.name, u.avatar_url, u.role, u.created_at, u.updated_at
  FROM public.users u
  INNER JOIN public.linked_accounts la ON u.id = la.user_id
  WHERE la.auth_user_id = p_auth_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.linked_accounts TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_user_account TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_social_account TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_auth_id TO anon, authenticated;
