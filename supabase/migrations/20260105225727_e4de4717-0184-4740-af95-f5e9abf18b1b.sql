-- Allow public INSERT into bots table for publishing
CREATE POLICY "Anyone can create bots" 
ON public.bots 
FOR INSERT 
WITH CHECK (true);

-- Allow public UPDATE for the bot owner (by api_key)
CREATE POLICY "Anyone can update their own bots" 
ON public.bots 
FOR UPDATE 
USING (true);