import { useCallback, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)
  const notify = useCallback((message, kind = 'info') => {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 3500)
  }, [])
  return { toast, notify, clear: () => setToast(null) }
}
