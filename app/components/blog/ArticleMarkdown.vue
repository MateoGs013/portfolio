<script setup lang="ts">
// Renderizador técnico de Markdown para artículos del Blog y Dossiers de Ingeniería.
// Tipografía de alta precisión, bloques de código con selector de lenguaje y copiado en 1 clic.
// Estética Obsidian Dark y acentos International Orange. Cero emojis.
import AppIcon from '~/components/ui/AppIcon.vue'

const props = defineProps<{
  content: string
}>()

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'code' | 'list' | 'quote' | 'p'
  content?: string
  lang?: string
  items?: string[]
}

const blocks = computed<Block[]>(() => {
  if (!props.content) return []
  const lines = props.content.split('\n')
  const result: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]!
    const trimmed = line.trim()

    // Bloque de código cercado
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim() || 'code'
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i]!.trim().startsWith('```')) {
        codeLines.push(lines[i]!)
        i++
      }
      result.push({
        type: 'code',
        lang,
        content: codeLines.join('\n'),
      })
      i++
      continue
    }

    // Encabezados
    if (trimmed.startsWith('### ')) {
      result.push({ type: 'h3', content: trimmed.slice(4).trim() })
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      result.push({ type: 'h2', content: trimmed.slice(3).trim() })
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      result.push({ type: 'h1', content: trimmed.slice(2).trim() })
      i++
      continue
    }

    // Citas técnicas
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [trimmed.slice(2).trim()]
      i++
      while (i < lines.length && lines[i]!.trim().startsWith('> ')) {
        quoteLines.push(lines[i]!.trim().slice(2).trim())
        i++
      }
      result.push({ type: 'quote', content: quoteLines.join(' ') })
      continue
    }

    // Listas (ordenadas o con guiones)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = []
      while (i < lines.length) {
        const cur = lines[i]!.trim()
        if (cur.startsWith('- ') || cur.startsWith('* ')) {
          listItems.push(cur.slice(2).trim())
          i++
        }
        else if (/^\d+\.\s/.test(cur)) {
          listItems.push(cur.replace(/^\d+\.\s*/, '').trim())
          i++
        }
        else if (cur === '') {
          break
        }
        else {
          break
        }
      }
      result.push({ type: 'list', items: listItems })
      continue
    }

    // Líneas vacías
    if (trimmed === '') {
      i++
      continue
    }

    // Párrafos continuos
    const pLines: string[] = [trimmed]
    i++
    while (i < lines.length) {
      const nextTrimmed = lines[i]!.trim()
      if (
        nextTrimmed === ''
        || nextTrimmed.startsWith('#')
        || nextTrimmed.startsWith('```')
        || nextTrimmed.startsWith('> ')
        || nextTrimmed.startsWith('- ')
        || /^\d+\.\s/.test(nextTrimmed)
      ) {
        break
      }
      pLines.push(nextTrimmed)
      i++
    }
    result.push({ type: 'p', content: pLines.join(' ') })
  }

  return result
})

const copiedIndex = ref<number | null>(null)

async function copyCode(code: string, idx: number) {
  try {
    await navigator.clipboard.writeText(code)
    copiedIndex.value = idx
    setTimeout(() => {
      if (copiedIndex.value === idx) copiedIndex.value = null
    }, 2000)
  }
  catch {
    // Fallback silencioso
  }
}

function sanitizeUrl(url?: string): string | null {
  if (!url) return null
  const trimmed = url.trim()
  // Solo permitir http://, https://, mailto:, anclas (#) o rutas relativas (/)
  // Rechazar terminantemente javascript:, data: y cualquier otro pseudo-protocolo
  if (!/^(?:https?:\/\/|mailto:|\/|#)/i.test(trimmed)) {
    return null
  }

  // Escapar caracteres peligrosos para evitar inyección en atributos HTML
  return trimmed
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function renderInline(text?: string): string {
  if (!text) return ''
  // Escapar caracteres html básicos
  let out = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Negrita **texto**
  out = out.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-ink">$1</strong>')

  // Código en línea `código`
  out = out.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 font-mono text-[11.5px] bg-paper border border-rule text-sig rounded-[2px]">$1</code>')

  // Enlaces [texto](url) sanitizados contra inyección XSS
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const sanitized = sanitizeUrl(href)
    if (!sanitized) return label
    const isExternal = /^https?:\/\//i.test(sanitized)
    const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${sanitized}"${targetAttrs} class="text-sig underline underline-offset-2 hover:text-sig-hover hover:decoration-sig">${label}${isExternal ? ' ↗' : ''}</a>`
  })

  return out
}
</script>

