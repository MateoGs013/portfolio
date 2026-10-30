<script setup lang="ts">
// Inicio mínimo (F1): comprueba la cañería con la API. P1 lo reemplaza por el inicio de movimiento.
const { t, localeRoute, langAttr } = useLocale()

const [about, contact, projects] = await Promise.all([useDoc('about'), useDoc('contact'), useProjects()])
failOn(about.error)
failOn(projects.error)
await usePageSeo({})

const featured = computed(() => (projects.data.value ?? []).filter(p => p.featured))
const email = computed(() => docText(contact.data.value, 'email'))
</script>

<template>
  <article data-hf="measure" class="flex flex-col gap-16 px-(--pad) py-24">
    <header class="flex flex-col gap-4">
      <h1 class="text-display-name font-medium tracking-tight text-ink" :lang="langAttr(about.data.value, 'display_name')">
        {{ docText(about.data.value, 'display_name') }}
      </h1>
      <p v-if="docText(about.data.value, 'headline')" class="max-w-[58ch] text-l text-dim" :lang="langAttr(about.data.value, 'headline')">
        {{ docText(about.data.value, 'headline') }}
      </p>
    </header>

    <section aria-labelledby="destacada" class="flex flex-col gap-4">
      <h2 id="destacada" class="text-s text-dim">
        {{ t('home.featured') }}
      </h2>
      <ul class="flex flex-col border-t border-rule">
        <li v-for="p in featured" :key="p.slug" class="border-b border-rule">
          <NuxtLink
            :to="localeRoute(`/projects/${p.slug}`)"
            data-row
            data-travel="row"
            :data-tint="p.media[0]?.tint ?? undefined"
            class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 text-ink no-underline focus-visible:outline-2 focus-visible:outline-sig-text"
          >
            <span data-travel-title class="text-xl font-medium">{{ p.title }}</span>
            <span class="text-s text-dim">
              <span :lang="langAttr(p, 'role')">{{ p.role }}</span> · {{ p.year }} · {{ t(`status.${p.status}`) }}
            </span>
          </NuxtLink>
        </li>
      </ul>
      <NuxtLink :to="localeRoute('/projects')" class="w-fit text-m text-ink underline underline-offset-4">
        {{ t('home.allWork') }}
      </NuxtLink>
    </section>

    <section id="contacto" aria-labelledby="contacto-titulo" class="flex flex-col gap-2">
      <h2 id="contacto-titulo" class="text-s text-dim">
        {{ t('nav.contact') }}
      </h2>
      <a v-if="email" :href="`mailto:${email}`" class="w-fit text-xl text-ink underline underline-offset-4">{{ email }}</a>
      <p v-if="docText(contact.data.value, 'availability')" class="text-m text-dim" :lang="langAttr(contact.data.value, 'availability')">
        {{ docText(contact.data.value, 'availability') }}
      </p>
    </section>
  </article>
</template>
