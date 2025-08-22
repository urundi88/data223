"use client"

import { useState, useEffect } from "react"
import { usePlayer } from "@/contexts/player-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { playerStats, addXp, setBaseXpPerLevel, setXpIncreasePerLevel } = usePlayer()
  const { toast } = useToast()

  const [baseXp, setBaseXp] = useState(playerStats.baseXpPerLevel)
  const [xpIncrease, setXpIncrease] = useState(playerStats.xpIncreasePerLevel)
  const [manualXp, setManualXp] = useState(0)
  const [savesList, setSavesList] = useState<string[]>([])

  useEffect(() => {
    // Get all save keys from localStorage
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("save_"))
    setSavesList(keys)
  }, [])

  const handleSaveSettings = () => {
    setBaseXpPerLevel(baseXp)
    setXpIncreasePerLevel(xpIncrease)

    toast({
      title: "Settings Saved",
      description: "Your XP settings have been updated.",
    })
  }

  const handleAddXp = () => {
    if (manualXp > 0) {
      addXp(manualXp)
      setManualXp(0)

      toast({
        title: "XP Added",
        description: `${manualXp} XP has been added to your character.`,
      })
    }
  }

  const handleSaveGame = () => {
    const saveName = prompt("Digite um nome para este save:")
    if (!saveName) return

    const saveKey = `save_${Date.now()}_${saveName.replace(/[^a-zA-Z0-9]/g, "_")}`
    const saveData = {
      name: saveName,
      date: new Date().toISOString(),
      playerStats,
      objectives: JSON.parse(localStorage.getItem("objectives") || "[]"),
      missions: JSON.parse(localStorage.getItem("missions") || "[]"),
      guides: JSON.parse(localStorage.getItem("guides") || "[]"),
      inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
      missionCategories: JSON.parse(localStorage.getItem("missionCategories") || "[]"),
      guideCategories: JSON.parse(localStorage.getItem("guideCategories") || "[]"),
    }

    localStorage.setItem(saveKey, JSON.stringify(saveData))
    setSavesList([...savesList, saveKey])

    toast({
      title: "Jogo Salvo",
      description: `Seu jogo foi salvo como "${saveName}".`,
    })
  }

  const handleCloneSave = (saveKey: string) => {
    const saveData = JSON.parse(localStorage.getItem(saveKey) || "{}")
    const newName = prompt("Digite um nome para a cópia:", `${saveData.name} (Cópia)`)

    if (!newName) return

    const newSaveKey = `save_${Date.now()}_${newName.replace(/[^a-zA-Z0-9]/g, "_")}`
    const clonedSaveData = {
      ...saveData,
      name: newName,
      date: new Date().toISOString(),
    }

    localStorage.setItem(newSaveKey, JSON.stringify(clonedSaveData))
    setSavesList([...savesList, newSaveKey])

    toast({
      title: "Save Clonado",
      description: `Save clonado como "${newName}".`,
    })
  }

  const handleExportSave = (saveKey: string) => {
    const saveData = localStorage.getItem(saveKey)
    if (!saveData) return

    const blob = new Blob([saveData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${JSON.parse(saveData).name}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Save Exportado",
      description: "Save exportado com sucesso.",
    })
  }

  const handleImportSave = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const saveData = JSON.parse(e.target?.result as string)
          const saveKey = `save_${Date.now()}_${saveData.name.replace(/[^a-zA-Z0-9]/g, "_")}`

          localStorage.setItem(saveKey, JSON.stringify(saveData))
          setSavesList([...savesList, saveKey])

          toast({
            title: "Save Importado",
            description: `Save "${saveData.name}" importado com sucesso.`,
          })
        } catch (error) {
          toast({
            title: "Erro",
            description: "Arquivo de save inválido.",
            variant: "destructive",
          })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleLoadGame = (saveKey: string) => {
    const saveData = JSON.parse(localStorage.getItem(saveKey) || "{}")

    if (confirm(`Are you sure you want to load "${saveData.name}"? This will overwrite your current progress.`)) {
      // Load all data from save
      localStorage.setItem("playerStats", JSON.stringify(saveData.playerStats))
      localStorage.setItem("objectives", JSON.stringify(saveData.objectives))
      localStorage.setItem("missions", JSON.stringify(saveData.missions))
      localStorage.setItem("guides", JSON.stringify(saveData.guides))
      localStorage.setItem("inventory", JSON.stringify(saveData.inventory))
      localStorage.setItem("missionCategories", JSON.stringify(saveData.missionCategories))
      localStorage.setItem("guideCategories", JSON.stringify(saveData.guideCategories))

      toast({
        title: "Game Loaded",
        description: `Your game has been loaded from "${saveData.name}".`,
      })

      // Reload the page to apply changes
      window.location.reload()
    }
  }

  const handleOverwriteSave = (saveKey: string) => {
    const saveData = JSON.parse(localStorage.getItem(saveKey) || "{}")

    if (confirm(`Are you sure you want to overwrite "${saveData.name}" with your current progress?`)) {
      const updatedSaveData = {
        ...saveData,
        date: new Date().toISOString(),
        playerStats,
        objectives: JSON.parse(localStorage.getItem("objectives") || "[]"),
        missions: JSON.parse(localStorage.getItem("missions") || "[]"),
        guides: JSON.parse(localStorage.getItem("guides") || "[]"),
        inventory: JSON.parse(localStorage.getItem("inventory") || "[]"),
        missionCategories: JSON.parse(localStorage.getItem("missionCategories") || "[]"),
        guideCategories: JSON.parse(localStorage.getItem("guideCategories") || "[]"),
      }

      localStorage.setItem(saveKey, JSON.stringify(updatedSaveData))

      toast({
        title: "Save Overwritten",
        description: `"${saveData.name}" has been updated with your current progress.`,
      })
    }
  }

  const handleDeleteSave = (saveKey: string) => {
    const saveData = JSON.parse(localStorage.getItem(saveKey) || "{}")

    if (confirm(`Are you sure you want to delete "${saveData.name}"? This cannot be undone.`)) {
      localStorage.removeItem(saveKey)
      setSavesList(savesList.filter((key) => key !== saveKey))

      toast({
        title: "Save Deleted",
        description: `"${saveData.name}" has been deleted.`,
      })
    }
  }
// Exemplo dentro do seu page.tsx
async function getObjective(id: string) {
  const response = await fetch(`/api/objectives/${id}`);
  if (!response.ok) return null;
  return response.json();
}

export default async function Page({ params }: { params: { id: string } }) {
  const objective = await getObjective(params.id);

  if (!objective) {
    return <div>Objetivo não encontrado</div>;
  }

  return (
    <div>
      <h1>{objective.title}</h1>
      <p>Percentual: {objective.perCompletion}</p>
    </div>
  );
}
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="player">
        <TabsList className="mb-6">
          <TabsTrigger value="player">Player</TabsTrigger>
          <TabsTrigger value="saves">Saves</TabsTrigger>
        </TabsList>

        <TabsContent value="player">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Stats</CardTitle>
                <CardDescription>View and manage your character stats</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Level {playerStats.level}</span>
                    <span>
                      {playerStats.xp} / {playerStats.nextLevelXp} XP
                    </span>
                  </div>
                  <Progress value={(playerStats.xp / playerStats.nextLevelXp) * 100} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="baseXp">Base XP per Level</Label>
                    <Input
                      id="baseXp"
                      type="number"
                      value={baseXp}
                      onChange={(e) => setBaseXp(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="xpIncrease">XP Increase per Level</Label>
                    <Input
                      id="xpIncrease"
                      type="number"
                      value={xpIncrease}
                      onChange={(e) => setXpIncrease(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add XP</CardTitle>
                <CardDescription>Manually add XP to your character</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="manualXp">XP Amount</Label>
                  <Input
                    id="manualXp"
                    type="number"
                    value={manualXp}
                    onChange={(e) => setManualXp(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddXp}>Add XP</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saves">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Saves</CardTitle>
              <CardDescription>Salve, carregue e gerencie seus estados de jogo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={handleSaveGame}>
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Save
                  </Button>
                  <Button variant="outline" onClick={handleImportSave}>
                    Importar Save
                  </Button>
                </div>

                {savesList.map((saveKey) => {
                  const saveData = JSON.parse(localStorage.getItem(saveKey) || "{}")
                  return (
                    <Card key={saveKey} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{saveData.name}</h4>
                          <p className="text-sm text-muted-foreground">{new Date(saveData.date).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            Nível {saveData.playerStats?.level || 1} •{saveData.objectives?.length || 0} objetivos •
                            {saveData.missions?.length || 0} missões
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" onClick={() => handleLoadGame(saveKey)}>
                            Carregar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleOverwriteSave(saveKey)}>
                            Sobrescrever
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCloneSave(saveKey)}>
                            Clonar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleExportSave(saveKey)}>
                            Exportar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteSave(saveKey)}>
                            Deletar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}

                {savesList.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum save encontrado.</p>
                    <Button variant="outline" className="mt-4" onClick={handleSaveGame}>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Primeiro Save
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <div className="flex justify-between mt-6">
        <Link href="/dashboard">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
