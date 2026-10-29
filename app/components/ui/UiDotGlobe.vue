<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useBenchoSound } from '~/composables/useBenchoSound'
import { useHyperfocus } from '~/composables/useHyperfocus'

export interface GlobeCity {
  name: string
  lat: number
  lon: number
}

const CITIES: GlobeCity[] = [
  { name: 'Paraná, AR', lat: -31.73, lon: -60.52 },
  { name: 'Buenos Aires', lat: -34.60, lon: -58.38 },
  { name: 'São Paulo', lat: -23.55, lon: -46.63 },
  { name: 'New York', lat: 40.71, lon: -74.00 },
  { name: 'San Francisco', lat: 37.77, lon: -122.42 },
  { name: 'Madrid', lat: 40.42, lon: -3.70 },
  { name: 'London', lat: 51.50, lon: -0.13 },
  { name: 'Tokyo', lat: 35.68, lon: 139.69 },
]

// Land bitmask exactly extracted from Bencho
const FE = 1.5
const IE = `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAfwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPj/z////3EAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/++f///w8AAPADgAEAAOADAAAAAAAAAAAAAAAg3N4f/v///wcAAB8AAAAAAAA4AAAAAAAAAAAAAAADAOAH/P///wcAAA4AAAAAAAAwAAAAAAAAAAAAAAC8cQwBAP///wcAAAAAAIAHAMD/DwDwAAAAAAAAAOAAAAAAAPz//wMAAAAAAGAAAPz/AQAAAAAAAAAAAOBdc/MDAPj//wEAAAAAABjAwP///z9gAAAAA4AAAED8A/P/AOAfAP7//////zjg/v///z//HwAAAPj/A0/8X4PwB/D//wAAAOA/AADh/v///////wM+/AEAAADwPGF++B8A8P///wMAnBMgAgAAAAAAAAAAyA8AAAAAAAB+gA8A/v///wEAOAAAAQAAAAAAAAAA5wEAAAAAAEAP2B/g/4H//8CBBwAAAAAAAAAAAAAAAOD//////88GH8AfAAwAwJ////////////////9/APz//////wNxDIAPAAAA8M///////////////98/APzf/////wHwAwAGAAAA+M///////////////+ADAPAB+P///wHwMwAAAAAA8A//////////////ZBgAAIACgP///wPgfwAAAAAQAAf///////////8fAA4AACAAAP///z/gfwAAAAAwYMf///////////8PAB8AAAQAAP7////5/wMAAABoQOj///////////8DAA8AAAAAgPz////5/wcAAADs+P////////////9/AAcAAAAAAPj////7/wMAAADg+f////////////9/AAEAAAAAAPj/////zwAAAAAw/v////////////+/AAAAAAAAAPD/////Gw4AAACg//////////////8fAAAAAAAAAOD/////HxAAAADA//////////////8fAAAAAAAAAOD//////wAAAACA//9P/vj///////8PAAAAAAAAAOD/////EwAAAACA//wHfPz////////HAAAAAAAAAOD/////AQAAAAD8g/EH8Pj////////gAAAAAAAAAOD/////AAAAAAD8Aebn+fH//////z8AAAAAAAAAAOD///9/AAAAAAD8AGT8//H//////xpgAAAAAAAAAMD///8/AAAAAAD8AMT8//H/////fzggAAAAAAAAAID///8fAAAAAABwdAD8/////////zE4AAAAAAAAAID///8fAAAAAACwfwBD/////////zA/AAAAAAAAAAD+//8PAAAAAAD4fwAA/////////wAHAAAAAAAAAAD8//8DAAAAAAD8/2OA/////////4EAAAAAAAAAAADo//8DAAAAAAD8/+///////////wEAAAAAAAAAAADo/wkCAAAAAAD+//////z//////wEAAAAAAAAAAADYfwACAAAAAID///8///n//////wEAAAAAAAAAAACgfwAWAAAAAMD///9//+H//////wAAAAAAAAAAAAAgfwAAAAAAAMD///9//jPg////fwAAAAAAAAAAAAAAfgAAAAAAAOD//////H/A////PwEAAAAAAAAAAAAAfAAIAAAAAOD//////f/A/+f/BwAAAAAAAAAAAAAAfDBwAAAAAOD/////+X8A/sN/AAAAAAAAAAAAAAAA+DgAAwAAAOD/////+T8A/oB/AwAAAAAAAAAAAAAA4B8AAAAAAOD/////8x8AfoB/AAMAAAAAAAAAAAAAgPwAAAAAAOD/////8wcAPoD+AAEAAAAAAAAAAAAAAPgBAAAAAOD/////7wEAHAD+AQEAAAAAAAAAAAAAAMAAAAAAAOD/////PwAAHAD8AQQAAAAAAAAAAAAAAICAAgAAAMD/////HwMAGADgAAoAAAAAAAAAAAAAAADBfgAAAID//////wMAGABAAAAAAAAAAAAAAAAAAADy/wAAAID//////wEAIAAGAAwAAAAAAAAAAAAAAADw/wEAAAD//////wEAIAAIAAgAAAAAAAAAAAAAAADw/x8AAAD8+P///wAAAAAZYAAAAAAAAAAAAAAAAADg/z8AAAAAwP///wAAAAAbMAAAAAAAAAAAAAAAAADw/z8AAAAAwP//fwAAAAAWfAAAAAAAAAAAAAAAAAD4/38AAAAAwP//HwAAAAAcficAAAAAAAAAAAAAAAD8//8BAAAAwP//DwAAAAAYPiABAAAAAAAAAAAAAAD8//8DAAAAwP//BwAAAAA4vgEaAAAAAAAAAAAAAAD8//8/AAAAgP//BwAAAABwEBL+AAAAAAAAAAAAAAD8////AAAAAP//AwAAAABgAADwAQAAAAAAAAAAAAD8////AQAAAP//AwAAAADABADyAwEAAAAAAAAAAAD4////AQAAAP7/AwAAAAAAHADwBgQAAAAAAAAAAADw////AAAAAP7/BwAAAAAAAAQADAAAAAAAAAAAAADw//9/AAAAAP7/BwAAAAAAAAAAAAAAAAAAAAAAAADg//9/AAAAAP7/BwAAAAAAAICHAAAAAAAAAAAAAADg//8/AAAAAP//BwEAAAAAANDHAAAAAAAAAAAAAADA//8/AAAAAP//hwMAAAAAAPjHAQAAAAAAAAAAAAAA//8/AAAAAP//4QEAAAAAAPzfAQAAAAAAAAAAAAAA/v8/AAAAAP//4AEAAAAAAP7/AwAAAAAAAAAAAAAA/v8fAAAAAP5/wAAAAAAAgP//ByAAAAAAAAAAAAAA/v8fAAAAAP7/4AAAAAAA4P//D0AAAAAAAAAAAAAA/v8HAAAAAPz/4AAAAAAA8P//HwAAAAAAAAAAAAAA/v8AAAAAAPx/YAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/v8AAAAAAPw/AAAAAAAA8P//PwAAAAAAAAAAAAAA/38AAAAAAPgfAAAAAAAA4P//PwAAAAAAAAAAAAAA/z8AAAAAAPAPAAAAAAAA4P//PwAAAAAAAAAAAAAA/x8AAAAAAPAHAAAAAAAA4B/+PwAAAAAAAAAAAAAA/w8AAAAAAPABAAAAAAAA4Af0HwAAAAAAAAAAAAAA/wMAAAAAAAAAAAAAAAAAAADwDwAIAAAAAAAAAACA/wMAAAAAAAAAAAAAAAAAAADgDwAQAAAAAAAAAACA/wEAAAAAAAAAAAAAAAAAAADAAgBwAAAAAAAAAACAfwAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAQAAAAAAAAAACAHwAAAAAAAAAAAAAAAAAAAAAABgAMAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAIADAAAAAAAAAADADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAgwEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAADwAAAR4Pv4HAAAAAAAAAAAAAAAACAAAAAAAAAAA4P8/4P//////BwAAAAAAAAAAAAAAPwAAAAAAAADg//8//P///////wMAAAAAAAAAAACAewAAAADI/v////8///////////8BAAAAAAAAABAAeAAAAID///////////////////8DAAAAAAAe4P//fwAAAMD//////////////////38AAADA////////BwAAAPz//////////////////x8AAEDz//////8/AAAA8P///////////////////x8AABj///////8PAIAH/////////////////////38AAADA//////8/gPAD4P///////////////////wcAAAD+////////P4Dx/////////////////////w8AAAD8//////////////////////////////////8AAPz/AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`

