"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMissions, type Mission, type Reward } from "@/contexts/missions-context"
import { useObjectives } from "@/contexts/objectives-context"
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

interface PageProps {
  params: {
    id: string
  }
}

export default function EditMissionPage({ params }: PageProps) {
  const { missions, updateMission, categories, addCategory } = useMissions()
  const { objectives } = useObjectives()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mission, setMission] = useState<Mission | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "generic" as any,
    category: "",
    selectedObjectives: [] as string[],
    rewards: [] as Reward[],
    xpPerCompletion: 500,
    xpPerPoint: 0,
    goldPerCompletion: 100,
    goldPerPoint: 0,
    isTemporary: false,
    expiryDate: "",
    imageUrl: "",
    hasLocation: false,
    zone: "",
    coordinates: "",
    locationNotes: "",
  })
  const [newCategory, setNewCategory] = useState("")

  useEffect(() => {
    const missionData = missions.find((m) => m.id === params.id)
    if (missionData) {
      setMission(missionData)
      setFormData({
        name: missionData.name,
        description: missionData.description,
        type: missionData.type,
        category: missionData.category,
        selectedObjectives: missionData.objectiveIds,
        rewards: missionData.rewards || [],
        xpPerCompletion: missionData.xpReward?.perCompletion || 500,
        xpPerPoint: missionData.xpReward?.perPoint || 0,
        goldPerCompletion: missionData.goldReward?.perCompletion || 100,
        goldPerPoint: missionData.goldReward?.perPoint || 0,
        isTemporary: !!missionData.expiresAt,
        expiryDate: missionData.expiresAt ? new Date(missionData.expiresAt).toISOString().slice(0, 16) : "",
        imageUrl: missionData.imageUrl || "",
        hasLocation: !!missionData.location,
        zone: missionData.location?.zone || "",
        coordinates: missionData.location?.coordinates || "",
        locationNotes: missionData.location?.notes || "",
      })
    }
    setLoading(false)
  }, [params.id, missions])

  const handleSave = () => {
    if (!mission) return

    if (!formData.name || !formData.category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const updates: Partial<Mission> = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        objectiveIds: formData.selectedObjectives,
        rewards: formData.rewards,
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

      updateMission(mission.id, updates)

      toast({
        title: "Missão Atualizada",
        description: "Todas as alterações foram salvas com sucesso.",
      })

      router.push(`/missions/${mission.id}`)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar missão",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  const handleAddReward = () => {
    setFormData({
      ...formData,
      rewards: [...formData.rewards, { type: "item", name: "", amount: 1 }],
    })
  }

  const handleRemoveReward = (index: number) => {
    setFormData({
      ...formData,
      rewards: formData.rewards.filter((_, i) => i !== index),
    })
  }

  const handleRewardChange = (index: number, field: keyof Reward, value: any) => {
    const updatedRewards = [...formData.rewards]
    updatedRewards[index] = { ...updatedRewards[index], [field]: value }
    setFormData({ ...formData, rewards: updatedRewards })
  }

  const handleObjectiveToggle = (objectiveId: string) => {
    setFormData({
      ...formData,
      selectedObjectives: formData.selectedObjectives.includes(objectiveId)
        ? formData.selectedObjectives.filter((id) => id !== objectiveId)
        : [...formData.selectedObjectives, objectiveId],
    })
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
          <p>Carregando missão...</p>
        </div>
      </div>
    )
  }

  if (!mission) {
    return (
      <div className="p-4 text-center">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Missão não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">A missão que você está tentando editar não foi encontrada.</p>
            <Link href="/missions">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar para Missões
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
          <Link href="/missions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Missões
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Editar Missão</h1>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Missão</CardTitle>
          <CardDescription>Edite os detalhes da sua missão</CardDescription>
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
                    placeholder="Nome da missão"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva sua missão"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kill">Kill</SelectItem>
                      <SelectItem value="dungeon">Dungeon</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="collection">Collection</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="generic">Generic</SelectItem>
                    </SelectContent>
                  </Select>
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

                {/* Recompensas da Missão */}
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-5 w-5 text-blue-600" />
                    <Label className="font-semibold text-blue-800">Recompensas da Missão</Label>
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
                  <Label htmlFor="temporary">Missão Temporária</Label>
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
                {/* Objectives Selection */}
                <div>
                  <Label className="text-base font-medium">Objetivos Associados</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-3 space-y-2">
                    {objectives.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhum objetivo disponível</p>
                    ) : (
                      objectives.map((objective) => (
                        <div key={objective.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={objective.id}
                            checked={formData.selectedObjectives.includes(objective.id)}
                            onCheckedChange={() => handleObjectiveToggle(objective.id)}
                          />
                          <Label htmlFor={objective.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <span>{objective.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {objective.type}
                              </Badge>
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.selectedObjectives.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {formData.selectedObjectives.length} objetivo(s) selecionado(s)
                    </p>
                  )}
                </div>

                {/* Rewards Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-base font-medium">Recompensas Adicionais</Label>
                    <Button type="button" onClick={handleAddReward} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formData.rewards.map((reward, index) => (
                      <Card key={index} className="p-3 border-orange-200 bg-orange-50">
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label>Tipo</Label>
                            <Select
                              value={reward.type}
                              onValueChange={(value) => handleRewardChange(index, "type", value)}
                            >
                              <SelectTrigger className="border-orange-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="item">Item</SelectItem>
                                <SelectItem value="currency">Moeda</SelectItem>
                                <SelectItem value="resource">Recurso</SelectItem>
                                <SelectItem value="xp">XP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1">
                            <Label>Nome</Label>
                            <Input
                              value={reward.name}
                              onChange={(e) => handleRewardChange(index, "name", e.target.value)}
                              placeholder="Nome da recompensa"
                              className="border-orange-200"
                            />
                          </div>
                          <div className="w-24">
                            <Label>Quantidade</Label>
                            <Input
                              type="number"
                              value={reward.amount}
                              onChange={(e) => handleRewardChange(index, "amount", Number(e.target.value))}
                              min={1}
                              className="border-orange-200"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => handleRemoveReward(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}

                    {formData.rewards.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <Trophy className="mx-auto h-12 w-12 mb-4" />
                        <p>Nenhuma recompensa adicional configurada.</p>
                        <p className="text-sm">Clique em "Adicionar" para incluir recompensas.</p>
                      </div>
                    )}
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
