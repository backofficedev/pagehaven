export function lazy<T>(fn: () => T): () => T {
  let cached: T | undefined
  return () => {
    if (cached === undefined) {
      cached = fn()
    }
    return cached
  }
}
