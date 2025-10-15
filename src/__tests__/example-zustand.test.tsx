import { renderHook, act } from '@testing-library/react'
import { create } from 'zustand'

// Example Zustand store for testing
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

describe('Zustand Store Example', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCounterStore.setState({ count: 0 })
  })

  it('initializes with default values', () => {
    const { result } = renderHook(() => useCounterStore())
    expect(result.current.count).toBe(0)
  })

  it('increments count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
    })
    
    expect(result.current.count).toBe(1)
  })

  it('decrements count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.decrement()
    })
    
    expect(result.current.count).toBe(-1)
  })

  it('resets count', () => {
    const { result } = renderHook(() => useCounterStore())
    
    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.reset()
    })
    
    expect(result.current.count).toBe(0)
  })
})
