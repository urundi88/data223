"use client"

import { useEffect, useState } from "react"
import { useGuides, type Guide } from "@/contexts/guides-context"
import { useMissions } from "@/contexts/missions-context"
import { useObjectives } from "@/contexts/objectives-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, Circle, ArrowRight, Trophy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
// Adicionar importação do Input
import { Input } from "@/components/ui/input"
import { Minus, Plus } from "lucide-react"

export default function GuideDetailsPage({ params }: { params: { id: string } }) {
  const { guides, getGuide, completeGuideStep, completeGuide } = useGuides()
  const { missions, completeMission } = useMissions()
  const { objectives } = useObjectives()
  const { toast } = useToast()
  const [guide, setGuide] = useState<Guide | null>(null)
  // Adicionar estado para o valor de incremento/decremento
  const [inputValue, setInputValue] = useState<number>(1)

  useEffect(() => {
    const g = getGuide(params.id)
    if (g) {
      setGuide(g)
    }
  }, [params.id, getGuide, guides])

  if (!guide) {
    return <div className="p-4">Guia não encontrado</div>
  }

  const completedSteps = guide.steps.filter((step) => step.completed).length
  const progress = (completedSteps / guide.steps.length) * 100

  const handleCompleteStep = (stepId: string) => {
    completeGuideStep(guide.id, stepId)
    toast({
      title: "Etapa Completada",
      description: `A etapa foi marcada como completa.`,
    })
  }

  const handleCompleteGuide = () => {
    completeGuide(guide.id)
    toast({
      title: "Guia Completado",
      description: `${guide.name} foi marcado como completo.`,
    })
  }

  // Função para obter detalhes de progresso de uma missão
  const getMissionDetails = (missionId: string) => {
    const mission = missions.find((m) => m.id === missionId)
    if (!mission) return null

    const missionObjectives = objectives.filter((obj) => mission.objectiveIds.includes(obj.id))
    const completedObjectives = missionObjectives.filter((obj) => obj.completed).length
    const totalObjectives = missionObjectives.length
    const progress = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0

    return {
      progress,
      currentValue: completedObjectives,
      totalValue: totalObjectives,
      missingValue: totalObjectives - completedObjectives,
      xpReward: mission.xpReward || 0,
    }
  }

  // Adicionar após a função getMissionDetails
  const handleIncrementMission = (missionId: string) => {
    // Aqui você pode implementar a lógica para incrementar o progresso da missão
    // Por exemplo, completar um objetivo da missão
    toast({
      title: "Progresso Incrementado",
      description: `Adicionado ${inputValue} pontos à missão.`,
    })
  }

  const handleDecrementMission = (missionId: string) => {
    // Aqui você pode implementar a lógica para decrementar o progresso da missão
    toast({
      title: "Progresso Decrementado",
      description: `Removido ${inputValue} pontos da missão.`,
    })
  }

  return (
    <div className="p-4">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle>{guide.name}</CardTitle>
            <Badge variant="outline">{guide.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>

            {guide.expiresAt && (
              <div className="flex items-center mt-2 text-amber-500">
                <Clock className="h-4 w-4 mr-1" />
                <span className="text-sm">Expira: {new Date(guide.expiresAt).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm">Progresso</span>
              <span className="text-sm">
                {completedSteps}/{guide.steps.length} etapas
              </span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Etapas Completas</div>
                <div className="font-medium">{completedSteps}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Trophy className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Etapas Totais</div>
                <div className="font-medium">{guide.steps.length}</div>
              </div>
            </div>
            <div className="flex items-center">
              <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">Etapas Faltando</div>
                <div className="font-medium">{guide.steps.length - completedSteps}</div>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-500" />
              <div>
                <div className="text-muted-foreground">XP Recompensa</div>
                <div className="font-medium">{guide.xpReward}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Etapas do Guia</h3>
        {guide.steps.map((step, index) => (
          <Card key={step.id} className={step.completed ? "border-green-500" : ""}>
            <CardHeader className="py-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">
                  {index + 1}. {step.name}
                </h4>
                <Badge variant={step.completed ? "success" : "outline"}>
                  {step.completed ? "Completo" : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-2 space-y-2">
              {step.description && <p className="text-xs text-muted-foreground">{step.description}</p>}

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center bg-muted/30 p-1 rounded">
                  <Circle className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="text-muted-foreground">Etapa:</span>
                  <span className="font-medium ml-auto">
                    {index + 1}/{guide.steps.length}
                  </span>
                </div>
                <div className="flex items-center bg-muted/30 p-1 rounded">
                  <Trophy className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium ml-auto">{step.completed ? "Completo" : "Pendente"}</span>
                </div>
                <div className="flex items-center bg-muted/30 p-1 rounded">
                  <ArrowRight className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="text-muted-foreground">Missões:</span>
                  <span className="font-medium ml-auto">{step.missionIds.length}</span>
                </div>
                <div className="flex items-center bg-muted/30 p-1 rounded">
                  <Clock className="h-3 w-3 mr-1 text-purple-500" />
                  <span className="text-muted-foreground">XP Parcial:</span>
                  <span className="font-medium ml-auto">{Math.round(guide.xpReward / guide.steps.length)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {step.missionIds.map((missionId) => {
                  const mission = missions.find((m) => m.id === missionId)
                  const details = getMissionDetails(missionId)

                  return mission && details ? (
                    <Card key={missionId} className="p-3 border-blue-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{mission.name}</span>
                        <div className="flex flex-col items-end">
                          <Badge variant={mission.completed ? "success" : "outline"} className="text-xs">
                            {mission.completed ? "Completo" : "Pendente"}
                          </Badge>
                          <div className="w-16 mt-1">
                            <Progress value={details.progress} className="h-1" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center bg-muted/30 p-1 rounded">
                          <Circle className="h-3 w-3 mr-1 text-purple-500" />
                          <span className="text-muted-foreground">Objetivos Completos:</span>
                          <span className="font-medium ml-auto">
                            {details.currentValue}/{details.totalValue}
                          </span>
                        </div>
                        <div className="flex items-center bg-muted/30 p-1 rounded">
                          <Trophy className="h-3 w-3 mr-1 text-purple-500" />
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-medium ml-auto">{Math.round(details.progress)}%</span>
                        </div>
                        <div className="flex items-center bg-muted/30 p-1 rounded">
                          <ArrowRight className="h-3 w-3 mr-1 text-purple-500" />
                          <span className="text-muted-foreground">Objetivos Faltando:</span>
                          <span className="font-medium ml-auto">{details.missingValue}</span>
                        </div>
                        <div className="flex items-center bg-muted/30 p-1 rounded">
                          <Clock className="h-3 w-3 mr-1 text-purple-500" />
                          <span className="text-muted-foreground">XP Recompensa:</span>
                          <span className="font-medium ml-auto">{details.xpReward}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleDecrementMission(missionId)}
                            disabled={mission.completed}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(Number(e.target.value))}
                            className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min={1}
                            disabled={mission.completed}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleIncrementMission(missionId)}
                            disabled={mission.completed}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {!mission.completed && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto"
                            onClick={() => completeMission(missionId)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </Card>
                  ) : null
                })}
              </div>

              {!step.completed && (
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => handleCompleteStep(step.id)}>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completar Etapa
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!guide.completed && (
        <Button variant="outline" className="w-full mt-6" onClick={handleCompleteGuide}>
          <CheckCircle className="h-4 w-4 mr-1" />
          Marcar Guia como Completo
        </Button>
      )}
      <div className="flex justify-between mt-6">
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <Link href="/guides">
          <Button variant="outline">Voltar para Guias</Button>
        </Link>
        <Button variant="outline">
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
