-- =============================================================================
-- WhatsApp Commerce Platform - Complete Database Schema
-- =============================================================================
-- Este sistema permite que cada usuário tenha sua própria loja virtual
-- integrada com WhatsApp, onde a IA pode consultar produtos, enviar fotos,
-- e processar vendas de forma completamente isolada por usuário.
-- =============================================================================

-- Tabela principal: Lojas (cada usuário pode ter uma loja)
CREATE TABLE IF NOT EXISTS public.commerce_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    banner_url TEXT,
    whatsapp_number TEXT,
    whatsapp_instance_id TEXT, -- ID da instância Evolution API
    is_active BOOLEAN DEFAULT true,
    ai_personality TEXT DEFAULT 'Você é um vendedor profissional e amigável. Ajude os clientes a encontrar os melhores produtos.',
    ai_instructions TEXT, -- Instruções específicas para a IA
    welcome_message TEXT DEFAULT 'Olá! 👋 Bem-vindo à nossa loja! Como posso ajudá-lo hoje?',
    payment_instructions TEXT, -- Instruções de pagamento personalizadas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Um usuário = uma loja
);

-- Categorias de produtos
CREATE TABLE IF NOT EXISTS public.commerce_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.commerce_categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produtos
CREATE TABLE IF NOT EXISTS public.commerce_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.commerce_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT, -- Descrição curta para IA enviar
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2), -- Preço original (para mostrar desconto)
    cost_price DECIMAL(10,2), -- Custo do produto
    sku TEXT, -- Código do produto
    barcode TEXT,
    stock_quantity INTEGER DEFAULT 0,
    track_stock BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    weight DECIMAL(10,3), -- Peso em kg
    dimensions JSONB, -- {length, width, height}
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[], -- Tags para busca
    metadata JSONB, -- Dados extras flexíveis
    ai_selling_points TEXT, -- Pontos de venda que a IA deve destacar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Imagens dos produtos (múltiplas por produto)
CREATE TABLE IF NOT EXISTS public.commerce_product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.commerce_products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Variações de produtos (tamanhos, cores, etc)
CREATE TABLE IF NOT EXISTS public.commerce_product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.commerce_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Azul - M"
    sku TEXT,
    price DECIMAL(10,2),
    stock_quantity INTEGER DEFAULT 0,
    options JSONB NOT NULL, -- {color: "Azul", size: "M"}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de pagamento
CREATE TABLE IF NOT EXISTS public.commerce_payment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL, -- 'pix', 'credit_card', 'boleto', 'link'
    is_enabled BOOLEAN DEFAULT true,
    -- PIX Settings
    pix_key TEXT,
    pix_key_type TEXT, -- 'cpf', 'cnpj', 'email', 'phone', 'random'
    pix_holder_name TEXT,
    -- Gateway Settings (para integrações futuras)
    gateway_name TEXT, -- 'mercadopago', 'stripe', 'pagseguro'
    gateway_api_key TEXT,
    gateway_webhook_secret TEXT,
    -- Configurações gerais
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, payment_method)
);

-- Clientes da loja (consumidores finais via WhatsApp)
CREATE TABLE IF NOT EXISTS public.commerce_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    whatsapp_number TEXT NOT NULL,
    name TEXT,
    email TEXT,
    cpf TEXT,
    address JSONB, -- {street, number, complement, neighborhood, city, state, zip}
    notes TEXT,
    tags TEXT[],
    total_orders INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    last_order_at TIMESTAMP WITH TIME ZONE,
    first_contact_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, whatsapp_number)
);

