-- Create ecommerce product extension table
-- 1:1 relation with products table
CREATE TABLE IF NOT EXISTS "product_ecommerce" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ecommerce_price" DOUBLE PRECISION,
    "compare_at_price" DOUBLE PRECISION,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ,
    "slug" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "short_description" TEXT,
    "long_description" TEXT,
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "show_stock" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "product_ecommerce_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_ecommerce_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE,
    CONSTRAINT "product_ecommerce_product_id_unique" UNIQUE ("product_id"),
    CONSTRAINT "product_ecommerce_slug_unique" UNIQUE ("slug")
);

CREATE INDEX IF NOT EXISTS "product_ecommerce_visible_idx" ON "product_ecommerce"("visible");
CREATE INDEX IF NOT EXISTS "product_ecommerce_featured_idx" ON "product_ecommerce"("featured");
CREATE INDEX IF NOT EXISTS "product_ecommerce_sort_order_idx" ON "product_ecommerce"("sort_order");
CREATE INDEX IF NOT EXISTS "product_ecommerce_published_at_idx" ON "product_ecommerce"("published_at");

-- Create product media table for images/gallery
CREATE TABLE IF NOT EXISTS "product_media" (
    "id" TEXT NOT NULL,
    "ecommerce_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "storage_provider" TEXT NOT NULL DEFAULT 'placeholder',
    "storage_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT "product_media_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_media_ecommerce_id_fkey" FOREIGN KEY ("ecommerce_id") REFERENCES "product_ecommerce"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "product_media_ecommerce_id_idx" ON "product_media"("ecommerce_id");
CREATE INDEX IF NOT EXISTS "product_media_is_primary_idx" ON "product_media"("is_primary");

-- Auto-update updated_at on product_ecommerce
CREATE OR REPLACE FUNCTION update_product_ecommerce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_ecommerce_updated_at ON "product_ecommerce";
CREATE TRIGGER trigger_product_ecommerce_updated_at
    BEFORE UPDATE ON "product_ecommerce"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_ecommerce_updated_at();
