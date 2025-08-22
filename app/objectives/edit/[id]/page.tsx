"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useObjectives, type Objective, type ObjectivePhase, type SubObjective } from "@/contexts/objectives-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash, Save, ArrowLeft, Target, Home, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { v4 as uuidv4 } from "uuid"

interface PageProps {
  params: {
    id: string
  }
}

export default function EditObjectivePage({ params }: PageProps) {
  const { objectives, updateObjective } = useObjectives()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [objective, setObjective] = useState<Objective | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "custom" as any,
    category: "",
    xpReward: { perCompletion: 0, perPoint: 0 },
    goldReward: { perCompletion: 0, perPoint: 0 },
    isRepeatable: false,
    maxCompletions: undefined as number | undefined,
    expiresAt: "",
    phases: [] as ObjectivePhase[],
    location: { zone: "", coordinates: "", notes: "" },
  })

  useEffect(() => {
    const obj = objectives.find((o) => o.id === params.id)
    if (obj) {
      setObjective(obj)
      setFormData({
        name: obj.name,
        description: obj.description || "",
        type: obj.type,
        category: obj.category || "",
        xpReward: obj.xpReward || { perCompletion: 0, perPoint: 0 },
        goldReward: obj.goldReward || { perCompletion: 0, perPoint: 0 },
        isRepeatable: obj.isRepeatable || false,
        maxCompletions: obj.maxCompletions,
        expiresAt: obj.expiresAt ? new Date(obj.expiresAt).toISOString().slice(0, 16) : "",
        phases: obj.phases || [],
        location: obj.location || { zone: "", coordinates: "", notes: "" },
      })
    }
    setLoading(false)
  }, [params.id, objectives])

  const handleSave = () => {
    if (!objective) return

    const updates: Partial<Objective> = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      category: formData.category || undefined,
      xpReward: formData.xpReward,
      goldReward: formData.goldReward,
      isRepeatable: formData.isRepeatable,
      maxCompletions: formData.maxCompletions,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      phases: formData.phases,
      location:
        formData.location.zone || formData.location.coordinates || formData.location.notes
          ? formData.location
          : undefined,
    }

    updateObjective(objective.id, updates)
    toast({
      title: "Objetivo Atualizado",
      description: "Todas as alterações foram salvas com sucesso.",
    })
    router.push(`/objective-details/${objective.id}`)
  }

  const addPhase = () => {
    const newPhase: ObjectivePhase = {
      id: uuidv4(),
      name: `Fase ${formData.phases.length + 1}`,
      description: "",
      completed: false,
      subObjectives: [],
      xpReward: { perCompletion: 0, perPoint: 0 },
      goldReward: { perCompletion: 0, perPoint: 0 },
      isRepeatable: false,
      isInfiniteLoop: false,
      currentRepetitions: 0,
      totalGoldEarned: 0,
    }
    setFormData({ ...formData, phases: [...formData.phases, newPhase] })
  }

  const removePhase = (phaseIndex: number) => {
    const newPhases = formData.phases.filter((_, index) => index !== phaseIndex)
    setFormData({ ...formData, phases: newPhases })
  }

  const updatePhase = (phaseIndex: number, updates: Partial<ObjectivePhase>) => {
    const newPhases = formData.phases.map((phase, index) => (index === phaseIndex ? { ...phase, ...updates } : phase))
    setFormData({ ...formData, phases: newPhases })
  }

  const addSubObjective = (phaseIndex: number) => {
    const newSubObjective: SubObjective = {
      id: uuidv4(),
      name: `Subobjetivo ${formData.phases[phaseIndex].subObjectives.length + 1}`,
      description: "",
      completed: false,
      currentValue: 0,
      targetValue: 1,
      xpReward: { perCompletion: 0, perPoint: 0 },
      goldReward: { perCompletion: 0, perPoint: 0 },
      isRepeatable: false,
      isInfiniteLoop: false,
      currentRepetitions: 0,
      totalGoldEarned: 0,
      hasCooldown: false,
      cooldownDuration: 60,
      cooldownProgress: 0,
    }

    const newPhases = formData.phases.map((phase, index) =>
      index === phaseIndex ? { ...phase, subObjectives: [...phase.subObjectives, newSubObjective] } : phase,
    )
    setFormData({ ...formData, phases: newPhases })
  }

  const removeSubObjective = (phaseIndex: number, subIndex: number) => {
    const newPhases = formData.phases.map((phase, index) =>
      index === phaseIndex ? { ...phase, subObjectives: phase.subObjectives.filter((_, i) => i !== subIndex) } : phase,
    )
    setFormData({ ...formData, phases: newPhases })
  }

  const updateSubObjective = (phaseIndex: number, subIndex: number, updates: Partial<SubObjective>) => {
    const newPhases = formData.phases.map((phase, index) =>
      index === phaseIndex
        ? {
            ...phase,
            subObjectives: phase.subObjectives.map((sub, i) => (i === subIndex ? { ...sub, ...updates } : sub)),
          }
        : phase,
    )
    setFormData({ ...formData, phases: newPhases })
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

  const setCooldownPreset = (phaseIndex: number, subIndex: number, seconds: number) => {
    updateSubObjective(phaseIndex, subIndex, { cooldownDuration: seconds })
  }

  const setCooldownFromInputs = (
    phaseIndex: number,
    subIndex: number,
    hours: number,
    minutes: number,
    seconds: number,
  ) => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds
    updateSubObjective(phaseIndex, subIndex, { cooldownDuration: Math.max(1, totalSeconds) })
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

  if (!objective) {
    return (
      <div className="p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Objetivo não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">O objetivo que você está tentando editar não foi encontrado.</p>
            <Link href="/objectives">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para Objetivos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/objectives">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Objetivos
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Editar Objetivo</h1>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Principal, Secundária, Daily"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="collection">Collection</SelectItem>
                    <SelectItem value="steps">Steps</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="kill">Kill</SelectItem>
                    <SelectItem value="resource">Resource</SelectItem>
                    <SelectItem value="dungeon">Dungeon</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="xpCompletion">XP por Conclusão</Label>
                <Input
                  id="xpCompletion"
                  type="number"
                  value={formData.xpReward.perCompletion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      xpReward: { ...formData.xpReward, perCompletion: Number(e.target.value) || 0 },
                    })
                  }
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="xpPoint">XP por Ponto</Label>
                <Input
                  id="xpPoint"
                  type="number"
                  value={formData.xpReward.perPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      xpReward: { ...formData.xpReward, perPoint: Number(e.target.value) || 0 },
                    })
                  }
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goldCompletion">Ouro por Conclusão</Label>
                <Input
                  id="goldCompletion"
                  type="number"
                  value={formData.goldReward.perCompletion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      goldReward: { ...formData.goldReward, perCompletion: Number(e.target.value) || 0 },
                    })
                  }
                  min={0}
                />
              </div>
              <div>
                <Label htmlFor="goldPoint">Ouro por Ponto</Label>
                <Input
                  id="goldPoint"
                  type="number"
                  value={formData.goldReward.perPoint}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      goldReward: { ...formData.goldReward, perPoint: Number(e.target.value) || 0 },
                    })
                  }
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="expiresAt">Data de Expiração</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRepeatable"
                  checked={formData.isRepeatable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isRepeatable: checked })}
                />
                <Label htmlFor="isRepeatable">Repetível</Label>
              </div>
              {formData.isRepeatable && (
                <div>
                  <Label htmlFor="maxCompletions">Máximo de Conclusões</Label>
                  <Input
                    id="maxCompletions"
                    type="number"
                    value={formData.maxCompletions || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxCompletions: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Deixe vazio para infinito"
                    min={1}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
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
                  value={formData.location.zone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, zone: e.target.value },
                    })
                  }
                  placeholder="Ex: Floresta Sombria"
                />
              </div>
              <div>
                <Label htmlFor="coordinates">Coordenadas</Label>
                <Input
                  id="coordinates"
                  value={formData.location.coordinates}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location: { ...formData.location, coordinates: e.target.value },
                    })
                  }
                  placeholder="Ex: 123, 456"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="locationNotes">Notas de Localização</Label>
              <Textarea
                id="locationNotes"
                value={formData.location.notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    location: { ...formData.location, notes: e.target.value },
                  })
                }
                placeholder="Informações adicionais sobre a localização"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Phases */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Fases e Subobjetivos</CardTitle>
              <Button onClick={addPhase} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Fase
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {formData.phases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4" />
                <p>Nenhuma fase adicionada ainda.</p>
                <p className="text-sm">Clique em "Adicionar Fase" para começar.</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {formData.phases.map((phase, phaseIndex) => (
                  <AccordionItem key={phase.id} value={`phase-${phaseIndex}`}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Fase {phaseIndex + 1}</Badge>
                        <span>{phase.name}</span>
                        <Badge variant="secondary">{phase.subObjectives.length} subobjetivos</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Phase Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nome da Fase</Label>
                            <Input
                              value={phase.name}
                              onChange={(e) => updatePhase(phaseIndex, { name: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label>XP da Fase (Conclusão)</Label>
                            <Input
                              type="number"
                              value={phase.xpReward?.perCompletion || 0}
                              onChange={(e) =>
                                updatePhase(phaseIndex, {
                                  xpReward: {
                                    ...phase.xpReward,
                                    perCompletion: Number(e.target.value) || 0,
                                  },
                                })
                              }
                              min={0}
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Descrição da Fase</Label>
                          <Textarea
                            value={phase.description}
                            onChange={(e) => updatePhase(phaseIndex, { description: e.target.value })}
                            rows={2}
                          />
                        </div>

                        {/* Phase Repetition Settings */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={phase.isRepeatable || false}
                              onCheckedChange={(checked) => updatePhase(phaseIndex, { isRepeatable: checked })}
                            />
                            <Label>Fase Repetível</Label>
                          </div>
                          {phase.isRepeatable && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={phase.isInfiniteLoop || false}
                                  onCheckedChange={(checked) => updatePhase(phaseIndex, { isInfiniteLoop: checked })}
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
                                      updatePhase(phaseIndex, {
                                        maxRepetitions: e.target.value ? Number(e.target.value) : undefined,
                                      })
                                    }
                                    min={1}
                                  />
                                </div>
                              )}
                              {phase.isInfiniteLoop && (
                                <div>
                                  <Label>Data Limite (opcional)</Label>
                                  <Input
                                    type="datetime-local"
                                    value={
                                      phase.infiniteDate ? new Date(phase.infiniteDate).toISOString().slice(0, 16) : ""
                                    }
                                    onChange={(e) =>
                                      updatePhase(phaseIndex, {
                                        infiniteDate: e.target.value
                                          ? new Date(e.target.value).toISOString()
                                          : undefined,
                                      })
                                    }
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        <Separator />

                        {/* SubObjectives */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">Subobjetivos</h4>
                            <Button onClick={() => addSubObjective(phaseIndex)} variant="outline" size="sm">
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar Subobjetivo
                            </Button>
                          </div>

                          {phase.subObjectives.map((subObj, subIndex) => (
                            <Card key={subObj.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex justify-between items-start">
                                  <Badge variant="outline">Subobjetivo {subIndex + 1}</Badge>
                                  <Button
                                    onClick={() => removeSubObjective(phaseIndex, subIndex)}
                                    variant="ghost"
                                    size="sm"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <Label>Nome</Label>
                                    <Input
                                      value={subObj.name}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, { name: e.target.value })
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label>Meta</Label>
                                    <Input
                                      type="number"
                                      value={subObj.targetValue}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, {
                                          targetValue: Number(e.target.value) || 1,
                                        })
                                      }
                                      min={1}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label>Descrição</Label>
                                  <Textarea
                                    value={subObj.description}
                                    onChange={(e) =>
                                      updateSubObjective(phaseIndex, subIndex, { description: e.target.value })
                                    }
                                    rows={2}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>XP por Ponto</Label>
                                    <Input
                                      type="number"
                                      value={subObj.xpReward?.perPoint || 0}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, {
                                          xpReward: {
                                            ...subObj.xpReward,
                                            perPoint: Number(e.target.value) || 0,
                                          },
                                        })
                                      }
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <Label>XP por Conclusão</Label>
                                    <Input
                                      type="number"
                                      value={subObj.xpReward?.perCompletion || 0}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, {
                                          xpReward: {
                                            ...subObj.xpReward,
                                            perCompletion: Number(e.target.value) || 0,
                                          },
                                        })
                                      }
                                      min={0}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label>Ouro por Ponto</Label>
                                    <Input
                                      type="number"
                                      value={subObj.goldReward?.perPoint || 0}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, {
                                          goldReward: {
                                            ...subObj.goldReward,
                                            perPoint: Number(e.target.value) || 0,
                                          },
                                        })
                                      }
                                      min={0}
                                    />
                                  </div>
                                  <div>
                                    <Label>Ouro por Conclusão</Label>
                                    <Input
                                      type="number"
                                      value={subObj.goldReward?.perCompletion || 0}
                                      onChange={(e) =>
                                        updateSubObjective(phaseIndex, subIndex, {
                                          goldReward: {
                                            ...subObj.goldReward,
                                            perCompletion: Number(e.target.value) || 0,
                                          },
                                        })
                                      }
                                      min={0}
                                    />
                                  </div>
                                </div>

                                {/* Sistema de Cooldown */}
                                <Card className="p-3 bg-purple-50 border-purple-200">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-purple-600" />
                                    <Label className="font-medium text-purple-800">Sistema de Cooldown</Label>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={subObj.hasCooldown || false}
                                        onCheckedChange={(checked) =>
                                          updateSubObjective(phaseIndex, subIndex, { hasCooldown: checked })
                                        }
                                      />
                                      <Label>Ativar Cooldown por Ponto</Label>
                                    </div>

                                    {subObj.hasCooldown && (
                                      <div className="space-y-3">
                                        <div className="text-sm text-purple-700 bg-purple-100 p-2 rounded">
                                          <strong>Duração Total:</strong>{" "}
                                          {formatCooldownTime(subObj.cooldownDuration || 60)}
                                        </div>

                                        {/* Campos de entrada para tempo */}
                                        <div className="grid grid-cols-3 gap-2">
                                          <div>
                                            <Label className="text-xs">Horas (0-23)</Label>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="23"
                                              value={Math.floor((subObj.cooldownDuration || 60) / 3600)}
                                              onChange={(e) => {
                                                const hours = Number(e.target.value) || 0
                                                const minutes = Math.floor(
                                                  ((subObj.cooldownDuration || 60) % 3600) / 60,
                                                )
                                                const seconds = (subObj.cooldownDuration || 60) % 60
                                                setCooldownFromInputs(phaseIndex, subIndex, hours, minutes, seconds)
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Minutos (0-59)</Label>
                                            <Input
                                              type="number"
                                              min="0"
                                              max="59"
                                              value={Math.floor(((subObj.cooldownDuration || 60) % 3600) / 60)}
                                              onChange={(e) => {
                                                const hours = Math.floor((subObj.cooldownDuration || 60) / 3600)
                                                const minutes = Number(e.target.value) || 0
                                                const seconds = (subObj.cooldownDuration || 60) % 60
                                                setCooldownFromInputs(phaseIndex, subIndex, hours, minutes, seconds)
                                              }}
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">Segundos (1-59)</Label>
                                            <Input
                                              type="number"
                                              min="1"
                                              max="59"
                                              value={(subObj.cooldownDuration || 60) % 60}
                                              onChange={(e) => {
                                                const hours = Math.floor((subObj.cooldownDuration || 60) / 3600)
                                                const minutes = Math.floor(
                                                  ((subObj.cooldownDuration || 60) % 3600) / 60,
                                                )
                                                const seconds = Math.max(1, Number(e.target.value) || 1)
                                                setCooldownFromInputs(phaseIndex, subIndex, hours, minutes, seconds)
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
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 10)}
                                          >
                                            10s
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 60)}
                                          >
                                            1m
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 300)}
                                          >
                                            5m
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 600)}
                                          >
                                            10m
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 3600)}
                                          >
                                            1h
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCooldownPreset(phaseIndex, subIndex, 7200)}
                                          >
                                            2h
                                          </Button>
                                        </div>

                                        <div className="text-xs text-purple-600">
                                          O cooldown será aplicado a cada ponto adicionado ao progresso deste
                                          subobjetivo.
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Card>

                                {/* SubObjective Repetition Settings */}
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={subObj.isRepeatable || false}
                                      onCheckedChange={(checked) =>
                                        updateSubObjective(phaseIndex, subIndex, { isRepeatable: checked })
                                      }
                                    />
                                    <Label>Repetível</Label>
                                  </div>
                                  {subObj.isRepeatable && (
                                    <>
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          checked={subObj.isInfiniteLoop || false}
                                          onCheckedChange={(checked) =>
                                            updateSubObjective(phaseIndex, subIndex, { isInfiniteLoop: checked })
                                          }
                                        />
                                        <Label>Loop Infinito</Label>
                                      </div>
                                      {!subObj.isInfiniteLoop && (
                                        <div>
                                          <Label>Máx. Repetições</Label>
                                          <Input
                                            type="number"
                                            value={subObj.maxRepetitions || ""}
                                            onChange={(e) =>
                                              updateSubObjective(phaseIndex, subIndex, {
                                                maxRepetitions: e.target.value ? Number(e.target.value) : undefined,
                                              })
                                            }
                                            min={1}
                                          />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-end">
                          <Button onClick={() => removePhase(phaseIndex)} variant="destructive" size="sm">
                            <Trash className="mr-2 h-4 w-4" />
                            Remover Fase
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            <Save className="mr-2 h-4 w-4" />
            Salvar Todas as Alterações
          </Button>
        </div>
      </div>
    </div>
  )
}