<template>
  <div class="article-markdown flex flex-col gap-5 w-full min-w-0 font-sans text-ink leading-relaxed">
    <template v-for="(block, idx) in blocks" :key="idx">
      <!-- H1 -->
      <h1 v-if="block.type === 'h1'" class="font-sans text-[22px] sm:text-[26px] font-bold text-ink tracking-tight pt-4 pb-2 border-b border-rule m-0">
        {{ block.content }}
      </h1>

      <!-- H2 -->
      <h2 v-else-if="block.type === 'h2'" class="font-sans text-[18px] sm:text-[21px] font-bold text-ink tracking-tight pt-4 pb-1.5 border-b border-rule/50 flex items-center gap-2 m-0">
        <span class="text-sig font-mono text-[14px]">§</span>
        <span>{{ block.content }}</span>
      </h2>

      <!-- H3 -->
      <h3 v-else-if="block.type === 'h3'" class="font-sans text-[15px] sm:text-[17px] font-bold text-ink pt-2 m-0">
        {{ block.content }}
      </h3>

      <!-- Bloque de código -->
      <div v-else-if="block.type === 'code'" class="code-chassis bg-black/80 border border-rule-strong rounded-[2px] overflow-hidden my-2 shadow-md">
        <div class="code-bar flex items-center justify-between px-3.5 py-1.5 bg-surface-raised border-b border-rule font-mono text-[10.5px]">
          <span class="code-lang text-sig font-bold uppercase tracking-wider">{{ block.lang }}</span>
          <button
            type="button"
            class="copy-btn inline-flex items-center gap-1.5 px-2 py-0.5 border border-rule bg-paper text-dim text-[10px] font-mono font-bold cursor-pointer transition-colors duration-150 hover:border-sig hover:text-sig"
            :class="{ '!border-sig !text-sig': copiedIndex === idx }"
            @click="copyCode(block.content ?? '', idx)"
          >
            <AppIcon :name="copiedIndex === idx ? 'check' : 'copy'" :size="11" />
            <span>{{ copiedIndex === idx ? 'COPIADO' : 'COPIAR' }}</span>
          </button>
        </div>
        <pre class="m-0 p-3.5 sm:p-4 bg-transparent text-[#e6edf3] font-mono text-[12px] sm:text-[12.5px] leading-relaxed overflow-x-auto"><code class="break-normal whitespace-pre">{{ block.content }}</code></pre>
      </div>

      <!-- Cita Técnica -->
      <blockquote v-else-if="block.type === 'quote'" class="m-0 p-3.5 sm:p-4 bg-surface border-l-4 border-sig border-y border-r border-rule rounded-[2px] font-mono text-[13px] sm:text-[13.5px] text-dim leading-relaxed">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="renderInline(block.content)" />
      </blockquote>

      <!-- Listas -->
      <ul v-else-if="block.type === 'list'" class="m-0 pl-5 flex flex-col gap-1.5 list-disc text-[14.5px] sm:text-[15px] text-ink leading-relaxed">
        <li v-for="(item, itemIdx) in block.items" :key="itemIdx" class="pl-1">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="renderInline(item)" />
        </li>
      </ul>

      <!-- Párrafo estándar -->
      <p v-else-if="block.type === 'p'" class="m-0 text-[14.5px] sm:text-[15.5px] text-ink/95 leading-relaxed break-words">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span v-html="renderInline(block.content)" />
      </p>
    </template>
  </div>
</template>

<style scoped>
.article-markdown :deep(code) {
  font-family: var(--font-mono, monospace);
}
</style>
