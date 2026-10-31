<script setup lang="ts">
// Pie: el contacto, en todas las páginas (#contacto). Todo sale del doc contact en el idioma de la
// página: email, tiempo de respuesta, disponibilidad, ubicación, zona horaria, GitHub, LinkedIn y el PDF
// del CV.
import { CONTACT_ID } from '~/composables/useHotkeys'

const { t, localeRoute, langAttr } = useLocale()
const contact = useDoc('contact')

const doc = computed(() => contact.data.value)
const email = computed(() => docText(doc.value, 'email'))
// La primera parte de la disponibilidad («Inmediata»); el detalle está en Sobre mí y en el CV.
const availability = computed(() => docText(doc.value, 'availability')?.split('·')[0]?.trim() || null)
const location = computed(() => docText(doc.value, 'location'))
const timeZone = computed(() => docText(doc.value, 'time_zone'))
const responseTime = computed(() => docText(doc.value, 'response_time'))

const external = computed(() => [
  { field: 'github', label: t('shell.github') },
  { field: 'linkedin', label: t('shell.linkedin') },
  { field: 'cv', label: t('nav.cv') },
].flatMap(({ field, label }) => {
  const href = docText(doc.value, field)
  return href ? [{ field, href, label }] : []
}))
</script>

<template>
  <footer :id="CONTACT_ID" data-chrome tabindex="-1" class="px-pad pt-[clamp(6rem,20vh,12rem)] pb-pad outline-none">
    <MailCopy v-if="email" :email="email">
      <p class="text-s text-dim">
        {{ t('shell.talk') }}<template v-if="responseTime">
          {{ ' ' }}<span :lang="langAttr(doc, 'response_time')">{{ responseTime }}</span>
        </template>
      </p>
    </MailCopy>
    <p v-else class="text-s text-dim">
      {{ t('shell.talk') }}<template v-if="responseTime">
        {{ ' ' }}<span :lang="langAttr(doc, 'response_time')">{{ responseTime }}</span>
      </template>
    </p>

    <div class="mt-[clamp(3rem,10vh,6rem)] flex flex-wrap justify-between gap-x-8 gap-y-4 border-t border-rule pt-5 text-s text-dim">
      <p class="flex flex-wrap items-center gap-x-2">
        <template v-if="availability">
          <span aria-hidden="true" class="inline-block size-[0.45rem] rounded-full bg-ok" />
          <span :lang="langAttr(doc, 'availability')">{{ availability }}</span>
        </template>
        <template v-if="location">
          <span v-if="availability" aria-hidden="true">·</span>
          <span :lang="langAttr(doc, 'location')">{{ location }}</span>
        </template>
        <template v-if="timeZone">
          <span v-if="availability || location" aria-hidden="true">·</span>
          <FooterClock :time-zone="timeZone" />
        </template>
      </p>

      <nav :aria-label="t('shell.elsewhere')">
        <ul class="flex flex-wrap gap-x-6 gap-y-2 text-ink coarse:gap-y-5">
          <li>
            <NuxtLink v-magnet :to="localeRoute('/articles')" class="hit inline-flex min-h-6 items-center">
              <RollText :text="t('nav.articles')" />
            </NuxtLink>
          </li>
          <li v-for="link in external" :key="link.field">
            <a v-magnet :href="link.href" target="_blank" rel="noopener noreferrer" class="hit inline-flex min-h-6 items-center gap-1">
              <RollText :text="link.label" />
              <AppIcon name="external" :size="12" class="text-dim" />
              <span class="sr-only">{{ t('shell.newTab') }}</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  </footer>
</template>