const props = withDefaults(defineProps<{
  size?: number
  homeCity?: string
  speed?: number
  showLegend?: boolean
}>(), {
  size: 240,
  homeCity: 'Paraná, AR',
  speed: 28,
  showLegend: false,
})

const emit = defineEmits<{
  selectCity: [city: GlobeCity]
}>()

const { playSound } = useBenchoSound()
const { isHyperfocus } = useHyperfocus()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const hoveredCity = ref<string | null>(null)

interface Arc {
  from: { x: number; y: number; z: number }
  to: { x: number; y: number; z: number }
  ang: number
  born: number
}

const LE = Math.PI / 180

function getBit(bytes: Uint8Array, lat: number, lon: number): boolean {
  const n = Math.min(119, Math.max(0, Math.floor((90 - lat) / FE)))
  const r = ((Math.floor((lon + 180) / FE) % 240) + 240) % 240
  const i = n * 240 + r
  return (((bytes[i >> 3] ?? 0) >> (i & 7)) & 1) === 1
}

function latLonToVec(lat: number, lon: number) {
  const cosLat = Math.cos(lat * LE)
  return {
    x: cosLat * Math.sin(lon * LE),
    y: Math.sin(lat * LE),
    z: cosLat * Math.cos(lon * LE),
  }
}

