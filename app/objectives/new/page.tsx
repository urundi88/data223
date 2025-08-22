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
import { ArrowLeft, Plus, Trash, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

export default function CreateObjectivePage() {
  const router = useRouter()
  const { addObjective } = useObjectives()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<ObjectiveType>("collection")
  const [xpReward, setXpReward] = useState(100)
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
          xpReward: 50,
          isRepeatable: false,
          isInfiniteLoop: false,
          currentRepetitions: 0,
        },
      ],
      xpReward: 100,
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
            xpReward: 50,
            isRepeatable: false,
            isInfiniteLoop: false,
            currentRepetitions: 0,
          },
        ],
        xpReward: 100,
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

  const handleAddSubObjective = (phaseIndex: number) => {
    const updatedPhases = [...phases]
    updatedPhases[phaseIndex].subObjectives.push({
      id: uuidv4(),
      name: `Subobjetivo ${updatedPhases[phaseIndex].subObjectives.length + 1}`,
      description: "",
      completed: false,
      currentValue: 0,
      targetValue: 1,
      xpReward: 25,
      isRepeatable: false,
      isInfiniteLoop: false,
      currentRepetitions: 0,
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
        xpReward: Number(xpReward),
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

                <div>
                  <Label htmlFor="xpReward">Recompensa XP</Label>
                  <Input
                    id="xpReward"
                    type="number"
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value))}
                    min={0}
                  />
                </div>

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
                      <Card key={phase.id} className="p-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Input
                              value={phase.name}
                              onChange={(e) => handlePhaseChange(phaseIndex, "name", e.target.value)}
                              placeholder="Nome da fase"
                              className="font-medium"
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
                          />

                          <div>
                            <Label>XP da Fase</Label>
                            <Input
                              type="number"
                              value={phase.xpReward}
                              onChange={(e) => handlePhaseChange(phaseIndex, "xpReward", Number(e.target.value))}
                              min={0}
                            />
                          </div>

                          <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium">Sistema de Repetições da Fase</h4>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`phase-repeatable-${phaseIndex}`}
                                checked={phase.isRepeatable || false}
                                onCheckedChange={(checked) => handlePhaseChange(phaseIndex, "isRepeatable", checked)}
                              />
                              <Label htmlFor={`phase-repeatable-${phaseIndex}`}>Fase Repetível</Label>
                            </div>

                            {phase.isRepeatable && (
                              <>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`phase-infinite-${phaseIndex}`}
                                    checked={phase.isInfiniteLoop || false}
                                    onCheckedChange={(checked) =>
                                      handlePhaseChange(phaseIndex, "isInfiniteLoop", checked)
                                    }
                                  />
                                  <Label htmlFor={`phase-infinite-${phaseIndex}`}>Loop Infinito</Label>
                                </div>

                                {!phase.isInfiniteLoop && (
                                  <div>
                                    <Label>Máximo de Repetições</Label>
                                    <Input
                                      type="number"
                                      value={phase.maxRepetitions || 1}
                                      onChange={(e) =>
                                        handlePhaseChange(phaseIndex, "maxRepetitions", Number(e.target.value))
                                      }
                                      min={1}
                                    />
                                  </div>
                                )}

                                {phase.isInfiniteLoop && (
                                  <div>
                                    <Label htmlFor={`phase-infinite-date-${phaseIndex}`}>Data Limite (Opcional)</Label>
                                    <Input
                                      id={`phase-infinite-date-${phaseIndex}`}
                                      type="datetime-local"
                                      value={phase.infiniteDate || ""}
                                      onChange={(e) => handlePhaseChange(phaseIndex, "infiniteDate", e.target.value)}
                                    />
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          <div>
                            <Label className="block mb-2">Subobjetivos</Label>
                            <div className="space-y-2">
                              {phase.subObjectives.map((subObj, subIndex) => (
                                <div key={subObj.id} className="flex items-end gap-2 p-2 border rounded">
                                  <div className="flex-1">
                                    <Label>Nome</Label>
                                    <Input
                                      value={subObj.name}
                                      onChange={(e) =>
                                        handleSubObjectiveChange(phaseIndex, subIndex, "name", e.target.value)
                                      }
                                      placeholder="Nome do subobjetivo"
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
                                    />
                                  </div>
                                  <div className="w-20">
                                    <Label>XP</Label>
                                    <Input
                                      type="number"
                                      value={subObj.xpReward}
                                      onChange={(e) =>
                                        handleSubObjectiveChange(
                                          phaseIndex,
                                          subIndex,
                                          "xpReward",
                                          Number(e.target.value),
                                        )
                                      }
                                      min={0}
                                    />
                                  </div>
                                  <div className="w-20">
                                    <Label>Repetível</Label>
                                    <Switch
                                      checked={subObj.isRepeatable || false}
                                      onCheckedChange={(checked) =>
                                        handleSubObjectiveChange(phaseIndex, subIndex, "isRepeatable", checked)
                                      }
                                    />
                                  </div>

                                  {subObj.isRepeatable && (
                                    <>
                                      <div className="w-20">
                                        <Label>Infinito</Label>
                                        <Switch
                                          checked={subObj.isInfiniteLoop || false}
                                          onCheckedChange={(checked) =>
                                            handleSubObjectiveChange(phaseIndex, subIndex, "isInfiniteLoop", checked)
                                          }
                                        />
                                      </div>

                                      {!subObj.isInfiniteLoop && (
                                        <div className="w-20">
                                          <Label>Max Rep.</Label>
                                          <Input
                                            type="number"
                                            value={subObj.maxRepetitions || 1}
                                            onChange={(e) =>
                                              handleSubObjectiveChange(
                                                phaseIndex,
                                                subIndex,
                                                "maxRepetitions",
                                                Number(e.target.value),
                                              )
                                            }
                                            min={1}
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
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
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSubObjective(phaseIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Subobjetivo
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}

                    <Button type="button" variant="outline" onClick={handleAddPhase}>
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
