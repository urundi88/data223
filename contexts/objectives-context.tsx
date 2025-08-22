"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { usePlayer } from "./player-context"
import { useInventory } from "./inventory-context"
import { useToast } from "@/hooks/use-toast"

export type ObjectiveType =
  | "collection"
  | "steps"
  | "percentage"
  | "custom"
  | "kill"
  | "resource"
  | "dungeon"
  | "achievement"

export type CollectionItem = {
  name: string
  targetAmount: number
  currentAmount: number
}

export type GoldRewardType = {
  perCompletion: number // Gold per completion
  perPoint: number // Gold per point of progress
}

export type XpRewardType = {
  perCompletion: number // XP per completion
  perPoint: number // XP per point of progress
}

export type LocationInfo = {
  zone?: string
  coordinates?: string
  notes?: string
}

export type SubObjective = {
  id: string
  name: string
  description: string
  completed: boolean
  currentValue: number
  targetValue: number
  xpReward: XpRewardType
  goldReward: GoldRewardType
  location?: LocationInfo

  // Sistema de repetições
  isRepeatable: boolean
  isInfiniteLoop: boolean
  maxRepetitions?: number
  currentRepetitions: number
  infiniteDate?: string

  // Gold tracking for repetitions
  totalGoldEarned: number

  // Sistema de cooldown
  hasCooldown?: boolean
  cooldownDuration?: number // em segundos
  cooldownStartTime?: number // timestamp quando o cooldown começou
  cooldownProgress?: number // 0-100
}

export type ObjectivePhase = {
  id: string
  name: string
  description: string
  completed: boolean
  subObjectives: SubObjective[]
  xpReward: XpRewardType // Mudar de number para XpRewardType
  goldReward: GoldRewardType // Add gold rewards
  location?: LocationInfo // Add location tracking

  // Sistema de repetições
  isRepeatable: boolean
  isInfiniteLoop: boolean
  maxRepetitions?: number
  currentRepetitions: number
  infiniteDate?: string

  // Gold tracking for repetitions
  totalGoldEarned: number
  targetValue: number
}

export type Objective = {
  id: string
  name: string
  description: string
  type: ObjectiveType
  completed: boolean
  xpReward: XpRewardType // Mudar de number para XpRewardType
  goldReward: GoldRewardType // Add gold rewards
  location?: LocationInfo // Add location tracking
  createdAt: string
  updatedAt: string
  imageUrl?: string
  category?: string

  // Sistema de repetição
  isRepeatable: boolean
  maxCompletions?: number
  currentCompletions: number

  // Gold tracking
  totalGoldEarned: number

  // Sistema de fases e subobjetivos
  phases: ObjectivePhase[]
  currentPhaseIndex: number

  // Para collection objectives (mantido para compatibilidade)
  collectionItems?: CollectionItem[]

  // Para step objectives (mantido para compatibilidade)
  totalSteps?: number
  currentStep?: number

  // Para percentage objectives (mantido para compatibilidade)
  percentage?: number
  targetPercentage?: number
  estimatedTime?: number

  // Para kill objectives (mantido para compatibilidade)
  targetKills?: number
  currentKills?: number

  // Para temporary objectives
  expiresAt?: string

  // Para custom objectives
  customData?: any

  // Profile association
  profileId?: string
}

type ObjectivesContextType = {
  objectives: Objective[]
  addObjective: (objective: Omit<Objective, "id" | "createdAt" | "updatedAt">, profileId?: string) => string
  updateObjective: (id: string, updates: Partial<Objective>) => void
  deleteObjective: (id: string) => void
  getObjective: (id: string) => Objective | undefined
  completeObjective: (id: string) => void
  resetObjective: (id: string) => void
  cloneObjective: (id: string) => string

  // Funções para subobjetivos
  completeSubObjective: (objectiveId: string, phaseId: string, subObjectiveId: string) => void
  updateSubObjective: (objectiveId: string, phaseId: string, subObjectiveId: string, value: number) => void

  // Funções para fases
  completePhase: (objectiveId: string, phaseId: string) => void
  goToNextPhase: (objectiveId: string) => void

  // Funções legadas (mantidas para compatibilidade)
  incrementCollectionItem: (objectiveId: string, itemIndex: number, amount: number) => void
  incrementStep: (objectiveId: string, steps: number) => void
  updatePercentage: (objectiveId: string, percentage: number) => void
  incrementKills: (objectiveId: string, kills: number) => void

  // Funções para repetições de fases
  resetPhase: (objectiveId: string, phaseId: string) => void

  // Funções para repetições de subobjetivos
  resetSubObjective: (objectiveId: string, phaseId: string, subObjectiveId: string) => void
}

