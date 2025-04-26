-- Create suggested_topics table if it doesn't exist
CREATE TABLE IF NOT EXISTS suggested_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,
  audience TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE suggested_topics ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Allow select for everyone" ON suggested_topics;
CREATE POLICY "Allow select for everyone"
  ON suggested_topics
  FOR SELECT
  USING (true);

-- Enable realtime
alter publication supabase_realtime add table suggested_topics;

-- Insert some example data
INSERT INTO suggested_topics (topic, audience, used)
VALUES 
  ('Bæredygtige events', 'Event koordinatorer i København', false),
  ('Hvordan styrker vi følelsen af fællesskab på tværs af teams?', 'Afdelingsledere og teamkoordinatorer', false),
  ('Fremtidens eventbranche', 'Eventplanlæggere og marketingchefer', false),
  ('Digitale værktøjer til eventplanlægning', 'Event managers og koordinatorer', false),
  ('Networking på events', 'Erhvervsledere og iværksættere', false)
ON CONFLICT (id) DO NOTHING;
