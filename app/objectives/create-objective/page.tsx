"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useObjectives, type ObjectiveType } from "@/contexts/objectives-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

type SubObjective = {
  id: string
  name: string
  description: string
  targetValue: number
  xpReward: {
    perCompletion: number
    perPoint: number
  }
  goldReward: {
    perCompletion: number
    perPoint: number
  }
  isRepeatable: boolean
  isInfiniteLoop: boolean
  maxRepetitions?: number
  hasCooldown: boolean
  cooldownDuration: number // em segundos
}

type Phase = {
  id: string
  name: string
  description: string
  xpReward: {
    perCompletion: number
    perPoint: number
  }
  goldReward: {
    perCompletion: number
    perPoint: number
  }
  isRepeatable: boolean
  isInfiniteLoop: boolean
  maxRepetitions?: number
  subObjectives: SubObjective[]
}

export default function CreateObjectivePage() {
  const router = useRouter()
  const { addObjective } = useObjectives()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<ObjectiveType>("steps")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isRepeatable, setIsRepeatable] = useState(false)
  const [maxCompletions, setMaxCompletions] = useState<number | undefined>()
  const [expiresAt, setExpiresAt] = useState("")

  // Recompensas do objetivo
  const [xpReward, setXpReward] = useState({
    perCompletion: 100,
    perPoint: 0,
  })
  const [goldReward, setGoldReward] = useState({
    perCompletion: 0,
    perPoint: 0,
  })

  // Localização
  const [location, setLocation] = useState({
    zone: "",
    coordinates: "",
    notes: "",
  })

  // Sistema de fases
  const [phases, setPhases] = useState<Phase[]>([
    {
      id: uuidv4(),
      name: "Fase 1",
      description: "",
      xpReward: { perCompletion: 0, perPoint: 0 },
      goldReward: { perCompletion: 0, perPoint: 0 },
      isRepeatable: false,
      isInfiniteLoop: false,
      subObjectives: [],
    },
  ])

  const addPhase = () => {
    setPhases([
      ...phases,
      {
        id: uuidv4(),
        name: `Fase ${phases.length + 1}`,
        description: "",
        xpReward: { perCompletion: 0, perPoint: 0 },
        goldReward: { perCompletion: 0, perPoint: 0 },
        isRepeatable: false,
        isInfiniteLoop: false,
        subObjectives: [],
      },
    ])
  }

  const removePhase = (phaseId: string) => {
    if (phases.length > 1) {
      setPhases(phases.filter((phase) => phase.id !== phaseId))
    }
  }

  const updatePhase = (phaseId: string, updates: Partial<Phase>) => {
    setPhases(phases.map((phase) => (phase.id === phaseId ? { ...phase, ...updates } : phase)))
  }

  const addSubObjective = (phaseId: string) => {
    const newSubObjective: SubObjective = {
      id: uuidv4(),
      name: `Subobjetivo ${phases.find((p) => p.id === phaseId)?.subObjectives.length + 1 || 1}`,
      description: "",
      targetValue: 1,
      xpReward: { perCompletion: 0, perPoint: 0 },
      goldReward: { perCompletion: 0, perPoint: 0 },
      isRepeatable: false,
      isInfiniteLoop: false,
      hasCooldown: false,
      cooldownDuration: 60, // 1 minuto por padrão
    }

    updatePhase(phaseId, {
      subObjectives: [...(phases.find((p) => p.id === phaseId)?.subObjectives || []), newSubObjective],
    })
  }

  const removeSubObjective = (phaseId: string, subObjectiveId: string) => {
    const phase = phases.find((p) => p.id === phaseId)
    if (phase) {
      updatePhase(phaseId, {
        subObjectives: phase.subObjectives.filter((sub) => sub.id !== subObjectiveId),
      })
    }
  }

  const updateSubObjective = (phaseId: string, subObjectiveId: string, updates: Partial<SubObjective>) => {
    const phase = phases.find((p) => p.id === phaseId)
    if (phase) {
      updatePhase(phaseId, {
        subObjectives: phase.subObjectives.map((sub) => (sub.id === subObjectiveId ? { ...sub, ...updates } : sub)),
      })
    }
  }

  const formatCooldownDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    const parts = []
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0) parts.push(`${minutes}m`)
    if (secs > 0) parts.push(`${secs}s`)

    return parts.length > 0 ? parts.join(" ") : "0s"
  }

  const setCooldownPreset = (phaseId: string, subObjectiveId: string, seconds: number) => {
    updateSubObjective(phaseId, subObjectiveId, { cooldownDuration: seconds })
  }

  const setCooldownFromInputs = (
    phaseId: string,
    subObjectiveId: string,
    hours: number,
    minutes: number,
    seconds: number,
  ) => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    updateSubObjective(phaseId, subObjectiveId, { cooldownDuration: Math.max(1, totalSeconds) })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do objetivo é obrigatório.",
        variant: "destructive",
      })
      return
    }

    // Normalizar fases para garantir que todas tenham as propriedades necessárias
    const normalizedPhases = phases.map((phase) => ({
      ...phase,
      completed: false,
      currentRepetitions: 0,
      totalGoldEarned: 0,
      subObjectives: phase.subObjectives.map((sub) => ({
        ...sub,
        completed: false,
        currentValue: 0,
        currentRepetitions: 0,
        totalGoldEarned: 0,
        cooldownProgress: 0,
      })),
    }))

    const objectiveData = {
      name: name.trim(),
      description: description.trim(),
      type,
      category: category.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      completed: false,
      isRepeatable,
      maxCompletions: isRepeatable ? maxCompletions : undefined,
      xpReward,
      goldReward,
      location: location.zone || location.coordinates || location.notes ? location : undefined,
      phases: normalizedPhases,
      currentPhaseIndex: 0,
      expiresAt: expiresAt || undefined,
    }

    try {
      addObjective(objectiveData)
      toast({
        title: "Sucesso",
        description: "Objetivo criado com sucesso!",
      })
      router.push("/objectives")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar objetivo. Tente novamente.",
        variant: "destructive",
      })
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Objetivo *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite o nome do objetivo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={(value: ObjectiveType) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">Coleção</SelectItem>
                    <SelectItem value="steps">Passos</SelectItem>
                    <SelectItem value="percentage">Porcentagem</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    <SelectItem value="kill">Eliminação</SelectItem>
                    <SelectItem value="resource">Recurso</SelectItem>
                    <SelectItem value="dungeon">Dungeon</SelectItem>
                    <SelectItem value="achievement">Conquista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o objetivo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ex: PvP, PvE, Crafting"
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">URL da Imagem</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiresAt">Data de Expiração</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Repetição */}
        <Card>
          <CardHeader>
            <CardTitle>Sistema de Repetição</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch id="repeatable" checked={isRepeatable} onCheckedChange={setIsRepeatable} />
              <Label htmlFor="repeatable">Objetivo Repetível</Label>
            </div>

            {isRepeatable && (
              <div>
                <Label htmlFor="maxCompletions">Máximo de Conclusões (deixe vazio para ilimitado)</Label>
                <Input
                  id="maxCompletions"
                  type="number"
                  min="1"
                  value={maxCompletions || ""}
                  onChange={(e) => setMaxCompletions(e.target.value ? Number.parseInt(e.target.value) : undefined)}
                  placeholder="Ex: 5"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recompensas */}
        <Card>
          <CardHeader>
            <CardTitle>Recompensas do Objetivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="xpCompletion">XP por Conclusão</Label>
                <Input
                  id="xpCompletion"
                  type="number"
                  min="0"
                  value={xpReward.perCompletion}
                  onChange={(e) => setXpReward({ ...xpReward, perCompletion: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="xpPoint">XP por Ponto</Label>
                <Input
                  id="xpPoint"
                  type="number"
                  min="0"
                  value={xpReward.perPoint}
                  onChange={(e) => setXpReward({ ...xpReward, perPoint: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="goldCompletion">Ouro por Conclusão</Label>
                <Input
                  id="goldCompletion"
                  type="number"
                  min="0"
                  value={goldReward.perCompletion}
                  onChange={(e) =>
                    setGoldReward({ ...goldReward, perCompletion: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="goldPoint">Ouro por Ponto</Label>
                <Input
                  id="goldPoint"
                  type="number"
                  min="0"
                  value={goldReward.perPoint}
                  onChange={(e) => setGoldReward({ ...goldReward, perPoint: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle>Localização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zone">Zona</Label>
                <Input
                  id="zone"
                  value={location.zone}
                  onChange={(e) => setLocation({ ...location, zone: e.target.value })}
                  placeholder="Ex: Floresta Sombria"
                />
              </div>
              <div>
                <Label htmlFor="coordinates">Coordenadas</Label>
                <Input
                  id="coordinates"
                  value={location.coordinates}
                  onChange={(e) => setLocation({ ...location, coordinates: e.target.value })}
                  placeholder="Ex: 123, 456"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="locationNotes">Notas de Localização</Label>
              <Textarea
                id="locationNotes"
                value={location.notes}
                onChange={(e) => setLocation({ ...location, notes: e.target.value })}
                placeholder="Informações adicionais sobre a localização"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Fases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Fases
              <Button type="button" onClick={addPhase} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Fase
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {phases.map((phase, phaseIndex) => (
              <div key={phase.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fase {phaseIndex + 1}</h3>
                  {phases.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePhase(phase.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Fase</Label>
                    <Input
                      value={phase.name}
                      onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                      placeholder="Nome da fase"
                    />
                  </div>
                  <div>
                    <Label>Descrição da Fase</Label>
                    <Input
                      value={phase.description}
                      onChange={(e) => updatePhase(phase.id, { description: e.target.value })}
                      placeholder="Descrição da fase"
                    />
                  </div>
                </div>

                {/* Recompensas da Fase */}
                <div>
                  <Label className="text-sm font-medium">Recompensas da Fase</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    <div>
                      <Label className="text-xs">XP/Conclusão</Label>
                      <Input
                        type="number"
                        min="0"
                        value={phase.xpReward.perCompletion}
                        onChange={(e) =>
                          updatePhase(phase.id, {
                            xpReward: { ...phase.xpReward, perCompletion: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">XP/Ponto</Label>
                      <Input
                        type="number"
                        min="0"
                        value={phase.xpReward.perPoint}
                        onChange={(e) =>
                          updatePhase(phase.id, {
                            xpReward: { ...phase.xpReward, perPoint: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ouro/Conclusão</Label>
                      <Input
                        type="number"
                        min="0"
                        value={phase.goldReward.perCompletion}
                        onChange={(e) =>
                          updatePhase(phase.id, {
                            goldReward: { ...phase.goldReward, perCompletion: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ouro/Ponto</Label>
                      <Input
                        type="number"
                        min="0"
                        value={phase.goldReward.perPoint}
                        onChange={(e) =>
                          updatePhase(phase.id, {
                            goldReward: { ...phase.goldReward, perPoint: Number.parseInt(e.target.value) || 0 },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sistema de Repetição da Fase */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={phase.isRepeatable}
                      onCheckedChange={(checked) => updatePhase(phase.id, { isRepeatable: checked })}
                    />
                    <Label className="text-sm">Fase Repetível</Label>
                  </div>

                  {phase.isRepeatable && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={phase.isInfiniteLoop}
                          onCheckedChange={(checked) => updatePhase(phase.id, { isInfiniteLoop: checked })}
                        />
                        <Label className="text-xs">Loop Infinito</Label>
                      </div>
                      {!phase.isInfiniteLoop && (
                        <div>
                          <Label className="text-xs">Máx. Repetições</Label>
                          <Input
                            type="number"
                            min="1"
                            value={phase.maxRepetitions || ""}
                            onChange={(e) =>
                              updatePhase(phase.id, {
                                maxRepetitions: e.target.value ? Number.parseInt(e.target.value) : undefined,
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Subobjetivos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-medium">Subobjetivos</Label>
                    <Button type="button" onClick={() => addSubObjective(phase.id)} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Subobjetivo
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {phase.subObjectives.map((subObj) => (
                      <div key={subObj.id} className="border rounded p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Input
                            value={subObj.name}
                            onChange={(e) => updateSubObjective(phase.id, subObj.id, { name: e.target.value })}
                            placeholder="Nome do subobjetivo"
                            className="flex-1 mr-2"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSubObjective(phase.id, subObj.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <Textarea
                          value={subObj.description}
                          onChange={(e) => updateSubObjective(phase.id, subObj.id, { description: e.target.value })}
                          placeholder="Descrição do subobjetivo"
                          rows={2}
                        />

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">Meta</Label>
                            <Input
                              type="number"
                              min="1"
                              value={subObj.targetValue}
                              onChange={(e) =>
                                updateSubObjective(phase.id, subObj.id, {
                                  targetValue: Number.parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">XP/Ponto</Label>
                            <Input
                              type="number"
                              min="0"
                              value={subObj.xpReward.perPoint}
                              onChange={(e) =>
                                updateSubObjective(phase.id, subObj.id, {
                                  xpReward: { ...subObj.xpReward, perPoint: Number.parseInt(e.target.value) || 0 },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">XP/Conclusão</Label>
                            <Input
                              type="number"
                              min="0"
                              value={subObj.xpReward.perCompletion}
                              onChange={(e) =>
                                updateSubObjective(phase.id, subObj.id, {
                                  xpReward: { ...subObj.xpReward, perCompletion: Number.parseInt(e.target.value) || 0 },
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Ouro/Conclusão</Label>
                            <Input
                              type="number"
                              min="0"
                              value={subObj.goldReward.perCompletion}
                              onChange={(e) =>
                                updateSubObjective(phase.id, subObj.id, {
                                  goldReward: {
                                    ...subObj.goldReward,
                                    perCompletion: Number.parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ouro/Ponto</Label>
                            <Input
                              type="number"
                              min="0"
                              value={subObj.goldReward.perPoint}
                              onChange={(e) =>
                                updateSubObjective(phase.id, subObj.id, {
                                  goldReward: { ...subObj.goldReward, perPoint: Number.parseInt(e.target.value) || 0 },
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={subObj.isRepeatable}
                            onCheckedChange={(checked) =>
                              updateSubObjective(phase.id, subObj.id, { isRepeatable: checked })
                            }
                          />
                          <Label className="text-sm">Repetível</Label>
                        </div>

                        {subObj.isRepeatable && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={subObj.isInfiniteLoop}
                                onCheckedChange={(checked) =>
                                  updateSubObjective(phase.id, subObj.id, { isInfiniteLoop: checked })
                                }
                              />
                              <Label className="text-xs">Loop Infinito</Label>
                            </div>
                            {!subObj.isInfiniteLoop && (
                              <div>
                                <Label className="text-xs">Máx. Repetições</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={subObj.maxRepetitions || ""}
                                  onChange={(e) =>
                                    updateSubObjective(phase.id, subObj.id, {
                                      maxRepetitions: e.target.value ? Number.parseInt(e.target.value) : undefined,
                                    })
                                  }
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Sistema de Cooldown */}
                        <div className="border-t pt-3 space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={subObj.hasCooldown}
                              onCheckedChange={(checked) =>
                                updateSubObjective(phase.id, subObj.id, { hasCooldown: checked })
                              }
                            />
                            <Label className="text-sm flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Ativar Cooldown por Ponto
                            </Label>
                          </div>

                          {subObj.hasCooldown && (
                            <div className="space-y-3 bg-blue-50 p-3 rounded-lg">
                              <div className="text-sm text-blue-700">
                                <strong>Duração Total:</strong> {formatCooldownDuration(subObj.cooldownDuration)}
                              </div>

                              {/* Campos de entrada para tempo */}
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Horas (0-23)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={Math.floor(subObj.cooldownDuration / 3600)}
                                    onChange={(e) => {
                                      const hours = Number.parseInt(e.target.value) || 0
                                      const minutes = Math.floor((subObj.cooldownDuration % 3600) / 60)
                                      const seconds = subObj.cooldownDuration % 60
                                      setCooldownFromInputs(phase.id, subObj.id, hours, minutes, seconds)
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Minutos (0-59)</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={Math.floor((subObj.cooldownDuration % 3600) / 60)}
                                    onChange={(e) => {
                                      const hours = Math.floor(subObj.cooldownDuration / 3600)
                                      const minutes = Number.parseInt(e.target.value) || 0
                                      const seconds = subObj.cooldownDuration % 60
                                      setCooldownFromInputs(phase.id, subObj.id, hours, minutes, seconds)
                                    }}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Segundos (1-59)</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="59"
                                    value={subObj.cooldownDuration % 60}
                                    onChange={(e) => {
                                      const hours = Math.floor(subObj.cooldownDuration / 3600)
                                      const minutes = Math.floor((subObj.cooldownDuration % 3600) / 60)
                                      const seconds = Math.max(1, Number.parseInt(e.target.value) || 1)
                                      setCooldownFromInputs(phase.id, subObj.id, hours, minutes, seconds)
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Botões de preset */}
                              <div className="flex flex-wrap gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 10)}
                                >
                                  10s
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 60)}
                                >
                                  1m
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 300)}
                                >
                                  5m
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 600)}
                                >
                                  10m
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 3600)}
                                >
                                  1h
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCooldownPreset(phase.id, subObj.id, 7200)}
                                >
                                  2h
                                </Button>
                              </div>

                              <div className="text-xs text-blue-600">
                                O cooldown será aplicado a cada ponto adicionado ao progresso deste subobjetivo.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-4">
          <Link href="/objectives">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit">Criar Objetivo</Button>
        </div>
      </form>
    </div>
  )
}
