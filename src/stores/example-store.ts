import { create } from 'zustand'

interface ExampleStore {
  count: number
  message: string
  increment: () => void
  decrement: () => void
  setMessage: (message: string) => void
  reset: () => void
}

export const useExampleStore = create<ExampleStore>((set) => ({
  count: 0,
  message: 'Hello from Zustand!',
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  setMessage: (message: string) => set({ message }),
  reset: () => set({ count: 0, message: 'Hello from Zustand!' }),
}))

