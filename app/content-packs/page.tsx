"use client"

import { useState } from "react"
import { useSessionProfiles } from "@/contexts/session-profiles-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Play,
  Home,
  Package,
  Settings,
  Copy,
  Target,
  BookOpen,
  Flag,
  Coins,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// Cores predefinidas para os profiles
const PROFILE_COLORS = [
  { name: "Azul", value: "#3b82f6" },
  { name: "Verde", value: "#10b981" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Amarelo", value: "#f59e0b" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
]

export default function ContentPacksPage() {
  const { profiles, activeProfile, createProfile, deleteProfile, setActiveProfile, getProfileStats, updateProfile } =
    useSessionProfiles()
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deleteProfileId, setDeleteProfileId] = useState<string | null>(null)
  const [newProfileName, setNewProfileName] = useState("")
  const [newProfileDescription, setNewProfileDescription] = useState("")
  const [newProfileColor, setNewProfileColor] = useState("#3b82f6")
  const [searchTerm, setSearchTerm] = useState("")

  const handleCreateSubProfile = () => {
    if (!newProfileName.trim()) {
      toast({
        title: "Erro",
        description: "Nome do sub-profile é obrigatório.",
        variant: "destructive",
      })
      return
    }

    try {
      const profileId = createProfile(newProfileName.trim(), newProfileDescription.trim(), newProfileColor)
      setNewProfileName("")
      setNewProfileDescription("")
      setNewProfileColor("#3b82f6")
      setIsCreateDialogOpen(false)

      toast({
        title: "Sub-Profile Criado",
        description: `Sub-profile "${newProfileName}" foi criado com sucesso.`,
      })
    } catch (error) {
      console.error("Error creating profile:", error)
      toast({
        title: "Erro",
        description: "Falha ao criar sub-profile. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSubProfile = () => {
    if (!deleteProfileId) return

    const profile = profiles.find((p) => p.id === deleteProfileId)
    deleteProfile(deleteProfileId)
    setDeleteProfileId(null)

    toast({
      title: "Sub-Profile Deletado",
      description: `Sub-profile "${profile?.name}" foi deletado com sucesso.`,
    })
  }

  const handleLoadSubProfile = (profile: any) => {
    try {
      console.log("Attempting to activate profile:", profile.name)
      setActiveProfile(profile)

      toast({
        title: "Sub-Profile Ativado",
        description: `Sub-profile "${profile.name}" foi ativado com sucesso.`,
      })

      // Force a small delay to ensure state is updated
      setTimeout(() => {
        console.log("Profile activation completed")
      }, 100)
    } catch (error) {
      console.error("Error activating profile:", error)
      toast({
        title: "Erro",
        description: "Falha ao ativar sub-profile. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateProfile = (profile: any) => {
    try {
      const duplicatedId = createProfile(`${profile.name} (Cópia)`, profile.description, profile.color)

      toast({
        title: "Sub-Profile Duplicado",
        description: `Sub-profile duplicado como "${profile.name} (Cópia)".`,
      })
    } catch (error) {
      console.error("Error duplicating profile:", error)
      toast({
        title: "Erro",
        description: "Falha ao duplicar sub-profile.",
        variant: "destructive",
      })
    }
  }

  // Filtrar profiles por busca
  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.description && profile.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-8 w-8" />
              Content Packs & Sub-Profiles
            </h1>
            <p className="text-muted-foreground">Gerencie seus sub-profiles de sessão com conteúdo específico</p>
          </div>
        </div>
        <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Sub-Profile
        </Button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
          <div>Total Profiles: {profiles.length}</div>
          <div>Active Profile: {activeProfile?.name || "None"}</div>
          <div>Active Profile ID: {activeProfile?.id || "None"}</div>
        </div>
      )}

      {/* Busca */}
      <div className="mb-6">
        <Input
          placeholder="Buscar sub-profiles por nome ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Sub-Profile Ativo */}
      {activeProfile && (
        <Card
          className="mb-6 border-2 bg-gradient-to-r from-indigo-50 to-purple-50"
          style={{
            borderColor: activeProfile.color || "#6366f1",
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: activeProfile.color || "#6366f1" }} />
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    {activeProfile.name}
                    <Badge variant="default" style={{ backgroundColor: activeProfile.color || "#6366f1" }}>
                      Sub-Profile Ativo
                    </Badge>
                  </CardTitle>
                  <CardDescription>{activeProfile.description || "Sem descrição"}</CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Configurar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setActiveProfile(null)}>
                  Desativar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-muted-foreground">Objetivos</div>
                  <div className="font-medium">{getProfileStats(activeProfile.id).totalObjectives}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-muted-foreground">Missões</div>
                  <div className="font-medium">{getProfileStats(activeProfile.id).totalMissions}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-muted-foreground">Guias</div>
                  <div className="font-medium">{getProfileStats(activeProfile.id).totalGuides}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-muted-foreground">Ouro Total</div>
                  <div className="font-medium text-yellow-600">0</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Sub-Profiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sub-Profiles de Sessão ({filteredProfiles.length})</h2>
          <div className="text-sm text-muted-foreground">Cada sub-profile pode ter conteúdo ilimitado</div>
        </div>

        {filteredProfiles.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? "Nenhum sub-profile encontrado" : "Nenhum sub-profile criado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca ou criar um novo sub-profile."
                  : "Crie seu primeiro sub-profile para organizar conteúdo específico de sessões."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeiro Sub-Profile
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => {
              const stats = getProfileStats(profile.id)
              const isActive = activeProfile?.id === profile.id

              return (
                <Card
                  key={profile.id}
                  className={`${isActive ? "ring-2 bg-green-50" : ""}`}
                  style={{
                    ringColor: isActive ? profile.color || "#6366f1" : undefined,
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: profile.color || "#6366f1" }} />
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {isActive && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {profile.name}
                            {isActive && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Ativo
                              </Badge>
                            )}
                          </CardTitle>
                          {profile.description && (
                            <CardDescription className="text-xs mt-1">{profile.description}</CardDescription>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{stats.totalObjectives}</div>
                        <div className="text-muted-foreground">Obj</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">{stats.totalMissions}</div>
                        <div className="text-muted-foreground">Miss</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-600">{stats.totalGuides}</div>
                        <div className="text-muted-foreground">Guias</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mb-3">
                      Criado: {new Date(profile.createdAt).toLocaleDateString()}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {!isActive ? (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleLoadSubProfile(profile)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Ativar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveProfile(null)}
                          className="border-green-600 text-green-600"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Ativo
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleDuplicateProfile(profile)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteProfileId(profile.id)}
                        disabled={isActive}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Sub-Profile de Sessão</DialogTitle>
            <DialogDescription>
              Crie um sub-profile específico para organizar conteúdo de uma sessão. Cada sub-profile pode ter seus
              próprios objetivos, missões, guias e configurações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Sub-Profile *</Label>
              <Input
                id="name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Ex: Skyrim Mage Build, Projeto X, Estudos Q1..."
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newProfileDescription}
                onChange={(e) => setNewProfileDescription(e.target.value)}
                placeholder="Descreva o propósito deste sub-profile..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Cor do Profile</Label>
              <Select value={newProfileColor} onValueChange={setNewProfileColor}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: newProfileColor }} />
                      {PROFILE_COLORS.find((c) => c.value === newProfileColor)?.name || "Personalizada"}
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />
                        {color.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateSubProfile}>Criar Sub-Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={!!deleteProfileId} onOpenChange={() => setDeleteProfileId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Sub-Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este sub-profile? Esta ação não pode ser desfeita. O conteúdo associado não
              será deletado, apenas a associação com o sub-profile será removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubProfile} className="bg-destructive text-destructive-foreground">
              Deletar Sub-Profile
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
