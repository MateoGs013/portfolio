-- Los pedidos de artículos a Eros (semanal, desde el admin o desde una tendencia): qué se pidió, cómo
-- terminó y qué artículo publicó. Aditiva: no toca el contenido; borrar un artículo deja la corrida
-- con articleId en NULL.

-- CreateTable
CREATE TABLE "ArticleRun" (
    "id" SERIAL NOT NULL,
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "topic" TEXT,
    "projectSlug" TEXT,
    "trendId" TEXT,
    "error" TEXT,
    "errorCode" TEXT,
    "articleId" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ArticleRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleRun_trigger_startedAt_idx" ON "ArticleRun"("trigger", "startedAt");

-- CreateIndex
CREATE INDEX "ArticleRun_articleId_idx" ON "ArticleRun"("articleId");

-- AddForeignKey
ALTER TABLE "ArticleRun" ADD CONSTRAINT "ArticleRun_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;

