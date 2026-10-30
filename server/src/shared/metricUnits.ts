/**
 * Unidades de Metric.unit. NULL es un conteo o un puntaje. El rótulo de cada una va en el
 * diccionario de interfaz; el valor se formatea con Intl según el idioma.
 *
 * Vive en server/ porque el API la usa en tiempo de ejecución y Dockerfile.api no copia app/.
 * app/lib/fieldMeta.ts la reexporta para el front.
 */
export const metricUnits = ['s', 'ms', 'kb', 'fps', 'h', 'req_day', 'usd_month'] as const
export type MetricUnit = typeof metricUnits[number]
