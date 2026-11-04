import { defineStore } from 'pinia'
import { loadJson, saveJson } from '../services/storage-service'

/**
 * MY WORLD — 我的世界(本地数据,无账号)。
 * 收藏/去过/想去 三个列表,key 均为目的地 id。
 */
export const useMyWorldStore = defineStore('my-world', {
  state: () => ({
    favorites: loadJson<string[]>('favorites', []),
    visited: loadJson<string[]>('visited', []),
    wantToGo: loadJson<string[]>('want-to-go', []),
    notes: loadJson<Record<string, string>>('notes', {}),
  }),

  getters: {
    isFavorite(state) {
      return (id: string) => state.favorites.includes(id)
    },
    isVisited(state) {
      return (id: string) => state.visited.includes(id)
    },
    isWantToGo(state) {
      return (id: string) => state.wantToGo.includes(id)
    },
  },

  actions: {
    toggleFavorite(id: string) {
      this.favorites = this.favorites.includes(id)
        ? this.favorites.filter((x) => x !== id)
        : [id, ...this.favorites]
      saveJson('favorites', this.favorites)
    },
    toggleVisited(id: string) {
      this.visited = this.visited.includes(id)
        ? this.visited.filter((x) => x !== id)
        : [id, ...this.visited]
      saveJson('visited', this.visited)
    },
    toggleWantToGo(id: string) {
      this.wantToGo = this.wantToGo.includes(id)
        ? this.wantToGo.filter((x) => x !== id)
        : [id, ...this.wantToGo]
      saveJson('want-to-go', this.wantToGo)
    },
    setNote(id: string, note: string) {
      if (note.trim()) {
        this.notes = { ...this.notes, [id]: note.trim() }
      } else {
        const { [id]: _removed, ...rest } = this.notes
        this.notes = rest
      }
      saveJson('notes', this.notes)
    },
  },
})
