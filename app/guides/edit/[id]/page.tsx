"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useGuides, type Guide, type GuideStep } from "@/contexts/guides-context"
import { useMissions } from "@/contexts/missions-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash, Save, Home, Trophy, Zap, Coins } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { v4 as uuidv4 } from "uuid"

interface PageProps {
  params: {
    id: string
  }
}

export default function EditGuidePage({ params }: PageProps) {
  const { guides, updateGuide, categories, addCategory } = useGuides()
  const { missions } = useMissions()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [guide, setGuide] = useState<Guide | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    xpPerCompletion: 1000,
    xpPerPoint: 0,
    goldPerCompletion: 200,
    goldPerPoint: 0,
    isTemporary: false,
    expiryDate: "",
    imageUrl: "",
    hasLocation: false,
    zone: "",
    coordinates: "",
    locationNotes: "",
    steps: [] as GuideStep[],
  })
  const [newCategory, setNewCategory] = useState("")

  useEffect(() => {
    const guideData = guides.find((g) => g.id === params.id)
    if (guideData) {
      setGuide(guideData)
      setFormData({
        name: guideData.name,
        description: guideData.description,
        category: guideData.category,
        xpPerCompletion: guideData.xpReward?.perCompletion || 1000,
        xpPerPoint: guideData.xpReward?.perPoint || 0,
        goldPerCompletion: guideData.goldReward?.perCompletion || 200,
        goldPerPoint: guideData.goldReward?.perPoint || 0,
        isTemporary: !!guideData.expiresAt,
        expiryDate: guideData.expiresAt ? new Date(guideData.expiresAt).toISOString().slice(0, 16) : "",
        imageUrl: guideData.imageUrl || "",
        hasLocation: !!guideData.location,
        zone: guideData.location?.zone || "",
        coordinates: guideData.location?.coordinates || "",
        locationNotes: guideData.location?.notes || "",
        steps: guideData.steps || [],
      })
    }
    setLoading(false)
  }, [params.id, guides])

  const handleSave = () => {
    if (!guide) return

    if (!formData.name || !formData.category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (formData.steps.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos uma etapa é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      const updates: Partial<Guide> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        steps: formData.steps,
        xpReward: {
          perCompletion: Number(formData.xpPerCompletion),
          perPoint: Number(formData.xpPerPoint),
        },
        goldReward: {
          perCompletion: Number(formData.goldPerCompletion),
          perPoint: Number(formData.goldPerPoint),
        },
        imageUrl: formData.imageUrl || undefined,
        location:
          formData.hasLocation && (formData.zone || formData.coordinates || formData.locationNotes)
            ? {
                zone: formData.zone || undefined,
                coordinates: formData.coordinates || undefined,
                notes: formData.locationNotes || undefined,
              }
            : undefined,
        expiresAt:
          formData.isTemporary && formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
      }

      updateGuide(guide.id, updates)

      toast({
        title: "Guia Atualizado",
        description: "Todas as alterações foram salvas com sucesso.",
      })

      router.push(`/guides/${guide.id}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar guia",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          id: uuidv4(),
          name: `Etapa ${formData.steps.length + 1}`,
          description: "",
          missionIds: [],
          completed: false,
          goldReward: { perCompletion: 50, perPoint: 0 },
          totalGoldEarned: 0,
        },
      ],
    })
  }

  const handleRemoveStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    })
  }

  const handleStepChange = (index: number, field: keyof GuideStep, value: any) => {
    const updatedSteps = [...formData.steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setFormData({ ...formData, steps: updatedSteps })
  }

  const handleMissionToggle = (stepIndex: number, missionId: string) => {
    const updatedSteps = [...formData.steps]
    const currentMissions = updatedSteps[stepIndex].missionIds
    updatedSteps[stepIndex].missionIds = currentMissions.includes(missionId)
      ? currentMissions.filter((id) => id !== missionId)
      : [...currentMissions, missionId]
    setFormData({ ...formData, steps: updatedSteps })
  }

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      addCategory(newCategory)
      setFormData({ ...formData, category: newCategory })
      setNewCategory("")
      toast({
        title: "Categoria Adicionada",
        description: `${newCategory} foi adicionada às categorias.`,
      })
    }
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Carregando guia...</p>
        </div>
      </div>
    )
  }

  if (!guide) {
    return (
      <div className="p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Guia não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">O guia que você está tentando editar não foi encontrado.</p>
            <Link href="/guides">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para Guias
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <Link href="/guides">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Guias
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Editar Guia</h1>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Guia</CardTitle>
          <CardDescription>Edite os detalhes do seu guia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do guia"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva seu guia"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nova categoria"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAddCategory} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Recompensas do Guia */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <Label className="font-semibold text-blue-800">Recompensas do Guia</Label>
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
                        value={formData.xpPerCompletion}
                        onChange={(e) => setFormData({ ...formData, xpPerCompletion: Number(e.target.value) })}
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
                        value={formData.xpPerPoint}
                        onChange={(e) => setFormData({ ...formData, xpPerPoint: Number(e.target.value) })}
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
                        value={formData.goldPerCompletion}
                        onChange={(e) => setFormData({ ...formData, goldPerCompletion: Number(e.target.value) })}
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
                        value={formData.goldPerPoint}
                        onChange={(e) => setFormData({ ...formData, goldPerPoint: Number(e.target.value) })}
                        min={0}
                        className="border-blue-200"
                      />
                    </div>
                  </div>
                </Card>

                <div>
                  <Label htmlFor="imageUrl">URL da Imagem (Opcional)</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                {/* Location Section */}
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch
                      id="hasLocation"
                      checked={formData.hasLocation}
                      onCheckedChange={(checked) => setFormData({ ...formData, hasLocation: checked })}
                    />
                    <Label htmlFor="hasLocation" className="font-semibold text-green-800">
                      Adicionar Informações de Localização
                    </Label>
                  </div>

                  {formData.hasLocation && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="zone">Zona</Label>
                        <Input
                          id="zone"
                          value={formData.zone}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          placeholder="Ex: Stormwind City, Orgrimmar"
                          className="border-green-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="coordinates">Coordenadas</Label>
                        <Input
                          id="coordinates"
                          value={formData.coordinates}
                          onChange={(e) => setFormData({ ...formData, coordinates: e.target.value })}
                          placeholder="Ex: 45.2, 67.8"
                          className="border-green-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="locationNotes">Notas de Localização</Label>
                        <Textarea
                          id="locationNotes"
                          value={formData.locationNotes}
                          onChange={(e) => setFormData({ ...formData, locationNotes: e.target.value })}
                          placeholder="Informações adicionais sobre a localização"
                          rows={2}
                          className="border-green-200"
                        />
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="temporary"
                    checked={formData.isTemporary}
                    onCheckedChange={(checked) => setFormData({ ...formData, isTemporary: checked })}
                  />
                  <Label htmlFor="temporary">Guia Temporário</Label>
                </div>

                {formData.isTemporary && (
                  <div>
                    <Label htmlFor="expiryDate">Data de Expiração</Label>
                    <Input
                      id="expiryDate"
                      type="datetime-local"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      required={formData.isTemporary}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Steps Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base font-medium">Etapas do Guia</Label>
                    <Button type="button" onClick={handleAddStep} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Etapa
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {formData.steps.map((step, stepIndex) => (
                      <Card key={step.id} className="p-4 border-purple-200 bg-purple-50">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Input
                              value={step.name}
                              onChange={(e) => handleStepChange(stepIndex, "name", e.target.value)}
                              placeholder="Nome da etapa"
                              className="font-medium border-purple-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveStep(stepIndex)}
                              disabled={formData.steps.length <= 1}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>

                          <Textarea
                            value={step.description}
                            onChange={(e) => handleStepChange(stepIndex, "description", e.target.value)}
                            placeholder="Descrição da etapa"
                            rows={2}
                            className="border-purple-200"
                          />

                          {/* Step Rewards */}
                          <Card className="p-3 bg-purple-100 border-purple-300">
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="h-4 w-4 text-purple-600" />
                              <Label className="font-medium text-purple-800">Recompensas da Etapa</Label>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  Ouro/Conclusão
                                </Label>
                                <Input
                                  type="number"
                                  value={step.goldReward?.perCompletion || 0}
                                  onChange={(e) =>
                                    handleStepChange(stepIndex, "goldReward", {
                                      ...step.goldReward,
                                      perCompletion: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-purple-300"
                                />
                              </div>
                              <div>
                                <Label className="flex items-center gap-1 text-xs">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  Ouro/Ponto
                                </Label>
                                <Input
                                  type="number"
                                  value={step.goldReward?.perPoint || 0}
                                  onChange={(e) =>
                                    handleStepChange(stepIndex, "goldReward", {
                                      ...step.goldReward,
                                      perPoint: Number(e.target.value),
                                    })
                                  }
                                  min={0}
                                  className="border-purple-300"
                                />
                              </div>
                            </div>
                          </Card>

                          {/* Missions Selection */}
                          <div>
                            <Label className="text-sm font-medium">Missões da Etapa</Label>
                            <div className="mt-2 max-h-40 overflow-y-auto border rounded-md p-3 space-y-2 bg-white">
                              {missions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhuma missão disponível</p>
                              ) : (
                                missions.map((mission) => (
                                  <div key={mission.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${stepIndex}-${mission.id}`}
                                      checked={step.missionIds.includes(mission.id)}
                                      onCheckedChange={() => handleMissionToggle(stepIndex, mission.id)}
                                    />
                                    <Label htmlFor={`${stepIndex}-${mission.id}`} className="flex-1 cursor-pointer">
                                      <div className="flex items-center gap-2">
                                        <span>{mission.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {mission.category}
                                        </Badge>
                                      </div>
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                            {step.missionIds.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {step.missionIds.length} missão(ões) selecionada(s)
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} size="lg">
                <Save className="mr-2 h-4 w-4" />
                Salvar Todas as Alterações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
