<script setup lang="ts">
/** Diálogos (común y destructivo con impacto), avisos y los estados de una vista. */
import { ref } from 'vue'
import { requestConfirm } from '../../stores/dialogs'
import { toast } from '../../stores/toasts'
import Button from '../Button.vue'
import Dialog from '../Dialog.vue'
import { ui } from '../dict'
import EmptyState from '../EmptyState.vue'
import ErrorState from '../ErrorState.vue'
import Field from '../Field.vue'
import Skeleton from '../Skeleton.vue'
import TextInput from '../TextInput.vue'
import Sample from './Sample.vue'
import State from './State.vue'
import type { SampleProject } from './useSampleProjects'

const props = defineProps<{ project: SampleProject | null }>()

const t = ui.muestrario
const s = t.sample

const dialogOpen = ref(false)
const company = ref('')
const retrying = ref(false)

function createCompany(): void {
  dialogOpen.value = false
  if (company.value.trim()) toast(`${s.create2}: ${company.value.trim()}`)
  company.value = ''
}

async function askDelete(): Promise<void> {
  const p = props.project
  if (!p) return
  const ok = await requestConfirm({
    title: s.deleteTitle(p.title),
    message: s.deleteText,
    impact: s.deleteImpact(p.media, p.steps, p.techs),
    confirmLabel: s.deleteConfirm,
    destructive: true,
  })
  toast(ok ? s.deleted : s.kept, { tone: ok ? 'ok' : 'info' })
}

function retry(): void {
  retrying.value = true
  setTimeout(() => (retrying.value = false), 900)
}
</script>

<template>
  <Sample :title="t.dialogs.title" :text="t.dialogs.text">
    <div class="flex flex-wrap gap-3">
      <Button data-testid="open-dialog" @click="dialogOpen = true">
        {{ s.openDialog }}
      </Button>
      <Button v-if="project" variant="danger" icon="trash" data-testid="open-confirm" @click="askDelete">
        {{ s.askDelete }}
      </Button>
    </div>
    <Dialog v-model:open="dialogOpen" :title="s.dialogTitle" :description="s.dialogText" size="sm">
      <form id="sample-company" class="grid gap-6" @submit.prevent="createCompany">
        <Field :label="s.company" required>
          <TextInput v-model="company" autocomplete="organization" />
        </Field>
      </form>
      <template #footer>
        <Button variant="ghost" @click="dialogOpen = false">
          {{ ui.actions.cancel }}
        </Button>
        <Button variant="primary" type="submit" form="sample-company">
          {{ s.create2 }}
        </Button>
      </template>
    </Dialog>
  </Sample>

  <Sample :title="t.feedback.title" :text="t.feedback.text">
    <div class="flex flex-wrap gap-3">
      <Button @click="toast(s.okMessage, { action: { label: s.undo, run: () => toast(s.kept, { tone: 'info' }) } })">
        {{ s.toastOk }}
      </Button>
      <Button @click="toast(s.errorMessage, { tone: 'error' })">
        {{ s.toastError }}
      </Button>
    </div>
  </Sample>

  <Sample :title="t.views.title" :text="t.views.text">
    <div class="grid gap-x-16 gap-y-10 lg:grid-cols-2">
      <State :label="t.state.loading">
        <Skeleton variant="form" :count="3" class="w-full" />
      </State>
      <State :label="t.state.empty">
        <EmptyState :title="s.emptyTitle" :text="s.emptyText" class="w-full">
          <Button variant="primary" icon="plus" shortcut="n">
            {{ s.newArticle }}
          </Button>
        </EmptyState>
      </State>
      <State :label="t.state.error" class="lg:col-span-2">
        <ErrorState :message="s.errorMessage" :retrying="retrying" class="w-full" @retry="retry" />
      </State>
    </div>
  </Sample>
</template>
