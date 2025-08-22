"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

// Função para gerar ID único sem dependências externas
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export type QuickObjective = {
  id: string
  description: string
  completed: boolean
  createdAt: string
  completedAt?: string
}

export type QuickMissionPhase = {
  id: string
  name: string
  description: string
  objectives: QuickObjective[]
  completed: boolean
  createdAt: string
  completedAt?: string
}

export type QuickMission = {
  id: string
  name: string
  description: string
  phases: QuickMissionPhase[]
  completed: boolean
  createdAt: string
  completedAt?: string
}

type QuickMissionsContextType = {
  missions: QuickMission[]
  addMission: (name: string, description: string) => string
  addPhase: (missionId: string, name: string, description: string) => string
  addObjective: (missionId: string, phaseId: string, description: string) => string
  toggleObjective: (missionId: string, phaseId: string, objectiveId: string) => void
  deleteMission: (missionId: string) => void
  deletePhase: (missionId: string, phaseId: string) => void
  deleteObjective: (missionId: string, phaseId: string, objectiveId: string) => void
  editMission: (missionId: string, name: string, description: string) => void
  editPhase: (missionId: string, phaseId: string, name: string, description: string) => void
  editObjective: (missionId: string, phaseId: string, objectiveId: string, description: string) => void
}

const QuickMissionsContext = createContext<QuickMissionsContextType | undefined>(undefined)

