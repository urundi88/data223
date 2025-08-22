"use client"

import { useState } from "react"
import { useQuickMissions } from "@/contexts/quick-missions-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Plus, Trash2, Edit, CheckCircle, Circle, Target, Flag, ListTodo } from "lucide-react"

export default function QuickMissionsPage() {
  const {
    missions,
    addMission,
    addPhase,
    addObjective,
    toggleObjective,
    deleteMission,
    deletePhase,
    deleteObjective,
    editMission,
    editPhase,
    editObjective,
  } = useQuickMissions()

  const [newMissionName, setNewMissionName] = useState("")
  const [newMissionDescription, setNewMissionDescription] = useState("")
  const [newPhaseName, setNewPhaseName] = useState("")
  const [newPhaseDescription, setNewPhaseDescription] = useState("")
  const [newObjectiveDescription, setNewObjectiveDescription] = useState("")
  const [editingItem, setEditingItem] = useState<{
    type: "mission" | "phase" | "objective"
    missionId: string
    phaseId?: string
    objectiveId?: string
    name?: string
    description: string
  } | null>(null)

  const handleCreateMission = () => {
    if (newMissionName.trim()) {
      addMission(newMissionName.trim(), newMissionDescription.trim())
      setNewMissionName("")
      setNewMissionDescription("")
    }
  }

  const handleCreatePhase = (missionId: string) => {
    if (newPhaseName.trim()) {
      addPhase(missionId, newPhaseName.trim(), newPhaseDescription.trim())
      setNewPhaseName("")
      setNewPhaseDescription("")
    }
  }

  const handleCreateObjective = (missionId: string, phaseId: string) => {
    if (newObjectiveDescription.trim()) {
      addObjective(missionId, phaseId, newObjectiveDescription.trim())
      setNewObjectiveDescription("")
    }
  }

  const handleEdit = () => {
    if (!editingItem) return

    if (editingItem.type === "mission") {
      editMission(editingItem.missionId, editingItem.name || "", editingItem.description)
    } else if (editingItem.type === "phase" && editingItem.phaseId) {
      editPhase(editingItem.missionId, editingItem.phaseId, editingItem.name || "", editingItem.description)
    } else if (editingItem.type === "objective" && editingItem.phaseId && editingItem.objectiveId) {
      editObjective(editingItem.missionId, editingItem.phaseId, editingItem.objectiveId, editingItem.description)
    }

    setEditingItem(null)
  }

  const completedMissions = missions.filter((m) => m.completed).length
  const totalObjectives = missions.reduce(
    (total, mission) => total + mission.phases.reduce((phaseTotal, phase) => phaseTotal + phase.objectives.length, 0),
    0,
  )
  const completedObjectives = missions.reduce(
    (total, mission) =>
      total +
      mission.phases.reduce(
        (phaseTotal, phase) => phaseTotal + phase.objectives.filter((obj) => obj.completed).length,
        0,
      ),
    0,
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Modo Missão</h1>
          <p className="text-muted-foreground">Sistema simples de objetivos com fases</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Missão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Missão</DialogTitle>
              <DialogDescription>Crie uma nova missão com fases e objetivos</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="mission-name">Nome da Missão</Label>
                <Input
                  id="mission-name"
                  value={newMissionName}
                  onChange={(e) => setNewMissionName(e.target.value)}
                  placeholder="Ex: Completar Projeto X"
                />
              </div>
              <div>
                <Label htmlFor="mission-description">Descrição</Label>
                <Textarea
                  id="mission-description"
                  value={newMissionDescription}
                  onChange={(e) => setNewMissionDescription(e.target.value)}
                  placeholder="Descreva o objetivo geral da missão"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateMission} disabled={!newMissionName.trim()}>
                Criar Missão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Flag className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Missões</p>
                <p className="text-2xl font-bold">
                  {completedMissions}/{missions.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Objetivos</p>
                <p className="text-2xl font-bold">
                  {completedObjectives}/{totalObjectives}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ListTodo className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-2xl font-bold">
                  {totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Missões */}
      {missions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma missão criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira missão para começar a organizar seus objetivos
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Missão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Missão</DialogTitle>
                  <DialogDescription>Crie uma nova missão com fases e objetivos</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mission-name-2">Nome da Missão</Label>
                    <Input
                      id="mission-name-2"
                      value={newMissionName}
                      onChange={(e) => setNewMissionName(e.target.value)}
                      placeholder="Ex: Completar Projeto X"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mission-description-2">Descrição</Label>
                    <Textarea
                      id="mission-description-2"
                      value={newMissionDescription}
                      onChange={(e) => setNewMissionDescription(e.target.value)}
                      placeholder="Descreva o objetivo geral da missão"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateMission} disabled={!newMissionName.trim()}>
                    Criar Missão
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => (
            <Card key={mission.id} className={mission.completed ? "border-green-500 bg-green-50" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="flex items-center gap-2">
                        {mission.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                        {mission.name}
                      </CardTitle>
                      {mission.completed && <Badge variant="success">Completa</Badge>}
                    </div>
                    {mission.description && <CardDescription className="mt-1">{mission.description}</CardDescription>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditingItem({
                          type: "mission",
                          missionId: mission.id,
                          name: mission.name,
                          description: mission.description,
                        })
                      }
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMission(mission.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {mission.phases.map((phase) => (
                    <AccordionItem key={phase.id} value={phase.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          {phase.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{phase.name}</span>
                          {phase.completed && (
                            <Badge variant="success" className="ml-2">
                              Completa
                            </Badge>
                          )}
                          <Badge variant="outline" className="ml-2">
                            {phase.objectives.filter((obj) => obj.completed).length}/{phase.objectives.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {phase.description && <p className="text-sm text-muted-foreground">{phase.description}</p>}

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditingItem({
                                  type: "phase",
                                  missionId: mission.id,
                                  phaseId: phase.id,
                                  name: phase.name,
                                  description: phase.description,
                                })
                              }
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar Fase
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deletePhase(mission.id, phase.id)}>
                              <Trash2 className="h-4 w-4 mr-1" />
                              Deletar Fase
                            </Button>
                          </div>

                          {/* Objetivos */}
                          <div className="space-y-2">
                            {phase.objectives.map((objective) => (
                              <div key={objective.id} className="flex items-center gap-3 p-2 border rounded">
                                <Checkbox
                                  checked={objective.completed}
                                  onCheckedChange={() => toggleObjective(mission.id, phase.id, objective.id)}
                                />
                                <span
                                  className={`flex-1 ${objective.completed ? "line-through text-muted-foreground" : ""}`}
                                >
                                  {objective.description}
                                </span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setEditingItem({
                                        type: "objective",
                                        missionId: mission.id,
                                        phaseId: phase.id,
                                        objectiveId: objective.id,
                                        description: objective.description,
                                      })
                                    }
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteObjective(mission.id, phase.id, objective.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Adicionar Objetivo */}
                            <div className="flex gap-2">
                              <Input
                                placeholder="Descrição do objetivo..."
                                value={newObjectiveDescription}
                                onChange={(e) => setNewObjectiveDescription(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleCreateObjective(mission.id, phase.id)
                                  }
                                }}
                              />
                              <Button
                                onClick={() => handleCreateObjective(mission.id, phase.id)}
                                disabled={!newObjectiveDescription.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Adicionar Fase */}
                <div className="mt-4 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Fase
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Adicionar Nova Fase</DialogTitle>
                        <DialogDescription>Adicione uma nova fase à missão "{mission.name}"</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="phase-name">Nome da Fase</Label>
                          <Input
                            id="phase-name"
                            value={newPhaseName}
                            onChange={(e) => setNewPhaseName(e.target.value)}
                            placeholder="Ex: Preparação, Execução, Finalização"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phase-description">Descrição</Label>
                          <Textarea
                            id="phase-description"
                            value={newPhaseDescription}
                            onChange={(e) => setNewPhaseDescription(e.target.value)}
                            placeholder="Descreva esta fase da missão"
                            rows={2}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={() => handleCreatePhase(mission.id)} disabled={!newPhaseName.trim()}>
                          Adicionar Fase
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Editar {editingItem?.type === "mission" ? "Missão" : editingItem?.type === "phase" ? "Fase" : "Objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingItem?.type !== "objective" && (
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={editingItem?.name || ""}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                />
              </div>
            )}
            <div>
              <Label htmlFor="edit-description">{editingItem?.type === "objective" ? "Descrição" : "Descrição"}</Label>
              {editingItem?.type === "objective" ? (
                <Input
                  id="edit-description"
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                />
              ) : (
                <Textarea
                  id="edit-description"
                  value={editingItem?.description || ""}
                  onChange={(e) => setEditingItem((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                  rows={3}
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