const ObjectivesContext = createContext<ObjectivesContextType | undefined>(undefined)

export function ObjectivesProvider({ children }: { children: ReactNode }) {
  const [objectives, setObjectives] = useState<Objective[]>([])
  const { addXp, addGold } = usePlayer() // Add addGold
  const { addItem } = useInventory()
  const { toast } = useToast()

  useEffect(() => {
    const savedObjectives = localStorage.getItem("objectives")
    if (savedObjectives) {
      try {
        const parsed = JSON.parse(savedObjectives)
        // Garantir que todos os objetivos tenham as propriedades necessárias
        const normalizedObjectives = parsed.map((obj: any) => ({
          ...obj,
          isRepeatable: obj.isRepeatable || false,
          currentCompletions: obj.currentCompletions || 0,
          phases: obj.phases || [],
          currentPhaseIndex: obj.currentPhaseIndex || 0,
          profileId: obj.profileId || null, // Add profileId support
        }))
        setObjectives(normalizedObjectives)
      } catch (error) {
        console.error("Error parsing objectives from localStorage:", error)
        setObjectives([])
      }
    }

    // Check for expired objectives
    const now = new Date()
    const filtered = JSON.parse(savedObjectives || "[]").filter((obj: Objective) => {
      if (obj.expiresAt) {
        return new Date(obj.expiresAt) > now
      }
      return true
    })

    if (filtered.length !== JSON.parse(savedObjectives || "[]").length) {
      setObjectives(filtered)
      toast({
        title: "Objectives Expired",
        description: "Some temporary objectives have expired and been removed.",
        variant: "default",
      })
    }
  }, [toast])

  useEffect(() => {
    localStorage.setItem("objectives", JSON.stringify(objectives))
  }, [objectives])

  const addObjective = (objective: Omit<Objective, "id" | "createdAt" | "updatedAt">, profileId?: string) => {
    const now = new Date().toISOString()

    // Garantir que todas as propriedades obrigatórias estejam presentes
    const normalizedPhases = (objective.phases || []).map((phase) => ({
      ...phase,
      xpReward: phase.xpReward || { perCompletion: 0, perPoint: 0 },
      goldReward: phase.goldReward || { perCompletion: 0, perPoint: 0 },
      totalGoldEarned: phase.totalGoldEarned || 0,
      isRepeatable: phase.isRepeatable || false,
      isInfiniteLoop: phase.isInfiniteLoop || false,
      currentRepetitions: phase.currentRepetitions || 0,
      targetValue: phase.targetValue || 100, // Valor padrão para a fase
      subObjectives: (phase.subObjectives || []).map((sub) => ({
        ...sub,
        targetValue: sub.targetValue || 100, // Preservar o targetValue individual do subobjetivo
        currentValue: sub.currentValue || 0,
        xpReward: sub.xpReward || { perCompletion: 0, perPoint: 0 },
        goldReward: sub.goldReward || { perCompletion: 0, perPoint: 0 },
        totalGoldEarned: sub.totalGoldEarned || 0,
        isRepeatable: sub.isRepeatable || false,
        isInfiniteLoop: sub.isInfiniteLoop || false,
        currentRepetitions: sub.currentRepetitions || 0,
        hasCooldown: sub.hasCooldown || false,
        cooldownDuration: sub.cooldownDuration || 60,
        cooldownProgress: sub.cooldownProgress || 0,
      })),
    }))

    const newObjective: Objective = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      isRepeatable: false,
      currentCompletions: 0,
      totalGoldEarned: 0,
      phases: normalizedPhases,
      currentPhaseIndex: 0,
      goldReward: { perCompletion: 0, perPoint: 0 },
      xpReward: { perCompletion: 100, perPoint: 0 }, // Inicializar XpRewardType
      profileId: profileId || null,
      ...objective,
    }

    setObjectives((prev) => [...prev, newObjective])

    console.log("Created objective with profileId:", profileId, "Objective:", newObjective.name)

    toast({
      title: "Objetivo Criado",
      description: `${newObjective.name} foi criado com sucesso.`,
    })

    return newObjective.id
  }

  const updateObjective = (id: string, updates: Partial<Objective>) => {
    setObjectives((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates, updatedAt: new Date().toISOString() } : obj)),
    )
  }

  const deleteObjective = (id: string) => {
    setObjectives((prev) => prev.filter((obj) => obj.id !== id))

    toast({
      title: "Objetivo Deletado",
      description: "O objetivo foi deletado com sucesso.",
    })
  }

  const getObjective = (id: string) => {
    const objective = objectives.find((obj) => obj.id === id)
    console.log("Getting objective:", id, "Found:", objective) // Debug log
    return objective
  }

  const completeObjective = (id: string) => {
    const objective = objectives.find((obj) => obj.id === id)
    if (objective && !objective.completed) {
      const goldEarned = objective.goldReward.perCompletion
      const xpEarned = objective.xpReward.perCompletion

      updateObjective(id, {
        completed: true,
        totalGoldEarned: objective.totalGoldEarned + goldEarned,
      })

      // Award XP
      if (xpEarned > 0) {
        addXp(xpEarned)
      }

      // Award Gold
      if (goldEarned > 0) {
        addGold(goldEarned)
        toast({
          title: "Ouro Ganho",
          description: `Você ganhou ${goldEarned} de ouro por completar ${objective.name}.`,
        })
      }

      toast({
        title: "Objetivo Completado",
        description: `${objective.name} foi marcado como completo.`,
      })
    }
  }

  const resetObjective = (id: string) => {
    const objective = objectives.find((obj) => obj.id === id)
    if (!objective) return

    if (!objective.isRepeatable) {
      toast({
        title: "Erro",
        description: "Este objetivo não pode ser reiniciado.",
        variant: "destructive",
      })
      return
    }

    if (objective.maxCompletions && objective.currentCompletions >= objective.maxCompletions) {
      toast({
        title: "Erro",
        description: "Este objetivo atingiu o limite máximo de conclusões.",
        variant: "destructive",
      })
      return
    }

    const resetPhases = objective.phases
      ? objective.phases.map((phase) => ({
          ...phase,
          completed: false,
          subObjectives: phase.subObjectives.map((sub) => ({
            ...sub,
            completed: false,
            currentValue: 0,
          })),
        }))
      : []

    updateObjective(id, {
      completed: false,
      currentPhaseIndex: 0,
      phases: resetPhases,
      currentCompletions: objective.currentCompletions + 1,
      // Reset legacy fields
      currentStep: 0,
      percentage: 0,
      currentKills: 0,
      collectionItems: objective.collectionItems?.map((item) => ({
        ...item,
        currentAmount: 0,
      })),
    })

    toast({
      title: "Objetivo Reiniciado",
      description: `${objective.name} foi reiniciado. Conclusão ${objective.currentCompletions + 1}${objective.maxCompletions ? `/${objective.maxCompletions}` : ""}.`,
    })
  }

  const cloneObjective = (id: string) => {
    const objective = objectives.find((obj) => obj.id === id)
    if (!objective) return ""

    const clonedObjective = {
      ...objective,
      name: `${objective.name} (Cópia)`,
      completed: false,
      currentCompletions: 0,
      currentPhaseIndex: 0,
      phases: objective.phases.map((phase) => ({
        ...phase,
        id: uuidv4(),
        completed: false,
        subObjectives: phase.subObjectives.map((sub) => ({
          ...sub,
          id: uuidv4(),
          completed: false,
          currentValue: 0,
        })),
      })),
      // Reset legacy fields
      currentStep: 0,
      percentage: 0,
      currentKills: 0,
      collectionItems: objective.collectionItems?.map((item) => ({
        ...item,
        currentAmount: 0,
      })),
    }

    return addObjective(clonedObjective, objective.profileId || undefined)
  }

  const completeSubObjective = (objectiveId: string, phaseId: string, subObjectiveId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          const updatedPhases = obj.phases.map((phase) => {
            if (phase.id === phaseId) {
              const updatedSubObjectives = phase.subObjectives.map((sub) => {
                if (sub.id === subObjectiveId) {
                  const goldEarned = sub.goldReward.perCompletion
                  const xpEarned = sub.xpReward.perCompletion

                  // Award gold and XP immediately
                  if (goldEarned > 0) {
                    addGold(goldEarned)
                    toast({
                      title: "Ouro Ganho",
                      description: `+${goldEarned} ouro por completar ${sub.name}`,
                    })
                  }

                  // Award XP for sub-objective
                  if (xpEarned > 0) {
                    addXp(xpEarned)
                    toast({
                      title: "XP Ganho",
                      description: `+${xpEarned} XP por completar ${sub.name}`,
                    })
                  }

                  return {
                    ...sub,
                    completed: true,
                    currentValue: sub.targetValue,
                    totalGoldEarned: sub.totalGoldEarned + goldEarned,
                  }
                }
                return sub
              })

              // Verificar se todos os subobjetivos da fase estão completos
              const allSubObjectivesComplete = updatedSubObjectives.every((sub) => sub.completed)

              let phaseGoldEarned = 0
              let phaseXpEarned = 0
              if (allSubObjectivesComplete && !phase.completed) {
                phaseGoldEarned = phase.goldReward.perCompletion
                phaseXpEarned = phase.xpReward.perCompletion

                if (phaseGoldEarned > 0) {
                  addGold(phaseGoldEarned)
                  toast({
                    title: "Ouro da Fase",
                    description: `+${phaseGoldEarned} ouro por completar ${phase.name}`,
                  })
                }

                // Award XP for phase completion
                if (phaseXpEarned > 0) {
                  addXp(phaseXpEarned)
                  toast({
                    title: "XP da Fase",
                    description: `+${phaseXpEarned} XP por completar ${phase.name}`,
                  })
                }
              }

              return {
                ...phase,
                subObjectives: updatedSubObjectives,
                completed: allSubObjectivesComplete,
                totalGoldEarned: phase.totalGoldEarned + phaseGoldEarned,
              }
            }
            return phase
          })

          // Verificar se a fase atual está completa para avançar automaticamente
          const currentPhase = updatedPhases[obj.currentPhaseIndex]
          let newPhaseIndex = obj.currentPhaseIndex
          let objectiveCompleted = obj.completed
          let objectiveGoldEarned = 0
          let objectiveXpEarned = 0

          if (currentPhase?.completed && obj.currentPhaseIndex < updatedPhases.length - 1) {
            newPhaseIndex = obj.currentPhaseIndex + 1
          }

          // Verificar se todas as fases estão completas
          if (updatedPhases.every((phase) => phase.completed) && !obj.completed) {
            objectiveCompleted = true
            objectiveGoldEarned = obj.goldReward.perCompletion
            objectiveXpEarned = obj.xpReward.perCompletion

            if (objectiveGoldEarned > 0) {
              addGold(objectiveGoldEarned)
              toast({
                title: "Ouro do Objetivo",
                description: `+${objectiveGoldEarned} ouro por completar ${obj.name}`,
              })
            }

            // Award XP for objective completion
            if (objectiveXpEarned > 0) {
              addXp(objectiveXpEarned)
              toast({
                title: "XP do Objetivo",
                description: `+${objectiveXpEarned} XP por completar ${obj.name}`,
              })
            }
          }

          return {
            ...obj,
            phases: updatedPhases,
            currentPhaseIndex: newPhaseIndex,
            completed: objectiveCompleted,
            totalGoldEarned: obj.totalGoldEarned + objectiveGoldEarned,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const updateSubObjective = (objectiveId: string, phaseId: string, subObjectiveId: string, value: number) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          const updatedPhases = obj.phases.map((phase) => {
            if (phase.id === phaseId) {
              const updatedSubObjectives = phase.subObjectives.map((sub) => {
                if (sub.id === subObjectiveId) {
                  const oldValue = sub.currentValue
                  const newValue = Math.max(0, Math.min(value, sub.targetValue))
                  const completed = newValue >= sub.targetValue

                  // Calculate XP per point
                  const pointsGained = Math.max(0, newValue - oldValue)
                  const xpEarned = pointsGained * sub.xpReward.perPoint

                  if (xpEarned > 0) {
                    addXp(xpEarned)
                    toast({
                      title: "XP por Progresso",
                      description: `+${xpEarned} XP por ${pointsGained} pontos em ${sub.name}`,
                    })
                  }

                  // Calculate gold per point (manter o código existente)
                  const goldEarned = pointsGained * sub.goldReward.perPoint

                  if (goldEarned > 0) {
                    addGold(goldEarned)
                    toast({
                      title: "Ouro por Progresso",
                      description: `+${goldEarned} ouro por ${pointsGained} pontos em ${sub.name}`,
                    })
                  }

                  return {
                    ...sub,
                    currentValue: newValue,
                    completed,
                    totalGoldEarned: sub.totalGoldEarned + goldEarned,
                  }
                }
                return sub
              })

              const allSubObjectivesComplete = updatedSubObjectives.every((sub) => sub.completed)

              return {
                ...phase,
                subObjectives: updatedSubObjectives,
                completed: allSubObjectivesComplete,
              }
            }
            return phase
          })

          return {
            ...obj,
            phases: updatedPhases,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const completePhase = (objectiveId: string, phaseId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          const updatedPhases = obj.phases.map((phase) => {
            if (phase.id === phaseId) {
              const completedSubObjectives = phase.subObjectives.map((sub) => ({
                ...sub,
                completed: true,
                currentValue: sub.targetValue,
              }))

              return {
                ...phase,
                subObjectives: completedSubObjectives,
                completed: true,
              }
            }
            return phase
          })

          // Dar XP da fase
          const completedPhase = updatedPhases.find((p) => p.id === phaseId)
          if (completedPhase?.xpReward?.perCompletion) {
            addXp(completedPhase.xpReward.perCompletion)
            toast({
              title: "XP da Fase",
              description: `+${completedPhase.xpReward.perCompletion} XP por completar ${completedPhase.name}`,
            })
          }

          return {
            ...obj,
            phases: updatedPhases,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const goToNextPhase = (objectiveId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId && obj.currentPhaseIndex < obj.phases.length - 1) {
          return {
            ...obj,
            currentPhaseIndex: obj.currentPhaseIndex + 1,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const incrementCollectionItem = (objectiveId: string, itemIndex: number, amount: number) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId && obj.collectionItems) {
          const updatedCollectionItems = obj.collectionItems.map((item, index) => {
            if (index === itemIndex) {
              return { ...item, currentAmount: item.currentAmount + amount }
            }
            return item
          })

          return {
            ...obj,
            collectionItems: updatedCollectionItems,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const incrementStep = (objectiveId: string, steps: number) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId && obj.totalSteps) {
          const newCurrentStep = Math.min(obj.totalSteps, (obj.currentStep || 0) + steps)
          return {
            ...obj,
            currentStep: newCurrentStep,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const updatePercentage = (objectiveId: string, percentage: number) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          return {
            ...obj,
            percentage: percentage,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  const incrementKills = (objectiveId: string, kills: number) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          return {
            ...obj,
            currentKills: (obj.currentKills || 0) + kills,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  // Funções para repetições de fases
  const resetPhase = (objectiveId: string, phaseId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          const updatedPhases = obj.phases.map((phase) => {
            if (phase.id === phaseId) {
              if (!phase.isRepeatable) return phase

              if (!phase.isInfiniteLoop && phase.maxRepetitions && phase.currentRepetitions >= phase.maxRepetitions) {
                return phase // Não pode mais repetir
              }

              const resetSubObjectives = phase.subObjectives.map((sub) => ({
                ...sub,
                completed: false,
                currentValue: 0,
                currentRepetitions: sub.isRepeatable ? sub.currentRepetitions : 0,
              }))

              return {
                ...phase,
                completed: false,
                subObjectives: resetSubObjectives,
                currentRepetitions: phase.currentRepetitions + 1,
              }
            }
            return phase
          })

          return {
            ...obj,
            phases: updatedPhases,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  // Funções para repetições de subobjetivos
  const resetSubObjective = (objectiveId: string, phaseId: string, subObjectiveId: string) => {
    setObjectives((prev) =>
      prev.map((obj) => {
        if (obj.id === objectiveId) {
          const updatedPhases = obj.phases.map((phase) => {
            if (phase.id === phaseId) {
              const updatedSubObjectives = phase.subObjectives.map((sub) => {
                if (sub.id === subObjectiveId) {
                  if (!sub.isRepeatable) return sub

                  if (!sub.isInfiniteLoop && sub.maxRepetitions && sub.currentRepetitions >= sub.maxRepetitions) {
                    return sub // Não pode mais repetir
                  }

                  return {
                    ...sub,
                    completed: false,
                    currentValue: 0,
                    currentRepetitions: sub.currentRepetitions + 1,
                  }
                }
                return sub
              })

              return {
                ...phase,
                subObjectives: updatedSubObjectives,
              }
            }
            return phase
          })

          return {
            ...obj,
            phases: updatedPhases,
            updatedAt: new Date().toISOString(),
          }
        }
        return obj
      }),
    )
  }

  return (
    <ObjectivesContext.Provider
      value={{
        objectives,
        addObjective,
        updateObjective,
        deleteObjective,
        getObjective,
        completeObjective,
        resetObjective,
        cloneObjective,
        completeSubObjective,
        updateSubObjective,
        completePhase,
        goToNextPhase,
        resetPhase,
        resetSubObjective,
        incrementCollectionItem,
        incrementStep,
        updatePercentage,
        incrementKills,
      }}
    >
      {children}
    </ObjectivesContext.Provider>
  )
}

export function useObjectives() {
  const context = useContext(ObjectivesContext)
  if (context === undefined) {
    throw new Error("useObjectives must be used within an ObjectivesProvider")
  }
  return context
}
