"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type PlayerStats = {
  level: number
  xp: number
  nextLevelXp: number
  baseXpPerLevel: number
  xpIncreasePerLevel: number
  gold: number // Add gold tracking
}

type PlayerContextType = {
  playerStats: PlayerStats
  addXp: (amount: number) => void
  addGold: (amount: number) => void // Add gold function
  removeGold: (amount: number) => void // Add remove gold function
  setBaseXpPerLevel: (amount: number) => void
  setXpIncreasePerLevel: (amount: number) => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 1,
    xp: 0,
    nextLevelXp: 3000,
    baseXpPerLevel: 3000,
    xpIncreasePerLevel: 500,
    gold: 0, // Initialize gold
  })

  useEffect(() => {
    const savedStats = localStorage.getItem("playerStats")
    if (savedStats) {
      setPlayerStats(JSON.parse(savedStats))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("playerStats", JSON.stringify(playerStats))
  }, [playerStats])

  const calculateNextLevelXp = (level: number, baseXp: number, increase: number) => {
    return baseXp + (level - 1) * increase
  }

  const addXp = (amount: number) => {
    setPlayerStats((prev) => {
      let newXp = prev.xp + amount
      let newLevel = prev.level
      let nextLevelXp = prev.nextLevelXp

      // Check if player leveled up
      while (newXp >= nextLevelXp) {
        newXp -= nextLevelXp
        newLevel++
        nextLevelXp = calculateNextLevelXp(newLevel, prev.baseXpPerLevel, prev.xpIncreasePerLevel)
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        nextLevelXp,
      }
    })
  }

  const addGold = (amount: number) => {
    setPlayerStats((prev) => ({
      ...prev,
      gold: prev.gold + amount,
    }))
  }

  const removeGold = (amount: number) => {
    setPlayerStats((prev) => ({
      ...prev,
      gold: Math.max(0, prev.gold - amount),
    }))
  }

  const setBaseXpPerLevel = (amount: number) => {
    setPlayerStats((prev) => {
      const nextLevelXp = calculateNextLevelXp(prev.level, amount, prev.xpIncreasePerLevel)
      return {
        ...prev,
        baseXpPerLevel: amount,
        nextLevelXp,
      }
    })
  }

  const setXpIncreasePerLevel = (amount: number) => {
    setPlayerStats((prev) => {
      const nextLevelXp = calculateNextLevelXp(prev.level, prev.baseXpPerLevel, amount)
      return {
        ...prev,
        xpIncreasePerLevel: amount,
        nextLevelXp,
      }
    })
  }

  return (
    <PlayerContext.Provider
      value={{
        playerStats,
        addXp,
        addGold,
        removeGold,
        setBaseXpPerLevel,
        setXpIncreasePerLevel,
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}
