"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { usePlayer } from "./player-context"
import { useInventory } from "./inventory-context"
import { useObjectives } from "./objectives-context"
import { useToast } from "@/hooks/use-toast"

export type XpRewardType = {
  perCompletion: number // XP per completion
  perPoint: number // XP per point of progress
}

export type MissionType = "kill" | "dungeon" | "resource" | "collection" | "achievement" | "custom" | "generic"

export type Reward = {
  type: "item" | "currency" | "resource" | "xp"
  name: string
  amount: number
}

export type Mission = {
  id: string
  name: string
  description: string
  type: MissionType
  category: string
  objectiveIds: string[]
  rewards: Reward[]
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

  // For temporary missions
  expiresAt?: string
}

type MissionsContextType = {
  missions: Mission[]
  categories: string[]
  addMission: (mission: Omit<Mission, "id" | "createdAt" | "updatedAt">) => string
  updateMission: (id: string, updates: Partial<Mission>) => void
  deleteMission: (id: string) => void
  getMission: (id: string) => Mission | undefined
  completeMission: (id: string) => void
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
}

const MissionsContext = createContext<MissionsContextType | undefined>(undefined)

export function MissionsProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState<Mission[]>([])
  const [categories, setCategories] = useState<string[]>([
    "World Quest",
    "Lore",
    "Lorewalking",
    "Dungeon",
    "Resource",
    "Generic",
  ])
  const { addXp, addGold } = usePlayer()
  const { addItem } = useInventory()
  const { objectives, completeObjective } = useObjectives()
  const { toast } = useToast()

  useEffect(() => {
    const savedMissions = localStorage.getItem("missions")
    if (savedMissions) {
      setMissions(JSON.parse(savedMissions))
    }

    const savedCategories = localStorage.getItem("missionCategories")
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }

    // Check for expired missions
    const now = new Date()
    const filtered = JSON.parse(savedMissions || "[]").filter((mission: Mission) => {
      if (mission.expiresAt) {
        return new Date(mission.expiresAt) > now
      }
      return true
    })

    if (filtered.length !== JSON.parse(savedMissions || "[]").length) {
      setMissions(filtered)
      toast({
        title: "Missions Expired",
        description: "Some temporary missions have expired and been removed.",
        variant: "default",
      })
    }
  }, [toast])

  useEffect(() => {
    localStorage.setItem("missions", JSON.stringify(missions))
  }, [missions])

  useEffect(() => {
    localStorage.setItem("missionCategories", JSON.stringify(categories))
  }, [categories])

  const addMission = (mission: Omit<Mission, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString()
    const newMission: Mission = {
      ...mission,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      goldReward: mission.goldReward || { perCompletion: 0, perPoint: 0 },
      xpReward: mission.xpReward || { perCompletion: 500, perPoint: 0 }, // Inicializar XpRewardType
      totalGoldEarned: 0,
    }

    setMissions((prev) => [...prev, newMission])
    toast({
      title: "Mission Created",
      description: `${newMission.name} has been created successfully.`,
    })

    return newMission.id
  }

  const updateMission = (id: string, updates: Partial<Mission>) => {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === id ? { ...mission, ...updates, updatedAt: new Date().toISOString() } : mission,
      ),
    )
  }

  const deleteMission = (id: string) => {
    setMissions((prev) => prev.filter((mission) => mission.id !== id))

    toast({
      title: "Mission Deleted",
      description: "The mission has been deleted successfully.",
    })
  }

  const getMission = (id: string) => {
    return missions.find((mission) => mission.id === id)
  }

  const completeMission = (id: string) => {
    const mission = missions.find((mission) => mission.id === id)
    if (mission && !mission.completed) {
      // Complete all objectives in the mission
      mission.objectiveIds.forEach((objId) => {
        completeObjective(objId)
      })

      const goldEarned = mission.goldReward.perCompletion
      const xpEarned = mission.xpReward.perCompletion

      // Mark mission as complete
      updateMission(id, {
        completed: true,
        totalGoldEarned: mission.totalGoldEarned + goldEarned,
      })

      // Award XP
      if (xpEarned > 0) {
        addXp(xpEarned)
        toast({
          title: "XP Awarded",
          description: `You earned ${xpEarned} XP for completing ${mission.name}.`,
        })
      }

      // Award Gold
      if (goldEarned > 0) {
        addGold(goldEarned)
        toast({
          title: "Gold Earned",
          description: `You earned ${goldEarned} gold for completing ${mission.name}.`,
        })
      }

      // Award rewards (manter código existente)
      mission.rewards.forEach((reward) => {
        if (reward.type === "item" || reward.type === "resource" || reward.type === "currency") {
          addItem({
            name: reward.name,
            type: reward.type,
            quantity: reward.amount,
          })

          toast({
            title: "Reward Received",
            description: `You received ${reward.amount} ${reward.name}.`,
          })
        } else if (reward.type === "xp") {
          addXp(reward.amount)
          toast({
            title: "XP Awarded",
            description: `You earned ${reward.amount} XP as a reward.`,
          })
        }
      })

      toast({
        title: "Mission Completed",
        description: `${mission.name} has been marked as complete.`,
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
    <MissionsContext.Provider
      value={{
        missions,
        categories,
        addMission,
        updateMission,
        deleteMission,
        getMission,
        completeMission,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </MissionsContext.Provider>
  )
}

export function useMissions() {
  const context = useContext(MissionsContext)
  if (context === undefined) {
    throw new Error("useMissions must be used within a MissionsProvider")
  }
  return context
}
