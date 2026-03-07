import type * as ymaps3Types from '@yandex/ymaps3-types'

declare global {
  interface Window {
    ymaps3: typeof ymaps3Types
  }
}

export {}

