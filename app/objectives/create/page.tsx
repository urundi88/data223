"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  useObjectives,
  type ObjectiveType,
  type CollectionItem,
  type ObjectivePhase,
  type SubObjective,
} from "@/contexts/objectives-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Plus, Trash, ChevronLeft, Zap, Trophy, Coins, RotateCcw, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"
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

export default function CreateObjectivePage() {
  const router = useRouter()
  const { addObjective } = useObjectives()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<ObjectiveType>("collection")
  const [xpPerCompletion, setXpPerCompletion] = useState(100)
  const [xpPerPoint, setXpPerPoint] = useState(0)
  const [goldPerCompletion, setGoldPerCompletion] = useState(0)
  const [goldPerPoint, setGoldPerPoint] = useState(0)
  const [category, setCategory] = useState("")
  const [isTemporary, setIsTemporary] = useState(false)
  const [expiryDate, setExpiryDate] = useState("")

  // Sistema de repetição
  const [isRepeatable, setIsRepeatable] = useState(false)
  const [hasMaxCompletions, setHasMaxCompletions] = useState(false)
  const [maxCompletions, setMaxCompletions] = useState(1)

  // Sistema de fases e subobjetivos
  const [usePhaseSystem, setUsePhaseSystem] = useState(true)
  const [phases, setPhases] = useState<ObjectivePhase[]>([
    {
      id: uuidv4(),
      name: "Fase 1",
      description: "",
      completed: false,
      subObjectives: [
        {
          id: uuidv4(),
          name: "Subobjetivo 1",
          description: "",
          completed: false,
          currentValue: 0,
          targetValue: 1,
          xpReward: { perCompletion: 0, perPoint: 5 },
          goldReward: { perCompletion: 25, perPoint: 2 },
          totalGoldEarned: 0,
          isRepeatable: false,
          isInfiniteLoop: false,
          currentRepetitions: 0,
          hasCooldown: false,
          cooldownDuration: 60, // padrão 1 minuto
          cooldownProgress: 0,
        },
      ],
      xpReward: { perCompletion: 0, perPoint: 10 },
      goldReward: { perCompletion: 50, perPoint: 5 },
      totalGoldEarned: 0,
      isRepeatable: false,
      isInfiniteLoop: false,
      currentRepetitions: 0,
    },
  ])

  // Collection type fields (para compatibilidade)
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([
    { name: "", targetAmount: 1, currentAmount: 0 },
  ])

  // Steps type fields
  const [totalSteps, setTotalSteps] = useState(1)
  const [currentStep, setCurrentStep] = useState(0)

  // Percentage type fields
  const [targetPercentage, setTargetPercentage] = useState(100)
  const [percentage, setPercentage] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)

  // Kill type fields
  const [targetKills, setTargetKills] = useState(10)
  const [currentKills, setCurrentKills] = useState(0)

  // Custom type fields
  const [customData, setCustomData] = useState("")

  const handleAddPhase = () => {
    setPhases([
      ...phases,
      {
        id: uuidv4(),
        name: `Fase ${phases.length + 1}`,
        description: "",
        completed: false,
        subObjectives: [
          {
            id: uuidv4(),
            name: "Subobjetivo 1",
            description: "",
            completed: false,
            currentValue: 0,
            targetValue: 1,
            xpReward: { perCompletion: 0, perPoint: 5 },
            goldReward: { perCompletion: 25, perPoint: 2 },
            totalGoldEarned: 0,
            isRepeatable: false,
            isInfiniteLoop: false,
            currentRepetitions: 0,
            hasCooldown: false,
            cooldownDuration: 60, // padrão 1 minuto
            cooldownProgress: 0,
          },
        ],
        xpReward: { perCompletion: 100, perPoint: 10 },
        goldReward: { perCompletion: 50, perPoint: 5 },
        totalGoldEarned: 0,
        isRepeatable: false,
        isInfiniteLoop: false,
        currentRepetitions: 0,
      },
    ])
  }

  const handleRemovePhase = (index: number) => {
    setPhases(phases.filter((_, i) => i !== index))
  }

  const handlePhaseChange = (index: number, field: keyof ObjectivePhase, value: any) => {
    const updatedPhases = [...phases]
    updatedPhases[index] = { ...updatedPhases[index], [field]: value }
    setPhases(updatedPhases)
  }

  const [phaseIndex, setPhaseIndex] = useState(0)

  const handleAddSubObjective = () => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].subObjectives.push({
      id: uuidv4(),
      name: `Subobjetivo ${updatedPhases[phaseIndex].subObjectives.length + 1}`,
      description: "",
      completed: false,
      currentValue: 0,
      targetValue: 1,
      xpReward: { perCompletion: 0, perPoint: 2 },
      goldReward: { perCompletion: 10, perPoint: 1 },
      totalGoldEarned: 0,
      isRepeatable: false,
      isInfiniteLoop: false,
      currentRepetitions: 0,
      hasCooldown: false,
      cooldownDuration: 60, // padrão 1 minuto
      cooldownProgress: 0,
    })
    setPhases(updatedPhases)
  }

  const handleRemoveSubObjective = (phaseIndex: number, subIndex: number) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].subObjectives = updatedPhases[phaseIndex].subObjectives.filter((_, i) => i !== subIndex)
    setPhases(updatedPhases)
  }

  const handleSubObjectiveChange = (phaseIndex: number, subIndex: number, field: keyof SubObjective, value: any) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].subObjectives[subIndex] = {
      ...updatedPhases[phaseIndex].subObjectives[subIndex],
      [field]: value,
    }
    setPhases(updatedPhases)
  }

  const handleAddCollectionItem = () => {
    setCollectionItems([...collectionItems, { name: "", targetAmount: 1, currentAmount: 0 }])
  }

  const handleRemoveCollectionItem = (index: number) => {
    setCollectionItems(collectionItems.filter((_, i) => i !== index))
  }

  const handleCollectionItemChange = (index: number, field: keyof CollectionItem, value: any) => {
    const updatedItems = [...collectionItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setCollectionItems(updatedItems)
  }

  const handleResetPhaseRepetitions = (phaseIndex: number) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].currentRepetitions = 0
    setPhases(updatedPhases)
    toast({
      title: "Repetições Resetadas",
      description: `Repetições da fase ${updatedPhases[phaseIndex].name} foram resetadas.`,
    })
  }

  const handleResetSubObjectiveRepetitions = (phaseIndex: number, subIndex: number) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].subObjectives[subIndex].currentRepetitions = 0
    setPhases(updatedPhases)
    toast({
      title: "Repetições Resetadas",
      description: `Repetições do subobjetivo foram resetadas.`,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      const objectiveData: any = {
        name,
        description,
        type,
        completed: false,
        xpReward: {
          perCompletion: Number(xpPerCompletion),
          perPoint: Number(xpPerPoint),
        },
        goldReward: {
          perCompletion: Number(goldPerCompletion),
          perPoint: Number(goldPerPoint),
        },
        totalGoldEarned: 0,
        category: category || undefined,
        isRepeatable,
        maxCompletions: hasMaxCompletions ? maxCompletions : undefined,
        currentCompletions: 0,
        phases: usePhaseSystem ? phases : [],
        currentPhaseIndex: 0,
      }

      if (isTemporary && expiryDate) {
        objectiveData.expiresAt = new Date(expiryDate).toISOString()
      }

      // Manter compatibilidade com sistema antigo
      if (!usePhaseSystem) {
        switch (type) {
          case "collection":
            if (collectionItems.some((item) => !item.name)) {
              toast({
                title: "Erro",
                description: "Todos os itens de coleção devem ter um nome",
                variant: "destructive",
              })
              return
            }
            objectiveData.collectionItems = collectionItems.map((item) => ({
              ...item,
              targetAmount: Number(item.targetAmount),
              currentAmount: Number(item.currentAmount),
            }))
            break

          case "steps":
            objectiveData.totalSteps = Number(totalSteps)
            objectiveData.currentStep = Number(currentStep)
            break

          case "percentage":
            objectiveData.targetPercentage = Number(targetPercentage)
            objectiveData.percentage = Number(percentage)
            objectiveData.estimatedTime = Number(estimatedTime)
            break

          case "kill":
            objectiveData.targetKills = Number(targetKills)
            objectiveData.currentKills = Number(currentKills)
            break

          case "custom":
            objectiveData.customData = customData
            break
        }
      }

      const newObjectiveId = addObjective(objectiveData)

      toast({
        title: "Objetivo Criado",
        description: `${name} foi criado com sucesso.`,
      })

      router.push("/unified-terms")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar objetivo",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/objectives">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Criar Novo Objetivo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Objetivo</CardTitle>
          <CardDescription>Preencha os detalhes para seu novo objetivo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome do objetivo"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva seu objetivo"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(value) => setType(value as ObjectiveType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collection">Coleção</SelectItem>
                      <SelectItem value="steps">Etapas</SelectItem>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="kill">Eliminação</SelectItem>
                      <SelectItem value="resource">Recurso</SelectItem>
                      <SelectItem value="dungeon">Dungeon</SelectItem>
                      <SelectItem value="achievement">Conquista</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category">Categoria (Opcional)</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Categoria"
                  />
                </div>

                {/* Recompensas do Objetivo Principal */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <Label className="font-semibold text-blue-800">Recompensas do Objetivo Principal</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="xpPerCompletion" className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-500" />
                        XP/Conclusão
                      </Label>
                      <Input
                        id="xpPerCompletion"
                        type="number"
                        value={xpPerCompletion}
                        onChange={(e) => setXpPerCompletion(Number(e.target.value))}
                        min={0}
                        className="border-blue-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="xpPerPoint" className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-blue-500" />
                        XP/Ponto
                      </Label>
                      <Input
                        id="xpPerPoint"
                        type="number"
                        value={xpPerPoint}
                        onChange={(e) => setXpPerPoint(Number(e.target.value))}
                        min={0}
                        className="border-blue-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="goldPerCompletion" className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        Ouro/Conclusão
                      </Label>
                      <Input
                        id="goldPerCompletion"
                        type="number"
                        value={goldPerCompletion}
                        onChange={(e) => setGoldPerCompletion(Number(e.target.value))}
                        min={0}
                        className="border-blue-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="goldPerPoint" className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        Ouro/Ponto
                      </Label>
                      <Input
                        id="goldPerPoint"
                        type="number"
                        value={goldPerPoint}
                        onChange={(e) => setGoldPerPoint(Number(e.target.value))}
                        min={0}
                        className="border-blue-200"
                      />
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="repeatable" checked={isRepeatable} onCheckedChange={setIsRepeatable} />
                    <Label htmlFor="repeatable">Objetivo Repetível</Label>
                  </div>

                  {isRepeatable && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="hasMaxCompletions"
                          checked={hasMaxCompletions}
                          onCheckedChange={setHasMaxCompletions}
                        />
                        <Label htmlFor="hasMaxCompletions">Limite de Conclusões</Label>
                      </div>

                      {hasMaxCompletions && (
                        <div>
                          <Label htmlFor="maxCompletions">Máximo de Conclusões</Label>
                          <Input
                            id="maxCompletions"
                            type="number"
                            value={maxCompletions}
                            onChange={(e) => setMaxCompletions(Number(e.target.value))}
                            min={1}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="temporary" checked={isTemporary} onCheckedChange={setIsTemporary} />
                  <Label htmlFor="temporary">Objetivo Temporário</Label>
                </div>

                {isTemporary && (
                  <div>
                    <Label htmlFor="expiryDate">Data de Expiração</Label>
                    <Input
                      id="expiryDate"
                      type="datetime-local"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      required={isTemporary}
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch id="usePhaseSystem" checked={usePhaseSystem} onCheckedChange={setUsePhaseSystem} />
                  <Label htmlFor="usePhaseSystem">Usar Sistema de Fases e Subobjetivos</Label>
                </div>

                {usePhaseSystem ? (
                  <div className="space-y-4">
                    <h3 className="font-medium">Fases e Subobjetivos</h3>

                    {phases.map((phase, phaseIndex) => (
                      <Card key={phase.id} className="p-4 border-green-200 bg-green-50">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Input
                              value={phase.name}
                              onChange={(e) => handlePhaseChange(phaseIndex, "name", e.target.value)}
                              placeholder="Nome da fase"
                              className="font-medium border-green-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemovePhase(phaseIndex)}
                              disabled={phases.length <= 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          <Textarea
                            value={phase.description}
                            onChange={(e) => handlePhaseChange(phaseIndex, "description", e.target.value)}
                            placeholder="Descrição da fase"
                            rows={2}
                            className="border-green-200"
                          />

                          {/* Recompensas da Fase */}
                          <Card className="p-3 bg-green-100 border-green-300">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="h-4 w-4 text-green-600" />
                              <Label className="font-medium text-green-800">Recompensas da Fase</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Zap className="h-3 w-3 text-green-500" />
                                  XP/Conclusão
                                </Label>
                                <Input
                                  type="number"
                                  value={phase.xpReward?.perCompletion || 100}
                                  onChange={(e) =>
                                    handlePhaseChange(phaseIndex, "xpReward", {
                                      ...phase.xpReward,
                                      perCompletion: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-green-300"
                                />
                              </div>
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Zap className="h-3 w-3 text-green-500" />
                                  XP/Ponto
                                </Label>
                                <Input
                                  type="number"
                                  value={phase.xpReward?.perPoint || 0}
                                  onChange={(e) =>
                                    handlePhaseChange(phaseIndex, "xpReward", {
                                      ...phase.xpReward,
                                      perPoint: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-green-300"
                                />
                              </div>
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  Ouro/Conclusão
                                </Label>
                                <Input
                                  type="number"
                                  value={phase.goldReward?.perCompletion || 0}
                                  onChange={(e) =>
                                    handlePhaseChange(phaseIndex, "goldReward", {
                                      ...phase.goldReward,
                                      perCompletion: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-green-300"
                                />
                              </div>
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  Ouro/Ponto
                                </Label>
                                <Input
                                  type="number"
                                  value={phase.goldReward?.perPoint || 0}
                                  onChange={(e) =>
                                    handlePhaseChange(phaseIndex, "goldReward", {
                                      ...phase.goldReward,
                                      perPoint: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-green-300"
                                />
                              </div>
                            </div>
                          </Card>

                          {/* Sistema de Repetições da Fase */}
                          <Card className="p-3 bg-green-100 border-green-300">
                            <div className="flex items-center gap-2 mb-2">
                              <RotateCcw className="h-4 w-4 text-green-600" />
                              <Label className="font-medium text-green-800">Sistema de Repetições</Label>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={phase.isRepeatable}
                                  onCheckedChange={(checked) => handlePhaseChange(phaseIndex, "isRepeatable", checked)}
                                />
                                <Label>Fase Repetível</Label>
                              </div>
                              {phase.isRepeatable && (
                                <>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={phase.isInfiniteLoop}
                                      onCheckedChange={(checked) =>
                                        handlePhaseChange(phaseIndex, "isInfiniteLoop", checked)
                                      }
                                    />
                                    <Label>Loop Infinito</Label>
                                  </div>
                                  {!phase.isInfiniteLoop && (
                                    <div>
                                      <Label>Máximo de Repetições</Label>
                                      <Input
                                        type="number"
                                        value={phase.maxRepetitions || ""}
                                        onChange={(e) =>
                                          handlePhaseChange(phaseIndex, "maxRepetitions", Number(e.target.value))
                                        }
                                        min={1}
                                        className="border-green-300"
                                      />
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-green-700">
                                      Repetições Atuais: {phase.currentRepetitions}
                                    </span>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 border-red-300 bg-transparent"
                                        >
                                          <RotateCcw className="h-3 w-3 mr-1" />
                                          Reset
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Resetar Repetições da Fase</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Tem certeza que deseja resetar as repetições desta fase? Esta ação não pode
                                            ser desfeita.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleResetPhaseRepetitions(phaseIndex)}>
                                            Resetar
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </>
                              )}
                            </div>
                          </Card>

                          <div>
                            <Label className="block mb-2">Subobjetivos</Label>
                            <div className="space-y-2">
                              {phase.subObjectives.map((subObj, subIndex) => (
                                <Card key={subObj.id} className="p-3 border-purple-200 bg-purple-50">
                                  <div className="space-y-3">
                                    <div className="flex items-end gap-2">
                                      <div className="flex-1">
                                        <Label>Nome</Label>
                                        <Input
                                          value={subObj.name}
                                          onChange={(e) =>
                                            handleSubObjectiveChange(phaseIndex, subIndex, "name", e.target.value)
                                          }
                                          placeholder="Nome do subobjetivo"
                                          className="border-purple-200"
                                        />
                                      </div>
                                      <div className="w-20">
                                        <Label>Meta</Label>
                                        <Input
                                          type="number"
                                          value={subObj.targetValue}
                                          onChange={(e) =>
                                            handleSubObjectiveChange(
                                              phaseIndex,
                                              subIndex,
                                              "targetValue",
                                              Number(e.target.value),
                                            )
                                          }
                                          min={1}
                                          className="border-purple-200"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => handleRemoveSubObjective(phaseIndex, subIndex)}
                                        disabled={phase.subObjectives.length <= 1}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    {/* Recompensas do Subobjetivo */}
                                    <Card className="p-2 bg-purple-100 border-purple-300">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Trophy className="h-3 w-3 text-purple-600" />
                                        <Label className="font-medium text-purple-800 text-xs">
                                          Recompensas do Subobjetivo
                                        </Label>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <Label className="flex items-center gap-1 text-xs">
                                            <Zap className="h-2 w-2 text-purple-500" />
                                            XP/Conclusão
                                          </Label>
                                          <Input
                                            type="number"
                                            value={subObj.xpReward?.perCompletion || 0}
                                            onChange={(e) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "xpReward", {
                                                ...subObj.xpReward,
                                                perCompletion: Number(e.target.value),
                                              })
                                            }
                                            min={0}
                                            className="border-purple-300 text-xs h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="flex items-center gap-1 text-xs">
                                            <Zap className="h-2 w-2 text-purple-500" />
                                            XP/Ponto
                                          </Label>
                                          <Input
                                            type="number"
                                            value={subObj.xpReward?.perPoint || 0}
                                            onChange={(e) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "xpReward", {
                                                ...subObj.xpReward,
                                                perPoint: Number(e.target.value),
                                              })
                                            }
                                            min={0}
                                            className="border-purple-300 text-xs h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="flex items-center gap-1 text-xs">
                                            <Coins className="h-2 w-2 text-yellow-500" />
                                            Ouro/Conclusão
                                          </Label>
                                          <Input
                                            type="number"
                                            value={subObj.goldReward?.perCompletion || 0}
                                            onChange={(e) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "goldReward", {
                                                ...subObj.goldReward,
                                                perCompletion: Number(e.target.value),
                                              })
                                            }
                                            min={0}
                                            className="border-purple-300 text-xs h-8"
                                          />
                                        </div>
                                        <div>
                                          <Label className="flex items-center gap-1 text-xs">
                                            <Coins className="h-2 w-2 text-yellow-500" />
                                            Ouro/Ponto
                                          </Label>
                                          <Input
                                            type="number"
                                            value={subObj.goldReward?.perPoint || 0}
                                            onChange={(e) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "goldReward", {
                                                ...subObj.goldReward,
                                                perPoint: Number(e.target.value),
                                              })
                                            }
                                            min={0}
                                            className="border-purple-300 text-xs h-8"
                                          />
                                        </div>
                                      </div>
                                    </Card>

                                    {/* Sistema de Repetições do Subobjetivo */}
                                    <Card className="p-2 bg-purple-100 border-purple-300">
                                      <div className="flex items-center gap-2 mb-2">
                                        <RotateCcw className="h-3 w-3 text-purple-600" />
                                        <Label className="font-medium text-purple-800 text-xs">Repetições</Label>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            checked={subObj.isRepeatable}
                                            onCheckedChange={(checked) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "isRepeatable", checked)
                                            }
                                          />
                                          <Label className="text-xs">Repetível</Label>
                                        </div>
                                        {subObj.isRepeatable && (
                                          <>
                                            <div className="flex items-center space-x-2">
                                              <Switch
                                                checked={subObj.isInfiniteLoop}
                                                onCheckedChange={(checked) =>
                                                  handleSubObjectiveChange(
                                                    phaseIndex,
                                                    subIndex,
                                                    "isInfiniteLoop",
                                                    checked,
                                                  )
                                                }
                                              />
                                              <Label className="text-xs">Loop Infinito</Label>
                                            </div>
                                            {!subObj.isInfiniteLoop && (
                                              <div>
                                                <Label className="text-xs">Máx. Repetições</Label>
                                                <Input
                                                  type="number"
                                                  value={subObj.maxRepetitions || ""}
                                                  onChange={(e) =>
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "maxRepetitions",
                                                      Number(e.target.value),
                                                    )
                                                  }
                                                  min={1}
                                                  className="border-purple-300 text-xs h-8"
                                                />
                                              </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs text-purple-700">
                                                Repetições: {subObj.currentRepetitions}
                                              </span>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 border-red-300 h-6 text-xs bg-transparent"
                                                  >
                                                    <RotateCcw className="h-2 w-2 mr-1" />
                                                    Reset
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                      Resetar Repetições do Subobjetivo
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Tem certeza que deseja resetar as repetições deste subobjetivo?
                                                      Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() =>
                                                        handleResetSubObjectiveRepetitions(phaseIndex, subIndex)
                                                      }
                                                    >
                                                      Resetar
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </Card>

                                    {/* Sistema de Cooldown do Subobjetivo */}
                                    <Card className="p-2 bg-purple-100 border-purple-300">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Clock className="h-3 w-3 text-purple-600" />
                                        <Label className="font-medium text-purple-800 text-xs">
                                          Sistema de Cooldown
                                        </Label>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                          <Switch
                                            checked={subObj.hasCooldown}
                                            onCheckedChange={(checked) =>
                                              handleSubObjectiveChange(phaseIndex, subIndex, "hasCooldown", checked)
                                            }
                                          />
                                          <Label className="text-xs">Ativar Cooldown</Label>
                                        </div>
                                        {subObj.hasCooldown && (
                                          <div className="space-y-2">
                                            <div className="grid grid-cols-3 gap-1">
                                              <div>
                                                <Label className="text-xs">Horas</Label>
                                                <Input
                                                  type="number"
                                                  value={Math.floor((subObj.cooldownDuration || 0) / 3600)}
                                                  onChange={(e) => {
                                                    const hours = Number(e.target.value) || 0
                                                    const minutes = Math.floor(
                                                      ((subObj.cooldownDuration || 0) % 3600) / 60,
                                                    )
                                                    const seconds = (subObj.cooldownDuration || 0) % 60
                                                    const totalSeconds = hours * 3600 + minutes * 60 + seconds
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      totalSeconds,
                                                    )
                                                  }}
                                                  min={0}
                                                  className="border-purple-300 text-xs h-6"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-xs">Min</Label>
                                                <Input
                                                  type="number"
                                                  value={Math.floor(((subObj.cooldownDuration || 0) % 3600) / 60)}
                                                  onChange={(e) => {
                                                    const hours = Math.floor((subObj.cooldownDuration || 0) / 3600)
                                                    const minutes = Number(e.target.value) || 0
                                                    const seconds = (subObj.cooldownDuration || 0) % 60
                                                    const totalSeconds = hours * 3600 + minutes * 60 + seconds
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      totalSeconds,
                                                    )
                                                  }}
                                                  min={0}
                                                  max={59}
                                                  className="border-purple-300 text-xs h-6"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-xs">Seg</Label>
                                                <Input
                                                  type="number"
                                                  value={(subObj.cooldownDuration || 0) % 60}
                                                  onChange={(e) => {
                                                    const hours = Math.floor((subObj.cooldownDuration || 0) / 3600)
                                                    const minutes = Math.floor(
                                                      ((subObj.cooldownDuration || 0) % 3600) / 60,
                                                    )
                                                    const seconds = Number(e.target.value) || 0
                                                    const totalSeconds = hours * 3600 + minutes * 60 + seconds
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      totalSeconds,
                                                    )
                                                  }}
                                                  min={0}
                                                  max={59}
                                                  className="border-purple-300 text-xs h-6"
                                                />
                                              </div>
                                            </div>
                                            <div className="text-xs text-purple-700">
                                              Duração total: {Math.floor((subObj.cooldownDuration || 0) / 3600)}h{" "}
                                              {Math.floor(((subObj.cooldownDuration || 0) % 3600) / 60)}m{" "}
                                              {(subObj.cooldownDuration || 0) % 60}s
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">Presets rápidos:</Label>
                                              <div className="grid grid-cols-4 gap-1">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-xs h-6 p-1 bg-transparent"
                                                  onClick={() =>
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      10,
                                                    )
                                                  }
                                                >
                                                  10s
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-xs h-6 p-1 bg-transparent"
                                                  onClick={() =>
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      60,
                                                    )
                                                  }
                                                >
                                                  1m
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-xs h-6 p-1 bg-transparent"
                                                  onClick={() =>
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      300,
                                                    )
                                                  }
                                                >
                                                  5m
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  className="text-xs h-6 p-1 bg-transparent"
                                                  onClick={() =>
                                                    handleSubObjectiveChange(
                                                      phaseIndex,
                                                      subIndex,
                                                      "cooldownDuration",
                                                      3600,
                                                    )
                                                  }
                                                >
                                                  1h
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </Card>
                                  </div>
                                </Card>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSubObjective(phaseIndex)}
                                className="border-purple-300 text-purple-700 hover:bg-purple-100"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Subobjetivo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddPhase}
                      className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Fase
                    </Button>
                  </div>
                ) : (
                  <Tabs defaultValue={type} value={type} onValueChange={(value) => setType(value as ObjectiveType)}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="collection">Coleção</TabsTrigger>
                      <TabsTrigger value="steps">Etapas</TabsTrigger>
                      <TabsTrigger value="percentage">Porcentagem</TabsTrigger>
                      <TabsTrigger value="kill">Eliminação</TabsTrigger>
                      <TabsTrigger value="custom">Personalizado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="collection" className="space-y-4">
                      <div className="space-y-4">
                        {collectionItems.map((item, index) => (
                          <div key={index} className="flex items-end gap-2">
                            <div className="flex-1">
                              <Label htmlFor={`item-name-${index}`}>Nome do Item</Label>
                              <Input
                                id={`item-name-${index}`}
                                value={item.name}
                                onChange={(e) => handleCollectionItemChange(index, "name", e.target.value)}
                                placeholder="Nome do item"
                              />
                            </div>
                            <div className="w-24">
                              <Label htmlFor={`item-target-${index}`}>Meta</Label>
                              <Input
                                id={`item-target-${index}`}
                                type="number"
                                value={item.targetAmount}
                                onChange={(e) =>
                                  handleCollectionItemChange(index, "targetAmount", Number(e.target.value))
                                }
                                min={1}
                              />
                            </div>
                            <div className="w-24">
                              <Label htmlFor={`item-current-${index}`}>Atual</Label>
                              <Input
                                id={`item-current-${index}`}
                                type="number"
                                value={item.currentAmount}
                                onChange={(e) =>
                                  handleCollectionItemChange(index, "currentAmount", Number(e.target.value))
                                }
                                min={0}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveCollectionItem(index)}
                              disabled={collectionItems.length <= 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}

                        <Button type="button" variant="outline" onClick={handleAddCollectionItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Item
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="steps" className="space-y-4">
                      <div>
                        <Label htmlFor="totalSteps">Total de Etapas</Label>
                        <Input
                          id="totalSteps"
                          type="number"
                          value={totalSteps}
                          onChange={(e) => setTotalSteps(Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currentStep">Etapa Atual</Label>
                        <Input
                          id="currentStep"
                          type="number"
                          value={currentStep}
                          onChange={(e) => setCurrentStep(Number(e.target.value))}
                          min={0}
                          max={totalSteps}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="percentage" className="space-y-4">
                      <div>
                        <Label htmlFor="targetPercentage">Porcentagem Meta</Label>
                        <Input
                          id="targetPercentage"
                          type="number"
                          value={targetPercentage}
                          onChange={(e) => setTargetPercentage(Number(e.target.value))}
                          min={1}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="percentage">Porcentagem Atual</Label>
                        <Input
                          id="percentage"
                          type="number"
                          value={percentage}
                          onChange={(e) => setPercentage(Number(e.target.value))}
                          min={0}
                          max={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="estimatedTime">Tempo Estimado (minutos)</Label>
                        <Input
                          id="estimatedTime"
                          type="number"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="kill" className="space-y-4">
                      <div>
                        <Label htmlFor="targetKills">Meta de Eliminações</Label>
                        <Input
                          id="targetKills"
                          type="number"
                          value={targetKills}
                          onChange={(e) => setTargetKills(Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div>
                        <Label htmlFor="currentKills">Eliminações Atuais</Label>
                        <Input
                          id="currentKills"
                          type="number"
                          value={currentKills}
                          onChange={(e) => setCurrentKills(Number(e.target.value))}
                          min={0}
                          max={targetKills}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4">
                      <div>
                        <Label htmlFor="customData">Dados Personalizados</Label>
                        <Textarea
                          id="customData"
                          value={customData}
                          onChange={(e) => setCustomData(e.target.value)}
                          placeholder="Digite dados personalizados para este objetivo"
                          rows={5}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </div>

            <CardFooter className="flex justify-end pt-6 px-0">
              <Button type="submit">Criar Objetivo</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
      <div className="flex justify-between mt-6">
        <Link href="/objectives">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para Objetivos
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Ir para Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
