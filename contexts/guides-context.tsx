"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { usePlayer } from "./player-context"
import { useInventory } from "./inventory-context"
import { useMissions } from "./missions-context"
import { useToast } from "@/hooks/use-toast"

export type XpRewardType = {
  perCompletion: number // XP per completion
  perPoint: number // XP per point of progress
}

export type GuideStep = {
  id: string
  name: string
  description: string
  missionIds: string[]
  completed: boolean
  goldReward: {
    perCompletion: number
    perPoint: number
  }
  location?: {
    zone?: string
    coordinates?: string
    notes?: string
  }
  totalGoldEarned: number
}

export type Guide = {
  id: string
  name: string
  description: string
  category: string
  steps: GuideStep[]
  completed: boolean
  xpReward: XpRewardType // Mudar de number para XpRewardType
  goldReward: {
    perCompletion: number
    perPoint: number
  }
  location?: {
    zone?: string
    coordinates?: string
    notes?: string
  }
  createdAt: string
  updatedAt: string
  imageUrl?: string
  totalGoldEarned: number

  // For temporary guides
  expiresAt?: string
}

type GuidesContextType = {
  guides: Guide[]
  categories: string[]
  addGuide: (guide: Omit<Guide, "id" | "createdAt" | "updatedAt">) => string
  updateGuide: (id: string, updates: Partial<Guide>) => void
  deleteGuide: (id: string) => void
  getGuide: (id: string) => Guide | undefined
  completeGuideStep: (guideId: string, stepId: string) => void
  completeGuide: (id: string) => void
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
}

const GuidesContext = createContext<GuidesContextType | undefined>(undefined)

export function GuidesProvider({ children }: { children: ReactNode }) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [categories, setCategories] = useState<string[]>([
    "Beginner",
    "Advanced",
    "Lore",
    "Dungeon",
    "Resource",
    "Achievement",
  ])
  const { addXp, addGold } = usePlayer()
  const { addItem } = useInventory()
  const { missions, completeMission } = useMissions()
  const { toast } = useToast()

  useEffect(() => {
    const savedGuides = localStorage.getItem("guides")
    if (savedGuides) {
      setGuides(JSON.parse(savedGuides))
    }

    const savedCategories = localStorage.getItem("guideCategories")
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }

    // Check for expired guides
    const now = new Date()
    const filtered = JSON.parse(savedGuides || "[]").filter((guide: Guide) => {
      if (guide.expiresAt) {
        return new Date(guide.expiresAt) > now
      }
      return true
    })

    if (filtered.length !== JSON.parse(savedGuides || "[]").length) {
      setGuides(filtered)
      toast({
        title: "Guides Expired",
        description: "Some temporary guides have expired and been removed.",
        variant: "default",
      })
    }
  }, [toast])

  useEffect(() => {
    localStorage.setItem("guides", JSON.stringify(guides))
  }, [guides])

  useEffect(() => {
    localStorage.setItem("guideCategories", JSON.stringify(categories))
  }, [categories])

  const addGuide = (guide: Omit<Guide, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newGuide: Guide = {
      ...guide,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      goldReward: guide.goldReward || { perCompletion: 0, perPoint: 0 },
      xpReward: guide.xpReward || { perCompletion: 1000, perPoint: 0 }, // Inicializar XpRewardType
      totalGoldEarned: 0,
      steps: guide.steps.map((step) => ({
        ...step,
        goldReward: step.goldReward || { perCompletion: 0, perPoint: 0 },
        totalGoldEarned: 0,
      })),
    }

    setGuides((prev) => [...prev, newGuide])
    toast({
      title: "Guide Created",
      description: `${newGuide.name} has been created successfully.`,
    })

    return newGuide.id
  }

  const updateGuide = (id: string, updates: Partial<Guide>) => {
    setGuides((prev) =>
      prev.map((guide) => (guide.id === id ? { ...guide, ...updates, updatedAt: new Date().toISOString() } : guide)),
    )
  }

  const deleteGuide = (id: string) => {
    setGuides((prev) => prev.filter((guide) => guide.id !== id))

    toast({
      title: "Guide Deleted",
      description: "The guide has been deleted successfully.",
    })
  }

  const getGuide = (id: string) => {
    return guides.find((guide) => guide.id === id)
  }

  const completeGuideStep = (guideId: string, stepId: string) => {
    setGuides((prev) =>
      prev.map((guide) => {
        if (guide.id === guideId) {
          const updatedSteps = guide.steps.map((step) => {
            if (step.id === stepId && !step.completed) {
              // Complete all missions in the step
              step.missionIds.forEach((missionId) => {
                completeMission(missionId)
              })

              const goldEarned = step.goldReward.perCompletion
              if (goldEarned > 0) {
                addGold(goldEarned)
                toast({
                  title: "Step Gold Earned",
                  description: `You earned ${goldEarned} gold for completing ${step.name}.`,
                })
              }

              return {
                ...step,
                completed: true,
                totalGoldEarned: step.totalGoldEarned + goldEarned,
              }
            }
            return step
          })

          // Check if all steps are complete
          const allStepsComplete = updatedSteps.every((step) => step.completed)
          let guideGoldEarned = 0

          if (allStepsComplete && !guide.completed) {
            guideGoldEarned = guide.goldReward.perCompletion
            if (guideGoldEarned > 0) {
              addGold(guideGoldEarned)
              toast({
                title: "Guide Gold Earned",
                description: `You earned ${guideGoldEarned} gold for completing ${guide.name}.`,
              })
            }
          }

          return {
            ...guide,
            steps: updatedSteps,
            completed: allStepsComplete,
            totalGoldEarned: guide.totalGoldEarned + guideGoldEarned,
            updatedAt: new Date().toISOString(),
          }
        }
        return guide
      }),
    )

    // Check if guide is now complete
    const updatedGuide = guides.find((g) => g.id === guideId)
    if (updatedGuide && updatedGuide.completed && updatedGuide.xpReward) {
      addXp(updatedGuide.xpReward)
      toast({
        title: "Guide Completed",
        description: `You earned ${updatedGuide.xpReward} XP for completing ${updatedGuide.name}.`,
      })
    }
  }

  const completeGuide = (id: string) => {
    const guide = guides.find((guide) => guide.id === id)
    if (guide && !guide.completed) {
      // Complete all steps and their missions
      guide.steps.forEach((step) => {
        if (!step.completed) {
          step.missionIds.forEach((missionId) => {
            completeMission(missionId)
          })
        }
      })

      // Mark guide as complete
      updateGuide(id, {
        completed: true,
        steps: guide.steps.map((step) => ({ ...step, completed: true })),
      })

      // Award XP
      const xpEarned = guide.xpReward.perCompletion
      if (xpEarned > 0) {
        addXp(xpEarned)
        toast({
          title: "XP Awarded",
          description: `You earned ${xpEarned} XP for completing ${guide.name}.`,
        })
      }

      toast({
        title: "Guide Completed",
        description: `${guide.name} has been marked as complete.`,
      })
    }
  }

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category])
    }
  }

  const removeCategory = (category: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== category))
  }

  return (
    <GuidesContext.Provider
      value={{
        guides,
        categories,
        addGuide,
        updateGuide,
        deleteGuide,
        getGuide,
        completeGuideStep,
        completeGuide,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </GuidesContext.Provider>
  )
}

export function useGuides() {
  const context = useContext(GuidesContext)
  if (context === undefined) {
    throw new Error("useGuides must be used within a GuidesProvider")
  }
  return context
}
