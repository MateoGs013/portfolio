<script setup lang="ts">
/** Botones, botones con icono, menú y marcas (punto, atajo, mono, espera e iconos). */
import Button from '../Button.vue'
import { ui } from '../dict'
import { muestrario } from './dict'
import Icon from '../Icon.vue'
import { ICON_NAMES } from '../icons'
import IconButton from '../IconButton.vue'
import Kbd from '../Kbd.vue'
import Menu from '../Menu.vue'
import Mono from '../Mono.vue'
import Spinner from '../Spinner.vue'
import StatusDot from '../StatusDot.vue'
import { toast } from '../../stores/toasts'
import Sample from './Sample.vue'
import State from './State.vue'
import type { SampleProject } from './useSampleProjects'

defineProps<{ project: SampleProject | null }>()

const t = muestrario
const s = t.sample

const menuItems = [
  { id: 'view', label: s.viewSite, icon: 'external' as const },
  { id: 'duplicate', label: s.duplicate, icon: 'copy' as const },
  { id: 'slug', label: s.changeSlug },
  { id: 'remove', label: s.remove, icon: 'trash' as const, danger: true },
]
</script>

<template>
  <Sample :title="t.buttons.title" :text="t.buttons.text">
    <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
      <State :label="t.state.rest">
        <Button variant="primary" size="lg" shortcut="mod+s">
          {{ s.save }}
        </Button>
        <Button>{{ s.create }}</Button>
        <Button variant="ghost">
          {{ s.discard }}
        </Button>
        <Button variant="danger" icon="trash">
          {{ s.remove }}
        </Button>
      </State>
      <State :label="t.state.disabled">
        <Button variant="primary" disabled>
          {{ s.save }}
        </Button>
        <Button disabled>
          {{ s.create }}
        </Button>
      </State>
      <State :label="t.state.loading">
        <Button variant="primary" size="lg" loading :loading-label="s.saving">
          {{ s.save }}
        </Button>
        <Button loading :loading-label="s.saving">
          {{ s.create }}
        </Button>
      </State>
      <State :label="s.viewSite">
        <Button v-if="project" :href="`/projects/${project.key}`" external variant="ghost">
          {{ s.viewSite }}
        </Button>
        <Menu :items="menuItems" :label="s.menu" @select="id => toast(`${s.menu}: ${menuItems.find(i => i.id === id)?.label}`, { tone: 'info' })" />
      </State>
    </div>
  </Sample>

  <Sample :title="t.iconButtons.title" :text="t.iconButtons.text">
    <div class="flex flex-wrap gap-8">
      <State :label="t.state.rest">
        <IconButton icon="search" :label="s.search" />
        <IconButton icon="upload" :label="s.upload" variant="secondary" />
        <IconButton icon="trash" :label="s.remove" variant="danger" />
        <IconButton icon="close" :label="ui.actions.close" size="sm" />
      </State>
      <State :label="t.state.disabled">
        <IconButton icon="trash" :label="s.remove" disabled />
      </State>
    </div>
  </Sample>

  <Sample :title="t.marks.title" :text="t.marks.text">
    <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
      <State :label="t.state.rest">
        <StatusDot tone="ok" :label="s.saveState" />
        <StatusDot tone="wip" :label="s.changed" />
        <StatusDot tone="danger" :label="s.failed" />
        <StatusDot :label="s.saving" />
      </State>
      <State label="Kbd">
        <Kbd keys="mod+k" />
        <Kbd keys="mod+s" />
        <Kbd keys="esc" />
        <Kbd keys="up" />
        <Kbd keys="down" />
        <Kbd keys="n" />
      </State>
      <State v-if="project" label="Mono">
        <Mono>{{ project.key }}</Mono>
        <Mono v-if="project.metricKey" size="label">
          {{ project.metricKey }}
        </Mono>
        <Mono>/projects/{{ project.key }}</Mono>
      </State>
      <State :label="t.state.loading">
        <Spinner show-label />
      </State>
    </div>
    <ul class="m-0 flex list-none flex-wrap gap-5 p-0 text-dim" :aria-label="t.marks.title">
      <li v-for="name in ICON_NAMES" :key="name" class="grid justify-items-center gap-2">
        <Icon :name="name" :size="20" />
        <Mono class="text-faint">
          {{ name }}
        </Mono>
      </li>
    </ul>
  </Sample>
</template>