function generatePoints(step: number, maskBytes: Uint8Array) {
  const pts = []
  for (let lat = -90 + step / 2; lat < 90; lat += step) {
    const ringCount = Math.max(1, Math.round((360 / step) * Math.cos(lat * LE)))
    for (let e = 0; e < ringCount; e++) {
      const lon = -180 + (e + 0.5) * (360 / ringCount)
      pts.push({
        ...latLonToVec(lat, lon),
        land: getBit(maskBytes, lat, lon),
      })
    }
  }
  return pts
}

function slerpWithLift(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number },
  ang: number,
  t: number,
) {
  const sinAng = Math.sin(ang) || 1e-6
  const k0 = Math.sin((1 - t) * ang) / sinAng
  const k1 = Math.sin(t * ang) / sinAng
  const lift = 1 + Math.sin(Math.PI * t) * 0.32 * Math.sqrt(ang / Math.PI)
  return {
    x: (p1.x * k0 + p2.x * k1) * lift,
    y: (p1.y * k0 + p2.y * k1) * lift,
    z: (p1.z * k0 + p2.z * k1) * lift,
  }
}

let animId = 0
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!import.meta.client || !canvasRef.value) return

  const canvas = canvasRef.value
  const rawCtx = canvas.getContext('2d')
  if (!rawCtx) return
  const ctx: CanvasRenderingContext2D = rawCtx

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = props.size * dpr
  canvas.height = props.size * dpr
  ctx.scale(dpr, dpr)

  // Decode mask bytes
  const rawStr = atob(IE)
  const maskBytes = new Uint8Array(rawStr.length)
  for (let i = 0; i < rawStr.length; i++) {
    maskBytes[i] = rawStr.charCodeAt(i)
  }

  const pts = generatePoints(3.4, maskBytes)
  const home = CITIES.find(c => c.name === props.homeCity) ?? CITIES[0]!
  const homeVec = latLonToVec(home.lat, home.lon)

  let rotA = -home.lon * LE - 0.35
  const tiltI = 22 * LE
  let inertia = 0
  let isPointerDown = false
  let pointerLast = { x: 0, t: 0 }
  let lastTime = performance.now()
  let globalTime = 0
  let nextArcCountdown = 0.5
  const arcs: Arc[] = []
  const renderedCities: Array<{ name: string; x: number; y: number }> = []

  const globeRadius = props.size * 0.42
  const center = props.size / 2

  const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function render(now: number) {
    const dt = Math.min(0.05, (now - lastTime) / 1000)
    lastTime = now
    globalTime += dt

    // Inertia & auto-rotation
    if (!isPointerDown) {
      const autoSpeed = isHyperfocus.value || prefersReduced ? 0 : (props.speed / 100) * 0.45
      rotA += (autoSpeed + inertia) * dt
      inertia *= Math.pow(0.04, dt)
    }

    const sinA = Math.sin(rotA)
    const cosA = Math.cos(rotA)
    const sinI = Math.sin(tiltI)
    const cosI = Math.cos(tiltI)

    function project(p: { x: number; y: number; z: number }) {
      const x1 = p.x * cosA + p.z * sinA
      const z1 = -p.x * sinA + p.z * cosA
      const y2 = p.y * cosI - z1 * sinI
      const z2 = p.y * sinI + z1 * cosI
      return { x: x1, y: y2, z: z2 }
    }

    ctx.clearRect(0, 0, props.size, props.size)

    // Detect theme ink color
    const inkColor = getComputedStyle(canvas).color || '#17181a'
    const sigColor = '#ff3e00'

    // 1. Draw Globe Dots
    for (const pt of pts) {
      const proj = project(pt)
      if (proj.z <= 0) continue

      const screenX = center + proj.x * globeRadius
      const screenY = center - proj.y * globeRadius
      const dotSize = pt.land ? 1.6 * (0.6 + 0.4 * proj.z) : 1.0

      ctx.fillStyle = inkColor
      ctx.globalAlpha = pt.land ? 0.3 + 0.7 * proj.z : 0.08 * proj.z
      ctx.fillRect(screenX - dotSize / 2, screenY - dotSize / 2, dotSize, dotSize)
    }

    // 2. Spawn & Draw Animated Arcs
    if (!prefersReduced && !isHyperfocus.value) {
      nextArcCountdown -= dt
      if (nextArcCountdown <= 0 && arcs.length < 5) {
        const others = CITIES.filter(c => c.name !== home.name)
        const target = others[Math.floor(Math.random() * others.length)] ?? home
        const targetVec = latLonToVec(target.lat, target.lon)
        const dotProduct = Math.max(-1, Math.min(1, homeVec.x * targetVec.x + homeVec.y * targetVec.y + homeVec.z * targetVec.z))
        const angle = Math.acos(dotProduct)
        arcs.push({
          from: homeVec,
          to: targetVec,
          ang: angle,
          born: globalTime,
        })
        nextArcCountdown = 1.2 + Math.random() * 2.2
      }
    }

    ctx.lineCap = 'round'
    for (let i = arcs.length - 1; i >= 0; i--) {
      const arc = arcs[i]
      if (!arc) continue
      const progress = (globalTime - arc.born) / 1.6
      if (progress > 1.45) {
        arcs.splice(i, 1)
        continue
      }

      const head = Math.min(1, progress)
      const tail = Math.max(0, progress - 0.45)

      ctx.beginPath()
      ctx.strokeStyle = sigColor
      ctx.lineWidth = 1.6
      ctx.globalAlpha = 0.85

      let hasStarted = false
      for (let s = 0; s <= 24; s++) {
        const t = tail + (head - tail) * (s / 24)
        const pos3D = project(slerpWithLift(arc.from, arc.to, arc.ang, t))
        const sx = center + pos3D.x * globeRadius
        const sy = center - projY(pos3D.y, globeRadius)
        const isVisible = pos3D.z > 0 || Math.hypot(pos3D.x, pos3D.y) > 1

        if (isVisible) {
          if (!hasStarted) {
            ctx.moveTo(sx, sy)
            hasStarted = true
          }
          else {
            ctx.lineTo(sx, sy)
          }
        }
      }
      ctx.stroke()
    }

    function projY(y: number, r: number) {
      return y * r
    }

    // 3. Draw Cities & Tooltips
    renderedCities.length = 0
    let hoveredData: { name: string; x: number; y: number } | null = null

    for (const city of CITIES) {
      const vec = latLonToVec(city.lat, city.lon)
      const proj = project(vec)
      if (proj.z <= 0.05) continue

      const sx = center + proj.x * globeRadius
      const sy = center - proj.y * globeRadius
      const isHome = city.name === home.name
      const isHovered = city.name === hoveredCity.value

      renderedCities.push({ name: city.name, x: sx, y: sy })

      // City marker circle
      ctx.globalAlpha = isHome || isHovered ? 1 : 0.5 + 0.5 * proj.z
      ctx.fillStyle = isHome ? sigColor : inkColor
      ctx.beginPath()
      ctx.arc(sx, sy, isHome ? 3.6 : isHovered ? 3.2 : 2.4, 0, Math.PI * 2)
      ctx.fill()

      if (isHome) {
        // Subtle beacon ring for home
        ctx.strokeStyle = sigColor
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.4 + 0.3 * Math.sin(globalTime * 3)
        ctx.beginPath()
        ctx.arc(sx, sy, 6, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (isHovered) {
        hoveredData = { name: city.name, x: sx, y: sy }
      }
    }

    // Tooltip pill for hovered city
    if (hoveredData) {
      ctx.font = '500 11px ui-monospace, monospace'
      const label = hoveredData.name
      const textWidth = ctx.measureText(label).width
      const pillW = textWidth + 16
      const pillH = 22
      const pillX = hoveredData.x + 8 + pillW > props.size ? hoveredData.x - pillW - 8 : hoveredData.x + 8
      const pillY = hoveredData.y - pillH / 2

      ctx.globalAlpha = 0.95
      ctx.fillStyle = '#111214'
      ctx.beginPath()
      ctx.roundRect(pillX, pillY, pillW, pillH, 6)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 62, 0, 0.4)'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, pillX + 8, pillY + pillH / 2 + 0.5)
    }

    animId = requestAnimationFrame(render)
  }

  // Pointer interactions
  function onPointerDown(e: PointerEvent) {
    isPointerDown = true
    pointerLast = { x: e.clientX, t: performance.now() }
    inertia = 0
    try {
      canvas.setPointerCapture(e.pointerId)
    }
    catch {
      // ignore pointer capture error
    }
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect()
    const scale = props.size / rect.width
    const cx = (e.clientX - rect.left) * scale
    const cy = (e.clientY - rect.top) * scale

    if (isPointerDown) {
      const now = performance.now()
      const dx = (e.clientX - pointerLast.x) / globeRadius
      rotA += dx
      const dtSec = Math.max(0.008, (now - pointerLast.t) / 1000)
      inertia = inertia * 0.5 + (dx / dtSec) * 0.5
      pointerLast = { x: e.clientX, t: now }
    }
    else {
      // Hit testing
      let found: string | null = null
      for (const city of renderedCities) {
        if (Math.hypot(city.x - cx, city.y - cy) < 10) {
          found = city.name
          break
        }
      }
      if (found !== hoveredCity.value) {
        hoveredCity.value = found
        if (found) playSound('poke')
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (!isPointerDown) return
    isPointerDown = false
    try {
      canvas.releasePointerCapture(e.pointerId)
    }
    catch {
      // ignore pointer release error
    }
    inertia = Math.max(-5, Math.min(5, inertia))

    // If tapped directly on a city
    if (hoveredCity.value) {
      const c = CITIES.find(city => city.name === hoveredCity.value)
      if (c) emit('selectCity', c)
    }
  }

  function onPointerLeave() {
    hoveredCity.value = null
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', onPointerLeave)

  // Intersection Observer
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      lastTime = performance.now()
      if (!animId) animId = requestAnimationFrame(render)
    }
    else {
      if (animId) {
        cancelAnimationFrame(animId)
        animId = 0
      }
    }
  }, { threshold: 0.15 })

  observer.observe(canvas)
  animId = requestAnimationFrame(render)
})

onBeforeUnmount(() => {
  if (animId) cancelAnimationFrame(animId)
  observer?.disconnect()
})
</script>

<template>
  <div class="glb-container inline-flex flex-col items-center justify-center select-none relative">
    <canvas
      ref="canvasRef"
      class="glb block cursor-grab active:cursor-grabbing shrink-0"
      :style="{ width: `${size}px`, height: `${size}px` }"
      :data-hover="hoveredCity ? 'true' : undefined"
      :aria-label="`Interactive 3D Dotted Globe with nodes connecting to ${homeCity}`"
      role="img"
    />
    <div v-if="showLegend" class="glb-legend mt-2 flex items-center gap-3 font-mono text-[10px] text-faint">
      <span class="inline-flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-sig" />
        {{ homeCity }}
      </span>
      <span class="text-rule">&bull;</span>
      <span>8 Global Relational Nodes</span>
    </div>
  </div>
</template>

<style scoped>
.glb {
  color: var(--d-ink, #17181a);
  touch-action: none;
  display: block;
}

.glb[data-hover="true"] {
  cursor: pointer;
}
</style>
