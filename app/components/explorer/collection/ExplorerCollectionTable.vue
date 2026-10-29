<script setup lang="ts">
import AppIcon from '~/components/ui/AppIcon.vue'
import { pad, type Folder } from '~/lib/explorer'

const props = defineProps<{
  items: Folder['items']
  head: string
}>()

const { isEs, tr, getExperienceLocalization } = usePortfolioLocale()

function formatItemLabel(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    return isEs.value ? (it.role || it.label) : (getExperienceLocalization(it.key)?.role || it.role || it.label)
  }
  return it.label
}

function formatItemMeta(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    if (!isEs.value) {
      return (it.meta || '').replace(/act$/i, 'present')
    }
  }
  return it.meta || ''
}

function formatItemBadge(it: Folder['items'][number]): string {
  if (props.head === 'experience') {
    if (!isEs.value && it.badge?.toLowerCase() === 'act') {
      return 'pres'
    }
  }
  return it.badge || ''
}
</script>

<template>
  <div class="table-container rounded-xl overflow-hidden my-4">
    <table class="data-table">
      <thead>
        <tr>
          <th class="th-n">{{ tr.collection.tableIndex }}</th>
          <th class="th-name">{{ tr.collection.tableName }}</th>
          <th class="th-key">{{ tr.collection.tableSlug }}</th>
          <th class="th-meta">{{ tr.collection.tableMeta }}</th>
          <th class="th-kind">{{ isEs ? 'TIPO' : 'TYPE' }}</th>
          <th class="th-action">{{ isEs ? 'ACCIÓN' : 'ACTION' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(it, n) in items" :key="it.key" class="t-row">
          <td class="td-n">{{ pad(n + 1) }}</td>
          <td class="td-name">
            <NuxtLink :to="it.to" class="t-link" :data-row="it.key">
              <AppIcon :name="it.kind === 'folder' ? 'folder' : 'file'" :size="13" class="t-icon" />
              <span class="t-label">{{ formatItemLabel(it) }}</span>
              <span v-if="it.badge" class="t-badge rounded">{{ formatItemBadge(it) }}</span>
            </NuxtLink>
          </td>
          <td class="td-key"><code>{{ it.key }}</code></td>
          <td class="td-meta">{{ formatItemMeta(it) }}</td>
          <td class="td-kind"><span class="badge-kind rounded">{{ it.kind }}</span></td>
          <td class="td-action">
            <NuxtLink :to="it.to" class="btn-open rounded-md">
              <span>{{ isEs ? 'Abrir' : 'Open' }}</span>
              <AppIcon name="chevron-right" :size="11" />
            </NuxtLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--d-rule);
  background: var(--d-surface);
  margin-top: 8px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: var(--font-text);
  font-size: 13px;
  text-align: left;
}
.data-table th {
  padding: 10px 14px;
  background: var(--d-paper);
  border-bottom: 1px solid var(--d-rule-strong);
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--d-dim);
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--d-rule);
  vertical-align: middle;
}
.t-row:hover,
.t-row:focus-within {
  background: var(--d-hover);
}
.t-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--d-ink);
  text-decoration: none;
  font-weight: 600;
  transition: color var(--d-dur) ease;
}
.t-link:hover,
.t-row:hover .t-link {
  color: var(--d-sig);
}
.t-icon {
  color: var(--d-dim);
  flex-shrink: 0;
  transition: color var(--d-dur) ease;
}
.t-link:hover .t-icon,
.t-row:hover .t-icon {
  color: var(--d-sig);
}
.t-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--d-dim);
  border: 1px solid var(--d-rule);
  padding: 1px 4px;
  margin-left: 4px;
  transition: all var(--d-dur) ease;
}
.t-row:hover .t-badge {
  border-color: var(--d-sig);
  color: var(--d-sig);
}
.td-key code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--d-dim);
}
.td-meta {
  font-family: var(--font-mono);
  font-size: 11.5px;
  color: var(--d-dim);
}
.badge-kind {
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
  padding: 2px 6px;
  background: var(--d-paper);
  border: 1px solid var(--d-rule);
  color: var(--d-dim);
}
.btn-open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--d-sig);
  text-decoration: none;
  padding: 3px 8px;
  border: 1px solid var(--d-rule);
  background: var(--d-paper);
  transition: all var(--d-dur) ease;
}
.btn-open:hover {
  background: var(--d-sig);
  color: var(--d-on-sig);
  border-color: var(--d-sig);
}
</style>
