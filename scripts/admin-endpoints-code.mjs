/**
 * Lectura mínima de TypeScript para scripts/check-admin-endpoints.mjs: separa el código de sus
 * literales para poder buscar llamadas (`router.get('…')`, `api.post(…)`) sin que un comentario, una
 * regex o un texto con comillas las confunda. No es un parser: alcanza para el estilo del repo.
 */

/** Los saltos de línea de un tramo: el código enmascarado los conserva para que archivo:línea no se corra. */
const newlines = text => text.replace(/[^\n]/g, '')

/** Una regex literal empieza donde no puede haber una división (después de un operador o de `return`). */
const REGEX_BEFORE = /(?:^|[(,=:[!&|?{};+\-*%<>~^]|\breturn|\btypeof)\s*$/

/** Desde la comilla en `i`: el valor del string y dónde termina. */
function readString(source, i) {
  const quote = source[i]
  let value = ''
  i++
  while (i < source.length && source[i] !== quote) {
    if (source[i] === '\\') i++
    value += source[i++] ?? ''
  }
  return { value, end: i + 1 }
}

/** Desde el backtick en `i`: los tramos fijos, las expresiones `${…}` y dónde termina. */
function readTemplate(source, i) {
  const parts = ['']
  const exprs = []
  i++
  while (i < source.length && source[i] !== '`') {
    if (source[i] === '\\') {
      parts[parts.length - 1] += source[i + 1] ?? ''
      i += 2
    }
    else if (source[i] === '$' && source[i + 1] === '{') {
      let depth = 1
      let expr = ''
      i += 2
      while (i < source.length && depth) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') depth--
        if (depth) expr += source[i]
        i++
      }
      exprs.push(expr)
      parts.push('')
    }
    else parts[parts.length - 1] += source[i++]
  }
  return { parts, exprs, end: i + 1 }
}

/** Desde la barra en `i`: dónde termina la regex literal, con sus banderas. */
function skipRegex(source, i) {
  let inClass = false
  i++
  while (i < source.length && (source[i] !== '/' || inClass) && source[i] !== '\n') {
    if (source[i] === '\\') i++
    else if (source[i] === '[') inClass = true
    else if (source[i] === ']') inClass = false
    i++
  }
  i++
  while (/[a-z]/.test(source[i] ?? '')) i++
  return i
}

/**
 * El código sin comentarios, con cada string o template reemplazado por «\0N\0» y cada regex por
 * «/re/», más la lista de literales: { kind: 'string', value } o { kind: 'template', parts, exprs }.
 */
export function mask(source) {
  const literals = []
  let out = ''
  let i = 0
  while (i < source.length) {
    const c = source[i]
    const next = source[i + 1]
    if (c === '/' && next === '/') {
      while (i < source.length && source[i] !== '\n') i++
    }
    else if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      const stop = end === -1 ? source.length : end + 2
      out += newlines(source.slice(i, stop))
      i = stop
    }
    else if (c === '/' && REGEX_BEFORE.test(out.slice(-12))) {
      i = skipRegex(source, i)
      out += '/re/'
    }
    else if (c === '\'' || c === '"') {
      const { value, end } = readString(source, i)
      out += `\0${literals.push({ kind: 'string', value }) - 1}\0`
      i = end
    }
    else if (c === '`') {
      const { parts, exprs, end } = readTemplate(source, i)
      out += `\0${literals.push({ kind: 'template', parts, exprs }) - 1}\0${newlines(source.slice(i, end))}`
      i = end
    }
    else out += source[i++]
  }
  return { code: out, literals }
}

/** El índice del literal si el texto es solo un literal enmascarado. */
export const literalAt = text => /^\0(\d+)\0$/.exec(text.trim())?.[1]

/** Corta los argumentos de una llamada en el nivel de arriba (sin entrar en paréntesis ni llaves). */
export function splitArgs(text) {
  const args = ['']
  let depth = 0
  for (const c of text) {
    if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    if (c === ',' && depth === 0) args.push('')
    else args[args.length - 1] += c
  }
  return args.map(a => a.trim()).filter(Boolean)
}

/** Desde `start` (justo después de un paréntesis abierto), el texto hasta su cierre. */
export function untilClose(code, start) {
  let depth = 1
  let i = start
  while (i < code.length && depth) {
    if (code[i] === '(') depth++
    else if (code[i] === ')') depth--
    i++
  }
  return code.slice(start, i - 1)
}
