/**
 * La elección de mundo persiste en una cookie, no en localStorage:
 * así el servidor puede saltear el umbral en el primer byte, sin flash.
 * Entrar por link directo a un mundo también cuenta como elegirlo.
 * El umbral vuelve a verse en `/umbral` (alias de `/` que no redirige).
 */
import { isWorld, type World } from '~/lib/path'

export default defineNuxtRouteMiddleware((to) => {
  const remembered = useCookie<World | null>('mundo', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const seg = to.path.split('/')[1]
  if (isWorld(seg)) {
    if (remembered.value !== seg) remembered.value = seg
    return
  }

  if (to.path === '/' && isWorld(remembered.value)) {
    return navigateTo({ path: `/${remembered.value}`, query: to.query }, { redirectCode: 302 })
  }
})
