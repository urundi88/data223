"use client"

import { useParams } from "next/navigation"
import { useObjectives } from "@/contexts/objectives-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Circle,
  Trophy,
  MapPin,
  Coins,
  Star,
  RotateCcw,
  Zap,
  Plus,
  Minus,
  Clock,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState, useEffect } from "react"

export default function ObjectiveDetailsPage() {
  const params = useParams()
  const { objectives, updateObjective, updateSubObjective } = useObjectives()
  const { toast } = useToast()
  const objectiveId = params.id as string

  const objective = objectives.find((obj) => obj.id === objectiveId)

  const [cooldownTimers, setCooldownTimers] = useState<{ [key: string]: NodeJS.Timeout }>({})

  useEffect(() => {
    const updateCooldowns = () => {
      if (!objective?.phases) return

      let hasActiveCooldowns = false
      const updatedObjective = { ...objective }

      objective.phases.forEach((phase, phaseIndex) => {
        phase.subObjectives.forEach((subObj, subIndex) => {
          if (subObj.hasCooldown && subObj.cooldownStartTime) {
            const elapsed = Date.now() - subObj.cooldownStartTime
            const progress = Math.min((elapsed / (subObj.cooldownDuration * 1000)) * 100, 100)

            if (progress < 100) {
              hasActiveCooldowns = true
              updatedObjective.phases[phaseIndex].subObjectives[subIndex] = {
                ...subObj,
                cooldownProgress: progress,
              }
            } else {
              // Cooldown completed
              updatedObjective.phases[phaseIndex].subObjectives[subIndex] = {
                ...subObj,
                cooldownProgress: 100,
                cooldownStartTime: undefined,
              }
            }
          }
        })
      })

      if (hasActiveCooldowns) {
        updateObjective(objectiveId, updatedObjective)
      }
    }

    const interval = setInterval(updateCooldowns, 100) // Update every 100ms for smooth progress
    return () => clearInterval(interval)
  }, [objective, updateObjective, objectiveId])

  if (!objective) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Objetivo não encontrado</h1>
          <Link href="/objectives">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Objetivos
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Função para incrementar/decrementar pontos de subobjetivo
  const handleSubObjectivePointChange = (phaseId: string, subObjectiveId: string, change: number) => {
    const phase = objective.phases.find((p) => p.id === phaseId)
    const subObj = phase?.subObjectives.find((s) => s.id === subObjectiveId)

    if (!subObj) return

    // Verificar cooldown
    if (subObj.hasCooldown && subObj.cooldownStartTime) {
      const elapsed = Date.now() - subObj.cooldownStartTime
      const cooldownRemaining = subObj.cooldownDuration * 1000 - elapsed

      if (cooldownRemaining > 0) {
        const remainingSeconds = Math.ceil(cooldownRemaining / 1000)
        toast({
          title: "Cooldown Ativo",
          description: `Aguarde ${formatCooldownTime(remainingSeconds)} para adicionar pontos.`,
          variant: "destructive",
        })
        return
      }
    }

    const newValue = Math.max(0, Math.min(subObj.currentValue + change, subObj.targetValue))

    // Se está incrementando e tem cooldown, iniciar cooldown
    if (change > 0 && subObj.hasCooldown) {
      const updatedObjective = { ...objective }
      const phaseIndex = updatedObjective.phases.findIndex((p) => p.id === phaseId)
      const subIndex = updatedObjective.phases[phaseIndex].subObjectives.findIndex((s) => s.id === subObjectiveId)

      updatedObjective.phases[phaseIndex].subObjectives[subIndex] = {
        ...subObj,
        cooldownStartTime: Date.now(),
        cooldownProgress: 0,
      }

      updateObjective(objectiveId, updatedObjective)
    }

    updateSubObjective(objectiveId, phaseId, subObjectiveId, newValue)
  }

  // Função para definir valor específico de subobjetivo
  const handleSubObjectiveValueSet = (phaseId: string, subObjectiveId: string, value: number) => {
    const phase = objective.phases.find((p) => p.id === phaseId)
    const subObj = phase?.subObjectives.find((s) => s.id === subObjectiveId)

    if (!subObj) return

    const newValue = Math.max(0, Math.min(value, subObj.targetValue))
    updateSubObjective(objectiveId, phaseId, subObjectiveId, newValue)
  }

  // Função para resetar repetições de um subobjetivo específico
  const handleResetSubObjectiveRepetitions = (phaseIndex: number, subIndex: number) => {
    const updatedObjective = { ...objective }
    if (updatedObjective.phases && updatedObjective.phases[phaseIndex]) {
      updatedObjective.phases[phaseIndex].subObjectives[subIndex] = {
        ...updatedObjective.phases[phaseIndex].subObjectives[subIndex],
        currentRepetitions: 0,
        currentValue: 0,
        completed: false,
      }
      updateObjective(objectiveId, updatedObjective)
      toast({
        title: "Repetições Resetadas",
        description: "Repetições do subobjetivo foram resetadas com sucesso.",
      })
    }
  }

  // Função para resetar repetições de uma fase específica
  const handleResetPhaseRepetitions = (phaseIndex: number) => {
    const updatedObjective = { ...objective }
    if (updatedObjective.phases && updatedObjective.phases[phaseIndex]) {
      updatedObjective.phases[phaseIndex] = {
        ...updatedObjective.phases[phaseIndex],
        currentRepetitions: 0,
        completed: false,
        subObjectives: updatedObjective.phases[phaseIndex].subObjectives.map((sub) => ({
          ...sub,
          completed: false,
          currentRepetitions: 0,
          currentValue: 0,
        })),
      }
      updateObjective(objectiveId, updatedObjective)
      toast({
        title: "Repetições da Fase Resetadas",
        description: "Todas as repetições da fase foram resetadas com sucesso.",
      })
    }
  }

  // Função para resetar todo o objetivo
  const handleResetObjective = () => {
    const updatedObjective = {
      ...objective,
      completed: false,
      currentCompletions: 0,
      currentPhaseIndex: 0,
      phases: objective.phases?.map((phase) => ({
        ...phase,
        completed: false,
        currentRepetitions: 0,
        subObjectives: phase.subObjectives.map((sub) => ({
          ...sub,
          completed: false,
          currentRepetitions: 0,
          currentValue: 0,
        })),
      })),
    }

    // Resetar campos específicos por tipo
    if (objective.type === "collection" && objective.collectionItems) {
      updatedObjective.collectionItems = objective.collectionItems.map((item) => ({
        ...item,
        currentAmount: 0,
      }))
    } else if (objective.type === "steps") {
      updatedObjective.currentStep = 0
    } else if (objective.type === "percentage") {
      updatedObjective.percentage = 0
    } else if (objective.type === "kill") {
      updatedObjective.currentKills = 0
    }

    updateObjective(objectiveId, updatedObjective)
    toast({
      title: "Objetivo Resetado",
      description: "Todo o progresso do objetivo foi resetado com sucesso.",
    })
  }

  // Função para calcular progresso baseado no tipo de objetivo
  const calculateProgress = () => {
    if (objective.phases && objective.phases.length > 0) {
      const currentPhase = objective.phases[objective.currentPhaseIndex || 0]
      if (currentPhase) {
        const completedSubObjectives = currentPhase.subObjectives.filter((sub) => sub.completed).length
        const totalSubObjectives = currentPhase.subObjectives.length
        return totalSubObjectives > 0 ? (completedSubObjectives / totalSubObjectives) * 100 : 0
      }
    }

    switch (objective.type) {
      case "collection":
        if (objective.collectionItems) {
          const totalItems = objective.collectionItems.reduce((sum, item) => sum + item.targetAmount, 0)
          const currentItems = objective.collectionItems.reduce((sum, item) => sum + item.currentAmount, 0)
          return totalItems > 0 ? (currentItems / totalItems) * 100 : 0
        }
        break
      case "steps":
        return objective.totalSteps > 0 ? ((objective.currentStep || 0) / objective.totalSteps) * 100 : 0
      case "percentage":
        return objective.percentage || 0
      case "kill":
        return objective.targetKills > 0 ? ((objective.currentKills || 0) / objective.targetKills) * 100 : 0
    }
    return 0
  }

  // Função para determinar como o XP é ganho
  const getXPEarningMethod = () => {
    const methods = []

    if (objective.xpReward?.perCompletion && objective.xpReward.perCompletion > 0) {
      methods.push(`${objective.xpReward.perCompletion} XP por conclusão`)
    }

    if (objective.xpReward?.perPoint && objective.xpReward.perPoint > 0) {
      methods.push(`${objective.xpReward.perPoint} XP por ponto`)
    }

    return methods.length > 0 ? methods.join(" + ") : "Sem recompensa XP"
  }

  const formatCooldownTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const progress = calculateProgress()

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/objectives">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">{objective.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Detalhes do Objetivo
                <div className="flex items-center gap-2">
                  <Badge variant={objective.completed ? "default" : "secondary"}>
                    {objective.completed ? "Concluído" : "Em Progresso"}
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-300 bg-transparent">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reiniciar Objetivo
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reiniciar Objetivo Completo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja reiniciar todo o objetivo? Isso irá resetar todas as fases,
                          subobjetivos e progresso para zero. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetObjective} className="bg-red-600 hover:bg-red-700">
                          Reiniciar Tudo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {objective.description && <p className="text-muted-foreground">{objective.description}</p>}

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Sistema de Recompensas XP Detalhado */}
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Sistema de Recompensas XP</span>
                </div>
                <div className="text-sm text-blue-700">
                  <strong>Como você ganha XP:</strong> {getXPEarningMethod()}
                </div>
              </Card>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {objective.xpReward?.perCompletion && objective.xpReward.perCompletion > 0 && (
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                    <div>
                      <div className="text-muted-foreground">XP/Conclusão</div>
                      <div className="font-medium">{objective.xpReward.perCompletion}</div>
                    </div>
                  </div>
                )}

                {objective.xpReward?.perPoint && objective.xpReward.perPoint > 0 && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <div className="text-muted-foreground">XP/Ponto</div>
                      <div className="font-medium">{objective.xpReward.perPoint}</div>
                    </div>
                  </div>
                )}

                {objective.goldReward &&
                  (objective.goldReward.perCompletion > 0 || objective.goldReward.perPoint > 0) && (
                    <>
                      {objective.goldReward.perCompletion > 0 && (
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-yellow-600" />
                          <div>
                            <div className="text-muted-foreground">Ouro/Conclusão</div>
                            <div className="font-medium">{objective.goldReward.perCompletion}</div>
                          </div>
                        </div>
                      )}

                      {objective.goldReward.perPoint > 0 && (
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-yellow-600" />
                          <div>
                            <div className="text-muted-foreground">Ouro/Ponto</div>
                            <div className="font-medium">{objective.goldReward.perPoint}</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                <div className="flex items-center">
                  <Circle className="h-4 w-4 mr-2 text-purple-500" />
                  <div>
                    <div className="text-muted-foreground">Tipo</div>
                    <div className="font-medium capitalize">{objective.type}</div>
                  </div>
                </div>
              </div>

              {objective.location && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Localização</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {objective.location.zone && (
                      <div>
                        <strong>Zona:</strong> {objective.location.zone}
                      </div>
                    )}
                    {objective.location.coordinates && (
                      <div>
                        <strong>Coordenadas:</strong> {objective.location.coordinates}
                      </div>
                    )}
                    {objective.location.notes && (
                      <div>
                        <strong>Notas:</strong> {objective.location.notes}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Fases e Subobjetivos */}
          {objective.phases && objective.phases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fases e Subobjetivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {objective.phases.map((phase, phaseIndex) => (
                    <div key={phase.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium">{phase.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={phase.completed ? "default" : "secondary"}>
                            {phase.completed ? "Concluída" : "Em Progresso"}
                          </Badge>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 bg-transparent"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset Fase
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Resetar Fase</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja resetar esta fase e todos os seus subobjetivos? Esta ação não
                                  pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResetPhaseRepetitions(phaseIndex)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Resetar Fase
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {phase.description && <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>}

                      {/* Recompensas da Fase */}
                      {(phase.xpReward?.perCompletion > 0 ||
                        phase.xpReward?.perPoint > 0 ||
                        phase.goldReward?.perCompletion > 0 ||
                        phase.goldReward?.perPoint > 0) && (
                        <Card className="p-3 bg-green-50 border-green-200 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800 text-sm">Recompensas da Fase</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {phase.xpReward?.perCompletion > 0 && (
                              <div>XP/Conclusão: {phase.xpReward.perCompletion}</div>
                            )}
                            {phase.xpReward?.perPoint > 0 && <div>XP/Ponto: {phase.xpReward.perPoint}</div>}
                            {phase.goldReward?.perCompletion > 0 && (
                              <div>Ouro/Conclusão: {phase.goldReward.perCompletion}</div>
                            )}
                            {phase.goldReward?.perPoint > 0 && <div>Ouro/Ponto: {phase.goldReward.perPoint}</div>}
                          </div>
                        </Card>
                      )}

                      <div className="space-y-3">
                        {phase.subObjectives.map((subObj: any) => (
                          <div key={subObj.id} className="bg-muted/30 rounded p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{subObj.name}</span>
                                  {subObj.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                                </div>
                                {subObj.description && (
                                  <div className="text-xs text-muted-foreground">{subObj.description}</div>
                                )}
                              </div>
                            </div>

                            {/* Estatísticas Detalhadas */}
                            <div className="bg-white/50 rounded p-3 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-purple-600">🎯 Atual:</span>
                                <span className="font-medium">{subObj.currentValue}</span>
                                <span className="text-blue-600">🎯 Meta:</span>
                                <span className="font-medium">{subObj.targetValue}</span>
                                <span className="text-orange-600">➡️ Restante:</span>
                                <span className="font-medium">{subObj.targetValue - subObj.currentValue}</span>
                                <span className="text-green-600">⚡ XP:</span>
                                <span className="font-medium">{subObj.xpReward?.perPoint || 0}/pt</span>
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Progresso do Subobjetivo</span>
                                  <span>{Math.round((subObj.currentValue / subObj.targetValue) * 100)}%</span>
                                </div>
                                <Progress value={(subObj.currentValue / subObj.targetValue) * 100} className="h-1" />
                              </div>
                            </div>

                            {/* Controles de Pontos */}
                            <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubObjectivePointChange(phase.id, subObj.id, -1)}
                                disabled={subObj.currentValue <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>

                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={subObj.targetValue}
                                  value={subObj.currentValue}
                                  onChange={(e) =>
                                    handleSubObjectiveValueSet(
                                      phase.id,
                                      subObj.id,
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  className="w-20 text-center"
                                />
                                <span className="text-sm text-muted-foreground">/ {subObj.targetValue}</span>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSubObjectivePointChange(phase.id, subObj.id, 1)}
                                disabled={subObj.currentValue >= subObj.targetValue}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Cooldown Display */}
                            {subObj.hasCooldown && (
                              <div className="bg-blue-50 rounded p-2 space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-800">Cooldown</span>
                                </div>
                                {subObj.cooldownStartTime &&
                                subObj.cooldownProgress !== undefined &&
                                subObj.cooldownProgress < 100 ? (
                                  <div className="space-y-1">
                                    <Progress value={subObj.cooldownProgress} className="h-1" />
                                    <div className="text-xs text-blue-600">
                                      Restante:{" "}
                                      {formatCooldownTime(
                                        Math.ceil(
                                          (subObj.cooldownDuration * 1000 - (Date.now() - subObj.cooldownStartTime)) /
                                            1000,
                                        ),
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-blue-600">
                                    Duração: {formatCooldownTime(subObj.cooldownDuration)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Rewards */}
                            {((subObj.xpReward?.perPoint || 0) > 0 ||
                              (subObj.xpReward?.perCompletion || 0) > 0 ||
                              (subObj.goldReward?.perCompletion || 0) > 0 ||
                              (subObj.goldReward?.perPoint || 0) > 0) && (
                              <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                                <strong>Recompensas:</strong>
                                {subObj.xpReward?.perCompletion ||
                                  (0 > 0 && ` ${subObj.xpReward.perCompletion} XP/conclusão`)}
                                {(subObj.xpReward?.perPoint || 0) > 0 && ` ${subObj.xpReward.perPoint} XP/ponto`}
                                {(subObj.goldReward?.perCompletion || 0) > 0 &&
                                  ` ${subObj.goldReward.perCompletion} Ouro/conclusão`}
                                {(subObj.goldReward?.perPoint || 0) > 0 && ` ${subObj.goldReward.perPoint} Ouro/ponto`}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Itens de Coleção */}
          {objective.type === "collection" && objective.collectionItems && (
            <Card>
              <CardHeader>
                <CardTitle>Itens de Coleção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {objective.collectionItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-right">
                        <div className="font-medium">
                          {item.currentAmount}/{item.targetAmount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round((item.currentAmount / item.targetAmount) * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar with additional information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {objective.isRepeatable && (
                <div>
                  <div className="text-sm text-muted-foreground">Repetições</div>
                  <div className="font-medium">
                    {objective.currentCompletions || 0}
                    {objective.maxCompletions ? `/${objective.maxCompletions}` : " (Ilimitado)"}
                  </div>
                </div>
              )}

              {objective.totalGoldEarned && objective.totalGoldEarned > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Ouro Total Ganho</div>
                  <div className="font-medium flex items-center">
                    <Coins className="h-4 w-4 mr-1 text-yellow-600" />
                    {objective.totalGoldEarned}
                  </div>
                </div>
              )}

              {objective.category && (
                <div>
                  <div className="text-sm text-muted-foreground">Categoria</div>
                  <div className="font-medium">{objective.category}</div>
                </div>
              )}

              {objective.expiresAt && (
                <div>
                  <div className="text-sm text-muted-foreground">Expira em</div>
                  <div className="font-medium">{new Date(objective.expiresAt).toLocaleDateString("pt-BR")}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Link href={`/objectives/edit/${objective.id}`}>
              <Button className="w-full">Editar Objetivo</Button>
            </Link>
            <Link href="/objectives">
              <Button variant="outline" className="w-full bg-transparent">
                Voltar para Lista
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
