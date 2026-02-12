-- Add ElevenLabs API key column to bots table
ALTER TABLE bots
ADD COLUMN IF NOT EXISTS elevenlabs_api_key TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN bots.elevenlabs_api_key IS 'ElevenLabs API key for voice synthesis in voice calls';