export function QuickMissionsProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState<QuickMission[]>([])
  const { toast } = useToast()

  // Carregar dados do localStorage
  useEffect(() => {
    try {
      const savedMissions = localStorage.getItem("quickMissions")
      if (savedMissions) {
        const parsedMissions = JSON.parse(savedMissions)
        setMissions(Array.isArray(parsedMissions) ? parsedMissions : [])
      }
    } catch (error) {
      console.error("Erro ao carregar missões rápidas:", error)
      setMissions([])
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      localStorage.setItem("quickMissions", JSON.stringify(missions))
    } catch (error) {
      console.error("Erro ao salvar missões rápidas:", error)
    }
  }, [missions])

  const addMission = (name: string, description: string) => {
    const newMission: QuickMission = {
      id: generateId(),
      name,
      description,
      phases: [],
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setMissions((prev) => [...prev, newMission])
    toast({
      title: "Missão Criada",
      description: `${name} foi criada com sucesso.`,
    })

    return newMission.id
  }

  const addPhase = (missionId: string, name: string, description: string) => {
    const newPhase: QuickMissionPhase = {
      id: generateId(),
      name,
      description,
      objectives: [],
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId ? { ...mission, phases: [...mission.phases, newPhase] } : mission,
      ),
    )

    toast({
      title: "Fase Adicionada",
      description: `${name} foi adicionada à missão.`,
    })

    return newPhase.id
  }

  const addObjective = (missionId: string, phaseId: string, description: string) => {
    const newObjective: QuickObjective = {
      id: generateId(),
      description,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              phases: mission.phases.map((phase) =>
                phase.id === phaseId ? { ...phase, objectives: [...phase.objectives, newObjective] } : phase,
              ),
            }
          : mission,
      ),
    )

    return newObjective.id
  }

  const toggleObjective = (missionId: string, phaseId: string, objectiveId: string) => {
    setMissions((prev) =>
      prev.map((mission) => {
        if (mission.id !== missionId) return mission

        const updatedMission = {
          ...mission,
          phases: mission.phases.map((phase) => {
            if (phase.id !== phaseId) return phase

            const updatedPhase = {
              ...phase,
              objectives: phase.objectives.map((objective) => {
                if (objective.id !== objectiveId) return objective

                const isCompleting = !objective.completed
                return {
                  ...objective,
                  completed: isCompleting,
                  completedAt: isCompleting ? new Date().toISOString() : undefined,
                }
              }),
            }

            // Verificar se a fase está completa
            const allObjectivesCompleted =
              updatedPhase.objectives.length > 0 && updatedPhase.objectives.every((obj) => obj.completed)

            if (allObjectivesCompleted && !updatedPhase.completed) {
              updatedPhase.completed = true
              updatedPhase.completedAt = new Date().toISOString()
              toast({
                title: "Fase Completa!",
                description: `${updatedPhase.name} foi concluída.`,
              })
            } else if (!allObjectivesCompleted && updatedPhase.completed) {
              updatedPhase.completed = false
              updatedPhase.completedAt = undefined
            }

            return updatedPhase
          }),
        }

        // Verificar se a missão está completa
        const allPhasesCompleted =
          updatedMission.phases.length > 0 && updatedMission.phases.every((phase) => phase.completed)

        if (allPhasesCompleted && !updatedMission.completed) {
          updatedMission.completed = true
          updatedMission.completedAt = new Date().toISOString()
          toast({
            title: "Missão Completa! 🎉",
            description: `${updatedMission.name} foi concluída com sucesso!`,
          })
        } else if (!allPhasesCompleted && updatedMission.completed) {
          updatedMission.completed = false
          updatedMission.completedAt = undefined
        }

        return updatedMission
      }),
    )
  }

  const deleteMission = (missionId: string) => {
    setMissions((prev) => prev.filter((mission) => mission.id !== missionId))
    toast({
      title: "Missão Deletada",
      description: "A missão foi removida com sucesso.",
    })
  }

  const deletePhase = (missionId: string, phaseId: string) => {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? { ...mission, phases: mission.phases.filter((phase) => phase.id !== phaseId) }
          : mission,
      ),
    )
    toast({
      title: "Fase Deletada",
      description: "A fase foi removida com sucesso.",
    })
  }

  const deleteObjective = (missionId: string, phaseId: string, objectiveId: string) => {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              phases: mission.phases.map((phase) =>
                phase.id === phaseId
                  ? { ...phase, objectives: phase.objectives.filter((obj) => obj.id !== objectiveId) }
                  : phase,
              ),
            }
          : mission,
      ),
    )
  }

  const editMission = (missionId: string, name: string, description: string) => {
    setMissions((prev) =>
      prev.map((mission) => (mission.id === missionId ? { ...mission, name, description } : mission)),
    )
    toast({
      title: "Missão Atualizada",
      description: "As alterações foram salvas com sucesso.",
    })
  }

  const editPhase = (missionId: string, phaseId: string, name: string, description: string) => {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              phases: mission.phases.map((phase) => (phase.id === phaseId ? { ...phase, name, description } : phase)),
            }
          : mission,
      ),
    )
    toast({
      title: "Fase Atualizada",
      description: "As alterações foram salvas com sucesso.",
    })
  }

  const editObjective = (missionId: string, phaseId: string, objectiveId: string, description: string) => {
    setMissions((prev) =>
      prev.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              phases: mission.phases.map((phase) =>
                phase.id === phaseId
                  ? {
                      ...phase,
                      objectives: phase.objectives.map((obj) =>
                        obj.id === objectiveId ? { ...obj, description } : obj,
                      ),
                    }
                  : phase,
              ),
            }
          : mission,
      ),
    )
    toast({
      title: "Objetivo Atualizado",
      description: "As alterações foram salvas com sucesso.",
    })
  }

  return (
    <QuickMissionsContext.Provider
      value={{
        missions,
        addMission,
        addPhase,
        addObjective,
        toggleObjective,
        deleteMission,
        deletePhase,
        deleteObjective,
        editMission,
        editPhase,
        editObjective,
      }}
    >
      {children}
    </QuickMissionsContext.Provider>
  )
}

export function useQuickMissions() {
  const context = useContext(QuickMissionsContext)
  if (context === undefined) {
    throw new Error("useQuickMissions must be used within a QuickMissionsProvider")
  }
  return context
}
