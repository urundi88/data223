"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { useToast } from "@/hooks/use-toast"

export type GameProfile = {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  lastPlayedAt: string

  // Game data
  playerStats: any
  objectives: any[]
  missions: any[]
  guides: any[]
  inventory: any[]
  missionCategories: string[]
  guideCategories: string[]

  // Statistics
  totalPlayTime: number // em minutos
  totalObjectives: number
  completedObjectives: number
  totalMissions: number
  completedMissions: number
}

type ProfilesContextType = {
  profiles: GameProfile[]
  currentProfile: GameProfile | null
  createProfile: (name: string, description?: string) => string
  loadProfile: (id: string) => void
  saveCurrentProfile: () => void
  updateProfile: (id: string, updates: Partial<GameProfile>) => void
  deleteProfile: (id: string) => void
  duplicateProfile: (id: string, newName: string) => string
  exportProfile: (id: string) => void
  importProfile: (profileData: any) => string
  setCurrentProfile: (profile: GameProfile | null) => void
}

const ProfilesContext = createContext<ProfilesContextType | undefined>(undefined)

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<GameProfile[]>([])
  const [currentProfile, setCurrentProfile] = useState<GameProfile | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Carregar perfis salvos
    const savedProfiles = localStorage.getItem("gameProfiles")
    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles)
        setProfiles(parsed)
      } catch (error) {
        console.error("Erro ao carregar perfis:", error)
      }
    }

    // Carregar perfil atual
    const currentProfileId = localStorage.getItem("currentProfileId")
    if (currentProfileId && savedProfiles) {
      const parsed = JSON.parse(savedProfiles)
      const profile = parsed.find((p: GameProfile) => p.id === currentProfileId)
      if (profile) {
        setCurrentProfile(profile)
      }
    }
  }, [])

  useEffect(() => {
    // Salvar perfis no localStorage
    localStorage.setItem("gameProfiles", JSON.stringify(profiles))
  }, [profiles])

  useEffect(() => {
    // Salvar perfil atual
    if (currentProfile) {
      localStorage.setItem("currentProfileId", currentProfile.id)
    } else {
      localStorage.removeItem("currentProfileId")
    }
  }, [currentProfile])

  const getCurrentGameData = () => {
    return {
      playerStats: JSON.parse(localStorage.getItem("playerStats") || "{}"),
      objectives: JSON.parse(localStorage.getItem("objectives") || "[]"),
      missions: JSON.parse(localStorage.getItem("missions") || "[]"),
      guides: JSON.parse(localStorage.getItem("guides") || "[]"),
      inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
      missionCategories: JSON.parse(localStorage.getItem("missionCategories") || "[]"),
      guideCategories: JSON.parse(localStorage.getItem("guideCategories") || "[]"),
    }
  }

  const createProfile = (name: string, description?: string) => {
    const now = new Date().toISOString()
    const gameData = getCurrentGameData()

    const newProfile: GameProfile = {
      id: uuidv4(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: now,
      totalPlayTime: 0,
      totalObjectives: gameData.objectives.length,
      completedObjectives: gameData.objectives.filter((obj: any) => obj.completed).length,
      totalMissions: gameData.missions.length,
      completedMissions: gameData.missions.filter((mission: any) => mission.completed).length,
      ...gameData,
    }

    setProfiles((prev) => [...prev, newProfile])
    setCurrentProfile(newProfile)

    toast({
      title: "Perfil Criado",
      description: `Perfil "${name}" foi criado com sucesso.`,
    })

    return newProfile.id
  }

  const loadProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado.",
        variant: "destructive",
      })
      return
    }

    // Carregar dados do perfil no jogo
    localStorage.setItem("playerStats", JSON.stringify(profile.playerStats))
    localStorage.setItem("objectives", JSON.stringify(profile.objectives))
    localStorage.setItem("missions", JSON.stringify(profile.missions))
    localStorage.setItem("guides", JSON.stringify(profile.guides))
    localStorage.setItem("inventory", JSON.stringify(profile.inventory))
    localStorage.setItem("missionCategories", JSON.stringify(profile.missionCategories))
    localStorage.setItem("guideCategories", JSON.stringify(profile.guideCategories))

    // Atualizar último acesso
    const updatedProfile = {
      ...profile,
      lastPlayedAt: new Date().toISOString(),
    }

    setProfiles((prev) => prev.map((p) => (p.id === id ? updatedProfile : p)))
    setCurrentProfile(updatedProfile)

    toast({
      title: "Perfil Carregado",
      description: `Perfil "${profile.name}" foi carregado com sucesso.`,
    })

    // Recarregar a página para aplicar mudanças
    setTimeout(() => window.location.reload(), 1000)
  }

  const saveCurrentProfile = () => {
    if (!currentProfile) {
      toast({
        title: "Erro",
        description: "Nenhum perfil ativo para salvar.",
        variant: "destructive",
      })
      return
    }

    const gameData = getCurrentGameData()
    const updatedProfile: GameProfile = {
      ...currentProfile,
      ...gameData,
      updatedAt: new Date().toISOString(),
      lastPlayedAt: new Date().toISOString(),
      totalObjectives: gameData.objectives.length,
      completedObjectives: gameData.objectives.filter((obj: any) => obj.completed).length,
      totalMissions: gameData.missions.length,
      completedMissions: gameData.missions.filter((mission: any) => mission.completed).length,
    }

    setProfiles((prev) => prev.map((p) => (p.id === currentProfile.id ? updatedProfile : p)))
    setCurrentProfile(updatedProfile)

    toast({
      title: "Perfil Salvo",
      description: `Progresso salvo em "${currentProfile.name}".`,
    })
  }

  const updateProfile = (id: string, updates: Partial<GameProfile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    )

    if (currentProfile?.id === id) {
      setCurrentProfile((prev) => (prev ? { ...prev, ...updates } : null))
    }
  }

  const deleteProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return

    setProfiles((prev) => prev.filter((p) => p.id !== id))

    if (currentProfile?.id === id) {
      setCurrentProfile(null)
    }

    toast({
      title: "Perfil Deletado",
      description: `Perfil "${profile.name}" foi deletado.`,
    })
  }

  const duplicateProfile = (id: string, newName: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return ""

    const now = new Date().toISOString()
    const duplicatedProfile: GameProfile = {
      ...profile,
      id: uuidv4(),
      name: newName,
      createdAt: now,
      updatedAt: now,
      lastPlayedAt: now,
    }

    setProfiles((prev) => [...prev, duplicatedProfile])

    toast({
      title: "Perfil Duplicado",
      description: `Perfil duplicado como "${newName}".`,
    })

    return duplicatedProfile.id
  }

  const exportProfile = (id: string) => {
    const profile = profiles.find((p) => p.id === id)
    if (!profile) return

    const dataStr = JSON.stringify(profile, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement("a")
    link.href = url
    link.download = `${profile.name.replace(/[^a-zA-Z0-9]/g, "_")}_profile.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: "Perfil Exportado",
      description: `Perfil "${profile.name}" foi exportado.`,
    })
  }

  const importProfile = (profileData: any) => {
    try {
      const now = new Date().toISOString()
      const importedProfile: GameProfile = {
        ...profileData,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
        lastPlayedAt: now,
      }

      setProfiles((prev) => [...prev, importedProfile])

      toast({
        title: "Perfil Importado",
        description: `Perfil "${importedProfile.name}" foi importado com sucesso.`,
      })

      return importedProfile.id
    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: "Arquivo de perfil inválido.",
        variant: "destructive",
      })
      return ""
    }
  }

  return (
    <ProfilesContext.Provider
      value={{
        profiles,
        currentProfile,
        createProfile,
        loadProfile,
        saveCurrentProfile,
        updateProfile,
        deleteProfile,
        duplicateProfile,
        exportProfile,
        importProfile,
        setCurrentProfile,
      }}
    >
      {children}
    </ProfilesContext.Provider>
  )
}

export function useProfiles() {
  const context = useContext(ProfilesContext)
  if (context === undefined) {
    throw new Error("useProfiles must be used within a ProfilesProvider")
  }
  return context
}
