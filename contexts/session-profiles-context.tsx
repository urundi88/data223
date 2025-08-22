"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

export type SessionProfile = {
  id: string
  name: string
  description?: string
  color?: string
  createdAt: string
  updatedAt: string

  // IDs dos conteúdos associados a este profile
  objectiveIds: string[]
  missionIds: string[]
  guideIds: string[]
}

type SessionProfilesContextType = {
  profiles: SessionProfile[]
  activeProfile: SessionProfile | null
  createProfile: (name: string, description?: string, color?: string) => string
  updateProfile: (id: string, updates: Partial<SessionProfile>) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (profile: SessionProfile | null) => void
  addObjectiveToProfile: (profileId: string, objectiveId: string) => void
  removeObjectiveFromProfile: (profileId: string, objectiveId: string) => void
  addMissionToProfile: (profileId: string, missionId: string) => void
  removeMissionFromProfile: (profileId: string, missionId: string) => void
  addGuideToProfile: (profileId: string, guideId: string) => void
  removeGuideFromProfile: (profileId: string, guideId: string) => void
  getProfileStats: (profileId: string) => {
    totalObjectives: number
    totalMissions: number
    totalGuides: number
  }
}

const SessionProfilesContext = createContext<SessionProfilesContextType | undefined>(undefined)

export function SessionProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<SessionProfile[]>([])
  const [activeProfile, setActiveProfileState] = useState<SessionProfile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Carregar profiles salvos
    const savedProfiles = localStorage.getItem("sessionProfiles")
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles)
        setProfiles(parsed)

        // Carregar profile ativo
        const activeProfileId = localStorage.getItem("activeSessionProfileId")
        if (activeProfileId) {
          const profile = parsed.find((p: SessionProfile) => p.id === activeProfileId)
          if (profile) {
            setActiveProfileState(profile)
            console.log("Loaded active profile:", profile.name)
          } else {
            // Remove invalid active profile ID
            localStorage.removeItem("activeSessionProfileId")
            console.log("Removed invalid active profile ID")
          }
        }
      } catch (error) {
        console.error("Erro ao carregar session profiles:", error)
        localStorage.removeItem("sessionProfiles")
        localStorage.removeItem("activeSessionProfileId")
      }
    }
  }, [])

  useEffect(() => {
    // Salvar profiles no localStorage
    if (profiles.length > 0) {
      localStorage.setItem("sessionProfiles", JSON.stringify(profiles))
      console.log("Saved profiles to localStorage:", profiles.length)
    }
  }, [profiles])

  useEffect(() => {
    // Salvar profile ativo
    if (activeProfile) {
      localStorage.setItem("activeSessionProfileId", activeProfile.id)
      console.log("Saved active profile:", activeProfile.name)
    } else {
      localStorage.removeItem("activeSessionProfileId")
      console.log("Removed active profile")
    }
  }, [activeProfile])

  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const createProfile = (name: string, description?: string, color?: string) => {
    const now = new Date().toISOString()
    const newProfile: SessionProfile = {
      id: generateId(),
      name,
      description,
      color: color || "#3b82f6",
      createdAt: now,
      updatedAt: now,
      objectiveIds: [],
      missionIds: [],
      guideIds: [],
    }

    setProfiles((prev) => {
      const updated = [...prev, newProfile]
      console.log("Created new profile:", newProfile.name)
      return updated
    })

    toast({
      title: "Profile Criado",
      description: `Profile "${name}" foi criado com sucesso.`,
    })

    return newProfile.id
  }

  const updateProfile = (id: string, updates: Partial<SessionProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    )

    if (activeProfile?.id === id) {
      setActiveProfileState((prev) => (prev ? { ...prev, ...updates } : null))
    }

    toast({
      title: "Profile Atualizado",
      description: "Profile foi atualizado com sucesso.",
    })
  }

  const deleteProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return

    setProfiles((prev) => prev.filter((p) => p.id !== id))

    if (activeProfile?.id === id) {
      setActiveProfileState(null)
    }

    toast({
      title: "Profile Deletado",
      description: `Profile "${profile.name}" foi deletado.`,
    })
  }

  const setActiveProfile = (profile: SessionProfile | null) => {
    console.log("Setting active profile:", profile?.name || "null")
    setActiveProfileState(profile)

    if (profile) {
      // Update the profile in the profiles array to ensure it's current
      setProfiles((prev) => prev.map((p) => (p.id === profile.id ? profile : p)))
    }
  }

  const addObjectiveToProfile = (profileId: string, objectiveId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId && !p.objectiveIds.includes(objectiveId)) {
          const updated = {
            ...p,
            objectiveIds: [...p.objectiveIds, objectiveId],
            updatedAt: new Date().toISOString(),
          }

          // Update active profile if it's the same
          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const removeObjectiveFromProfile = (profileId: string, objectiveId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId) {
          const updated = {
            ...p,
            objectiveIds: p.objectiveIds.filter((id) => id !== objectiveId),
            updatedAt: new Date().toISOString(),
          }

          // Update active profile if it's the same
          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const addMissionToProfile = (profileId: string, missionId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId && !p.missionIds.includes(missionId)) {
          const updated = {
            ...p,
            missionIds: [...p.missionIds, missionId],
            updatedAt: new Date().toISOString(),
          }

          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const removeMissionFromProfile = (profileId: string, missionId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId) {
          const updated = {
            ...p,
            missionIds: p.missionIds.filter((id) => id !== missionId),
            updatedAt: new Date().toISOString(),
          }

          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const addGuideToProfile = (profileId: string, guideId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId && !p.guideIds.includes(guideId)) {
          const updated = {
            ...p,
            guideIds: [...p.guideIds, guideId],
            updatedAt: new Date().toISOString(),
          }

          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const removeGuideFromProfile = (profileId: string, guideId: string) => {
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === profileId) {
          const updated = {
            ...p,
            guideIds: p.guideIds.filter((id) => id !== guideId),
            updatedAt: new Date().toISOString(),
          }

          if (activeProfile?.id === profileId) {
            setActiveProfileState(updated)
          }

          return updated
        }
        return p
      }),
    )
  }

  const getProfileStats = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) {
      return { totalObjectives: 0, totalMissions: 0, totalGuides: 0 }
    }

    return {
      totalObjectives: profile.objectiveIds.length,
      totalMissions: profile.missionIds.length,
      totalGuides: profile.guideIds.length,
    }
  }

  return (
    <SessionProfilesContext.Provider
      value={{
        profiles,
        activeProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        setActiveProfile,
        addObjectiveToProfile,
        removeObjectiveFromProfile,
        addMissionToProfile,
        removeMissionFromProfile,
        addGuideToProfile,
        removeGuideFromProfile,
        getProfileStats,
      }}
    >
      {children}
    </SessionProfilesContext.Provider>
  )
}

export function useSessionProfiles() {
  const context = useContext(SessionProfilesContext)
  if (context === undefined) {
    throw new Error("useSessionProfiles must be used within a SessionProfilesProvider")
  }
  return context
}
