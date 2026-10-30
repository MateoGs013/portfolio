<script setup lang="ts">
// Los PDF publicados del CV (contact.cv): el del idioma de la página para descargar y el del otro
// idioma como enlace, rotulado en su propio idioma. Sin rutas ni nombres escritos acá.
import { langs, translate } from '~/lib/dict'

const { t, lang } = useLocale()
const { data: files } = await useCvFiles()

const active = computed(() => files.value?.[lang.value])
const other = computed(() => {
  const l = langs.find(candidate => candidate !== lang.value)
  const file = l ? files.value?.[l] : undefined
  return l && file ? { lang: l, file, label: translate('cv.otherPdf', l) } : null
})
</script>

<template>
  <ul v-if="active || other" data-chrome class="no-print flex flex-wrap items-center gap-x-6 gap-y-2 text-s">
    <li v-if="active">
      <a
        :href="active.href"
        :download="active.name"
        :title="t('cv.downloadHint', { file: active.name })"
        class="inline-flex items-center gap-2 text-ink"
      >
        <AppIcon name="download" :size="15" class="text-dim" />
        <span class="roll"><span :data-t="t('cv.download')">{{ t('cv.download') }}</span></span>
      </a>
    </li>
    <li v-if="other">
      <a
        :href="other.file.href"
        :download="other.file.name"
        :hreflang="other.lang"
        :lang="other.lang"
        class="inline-flex text-dim transition-colors duration-300 hover:text-ink focus-visible:text-ink"
      >
        <span class="roll"><span :data-t="other.label">{{ other.label }}</span></span>
      </a>
    </li>
  </ul>
</template>
