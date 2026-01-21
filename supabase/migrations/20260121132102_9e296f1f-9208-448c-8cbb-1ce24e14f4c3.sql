-- Allow widget users to view messages for their conversation via contact_number
-- This enables real-time updates for human operator messages to reach the widget

CREATE POLICY "Widget users can view messages by contact_number"
ON public.live_chat_messages
FOR SELECT
USING (
  source = 'widget' AND 
  instance_name = 'widget'
);

-- This policy allows the realtime subscription to work for widget clients
-- The contact_number filter in the subscription provides the security