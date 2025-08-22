"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Target, CheckCircle, Trophy, Copy, Trash, Clock, Coins } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

interface Objective {
  id: string
  name: string
  description: string
  xpReward: number
  goldReward: {
    perCompletion: number
    perPoint: number
  }
  totalGoldEarned: number
  completed: boolean
  assignedProfile: string | null
  phases?: {
    id: string
    name: string
    totalGoldEarned: number
    subObjectives: {
      id: string
      name: string
      totalGoldEarned: number
    }[]
  }[]
}

interface SessionProfile {
  id: string
  name: string
  description: string
  expiresAt: Date | null
}

const defaultObjectives: Objective[] = [
  {
    id: "1",
    name: "Complete Tutorial",
    description: "Finish the introductory tutorial.",
    xpReward: 50,
    goldReward: {
      perCompletion: 10,
      perPoint: 0,
    },
    totalGoldEarned: 10,
    completed: true,
    assignedProfile: "1",
    phases: [
      {
        id: "phase1",
        name: "Phase 1",
        totalGoldEarned: 5,
        subObjectives: [
          {
            id: "sub1",
            name: "Sub Objective 1",
            totalGoldEarned: 2,
          },
          {
            id: "sub2",
            name: "Sub Objective 2",
            totalGoldEarned: 3,
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Win a Match",
    description: "Achieve victory in a competitive match.",
    xpReward: 100,
    goldReward: {
      perCompletion: 20,
      perPoint: 0,
    },
    totalGoldEarned: 20,
    completed: false,
    assignedProfile: "1",
    phases: [
      {
        id: "phase2",
        name: "Phase 2",
        totalGoldEarned: 10,
        subObjectives: [
          {
            id: "sub3",
            name: "Sub Objective 3",
            totalGoldEarned: 4,
          },
          {
            id: "sub4",
            name: "Sub Objective 4",
            totalGoldEarned: 6,
          },
        ],
      },
    ],
  },
  {
    id: "3",
    name: "Daily Login",
    description: "Log in to the game each day.",
    xpReward: 25,
    goldReward: {
      perCompletion: 5,
      perPoint: 0,
    },
    totalGoldEarned: 5,
    completed: true,
    assignedProfile: "2",
    phases: [
      {
        id: "phase3",
        name: "Phase 3",
        totalGoldEarned: 2,
        subObjectives: [
          {
            id: "sub5",
            name: "Sub Objective 5",
            totalGoldEarned: 1,
          },
          {
            id: "sub6",
            name: "Sub Objective 6",
            totalGoldEarned: 1,
          },
        ],
      },
    ],
  },
  {
    id: "4",
    name: "Reach Level 10",
    description: "Advance your player level to 10.",
    xpReward: 150,
    goldReward: {
      perCompletion: 30,
      perPoint: 0,
    },
    totalGoldEarned: 30,
    completed: false,
    assignedProfile: "2",
    phases: [
      {
        id: "phase4",
        name: "Phase 4",
        totalGoldEarned: 15,
        subObjectives: [
          {
            id: "sub7",
            name: "Sub Objective 7",
            totalGoldEarned: 7,
          },
          {
            id: "sub8",
            name: "Sub Objective 8",
            totalGoldEarned: 8,
          },
        ],
      },
    ],
  },
  {
    id: "5",
    name: "Complete a Quest",
    description: "Finish any quest in the game world.",
    xpReward: 75,
    goldReward: {
      perCompletion: 15,
      perPoint: 0,
    },
    totalGoldEarned: 15,
    completed: true,
    assignedProfile: "1",
    phases: [
      {
        id: "phase5",
        name: "Phase 5",
        totalGoldEarned: 7,
        subObjectives: [
          {
            id: "sub9",
            name: "Sub Objective 9",
            totalGoldEarned: 3,
          },
          {
            id: "sub10",
            name: "Sub Objective 10",
            totalGoldEarned: 4,
          },
        ],
      },
    ],
  },
]

const defaultProfiles: SessionProfile[] = [
  {
    id: "1",
    name: "Iniciante",
    description: "Perfil para novos jogadores.",
    expiresAt: new Date(new Date().setDate(new Date().getDate() + 7)),
  },
  {
    id: "2",
    name: "Veterano",
    description: "Perfil para jogadores experientes.",
    expiresAt: null,
  },
]

export default function SessionProfilesPage() {
  const [profiles, setProfiles] = useState<SessionProfile[]>(defaultProfiles)
  const [objectives, setObjectives] = useState<Objective[]>(defaultObjectives)
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDescription, setNewProfileDescription] = useState("")
  const [activeProfile, setActiveProfile] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreateProfile = () => {
    if (newProfileName.trim() === "") {
      toast({
        title: "Erro",
        description: "O nome do perfil não pode estar vazio.",
        variant: "destructive",
      })
      return
    }

    const newProfile: SessionProfile = {
      id: uuidv4(),
      name: newProfileName,
      description: newProfileDescription,
      expiresAt: null,
    }

    setProfiles([...profiles, newProfile])
    setNewProfileName("")
    setNewProfileDescription("")

    toast({
      title: "Sucesso",
      description: "Perfil criado com sucesso.",
    })
  }

  const handleDeleteProfile = (id: string) => {
    setProfiles(profiles.filter((profile) => profile.id !== id))
    setObjectives(
      objectives.map((objective) =>
        objective.assignedProfile === id ? { ...objective, assignedProfile: null } : objective,
      ),
    )

    toast({
      title: "Sucesso",
      description: "Perfil deletado com sucesso.",
    })
  }

  const handleDuplicateProfile = (id: string) => {
    const profileToDuplicate = profiles.find((profile) => profile.id === id)

    if (!profileToDuplicate) {
      toast({
        title: "Erro",
        description: "Perfil não encontrado.",
        variant: "destructive",
      })
      return
    }

    const duplicatedProfile: SessionProfile = {
      id: uuidv4(),
      name: `${profileToDuplicate.name} (Cópia)`,
      description: profileToDuplicate.description,
      expiresAt: profileToDuplicate.expiresAt,
    }

    setProfiles([...profiles, duplicatedProfile])

    toast({
      title: "Sucesso",
      description: "Perfil duplicado com sucesso.",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Nome do perfil"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição do perfil"
                  value={newProfileDescription}
                  onChange={(e) => setNewProfileDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateProfile}>Criar Perfil</Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Perfis de Sessão</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {profiles.map((profile) => {
                const profileObjectives = objectives.filter((obj) => obj.assignedProfile === profile.id)
                const completedObjectives = profileObjectives.filter((obj) => obj.completed).length
                const totalXP = profileObjectives.reduce((sum, obj) => sum + obj.xpReward, 0)
                const totalGold = profileObjectives.reduce((sum, obj) => {
                  const objectiveGold = obj.totalGoldEarned
                  const phaseGold = obj.phases?.reduce((phaseSum, phase) => phaseSum + phase.totalGoldEarned, 0) || 0
                  const subObjectiveGold =
                    obj.phases?.reduce(
                      (phaseSum, phase) =>
                        phaseSum + phase.subObjectives.reduce((subSum, sub) => subSum + sub.totalGoldEarned, 0),
                      0,
                    ) || 0
                  return sum + objectiveGold + phaseGold + subObjectiveGold
                }, 0)

                return (
                  <Card key={profile.id}>
                    <CardHeader>
                      <CardTitle>{profile.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{profile.description}</p>

                        {profile.expiresAt && (
                          <div className="flex items-center mt-2 text-amber-500">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="text-sm">Expira: {new Date(profile.expiresAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2 text-blue-500" />
                          <div>
                            <div className="text-muted-foreground">Objetivos</div>
                            <div className="font-medium">{profileObjectives.length}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <div>
                            <div className="text-muted-foreground">Completos</div>
                            <div className="font-medium">{completedObjectives}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Trophy className="h-4 w-4 mr-2 text-purple-500" />
                          <div>
                            <div className="text-muted-foreground">XP Total</div>
                            <div className="font-medium">{totalXP}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Coins className="h-4 w-4 mr-2 text-yellow-500" />
                          <div>
                            <div className="text-muted-foreground">Ouro Total</div>
                            <div className="font-medium text-yellow-600">{totalGold}</div>
                          </div>
                        </div>
                      </div>

                      {profileObjectives.length > 0 && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Coins className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-700">Detalhes de Ouro</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <div className="text-yellow-600">Ouro por Conclusão:</div>
                              <div className="font-bold text-yellow-700">
                                {profileObjectives.reduce((sum, obj) => sum + obj.goldReward.perCompletion, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-yellow-600">Ouro por Ponto:</div>
                              <div className="font-bold text-yellow-700">
                                {profileObjectives.reduce((sum, obj) => sum + obj.goldReward.perPoint, 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-yellow-600">Ouro de Fases:</div>
                              <div className="font-bold text-yellow-700">
                                {profileObjectives.reduce(
                                  (sum, obj) =>
                                    sum +
                                    (obj.phases?.reduce((phaseSum, phase) => phaseSum + phase.totalGoldEarned, 0) || 0),
                                  0,
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="text-yellow-600">Ouro de Subobjetivos:</div>
                              <div className="font-bold text-yellow-700">
                                {profileObjectives.reduce(
                                  (sum, obj) =>
                                    sum +
                                    (obj.phases?.reduce(
                                      (phaseSum, phase) =>
                                        phaseSum +
                                        phase.subObjectives.reduce((subSum, sub) => subSum + sub.totalGoldEarned, 0),
                                      0,
                                    ) || 0),
                                  0,
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          variant={profile.id === activeProfile?.id ? "default" : "outline"}
                          onClick={() => setActiveProfile(profile.id)}
                        >
                          {profile.id === activeProfile?.id ? "Ativo" : "Ativar"}
                        </Button>
                        <Button variant="outline" onClick={() => handleDuplicateProfile(profile.id)}>
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicar
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteProfile(profile.id)}>
                          <Trash className="h-4 w-4 mr-1" />
                          Deletar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
