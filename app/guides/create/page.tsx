"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGuides, type GuideStep } from "@/contexts/guides-context"
import { useMissions } from "@/contexts/missions-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Plus, Trash, Target, Zap, Coins, Trophy } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { v4 as uuidv4 } from "uuid"

export default function CreateGuidePage() {
  const router = useRouter()
  const { addGuide, categories, addCategory } = useGuides()
  const { missions } = useMissions()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [xpPerCompletion, setXpPerCompletion] = useState(1000)
  const [xpPerPoint, setXpPerPoint] = useState(0)
  const [goldPerCompletion, setGoldPerCompletion] = useState(200)
  const [goldPerPoint, setGoldPerPoint] = useState(0)
  const [isTemporary, setIsTemporary] = useState(false)
  const [expiryDate, setExpiryDate] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // Location fields
  const [hasLocation, setHasLocation] = useState(false)
  const [zone, setZone] = useState("")
  const [coordinates, setCoordinates] = useState("")
  const [locationNotes, setLocationNotes] = useState("")

  const [steps, setSteps] = useState<GuideStep[]>([
    {
      id: uuidv4(),
      name: "Etapa 1",
      description: "",
      missionIds: [],
      completed: false,
      goldReward: { perCompletion: 50, perPoint: 0 },
      totalGoldEarned: 0,
    },
  ])

  const handleAddStep = () => {
    setSteps([
      ...steps,
      {
        id: uuidv4(),
        name: `Etapa ${steps.length + 1}`,
        description: "",
        missionIds: [],
        completed: false,
        goldReward: { perCompletion: 50, perPoint: 0 },
        totalGoldEarned: 0,
      },
    ])
  }

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const handleStepChange = (index: number, field: keyof GuideStep, value: any) => {
    const updatedSteps = [...steps]
    updatedSteps[index] = { ...updatedSteps[index], [field]: value }
    setSteps(updatedSteps)
  }

  const handleMissionToggle = (stepIndex: number, missionId: string) => {
    const updatedSteps = [...steps]
    const currentMissions = updatedSteps[stepIndex].missionIds
    updatedSteps[stepIndex].missionIds = currentMissions.includes(missionId)
      ? currentMissions.filter((id) => id !== missionId)
      : [...currentMissions, missionId]
    setSteps(updatedSteps)
  }

  const handleAddCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      addCategory(newCategory)
      setCategory(newCategory)
      setNewCategory("")
      toast({
        title: "Categoria Adicionada",
        description: `${newCategory} foi adicionada às categorias.`,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (steps.length === 0) {
      toast({
        title: "Erro",
        description: "Pelo menos uma etapa é obrigatória",
        variant: "destructive",
      })
      return
    }

    try {
      const guideData = {
        name,
        description,
        category,
        steps,
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
        imageUrl: imageUrl || undefined,
        location:
          hasLocation && (zone || coordinates || locationNotes)
            ? {
                zone: zone || undefined,
                coordinates: coordinates || undefined,
                notes: locationNotes || undefined,
              }
            : undefined,
        expiresAt: isTemporary && expiryDate ? new Date(expiryDate).toISOString() : undefined,
      }

      addGuide(guideData)

      toast({
        title: "Guia Criado",
        description: `${name} foi criado com sucesso.`,
      })

      router.push("/guides")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar guia",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/guides">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Criar Novo Guia</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Guia</CardTitle>
          <CardDescription>Preencha os detalhes para seu novo guia</CardDescription>
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
                    placeholder="Nome do guia"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva seu guia"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <div className="flex gap-2">
                    <Select value={category} onValueChange={setCategory}>
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

                <div>
                  <Label htmlFor="imageUrl">URL da Imagem (Opcional)</Label>
                  <Input
                    id="imageUrl"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                {/* Location Section */}
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Switch id="hasLocation" checked={hasLocation} onCheckedChange={setHasLocation} />
                    <Label htmlFor="hasLocation" className="font-semibold text-green-800">
                      Adicionar Informações de Localização
                    </Label>
                  </div>

                  {hasLocation && (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="zone">Zona</Label>
                        <Input
                          id="zone"
                          value={zone}
                          onChange={(e) => setZone(e.target.value)}
                          placeholder="Ex: Stormwind City, Orgrimmar"
                          className="border-green-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="coordinates">Coordenadas</Label>
                        <Input
                          id="coordinates"
                          value={coordinates}
                          onChange={(e) => setCoordinates(e.target.value)}
                          placeholder="Ex: 45.2, 67.8"
                          className="border-green-200"
                        />
                      </div>
                      <div>
                        <Label htmlFor="locationNotes">Notas de Localização</Label>
                        <Textarea
                          id="locationNotes"
                          value={locationNotes}
                          onChange={(e) => setLocationNotes(e.target.value)}
                          placeholder="Informações adicionais sobre a localização"
                          rows={2}
                          className="border-green-200"
                        />
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex items-center space-x-2">
                  <Switch id="temporary" checked={isTemporary} onCheckedChange={setIsTemporary} />
                  <Label htmlFor="temporary">Guia Temporário</Label>
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
                    {steps.map((step, stepIndex) => (
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
                              disabled={steps.length <= 1}
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
                                        <Target className="h-4 w-4" />
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
              <Button type="submit">Criar Guia</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Link href="/guides">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Guias
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Ir para Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
