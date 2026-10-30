-- Rediseño «movimiento» (1-nov-2026)
--
-- Suma Metric, los campos nuevos de Media (tint, poster, srcWebm, caption, viewport), la experiencia
-- del CV (kind, highlights, location, cvOrder y la relación con Project) y las tablas *Translation.
-- Convierte los datos existentes antes de cambiar la estructura:
--   1. Media con role LAYER pasa a GALLERY y después sale LAYER del enum (y la columna layer).
--   2. Cada clave del Json `Project.metrics` se vuelve una fila Metric (al final del archivo).
-- La columna `Project.metrics` se conserva (Prisma la llama legacyMetrics) hasta que el parche
-- 2026-11-01-rediseno-datos verifique la conversión; se borra en una migración posterior.

-- CreateEnum
CREATE TYPE "MediaViewport" AS ENUM ('DESKTOP', 'MOBILE');

-- CreateEnum
CREATE TYPE "ExperienceKind" AS ENUM ('EDUCATION', 'THESIS', 'FREELANCE', 'CLIENT', 'PERSONAL');

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('es', 'en');

-- LAYER deja de existir: las capas se muestran como piezas de la galería.
UPDATE "Media" SET "role" = 'GALLERY' WHERE "role" = 'LAYER';

-- AlterEnum
BEGIN;
CREATE TYPE "MediaRole_new" AS ENUM ('COVER', 'GALLERY');
ALTER TABLE "public"."Media" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Media" ALTER COLUMN "role" TYPE "MediaRole_new" USING ("role"::text::"MediaRole_new");
ALTER TYPE "MediaRole" RENAME TO "MediaRole_old";
ALTER TYPE "MediaRole_new" RENAME TO "MediaRole";
DROP TYPE "public"."MediaRole_old";
ALTER TABLE "Media" ALTER COLUMN "role" SET DEFAULT 'GALLERY';
COMMIT;

-- AlterTable
ALTER TABLE "Experience" ADD COLUMN     "cvOrder" INTEGER,
ADD COLUMN     "highlights" TEXT[],
ADD COLUMN     "kind" "ExperienceKind" NOT NULL DEFAULT 'FREELANCE',
ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "Media" DROP COLUMN "layer",
ADD COLUMN     "caption" TEXT,
ADD COLUMN     "poster" TEXT,
ADD COLUMN     "srcWebm" TEXT,
ADD COLUMN     "tint" TEXT,
ADD COLUMN     "viewport" "MediaViewport" NOT NULL DEFAULT 'DESKTOP';

-- CreateTable
CREATE TABLE "Metric" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" DECIMAL(14,4),
    "items" TEXT[],
    "unit" TEXT,
    "label" TEXT,
    "source" TEXT,
    "measuredAt" DATE,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTranslation" (
    "projectId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "role" TEXT,
    "summary" TEXT,
    "brief" TEXT,
    "outcome" TEXT,

    CONSTRAINT "ProjectTranslation_pkey" PRIMARY KEY ("projectId","locale")
);

-- CreateTable
CREATE TABLE "ProcessStepTranslation" (
    "stepId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "body" TEXT,

    CONSTRAINT "ProcessStepTranslation_pkey" PRIMARY KEY ("stepId","locale")
);

-- CreateTable
CREATE TABLE "MediaTranslation" (
    "mediaId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "alt" TEXT,
    "caption" TEXT,

    CONSTRAINT "MediaTranslation_pkey" PRIMARY KEY ("mediaId","locale")
);

-- CreateTable
CREATE TABLE "LinkTranslation" (
    "linkId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT,

    CONSTRAINT "LinkTranslation_pkey" PRIMARY KEY ("linkId","locale")
);

-- CreateTable
CREATE TABLE "ExperienceTranslation" (
    "experienceId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "role" TEXT,
    "summary" TEXT,
    "story" TEXT,
    "highlights" TEXT[],
    "location" TEXT,

    CONSTRAINT "ExperienceTranslation_pkey" PRIMARY KEY ("experienceId","locale")
);

-- CreateTable
CREATE TABLE "TechTranslation" (
    "techId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "note" TEXT,

    CONSTRAINT "TechTranslation_pkey" PRIMARY KEY ("techId","locale")
);

