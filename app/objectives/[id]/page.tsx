"use client"

import { useEffect, useState } from "react"
import { useObjectives, type Objective } from "@/contexts/objectives-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  Clock,
  Circle,
  ArrowRight,
  Trophy,
  RotateCcw,
  Copy,
  Search,
  Coins,
  MapPin,
  Zap,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import DraggableSubObjectives from "@/components/draggable-subobjectives"
import { XpProgressBar } from "@/components/xp-progress-bar"

interface PageProps {
  params: {
    id: string
  }
}

export default function ObjectiveDetailsPage({ params }: PageProps) {
  const {
    objectives,
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
    updateObjective,
  } = useObjectives()
  const { toast } = useToast()
  const [objective, setObjective] = useState<Objective | null>(null)
  const [inputValue, setInputValue] = useState<number>(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Evitar conflito com a rota /objectives/new
  const isNewRoute = params.id === "new"

  useEffect(() => {
    try {
      // Evitar processar a rota "new"
      if (isNewRoute) {
        setError("Rota inválida")
        setLoading(false)
        return
      }

      console.log("Searching for objective with ID:", params.id)
      console.log(
        "Available objectives:",
        objectives.map((o) => ({ id: o.id, name: o.name })),
      )

      if (!params.id) {
        setError("ID do objetivo não fornecido")
        setLoading(false)
        return
      }

      const obj = objectives.find((o) => o.id === params.id)
      console.log("Found objective:", obj)

      if (objectives.length > 0 && !obj) {
        setError(`Objetivo com ID "${params.id}" não encontrado`)
      } else if (obj) {
        setObjective(obj)
        setError(null)
      }

      setLoading(false)
    } catch (err) {
      console.error("Error loading objective:", err)
      setError("Erro ao carregar objetivo")
      setLoading(false)
    }
  }, [params.id, objectives])

  // Filtrar fases e subobjetivos baseado na busca
  const filteredPhases =
    objective?.phases?.filter((phase) => {
      if (!searchTerm) return true

      const phaseMatch =
        phase.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phase.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const subObjectiveMatch = phase.subObjectives.some(
        (sub) =>
          sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      return phaseMatch || subObjectiveMatch
    }) || []

  // Função para reordenar subobjetivos
  const handleReorderSubObjectives = (phaseId: string, startIndex: number, endIndex: number) => {
    if (!objective) return

    const updatedPhases = objective.phases.map((phase) => {
      if (phase.id === phaseId) {
        const reorderedSubObjectives = [...phase.subObjectives]
        const [removed] = reorderedSubObjectives.splice(startIndex, 1)
        reorderedSubObjectives.splice(endIndex, 0, removed)

        return {
          ...phase,
          subObjectives: reorderedSubObjectives,
        }
      }
      return phase
    })

    updateObjective(objective.id, { phases: updatedPhases })
  }

  // Função para resetar repetições de subobjetivos
  const handleResetSubObjectiveRepetitions = (subObjectiveId: string) => {
    if (!objective) return

    const updatedPhases = objective.phases.map((phase) => ({
      ...phase,
      subObjectives: phase.subObjectives.map((sub) =>
        sub.id === subObjectiveId ? { ...sub, currentRepetitions: 0 } : sub,
      ),
    }))

    updateObjective(objective.id, { phases: updatedPhases })

    toast({
      title: "Repetições Resetadas",
      description: "As repetições do subobjetivo foram resetadas para zero.",
    })
  }

  // Função para verificar se o objetivo pode ser reiniciado
  const canResetObjective = (obj: Objective) => {
    if (!obj.isRepeatable) return false

    // Se é loop infinito, sempre pode reiniciar
    if (obj.maxCompletions === undefined || obj.maxCompletions === null) return true

    // Se tem limite máximo, verificar se ainda não atingiu
    return obj.currentCompletions < obj.maxCompletions
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Carregando objetivo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">ID procurado: {params.id}</p>
              <p className="text-sm text-muted-foreground">Objetivos disponíveis: {objectives.length}</p>
            </div>
            <div className="mt-4">
              <Link href="/objectives">
                <Button variant="outline">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar para Objetivos
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!objective) {
    return (
      <div className="p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Objetivo não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Nenhum objetivo foi encontrado. Isso pode acontecer se o objetivo foi deletado ou se há um problema de
              sincronização.
            </p>
            <Link href="/objectives">
              <Button variant="outline">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar para Objetivos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Se não há fases, mostrar interface simplificada
  if (!objective.phases || objective.phases.length === 0) {
    return (
      <div className="p-4 space-y-6">
        {/* Barra de XP no topo */}
        <XpProgressBar size="lg" />

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
                {objective.name}
                {objective.isRepeatable && (
                  <Badge
                    variant={
                      objective.maxCompletions && objective.currentCompletions >= objective.maxCompletions
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {objective.currentCompletions}
                    {objective.maxCompletions ? `/${objective.maxCompletions}` : "/∞"}
                    {objective.maxCompletions && objective.currentCompletions >= objective.maxCompletions && " (Máx)"}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline">{objective.type}</Badge>
                {objective.category && <Badge variant="secondary">{objective.category}</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{objective.description}</p>

              {objective.expiresAt && (
                <div className="flex items-center mt-2 text-amber-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">Expira: {new Date(objective.expiresAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Circle className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="font-medium">{objective.completed ? "Completo" : "Em Progresso"}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="text-muted-foreground">Tipo</div>
                  <div className="font-medium">{objective.type}</div>
                </div>
              </div>
              <div className="flex items-center">
                <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="text-muted-foreground">Categoria</div>
                  <div className="font-medium">{objective.category || "Nenhuma"}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="text-muted-foreground">XP Recompensa</div>
                  <div className="font-medium">
                    {typeof objective.xpReward === "object"
                      ? `${objective.xpReward.perCompletion}${objective.xpReward.perPoint > 0 ? ` + ${objective.xpReward.perPoint}/pt` : ""}`
                      : objective.xpReward}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!objective.completed && (
                <Button onClick={() => completeObjective(objective.id)}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completar Objetivo
                </Button>
              )}
              {canResetObjective(objective) && (
                <Button variant="outline" onClick={() => resetObjective(objective.id)}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reiniciar
                </Button>
              )}
              <Button variant="outline" onClick={() => cloneObjective(objective.id)}>
                <Copy className="h-4 w-4 mr-1" />
                Clonar
              </Button>

              {/* Indicador quando atingiu limite máximo */}
              {objective.isRepeatable &&
                objective.maxCompletions &&
                objective.currentCompletions >= objective.maxCompletions && (
                  <Badge variant="destructive" className="ml-2">
                    Limite de Repetições Atingido
                  </Badge>
                )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Link href="/objectives">
            <Button variant="outline">Voltar para Objetivos</Button>
          </Link>
          <Button variant="outline">
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // Interface com fases
  const currentPhase = objective.phases[objective.currentPhaseIndex]
  const totalPhases = objective.phases.length
  const completedPhases = objective.phases.filter((p) => p.completed).length
  const overallProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0

  const handleCompleteObjective = () => {
    completeObjective(objective.id)
    toast({
      title: "Objetivo Completado",
      description: `${objective.name} foi marcado como completo.`,
    })
  }

  const handleResetObjective = () => {
    resetObjective(objective.id)
    toast({
      title: "Objetivo Reiniciado",
      description: `${objective.name} foi reiniciado.`,
    })
  }

  const handleCloneObjective = () => {
    const newId = cloneObjective(objective.id)
    toast({
      title: "Objetivo Clonado",
      description: `${objective.name} foi clonado com sucesso.`,
    })
  }

  const handleCompleteSubObjective = (subObjectiveId: string) => {
    if (currentPhase) {
      completeSubObjective(objective.id, currentPhase.id, subObjectiveId)
    }
  }

  const handleUpdateSubObjective = (subObjectiveId: string, value: number) => {
    if (currentPhase) {
      updateSubObjective(objective.id, currentPhase.id, subObjectiveId, value)
    }
  }

  const handleResetSubObjective = (subObjectiveId: string) => {
    if (currentPhase) {
      resetSubObjective(objective.id, currentPhase.id, subObjectiveId)
    }
  }

  const handleCompletePhase = () => {
    if (currentPhase) {
      completePhase(objective.id, currentPhase.id)
      toast({
        title: "Fase Completada",
        description: `${currentPhase.name} foi completada.`,
      })
    }
  }

  const handleNextPhase = () => {
    goToNextPhase(objective.id)
    toast({
      title: "Próxima Fase",
      description: "Avançou para a próxima fase.",
    })
  }

  return (
    <div className="p-4 space-y-6">
      {/* Barra de XP no topo */}
      <XpProgressBar size="lg" />

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              {objective.name}
              {objective.isRepeatable && (
                <Badge
                  variant={
                    objective.maxCompletions && objective.currentCompletions >= objective.maxCompletions
                      ? "destructive"
                      : "outline"
                  }
                >
                  {objective.currentCompletions}
                  {objective.maxCompletions ? `/${objective.maxCompletions}` : "/∞"}
                  {objective.maxCompletions && objective.currentCompletions >= objective.maxCompletions && " (Máx)"}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{objective.type}</Badge>
              {objective.category && <Badge variant="secondary">{objective.category}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{objective.description}</p>

            {objective.expiresAt && (
              <div className="flex items-center mt-2 text-amber-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Expira: {new Date(objective.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Progresso Geral</span>
              <span className="text-sm">
                {completedPhases}/{totalPhases} fases
              </span>
            </div>
            <Progress value={overallProgress} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Fases Completas</div>
                <div className="font-medium">{completedPhases}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Fases Totais</div>
                <div className="font-medium">{totalPhases}</div>
              </div>
            </div>
            <div className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Fases Restantes</div>
                <div className="font-medium">{totalPhases - completedPhases}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 mr-2 text-blue-500" />
              <div>
                <div className="text-muted-foreground">XP Total</div>
                <div className="font-medium">
                  {typeof objective.xpReward === "object"
                    ? `${objective.xpReward.perCompletion}${objective.xpReward.perPoint > 0 ? ` + ${objective.xpReward.perPoint}/pt` : ""}`
                    : objective.xpReward}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              <div>
                <div className="text-muted-foreground">Ouro Total Ganho</div>
                <div className="font-medium">{objective.totalGoldEarned}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              <div>
                <div className="text-muted-foreground">Ouro por Conclusão</div>
                <div className="font-medium">{objective.goldReward?.perCompletion || 0}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              <div>
                <div className="text-muted-foreground">Ouro por Ponto</div>
                <div className="font-medium">{objective.goldReward?.perPoint || 0}</div>
              </div>
            </div>
            {objective.location && (
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="text-muted-foreground">Localização</div>
                  <div className="font-medium">
                    {objective.location.zone || objective.location.coordinates || "Registrada"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {!objective.completed && (
              <Button onClick={handleCompleteObjective}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Completar Objetivo
              </Button>
            )}
            {canResetObjective(objective) && (
              <Button variant="outline" onClick={handleResetObjective}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reiniciar
              </Button>
            )}
            <Button variant="outline" onClick={handleCloneObjective}>
              <Copy className="h-4 w-4 mr-1" />
              Clonar
            </Button>

            {/* Indicador quando atingiu limite máximo */}
            {objective.isRepeatable &&
              objective.maxCompletions &&
              objective.currentCompletions >= objective.maxCompletions && (
                <Badge variant="destructive" className="self-center">
                  Limite de Repetições Atingido
                </Badge>
              )}
          </div>
        </CardContent>
      </Card>

      {objective.location && (
        <Card className="mt-4 p-3 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <Label className="font-medium text-blue-800">Informações de Localização</Label>
          </div>
          <div className="space-y-1 text-sm">
            {objective.location.zone && (
              <div>
                <span className="text-muted-foreground">Zona:</span> {objective.location.zone}
              </div>
            )}
            {objective.location.coordinates && (
              <div>
                <span className="text-muted-foreground">Coordenadas:</span> {objective.location.coordinates}
              </div>
            )}
            {objective.location.notes && (
              <div>
                <span className="text-muted-foreground">Notas:</span> {objective.location.notes}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Gold Tracking Section */}
      <Card className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-yellow-600" />
          <Label className="font-semibold text-yellow-800 text-lg">Histórico de Ouro Detalhado</Label>
        </div>

        <div className="space-y-4">
          {/* Objective Gold Summary */}
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">Resumo do Objetivo</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-yellow-50 p-2 rounded">
                <div className="text-yellow-600 font-medium">Total Ganho</div>
                <div className="text-lg font-bold text-yellow-700">{objective.totalGoldEarned}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="text-yellow-600 font-medium">Por Conclusão</div>
                <div className="text-lg font-bold text-yellow-700">{objective.goldReward?.perCompletion || 0}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="text-yellow-600 font-medium">Por Ponto</div>
                <div className="text-lg font-bold text-yellow-700">{objective.goldReward?.perPoint || 0}</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded">
                <div className="text-yellow-600 font-medium">Conclusões</div>
                <div className="text-lg font-bold text-yellow-700">
                  {objective.currentCompletions}
                  {objective.isRepeatable && (objective.maxCompletions ? `/${objective.maxCompletions}` : "/∞")}
                </div>
              </div>
            </div>
          </div>

          {/* XP Summary */}
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Resumo de XP</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">XP por Conclusão</div>
                <div className="text-lg font-bold text-blue-700">
                  {typeof objective.xpReward === "object" ? objective.xpReward.perCompletion : objective.xpReward}
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">XP por Ponto</div>
                <div className="text-lg font-bold text-blue-700">
                  {typeof objective.xpReward === "object" ? objective.xpReward.perPoint : 0}
                </div>
              </div>
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">Sistema</div>
                <div className="text-lg font-bold text-blue-700">
                  {typeof objective.xpReward === "object" &&
                  objective.xpReward.perPoint > 0 &&
                  objective.xpReward.perCompletion > 0
                    ? "Híbrido"
                    : typeof objective.xpReward === "object" && objective.xpReward.perPoint > 0
                      ? "Por Ponto"
                      : "Por Conclusão"}
                </div>
              </div>
            </div>
          </div>

          {/* Phases Gold and XP Breakdown */}
          {objective.phases && objective.phases.length > 0 && (
            <div className="bg-white p-3 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800 mb-3">Recompensas por Fase</h4>
              <div className="space-y-3">
                {objective.phases.map((phase, phaseIndex) => (
                  <div key={phase.id} className="border border-yellow-100 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-medium text-yellow-700">
                        Fase {phaseIndex + 1}: {phase.name}
                      </h5>
                      <Badge
                        variant={phase.completed ? "default" : "outline"}
                        className="bg-yellow-100 text-yellow-800"
                      >
                        {phase.completed ? "Completa" : "Em Progresso"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs mb-3">
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="text-yellow-600">Ouro Total</div>
                        <div className="font-bold text-yellow-700">{phase.totalGoldEarned}</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="text-yellow-600">Ouro/Conclusão</div>
                        <div className="font-bold text-yellow-700">{phase.goldReward?.perCompletion || 0}</div>
                      </div>
                      <div className="bg-yellow-50 p-2 rounded">
                        <div className="text-yellow-600">Ouro/Ponto</div>
                        <div className="font-bold text-yellow-700">{phase.goldReward?.perPoint || 0}</div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-blue-600">XP/Conclusão</div>
                        <div className="font-bold text-blue-700">
                          {typeof phase.xpReward === "object" ? phase.xpReward.perCompletion : phase.xpReward}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="text-blue-600">XP/Ponto</div>
                        <div className="font-bold text-blue-700">
                          {typeof phase.xpReward === "object" ? phase.xpReward.perPoint : 0}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-gray-600">Repetições</div>
                        <div className="font-bold text-gray-700">
                          {phase.currentRepetitions}
                          {phase.isRepeatable && (phase.isInfiniteLoop ? "/∞" : `/${phase.maxRepetitions}`)}
                        </div>
                      </div>
                    </div>

                    {/* Sub-objectives Gold and XP */}
                    <div className="space-y-2">
                      <h6 className="text-xs font-medium text-yellow-700">Subobjetivos:</h6>
                      {phase.subObjectives.map((subObj, subIndex) => (
                        <div key={subObj.id} className="bg-yellow-25 border border-yellow-100 rounded p-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-yellow-700">{subObj.name}</span>
                            <Badge
                              variant={subObj.completed ? "default" : "outline"}
                              className="text-xs bg-yellow-100 text-yellow-800"
                            >
                              {subObj.currentValue}/{subObj.targetValue}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-6 gap-1 text-xs">
                            <div className="text-center">
                              <div className="text-yellow-600">Ouro Total</div>
                              <div className="font-bold text-yellow-700">{subObj.totalGoldEarned}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-yellow-600">Ouro/Concl.</div>
                              <div className="font-bold text-yellow-700">{subObj.goldReward?.perCompletion || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-yellow-600">Ouro/Pt</div>
                              <div className="font-bold text-yellow-700">{subObj.goldReward?.perPoint || 0}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-600">XP/Concl.</div>
                              <div className="font-bold text-blue-700">
                                {typeof subObj.xpReward === "object" ? subObj.xpReward.perCompletion : subObj.xpReward}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-blue-600">XP/Pt</div>
                              <div className="font-bold text-blue-700">
                                {typeof subObj.xpReward === "object" ? subObj.xpReward.perPoint : 0}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600">Rep.</div>
                              <div className="font-bold text-gray-700">
                                {subObj.currentRepetitions}
                                {subObj.isRepeatable && (subObj.isInfiniteLoop ? "/∞" : `/${subObj.maxRepetitions}`)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Calculation Summary */}
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2">Cálculo Total de Recompensas</h4>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-yellow-600">Ouro do Objetivo Principal:</span>
                <span className="font-bold text-yellow-700">{objective.totalGoldEarned}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Ouro de Todas as Fases:</span>
                <span className="font-bold text-yellow-700">
                  {objective.phases?.reduce((sum, phase) => sum + (phase.totalGoldEarned || 0), 0) || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-yellow-600">Ouro de Todos os Subobjetivos:</span>
                <span className="font-bold text-yellow-700">
                  {objective.phases?.reduce(
                    (sum, phase) =>
                      sum + phase.subObjectives.reduce((subSum, sub) => subSum + (sub.totalGoldEarned || 0), 0),
                    0,
                  ) || 0}
                </span>
              </div>
              <div className="border-t border-yellow-200 pt-2 mt-2">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-yellow-700">TOTAL GERAL OURO:</span>
                  <span className="font-bold text-lg text-yellow-800">
                    {(objective.totalGoldEarned || 0) +
                      (objective.phases?.reduce((sum, phase) => sum + (phase.totalGoldEarned || 0), 0) || 0) +
                      (objective.phases?.reduce(
                        (sum, phase) =>
                          sum + phase.subObjectives.reduce((subSum, sub) => subSum + (sub.totalGoldEarned || 0), 0),
                        0,
                      ) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Potential Rewards */}
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Potencial de Recompensas</h4>
            <div className="text-sm space-y-1">
              {!objective.completed && (
                <>
                  <div className="flex justify-between">
                    <span className="text-green-600">Ouro ao Completar Objetivo:</span>
                    <span className="font-bold text-green-700">+{objective.goldReward?.perCompletion || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">XP ao Completar Objetivo:</span>
                    <span className="font-bold text-blue-700">
                      +{typeof objective.xpReward === "object" ? objective.xpReward.perCompletion : objective.xpReward}
                    </span>
                  </div>
                </>
              )}
              {objective.phases?.some((phase) => !phase.completed) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-green-600">Ouro de Fases Restantes:</span>
                    <span className="font-bold text-green-700">
                      +
                      {objective.phases
                        .filter((phase) => !phase.completed)
                        .reduce((sum, phase) => sum + (phase.goldReward?.perCompletion || 0), 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">XP de Fases Restantes:</span>
                    <span className="font-bold text-blue-700">
                      +
                      {objective.phases
                        .filter((phase) => !phase.completed)
                        .reduce(
                          (sum, phase) =>
                            sum + (typeof phase.xpReward === "object" ? phase.xpReward.perCompletion : phase.xpReward),
                          0,
                        )}
                    </span>
                  </div>
                </>
              )}
              {objective.phases?.some((phase) => phase.subObjectives.some((sub) => !sub.completed)) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-green-600">Ouro de Subobjetivos Restantes:</span>
                    <span className="font-bold text-green-700">
                      +
                      {objective.phases.reduce(
                        (sum, phase) =>
                          sum +
                          phase.subObjectives
                            .filter((sub) => !sub.completed)
                            .reduce((subSum, sub) => subSum + (sub.goldReward?.perCompletion || 0), 0),
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">XP de Subobjetivos Restantes:</span>
                    <span className="font-bold text-blue-700">
                      +
                      {objective.phases.reduce(
                        (sum, phase) =>
                          sum +
                          phase.subObjectives
                            .filter((sub) => !sub.completed)
                            .reduce(
                              (subSum, sub) =>
                                subSum + (typeof sub.xpReward === "object" ? sub.xpReward.perCompletion : sub.xpReward),
                              0,
                            ),
                        0,
                      )}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Barra de Pesquisa Interna */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Buscar Fases e Subobjetivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por nome de fase ou subobjetivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-muted-foreground mt-2">
              Mostrando {filteredPhases.length} de {totalPhases} fases
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mostrar fases filtradas */}
      {filteredPhases.map((phase, index) => (
        <Card key={phase.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                Fase {objective.phases.findIndex((p) => p.id === phase.id) + 1}: {phase.name}
                {phase.isRepeatable && (
                  <Badge
                    variant={
                      !phase.isInfiniteLoop && phase.maxRepetitions && phase.currentRepetitions >= phase.maxRepetitions
                        ? "destructive"
                        : "outline"
                    }
                    className="ml-2"
                  >
                    {phase.isInfiniteLoop ? "∞" : `${phase.currentRepetitions}/${phase.maxRepetitions}`}
                    {!phase.isInfiniteLoop &&
                      phase.maxRepetitions &&
                      phase.currentRepetitions >= phase.maxRepetitions &&
                      " (Máx)"}
                  </Badge>
                )}
              </CardTitle>
              <Badge variant={phase.completed ? "success" : "outline"}>
                {phase.completed ? "Completa" : "Em Progresso"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}

            {/* Phase Rewards Display */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <Label className="font-medium text-green-800">Recompensas da Fase</Label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <div className="text-green-600 font-medium">Ouro/Conclusão</div>
                  <div className="text-lg font-bold text-green-700">{phase.goldReward?.perCompletion || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-medium">Ouro/Ponto</div>
                  <div className="text-lg font-bold text-green-700">{phase.goldReward?.perPoint || 0}</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-medium">XP/Conclusão</div>
                  <div className="text-lg font-bold text-blue-700">
                    {typeof phase.xpReward === "object" ? phase.xpReward.perCompletion : phase.xpReward}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 font-medium">XP/Ponto</div>
                  <div className="text-lg font-bold text-blue-700">
                    {typeof phase.xpReward === "object" ? phase.xpReward.perPoint : 0}
                  </div>
                </div>
              </div>
            </div>

            {phase.isRepeatable && (
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Repetições:</span>
                  <span>
                    {phase.currentRepetitions}
                    {phase.isInfiniteLoop ? " (∞)" : `/${phase.maxRepetitions}`}
                  </span>
                </div>
                {phase.infiniteDate && (
                  <div className="flex justify-between text-amber-600">
                    <span>Limite:</span>
                    <span>{new Date(phase.infiniteDate).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}

            {/* Draggable Subobjectives */}
            <DraggableSubObjectives
              subObjectives={phase.subObjectives}
              onUpdateSubObjective={handleUpdateSubObjective}
              onCompleteSubObjective={handleCompleteSubObjective}
              onResetSubObjective={handleResetSubObjective}
              onResetSubObjectiveRepetitions={handleResetSubObjectiveRepetitions}
              onReorderSubObjectives={(startIndex, endIndex) =>
                handleReorderSubObjectives(phase.id, startIndex, endIndex)
              }
              inputValue={inputValue}
              setInputValue={setInputValue}
              searchTerm={searchTerm}
            />

            <div className="flex gap-2">
              {!phase.completed && (
                <Button onClick={handleCompletePhase}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completar Fase
                </Button>
              )}
              {phase.isRepeatable &&
                phase.completed &&
                (phase.isInfiniteLoop || !phase.maxRepetitions || phase.currentRepetitions < phase.maxRepetitions) && (
                  <Button variant="outline" onClick={() => resetPhase(objective.id, phase.id)}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Repetir Fase
                  </Button>
                )}
              {phase.completed && objective.currentPhaseIndex < totalPhases - 1 && (
                <Button variant="outline" onClick={handleNextPhase}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Próxima Fase
                </Button>
              )}

              {/* Indicador quando atingiu limite máximo da fase */}
              {phase.isRepeatable &&
                !phase.isInfiniteLoop &&
                phase.maxRepetitions &&
                phase.currentRepetitions >= phase.maxRepetitions && (
                  <Badge variant="destructive" className="self-center">
                    Limite de Repetições da Fase Atingido
                  </Badge>
                )}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between">
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Link href="/objectives">
          <Button variant="outline">Voltar para Objetivos</Button>
        </Link>
        <Button variant="outline">
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
