"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMissions, type MissionType, type Reward } from "@/contexts/missions-context"
import { useObjectives } from "@/contexts/objectives-context"
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

export default function CreateMissionPage() {
  const router = useRouter()
  const { addMission, categories, addCategory } = useMissions()
  const { objectives } = useObjectives()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<MissionType>("generic")
  const [category, setCategory] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [xpPerCompletion, setXpPerCompletion] = useState(500)
  const [xpPerPoint, setXpPerPoint] = useState(0)
  const [goldPerCompletion, setGoldPerCompletion] = useState(100)
  const [goldPerPoint, setGoldPerPoint] = useState(0)
  const [isTemporary, setIsTemporary] = useState(false)
  const [expiryDate, setExpiryDate] = useState("")
  const [imageUrl, setImageUrl] = useState("")

  // Location fields
  const [hasLocation, setHasLocation] = useState(false)
  const [zone, setZone] = useState("")
  const [coordinates, setCoordinates] = useState("")
  const [locationNotes, setLocationNotes] = useState("")

  const handleAddReward = () => {
    setRewards([...rewards, { type: "item", name: "", amount: 1 }])
  }

  const handleRemoveReward = (index: number) => {
    setRewards(rewards.filter((_, i) => i !== index))
  }

  const handleRewardChange = (index: number, field: keyof Reward, value: any) => {
    const updatedRewards = [...rewards]
    updatedRewards[index] = { ...updatedRewards[index], [field]: value }
    setRewards(updatedRewards)
  }

  const handleObjectiveToggle = (objectiveId: string) => {
    setSelectedObjectives((prev) =>
      prev.includes(objectiveId) ? prev.filter((id) => id !== objectiveId) : [...prev, objectiveId],
    )
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

    try {
      const missionData = {
        name,
        description,
        type,
        category,
        objectiveIds: selectedObjectives,
        rewards,
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

      addMission(missionData)

      toast({
        title: "Missão Criada",
        description: `${name} foi criada com sucesso.`,
      })

      router.push("/missions")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar missão",
        variant: "destructive",
      })
      console.error(error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/missions">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Criar Nova Missão</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Missão</CardTitle>
          <CardDescription>Preencha os detalhes para sua nova missão</CardDescription>
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
                    placeholder="Nome da missão"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descreva sua missão"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={type} onValueChange={(value) => setType(value as MissionType)}>
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
                  <Label htmlFor="temporary">Missão Temporária</Label>
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
                            checked={selectedObjectives.includes(objective.id)}
                            onCheckedChange={() => handleObjectiveToggle(objective.id)}
                          />
                          <Label htmlFor={objective.id} className="flex-1 cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
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
                  {selectedObjectives.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedObjectives.length} objetivo(s) selecionado(s)
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
                    {rewards.map((reward, index) => (
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

                    {rewards.length === 0 && (
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
              <Button type="submit">Criar Missão</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Link href="/missions">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Missões
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">Ir para Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
