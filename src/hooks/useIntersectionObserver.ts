import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
}

// Intersection Observer 훅 - 무한 스크롤 등에 유용
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0, root = null, rootMargin = '0px' } = options
  const [entry, setEntry] = useState<IntersectionObserverEntry>()
  const [node, setNode] = useState<Element | null>(null)

  const observer = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (observer.current) observer.current.disconnect()

    observer.current = new IntersectionObserver(
      ([entry]) => setEntry(entry),
      { threshold, root, rootMargin }
    )

    const { current: currentObserver } = observer

    if (node) currentObserver.observe(node)

    return () => currentObserver.disconnect()
  }, [node, threshold, root, rootMargin])

  return [setNode, entry] as const
}
