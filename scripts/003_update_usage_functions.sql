-- Function to safely increment usage count
CREATE OR REPLACE FUNCTION increment_usage(user_id_in uuid, increment_value int)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET usage_count = usage_count + increment_value
  WHERE id = user_id_in;
END;
$$ LANGUAGE plpgsql;

-- Function to safely decrement usage count
CREATE OR REPLACE FUNCTION decrement_usage(user_id_in uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.users
  SET usage_count = usage_count - 1
  WHERE id = user_id_in AND usage_count > 0;
END;
$$ LANGUAGE plpgsql;