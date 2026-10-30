<script setup lang="ts">
import { ref } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'

export interface TreeNode {
  name: string
  meta?: string
  to?: string
  kids?: TreeNode[]
}

const props = withDefaults(defineProps<{
  root: TreeNode
  indent?: number
  guides?: boolean
  initialOpen?: string[]
  initialSelected?: string
}>(), {
  indent: 18,
  guides: true,
  initialOpen: () => ['db', 'db/projects', 'db/stack'],
  initialSelected: 'db/projects/la-rucula.ts',
})

const emit = defineEmits<{
  select: [path: string, node: TreeNode]
}>()

const { playSound } = useBenchoSound()

const openSet = ref<Set<string>>(new Set(props.initialOpen))
const selectedPath = ref<string>(props.initialSelected)

function isOpen(path: string): boolean {
  return openSet.value.has(path)
}

function toggleNode(node: TreeNode, path: string) {
  if (node.kids?.length) {
    const next = new Set(openSet.value)
    if (next.has(path)) {
      next.delete(path)
      playSound('press')
    }
    else {
      next.add(path)
      playSound('expand')
    }
    openSet.value = next
  }
  else {
    selectedPath.value = path
    playSound('tock')
    emit('select', path, node)
  }
}
</script>

<template>
  <div class="tre w-full select-none">
    <ul class="tre-card list-none m-0 p-1.5 rounded-xl border border-rule bg-paper/70" aria-label="Árbol de registros">
      <!-- Nivel 0 (Raíz) -->
      <li class="tre-item">
        <button
          type="button"
          class="tre-row"
          :data-on="(!root.kids?.length && selectedPath === root.name) || undefined"
          :aria-expanded="root.kids?.length ? isOpen(root.name) : undefined"
          @click="toggleNode(root, root.name)"
        >
          <span class="tre-chev" :data-open="isOpen(root.name) || undefined" aria-hidden="true">
            <svg v-if="root.kids?.length" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
          <span class="tre-mark text-sig" aria-hidden="true">
            <AppIcon name="db" :size="13" />
          </span>
          <span class="tre-name font-mono text-[12px] font-medium">{{ root.name }}</span>
          <span v-if="root.meta" class="ml-auto font-mono text-[10px] text-faint">{{ root.meta }}</span>
        </button>

        <!-- Nivel 1 -->
        <ul
          v-if="root.kids?.length && isOpen(root.name)"
          class="tre-kids list-none m-0 p-0"
          :data-guides="guides || undefined"
          :style="{ '--tre-x': '14px' }"
        >
          <li
            v-for="(n1, i1) in root.kids"
            :key="`${root.name}/${n1.name}`"
            class="tre-item tre-stagger"
            :style="{ '--delay': `${20 + i1 * 25}ms` }"
          >
            <button
              type="button"
              class="tre-row"
              :style="{ marginLeft: `${indent}px`, width: `calc(100% - ${indent}px)` }"
              :data-on="(!n1.kids?.length && selectedPath === `${root.name}/${n1.name}`) || undefined"
              :aria-expanded="n1.kids?.length ? isOpen(`${root.name}/${n1.name}`) : undefined"
              @click="toggleNode(n1, `${root.name}/${n1.name}`)"
            >
              <span class="tre-chev" :data-open="isOpen(`${root.name}/${n1.name}`) || undefined" aria-hidden="true">
                <svg v-if="n1.kids?.length" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </span>
              <span class="tre-mark" aria-hidden="true">
                <AppIcon :name="n1.kids?.length ? 'folder' : 'file'" :size="13" />
              </span>
              <span class="tre-name font-mono text-[11.5px]">{{ n1.name }}</span>
              <span v-if="n1.meta" class="ml-auto font-mono text-[10px] text-faint">{{ n1.meta }}</span>
            </button>

            <!-- Nivel 2 -->
            <ul
              v-if="n1.kids?.length && isOpen(`${root.name}/${n1.name}`)"
              class="tre-kids list-none m-0 p-0"
              :data-guides="guides || undefined"
              :style="{ '--tre-x': `${indent + 14}px` }"
            >
              <li
                v-for="(n2, i2) in n1.kids"
                :key="`${root.name}/${n1.name}/${n2.name}`"
                class="tre-item tre-stagger"
                :style="{ '--delay': `${20 + i2 * 25}ms` }"
              >
                <button
                  type="button"
                  class="tre-row"
                  :style="{ marginLeft: `${indent * 2}px`, width: `calc(100% - ${indent * 2}px)` }"
                  :data-on="selectedPath === `${root.name}/${n1.name}/${n2.name}` || undefined"
                  @click="toggleNode(n2, `${root.name}/${n1.name}/${n2.name}`)"
                >
                  <span class="tre-chev" aria-hidden="true" />
                  <span class="tre-mark" aria-hidden="true">
                    <AppIcon name="file" :size="12" />
                  </span>
                  <span class="tre-name font-mono text-[11.5px]">{{ n2.name }}</span>
                  <span v-if="n2.meta" class="ml-auto font-mono text-[10px] text-faint">{{ n2.meta }}</span>
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Bencho tree-view (.tre-*) exact geometry & transitions */
.tre-row {
  border-radius: 6px;
  width: 100%;
  height: 29px;
  color: color-mix(in srgb, var(--d-ink) 72%, var(--d-surface));
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  align-items: center;
  gap: 6px;
  padding: 0 10px 0 6px;
  display: flex;
  transition: background-color 0.16s, color 0.16s;
}

.tre-row:hover {
  background: var(--d-hover);
  color: var(--d-ink);
}

.tre-row[data-on] {
  background: var(--d-surface-raised);
  color: var(--d-ink);
  font-weight: 500;
}

.tre-chev,
.tre-mark {
  color: var(--d-dim);
  flex: none;
  place-items: center;
  display: grid;
}

.tre-chev {
  width: 12px;
  height: 12px;
  transition: rotate 0.22s cubic-bezier(0.22, 1, 0.36, 1);
}

.tre-chev[data-open] {
  rotate: 90deg;
}

.tre-row[data-on] .tre-mark {
  color: var(--d-sig);
}

.tre-name {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.tre-kids {
  position: relative;
  overflow: hidden;
}

.tre-kids[data-guides]::before {
  content: "";
  left: var(--tre-x, 14px);
  background: color-mix(in srgb, var(--d-ink) 12%, transparent);
  width: 1px;
  position: absolute;
  top: 2px;
  bottom: 6px;
}

.tre-stagger {
  animation: tre-enter 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--delay, 0ms);
}

@keyframes tre-enter {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
