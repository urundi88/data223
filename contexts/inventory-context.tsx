"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/hooks/use-toast"

export type ItemType = "item" | "resource" | "currency"

export type InventoryItem = {
  id: string
  name: string
  type: ItemType
  quantity: number
  description?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

type InventoryContextType = {
  items: InventoryItem[]
  addItem: (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => string
  updateItem: (id: string, updates: Partial<InventoryItem>) => void
  removeItem: (id: string, quantity?: number) => void
  getItemsByType: (type: ItemType) => InventoryItem[]
  getItemByName: (name: string) => InventoryItem | undefined
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined)

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const savedItems = localStorage.getItem("inventory")
    if (savedItems) {
      setItems(JSON.parse(savedItems))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("inventory", JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()

    // Check if item already exists
    const existingItem = items.find((i) => i.name.toLowerCase() === item.name.toLowerCase() && i.type === item.type)

    if (existingItem) {
      // Update quantity
      updateItem(existingItem.id, {
        quantity: existingItem.quantity + item.quantity,
      })
      return existingItem.id
    } else {
      // Add new item
      const newItem: InventoryItem = {
        ...item,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      }

      setItems((prev) => [...prev, newItem])

      toast({
        title: "Item Added",
        description: `${item.quantity} ${item.name} added to your inventory.`,
      })

      return newItem.id
    }
  }

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item)),
    )
  }

  const removeItem = (id: string, quantity?: number) => {
    const item = items.find((i) => i.id === id)

    if (!item) return

    if (quantity && quantity < item.quantity) {
      // Reduce quantity
      updateItem(id, { quantity: item.quantity - quantity })

      toast({
        title: "Item Removed",
        description: `${quantity} ${item.name} removed from your inventory.`,
      })
    } else {
      // Remove item completely
      setItems((prev) => prev.filter((i) => i.id !== id))

      toast({
        title: "Item Removed",
        description: `${item.name} removed from your inventory.`,
      })
    }
  }

  const getItemsByType = (type: ItemType) => {
    return items.filter((item) => item.type === type)
  }

  const getItemByName = (name: string) => {
    return items.find((item) => item.name.toLowerCase() === name.toLowerCase())
  }

  return (
    <InventoryContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        removeItem,
        getItemsByType,
        getItemByName,
      }}
    >
      {children}
    </InventoryContext.Provider>
  )
}

export function useInventory() {
  const context = useContext(InventoryContext)
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider")
  }
  return context
}
