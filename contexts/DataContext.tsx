"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DataContextType {
  refreshData: () => void
  refreshTrigger: number
  isRefreshing: boolean
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = useCallback(() => {
    setIsRefreshing(true)
    setRefreshTrigger((prev) => prev + 1)
    // Reset refreshing state after a short delay
    setTimeout(() => setIsRefreshing(false), 500)
  }, [])

  return <DataContext.Provider value={{ refreshData, refreshTrigger, isRefreshing }}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
