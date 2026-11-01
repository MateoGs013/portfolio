-- Rótulo propio de una métrica en inglés (D2). Aditiva: las métricas existentes no tienen fila y la
-- API sirve su `label` en español, listado en `untranslated`. Se borra con la métrica.

-- CreateTable
CREATE TABLE "MetricTranslation" (
    "metricId" INTEGER NOT NULL,
    "locale" "Locale" NOT NULL,
    "label" TEXT,

    CONSTRAINT "MetricTranslation_pkey" PRIMARY KEY ("metricId","locale")
);

-- AddForeignKey
ALTER TABLE "MetricTranslation" ADD CONSTRAINT "MetricTranslation_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