-- CreateTable
CREATE TABLE "ArticleTranslation" (
    "articleId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "title" TEXT,
    "summary" TEXT,
    "content" TEXT,

    CONSTRAINT "ArticleTranslation_pkey" PRIMARY KEY ("articleId","locale")
);

-- CreateTable
CREATE TABLE "_ExperienceToProject" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ExperienceToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Metric_projectId_order_idx" ON "Metric"("projectId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Metric_projectId_key_key" ON "Metric"("projectId", "key");

-- CreateIndex
CREATE INDEX "_ExperienceToProject_B_index" ON "_ExperienceToProject"("B");

-- CreateIndex
CREATE INDEX "Experience_orgId_idx" ON "Experience"("orgId");

-- CreateIndex
CREATE INDEX "Link_projectId_idx" ON "Link"("projectId");

-- CreateIndex
CREATE INDEX "ProcessStep_mediaId_idx" ON "ProcessStep"("mediaId");

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTranslation" ADD CONSTRAINT "ProjectTranslation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessStepTranslation" ADD CONSTRAINT "ProcessStepTranslation_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProcessStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaTranslation" ADD CONSTRAINT "MediaTranslation_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkTranslation" ADD CONSTRAINT "LinkTranslation_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTranslation" ADD CONSTRAINT "ExperienceTranslation_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechTranslation" ADD CONSTRAINT "TechTranslation_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Tech"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleTranslation" ADD CONSTRAINT "ArticleTranslation_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExperienceToProject" ADD CONSTRAINT "_ExperienceToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Experience"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExperienceToProject" ADD CONSTRAINT "_ExperienceToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- metrics Json → filas Metric. Una fila por clave, así no se pierde ninguna:
--   número                 → value
--   texto conocido         → value + unit ('0.8s' → 0.8 s, '1,500 RPD' → 1500 req_day, '$0/mes' → 0 usd_month, '24h' → 24 h)
--   lista                  → items (languages, localModels)
--   otro texto o booleano  → items con un solo elemento
-- La unidad sale de la clave con las mismas reglas que server/src/seed/metrics.ts.
INSERT INTO "Metric" ("projectId", "key", "value", "items", "unit", "order")
SELECT
  p."id",
  m."key",
  CASE
    WHEN jsonb_typeof(m."value") = 'number' THEN (m."value" #>> '{}')::numeric
    WHEN jsonb_typeof(m."value") = 'string' AND m."key" IN ('lcp', 'freeTierQuota', 'operatingCost', 'ephemeralTTL')
      THEN NULLIF(regexp_replace(m."value" #>> '{}', '[^0-9.]', '', 'g'), '')::numeric
    ELSE NULL
  END,
  CASE
    WHEN jsonb_typeof(m."value") = 'array' THEN ARRAY(SELECT jsonb_array_elements_text(m."value"))
    WHEN jsonb_typeof(m."value") IN ('number', 'null') THEN ARRAY[]::TEXT[]
    WHEN jsonb_typeof(m."value") = 'string' AND m."key" IN ('lcp', 'freeTierQuota', 'operatingCost', 'ephemeralTTL')
      THEN ARRAY[]::TEXT[]
    ELSE ARRAY[m."value" #>> '{}']
  END,
  CASE
    WHEN m."key" = 'lcp' THEN 's'
    WHEN m."key" = 'freeTierQuota' THEN 'req_day'
    WHEN m."key" = 'operatingCost' THEN 'usd_month'
    WHEN m."key" = 'ephemeralTTL' THEN 'h'
    WHEN m."key" = 'fpsTarget' THEN 'fps'
    WHEN m."key" ~ 'Ms$' THEN 'ms'
    WHEN m."key" ~ 'Kb$' THEN 'kb'
    ELSE NULL
  END,
  (m."ord" - 1)::INTEGER
FROM "Project" p
CROSS JOIN LATERAL jsonb_each(p."metrics") WITH ORDINALITY AS m("key", "value", "ord")
WHERE jsonb_typeof(p."metrics") = 'object';
