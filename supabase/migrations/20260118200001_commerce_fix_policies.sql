-- =============================================================================
-- WhatsApp Commerce Platform - Script de Correção
-- =============================================================================
-- Execute este script se o anterior deu erro de "policy already exists"
-- =============================================================================

-- Primeiro remove todas as policies existentes
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'commerce_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Agora recria as policies

-- Policies para STORES
CREATE POLICY "Users can view own store" ON public.commerce_stores
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can create own store" ON public.commerce_stores
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update own store" ON public.commerce_stores
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies para CATEGORIES (via store_id)
CREATE POLICY "Users can manage own categories" ON public.commerce_categories
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para PRODUCTS (via store_id)
CREATE POLICY "Users can manage own products" ON public.commerce_products
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para PRODUCT_IMAGES (via product -> store)
CREATE POLICY "Users can manage own product images" ON public.commerce_product_images
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.commerce_products p
            JOIN public.commerce_stores s ON p.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policies para PRODUCT_VARIANTS (via product -> store)
CREATE POLICY "Users can manage own product variants" ON public.commerce_product_variants
    FOR ALL USING (
        product_id IN (
            SELECT p.id FROM public.commerce_products p
            JOIN public.commerce_stores s ON p.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policies para PAYMENT_SETTINGS (via store_id)
CREATE POLICY "Users can manage own payment settings" ON public.commerce_payment_settings
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para CUSTOMERS (via store_id)
CREATE POLICY "Users can manage own customers" ON public.commerce_customers
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para ORDERS (via store_id)
CREATE POLICY "Users can manage own orders" ON public.commerce_orders
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para ORDER_ITEMS (via order -> store)
CREATE POLICY "Users can manage own order items" ON public.commerce_order_items
    FOR ALL USING (
        order_id IN (
            SELECT o.id FROM public.commerce_orders o
            JOIN public.commerce_stores s ON o.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policies para CONVERSATIONS (via store_id)
CREATE POLICY "Users can manage own conversations" ON public.commerce_conversations
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- Policies para MESSAGES (via conversation -> store)
CREATE POLICY "Users can manage own messages" ON public.commerce_messages
    FOR ALL USING (
        conversation_id IN (
            SELECT c.id FROM public.commerce_conversations c
            JOIN public.commerce_stores s ON c.store_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

-- Policies para ANALYTICS (via store_id)
CREATE POLICY "Users can view own analytics" ON public.commerce_analytics
    FOR ALL USING (
        store_id IN (SELECT id FROM public.commerce_stores WHERE user_id = auth.uid())
    );

-- SERVICE ROLE POLICIES (para Edge Functions)
CREATE POLICY "Service role full access stores" ON public.commerce_stores
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access products" ON public.commerce_products
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access customers" ON public.commerce_customers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access orders" ON public.commerce_orders
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access conversations" ON public.commerce_conversations
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access messages" ON public.commerce_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access images" ON public.commerce_product_images
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access categories" ON public.commerce_categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access variants" ON public.commerce_product_variants
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access payments" ON public.commerce_payment_settings
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access order_items" ON public.commerce_order_items
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access analytics" ON public.commerce_analytics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Pronto!
SELECT 'Commerce Platform policies recriadas com sucesso!' as status;
