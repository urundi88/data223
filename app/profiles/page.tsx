"use client"

import type React from "react"

import { useState } from "react"
import { useProfiles } from "@/contexts/profiles-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
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
import {
  User,
  Plus,
  Play,
  Save,
  Copy,
  Edit,
  Trash,
  Download,
  Upload,
  Calendar,
  Trophy,
  Target,
  BookOpen,
  Home,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ProfilesPage() {
  const {
    profiles,
    currentProfile,
    createProfile,
    loadProfile,
    saveCurrentProfile,
    updateProfile,
    deleteProfile,
    duplicateProfile,
    exportProfile,
    importProfile,
  } = useProfiles()
  const { toast } = useToast()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
  })

  const [duplicateName, setDuplicateName] = useState("")

  const handleCreateProfile = () => {
    if (!createForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do perfil é obrigatório.",
        variant: "destructive",
      })
      return
    }

    createProfile(createForm.name, createForm.description)
    setCreateForm({ name: "", description: "" })
    setShowCreateDialog(false)
  }

  const handleEditProfile = (profile: any) => {
    setSelectedProfile(profile)
    setEditForm({
      name: profile.name,
      description: profile.description || "",
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (!editForm.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do perfil é obrigatório.",
        variant: "destructive",
      })
      return
    }

    updateProfile(selectedProfile.id, {
      name: editForm.name,
      description: editForm.description,
    })
    setShowEditDialog(false)
    setSelectedProfile(null)
  }

  const handleDeleteProfile = (profile: any) => {
    setSelectedProfile(profile)
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (selectedProfile) {
      deleteProfile(selectedProfile.id)
      setShowDeleteDialog(false)
      setSelectedProfile(null)
    }
  }

  const handleDuplicateProfile = (profile: any) => {
    setSelectedProfile(profile)
    setDuplicateName(`${profile.name} (Cópia)`)
    setShowDuplicateDialog(true)
  }

  const confirmDuplicate = () => {
    if (selectedProfile && duplicateName.trim()) {
      duplicateProfile(selectedProfile.id, duplicateName)
      setShowDuplicateDialog(false)
      setSelectedProfile(null)
      setDuplicateName("")
    }
  }

  const handleImportProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const profileData = JSON.parse(e.target?.result as string)
        importProfile(profileData)
      } catch (error) {
        toast({
          title: "Erro na Importação",
          description: "Arquivo inválido.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
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
          <h1 className="text-3xl font-bold">Perfis de Jogo</h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Perfil
          </Button>
          <Button variant="outline" onClick={saveCurrentProfile} disabled={!currentProfile}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Atual
          </Button>
        </div>
      </div>

      {/* Current Profile Info */}
      {currentProfile && (
        <Card className="mb-6 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil Ativo: {currentProfile.name}
              <Badge variant="default">Ativo</Badge>
            </CardTitle>
            <CardDescription>{currentProfile.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2 text-blue-500" />
                <div>
                  <div className="text-muted-foreground">Objetivos</div>
                  <div className="font-medium">
                    {currentProfile.completedObjectives}/{currentProfile.totalObjectives}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                <div>
                  <div className="text-muted-foreground">Missões</div>
                  <div className="font-medium">
                    {currentProfile.completedMissions}/{currentProfile.totalMissions}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                <div>
                  <div className="text-muted-foreground">Nível</div>
                  <div className="font-medium">{currentProfile.playerStats?.level || 1}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                <div>
                  <div className="text-muted-foreground">Último Acesso</div>
                  <div className="font-medium">{new Date(currentProfile.lastPlayedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      <div className="mb-6">
        <input type="file" accept=".json" onChange={handleImportProfile} className="hidden" id="import-profile" />
        <label htmlFor="import-profile">
          <Button variant="outline" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Importar Perfil
            </span>
          </Button>
        </label>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card key={profile.id} className={currentProfile?.id === profile.id ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="flex items-center gap-2">
                  {profile.name}
                  {currentProfile?.id === profile.id && <Badge variant="default">Ativo</Badge>}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEditProfile(profile)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDuplicateProfile(profile)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => exportProfile(profile.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProfile(profile)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>{profile.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Target className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <div className="text-muted-foreground">Objetivos</div>
                      <div className="font-medium">
                        {profile.completedObjectives}/{profile.totalObjectives}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                    <div>
                      <div className="text-muted-foreground">Missões</div>
                      <div className="font-medium">
                        {profile.completedMissions}/{profile.totalMissions}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Criado: {new Date(profile.createdAt).toLocaleDateString()}</div>
                  <div>Atualizado: {new Date(profile.updatedAt).toLocaleDateString()}</div>
                  <div>Último acesso: {new Date(profile.lastPlayedAt).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => loadProfile(profile.id)}
                disabled={currentProfile?.id === profile.id}
              >
                <Play className="mr-2 h-4 w-4" />
                {currentProfile?.id === profile.id ? "Perfil Ativo" : "Carregar Perfil"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum perfil encontrado</h3>
          <p className="text-muted-foreground mb-4">Crie seu primeiro perfil para começar a jogar.</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeiro Perfil
          </Button>
        </div>
      )}

      {/* Create Profile Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
            <DialogDescription>Crie um novo perfil de jogo com seus dados atuais.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-name">Nome do Perfil</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ex: Minha Aventura Principal"
              />
            </div>
            <div>
              <Label htmlFor="create-description">Descrição (opcional)</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Descreva este perfil..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProfile}>Criar Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>Edite as informações do perfil.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Perfil</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o perfil "{selectedProfile?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Profile Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Perfil</DialogTitle>
            <DialogDescription>Crie uma cópia do perfil "{selectedProfile?.name}".</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="duplicate-name">Nome do Novo Perfil</Label>
              <Input id="duplicate-name" value={duplicateName} onChange={(e) => setDuplicateName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmDuplicate}>Duplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