-- Pedidos
CREATE TABLE IF NOT EXISTS public.commerce_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.commerce_customers(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL, -- Número legível do pedido
    status TEXT NOT NULL DEFAULT 'pending', 
    -- Status: pending, awaiting_payment, paid, processing, shipped, delivered, cancelled, refunded
    subtotal DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    shipping_cost DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_reference TEXT, -- ID do pagamento externo
    shipping_address JSONB,
    shipping_method TEXT,
    tracking_code TEXT,
    notes TEXT,
    internal_notes TEXT,
    created_via TEXT DEFAULT 'whatsapp', -- whatsapp, manual
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- Itens do pedido
CREATE TABLE IF NOT EXISTS public.commerce_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.commerce_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.commerce_products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.commerce_product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot do nome
    product_sku TEXT,
    variant_name TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversas de comércio (histórico de chat com contexto de venda)
CREATE TABLE IF NOT EXISTS public.commerce_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.commerce_customers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active', -- active, closed, human_takeover
    current_cart JSONB, -- Carrinho atual da conversa
    context JSONB, -- Contexto da IA (produtos vistos, preferências, etc)
    last_message_at TIMESTAMP WITH TIME ZONE,
    ai_summary TEXT, -- Resumo da conversa pela IA
    assigned_to UUID REFERENCES auth.users(id), -- Se foi transferido para humano
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mensagens das conversas de comércio
CREATE TABLE IF NOT EXISTS public.commerce_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.commerce_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- 'customer', 'ai', 'human'
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text', -- text, image, audio, document, product_card
    media_url TEXT,
    product_id UUID REFERENCES public.commerce_products(id), -- Se for card de produto
    metadata JSONB, -- Dados extras (ex: ID do WhatsApp)
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics de comércio
CREATE TABLE IF NOT EXISTS public.commerce_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.commerce_stores(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- product_view, add_to_cart, checkout_start, order_complete, etc
    product_id UUID REFERENCES public.commerce_products(id),
    customer_id UUID REFERENCES public.commerce_customers(id),
    order_id UUID REFERENCES public.commerce_orders(id),
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Stores
CREATE INDEX IF NOT EXISTS idx_commerce_stores_user_id ON public.commerce_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_commerce_stores_whatsapp ON public.commerce_stores(whatsapp_number);

-- Products
CREATE INDEX IF NOT EXISTS idx_commerce_products_store_id ON public.commerce_products(store_id);
CREATE INDEX IF NOT EXISTS idx_commerce_products_category_id ON public.commerce_products(category_id);
CREATE INDEX IF NOT EXISTS idx_commerce_products_active ON public.commerce_products(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_commerce_products_search ON public.commerce_products USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

-- Orders
CREATE INDEX IF NOT EXISTS idx_commerce_orders_store_id ON public.commerce_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_customer_id ON public.commerce_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_status ON public.commerce_orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_commerce_orders_date ON public.commerce_orders(store_id, created_at DESC);

-- Customers
CREATE INDEX IF NOT EXISTS idx_commerce_customers_store_id ON public.commerce_customers(store_id);
CREATE INDEX IF NOT EXISTS idx_commerce_customers_phone ON public.commerce_customers(store_id, whatsapp_number);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_commerce_conversations_store ON public.commerce_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_commerce_conversations_customer ON public.commerce_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_commerce_conversations_active ON public.commerce_conversations(store_id, status);

-- Messages
CREATE INDEX IF NOT EXISTS idx_commerce_messages_conversation ON public.commerce_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_commerce_messages_date ON public.commerce_messages(conversation_id, created_at DESC);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_commerce_analytics_store ON public.commerce_analytics(store_id);
CREATE INDEX IF NOT EXISTS idx_commerce_analytics_date ON public.commerce_analytics(store_id, created_at DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE public.commerce_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_analytics ENABLE ROW LEVEL SECURITY;

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

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Função para gerar número de pedido único
CREATE OR REPLACE FUNCTION generate_order_number(store_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    store_prefix TEXT;
    order_count INTEGER;
    new_number TEXT;
BEGIN
    -- Pega as primeiras 3 letras do nome da loja
    SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
    INTO store_prefix
    FROM public.commerce_stores
    WHERE id = store_uuid;
    
    -- Conta pedidos existentes
    SELECT COUNT(*) + 1
    INTO order_count
    FROM public.commerce_orders
    WHERE store_id = store_uuid;
    
    -- Gera número: PREFIX-YYYYMMDD-NNNN
    new_number := COALESCE(store_prefix, 'ORD') || '-' || 
                  TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                  LPAD(order_count::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar produtos (usada pela IA)
CREATE OR REPLACE FUNCTION search_store_products(
    p_store_id UUID,
    p_query TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    short_description TEXT,
    price DECIMAL,
    compare_at_price DECIMAL,
    stock_quantity INTEGER,
    is_active BOOLEAN,
    category_name TEXT,
    primary_image_url TEXT,
    ai_selling_points TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.short_description,
        p.price,
        p.compare_at_price,
        p.stock_quantity,
        p.is_active,
        c.name AS category_name,
        (SELECT pi.url FROM public.commerce_product_images pi 
         WHERE pi.product_id = p.id AND pi.is_primary = true LIMIT 1) AS primary_image_url,
        p.ai_selling_points
    FROM public.commerce_products p
    LEFT JOIN public.commerce_categories c ON p.category_id = c.id
    WHERE p.store_id = p_store_id
      AND p.is_active = true
      AND (p_query IS NULL OR 
           p.name ILIKE '%' || p_query || '%' OR 
           p.description ILIKE '%' || p_query || '%' OR
           p.tags @> ARRAY[LOWER(p_query)])
      AND (p_category_id IS NULL OR p.category_id = p_category_id)
    ORDER BY p.is_featured DESC, p.name
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para encontrar ou criar cliente
CREATE OR REPLACE FUNCTION find_or_create_customer(
    p_store_id UUID,
    p_whatsapp_number TEXT,
    p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    customer_uuid UUID;
BEGIN
    -- Tenta encontrar cliente existente
    SELECT id INTO customer_uuid
    FROM public.commerce_customers
    WHERE store_id = p_store_id AND whatsapp_number = p_whatsapp_number;
    
    -- Se não existir, cria novo
    IF customer_uuid IS NULL THEN
        INSERT INTO public.commerce_customers (store_id, whatsapp_number, name)
        VALUES (p_store_id, p_whatsapp_number, p_name)
        RETURNING id INTO customer_uuid;
    END IF;
    
    RETURN customer_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar estatísticas do cliente após pedido
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        UPDATE public.commerce_customers
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + NEW.total,
            last_order_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.customer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_customer_stats
    AFTER INSERT OR UPDATE ON public.commerce_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_commerce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trg_commerce_stores_updated_at
    BEFORE UPDATE ON public.commerce_stores
    FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_commerce_products_updated_at
    BEFORE UPDATE ON public.commerce_products
    FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_commerce_orders_updated_at
    BEFORE UPDATE ON public.commerce_orders
    FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_commerce_customers_updated_at
    BEFORE UPDATE ON public.commerce_customers
    FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

CREATE TRIGGER trg_commerce_conversations_updated_at
    BEFORE UPDATE ON public.commerce_conversations
    FOR EACH ROW EXECUTE FUNCTION update_commerce_updated_at();

-- =============================================================================
-- SERVICE ROLE POLICIES (para Edge Functions)
-- =============================================================================

-- Permitir que service role acesse tudo (para webhooks e IA)
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
