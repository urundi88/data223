"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  Clock,
  Circle,
  Trophy,
  RotateCcw,
  Copy,
  Plus,
  Eye,
  Coins,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Target,
  MapPin,
  ChevronDown,
  ChevronUp,
  Minus,
  Edit,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import { useObjectives } from "@/contexts/objectives-context"
import { useSessionProfiles } from "@/contexts/session-profiles-context"
import { SessionProfileSelector } from "@/components/session-profile-selector"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { XpProgressBar } from "@/components/xp-progress-bar"

type SortOption = "name" | "progress" | "xp" | "gold" | "created" | "category"
type FilterOption = "all" | "completed" | "active" | "expired" | "repeatable"

export default function ObjectivesPage() {
  const {
    objectives,
    completeObjective,
    resetObjective,
    cloneObjective,
    addObjectiveToProfile,
    removeObjectiveFromProfile,
    updateObjective,
    updateSubObjective,
  } = useObjectives()
  const { profiles, activeProfile } = useSessionProfiles()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("created")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterBy, setFilterBy] = useState<FilterOption>("all")
  const [selectedProfile, setSelectedProfile] = useState<string>(activeProfile?.id || "")
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Estados para pesquisa e navegação de subobjetivos
  const [subObjectiveSearchTerms, setSubObjectiveSearchTerms] = useState<Record<string, string>>({})
  const [phasePages, setPhasePages] = useState<Record<string, number>>({})

  const SUBOBJECTIVES_PER_PAGE = 3

  // Filter objectives based on selected profile
  const profileFilteredObjectives = useMemo(() => {
    if (!selectedProfile) return objectives

    const profile = profiles.find((p) => p.id === selectedProfile)
    if (!profile) return objectives

    return objectives.filter((obj) => profile.objectiveIds.includes(obj.id))
  }, [objectives, selectedProfile, profiles])

  // Apply search, filter and sort
  const filteredAndSortedObjectives = useMemo(() => {
    let filtered = profileFilteredObjectives

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (obj) =>
          obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obj.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          obj.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    switch (filterBy) {
      case "completed":
        filtered = filtered.filter((obj) => obj.completed)
        break
      case "active":
        filtered = filtered.filter((obj) => !obj.completed && (!obj.expiresAt || new Date(obj.expiresAt) > new Date()))
        break
      case "expired":
        filtered = filtered.filter((obj) => obj.expiresAt && new Date(obj.expiresAt) <= new Date())
        break
      case "repeatable":
        filtered = filtered.filter((obj) => obj.isRepeatable)
        break
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "progress":
          aValue = a.completed
            ? 100
            : a.phases?.length
              ? (a.phases.filter((p) => p.completed).length / a.phases.length) * 100
              : 0
          bValue = b.completed
            ? 100
            : b.phases?.length
              ? (b.phases.filter((p) => p.completed).length / b.phases.length) * 100
              : 0
          break
        case "xp":
          aValue = a.xpReward?.perCompletion || 0
          bValue = b.xpReward?.perCompletion || 0
          break
        case "gold":
          aValue = a.totalGoldEarned || 0
          bValue = b.totalGoldEarned || 0
          break
        case "category":
          aValue = a.category || ""
          bValue = b.category || ""
          break
        case "created":
        default:
          aValue = a.createdAt || ""
          bValue = b.createdAt || ""
          break
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [profileFilteredObjectives, searchTerm, filterBy, sortBy, sortOrder])

  // Função para filtrar subobjetivos por busca
  const getFilteredSubObjectives = (phase: any, phaseId: string) => {
    const searchTerm = subObjectiveSearchTerms[phaseId] || ""
    if (!searchTerm) return phase.subObjectives || []

    return (phase.subObjectives || []).filter(
      (subObj: any) =>
        subObj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subObj.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  // Função para obter subobjetivos paginados
  const getPaginatedSubObjectives = (phase: any, phaseId: string) => {
    const filteredSubs = getFilteredSubObjectives(phase, phaseId)
    const currentPage = phasePages[phaseId] || 0
    const startIndex = currentPage * SUBOBJECTIVES_PER_PAGE
    const endIndex = startIndex + SUBOBJECTIVES_PER_PAGE

    return {
      items: filteredSubs.slice(startIndex, endIndex),
      totalItems: filteredSubs.length,
      totalPages: Math.ceil(filteredSubs.length / SUBOBJECTIVES_PER_PAGE),
      currentPage,
      startIndex,
      endIndex: Math.min(endIndex, filteredSubs.length),
    }
  }

  // Funções de navegação
  const setPhasePageNumber = (phaseId: string, page: number) => {
    setPhasePages((prev) => ({ ...prev, [phaseId]: page }))
  }

  const goToFirstPage = (phaseId: string) => {
    setPhasePageNumber(phaseId, 0)
  }

  const goToPreviousPage = (phaseId: string) => {
    const currentPage = phasePages[phaseId] || 0
    if (currentPage > 0) {
      setPhasePageNumber(phaseId, currentPage - 1)
    }
  }

  const goToNextPage = (phaseId: string, totalPages: number) => {
    const currentPage = phasePages[phaseId] || 0
    if (currentPage < totalPages - 1) {
      setPhasePageNumber(phaseId, currentPage + 1)
    }
  }

  const goToLastPage = (phaseId: string, totalPages: number) => {
    setPhasePageNumber(phaseId, totalPages - 1)
  }

  const handleCompleteObjective = async (id: string) => {
    try {
      completeObjective(id)
      toast({
        title: "Objetivo Completado!",
        description: "Parabéns! Você completou o objetivo.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao completar objetivo.",
        variant: "destructive",
      })
    }
  }

  const handleResetObjective = async (id: string) => {
    try {
      resetObjective(id)
      toast({
        title: "Objetivo Reiniciado",
        description: "O objetivo foi reiniciado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reiniciar objetivo.",
        variant: "destructive",
      })
    }
  }

  const handleCloneObjective = async (id: string) => {
    try {
      cloneObjective(id)
      toast({
        title: "Objetivo Clonado",
        description: "Uma cópia do objetivo foi criada.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao clonar objetivo.",
        variant: "destructive",
      })
    }
  }

  const handleAddToProfile = (objectiveId: string, profileId: string) => {
    addObjectiveToProfile(objectiveId, profileId)
    const profile = profiles.find((p) => p.id === profileId)
    toast({
      title: "Objetivo Adicionado",
      description: `Objetivo adicionado ao profile "${profile?.name}".`,
    })
  }

  const handleRemoveFromProfile = (objectiveId: string, profileId: string) => {
    removeObjectiveFromProfile(objectiveId, profileId)
    const profile = profiles.find((p) => p.id === profileId)
    toast({
      title: "Objetivo Removido",
      description: `Objetivo removido do profile "${profile?.name}".`,
    })
  }

  const handleResetObjectiveRepetitions = async (id: string) => {
    try {
      const objective = objectives.find((obj) => obj.id === id)
      if (!objective) return

      updateObjective(id, {
        currentCompletions: 0,
        currentPhaseIndex: 0,
        phases: objective.phases?.map((phase) => ({
          ...phase,
          currentRepetitions: 0,
          completed: false,
          subObjectives: phase.subObjectives.map((sub) => ({
            ...sub,
            currentRepetitions: 0,
            completed: false,
            currentValue: 0,
          })),
        })),
      })

      toast({
        title: "Repetições do Objetivo Resetadas",
        description: `Todas as repetições de "${objective.name}" foram resetadas para zero.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao resetar repetições do objetivo.",
        variant: "destructive",
      })
    }
  }

  const handleResetAllSubObjectiveRepetitions = async (id: string) => {
    try {
      const objective = objectives.find((obj) => obj.id === id)
      if (!objective) return

      updateObjective(id, {
        phases: objective.phases?.map((phase) => ({
          ...phase,
          subObjectives: phase.subObjectives.map((sub) => ({
            ...sub,
            currentRepetitions: 0,
            completed: false,
            currentValue: 0,
          })),
        })),
      })

      toast({
        title: "Repetições dos Subobjetivos Resetadas",
        description: `Todas as repetições dos subobjetivos de "${objective.name}" foram resetadas para zero.`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao resetar repetições dos subobjetivos.",
        variant: "destructive",
      })
    }
  }

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCards(newExpanded)
  }

  const calculateProgress = (objective: any) => {
    if (objective.completed) return 100
    if (!objective.phases?.length) return 0

    const completedPhases = objective.phases.filter((p: any) => p.completed).length
    return (completedPhases / objective.phases.length) * 100
  }

  const calculateTotalGold = (objective: any) => {
    let total = objective.totalGoldEarned || 0

    if (objective.phases) {
      objective.phases.forEach((phase: any) => {
        total += phase.totalGoldEarned || 0
        if (phase.subObjectives) {
          phase.subObjectives.forEach((sub: any) => {
            total += sub.totalGoldEarned || 0
          })
        }
      })
    }

    return total
  }

  const calculatePotentialGold = (objective: any) => {
    let potential = 0

    // Objective level gold
    if (!objective.completed) {
      potential += objective.goldReward?.perCompletion || 0
    }

    // Phase level gold
    if (objective.phases) {
      objective.phases.forEach((phase: any) => {
        if (!phase.completed) {
          potential += phase.goldReward?.perCompletion || 0
        }

        // SubObjective level gold
        if (phase.subObjectives) {
          phase.subObjectives.forEach((sub: any) => {
            if (!sub.completed) {
              potential += sub.goldReward?.perCompletion || 0
              potential += (sub.goldReward?.perPoint || 0) * (sub.targetValue - sub.currentValue)
            }
          })
        }
      })
    }

    return potential
  }

  // Função para incrementar/decrementar pontos de subobjetivo
  const handleSubObjectivePointChange = (
    objectiveId: string,
    phaseId: string,
    subObjectiveId: string,
    change: number,
  ) => {
    const objective = objectives.find((obj) => obj.id === objectiveId)
    const phase = objective?.phases?.find((p) => p.id === phaseId)
    const subObj = phase?.subObjectives.find((s) => s.id === subObjectiveId)

    if (!subObj) return

    // Verificar cooldown
    if (subObj.hasCooldown && subObj.cooldownStartTime) {
      const elapsed = Date.now() - subObj.cooldownStartTime
      const cooldownRemaining = (subObj.cooldownDuration || 60) * 1000 - elapsed

      if (cooldownRemaining > 0) {
        const remainingSeconds = Math.ceil(cooldownRemaining / 1000)
        toast({
          title: "Cooldown Ativo",
          description: `Aguarde ${formatCooldownTime(remainingSeconds)} para adicionar pontos.`,
          variant: "destructive",
        })
        return
      }
    }

    const newValue = Math.max(0, Math.min(subObj.currentValue + change, subObj.targetValue))

    // Se está incrementando e tem cooldown, iniciar cooldown
    if (change > 0 && subObj.hasCooldown && objective) {
      const updatedObjective = { ...objective }
      const phaseIndex = updatedObjective.phases?.findIndex((p) => p.id === phaseId) ?? -1
      const subIndex =
        updatedObjective.phases?.[phaseIndex]?.subObjectives.findIndex((s) => s.id === subObjectiveId) ?? -1

      if (phaseIndex >= 0 && subIndex >= 0 && updatedObjective.phases) {
        updatedObjective.phases[phaseIndex].subObjectives[subIndex] = {
          ...subObj,
          cooldownStartTime: Date.now(),
          cooldownProgress: 0,
        }

        updateObjective(objectiveId, updatedObjective)
      }
    }

    updateSubObjective(objectiveId, phaseId, subObjectiveId, newValue)
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

  // Statistics
  const stats = useMemo(() => {
    const total = filteredAndSortedObjectives.length
    const completed = filteredAndSortedObjectives.filter((obj) => obj.completed).length
    const active = filteredAndSortedObjectives.filter((obj) => !obj.completed).length
    const totalGold = filteredAndSortedObjectives.reduce((sum, obj) => sum + calculateTotalGold(obj), 0)
    const potentialGold = filteredAndSortedObjectives.reduce((sum, obj) => sum + calculatePotentialGold(obj), 0)

    return { total, completed, active, totalGold, potentialGold }
  }, [filteredAndSortedObjectives])

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Objetivos</h1>
          <p className="text-muted-foreground">Gerencie seus objetivos e acompanhe o progresso</p>
        </div>
        <div className="flex gap-2">
          <Link href="/unified-terms">
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Objetivos Unificados
            </Button>
          </Link>
          <Link href="/objectives/create-objective">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Objetivo
            </Button>
          </Link>
        </div>
      </div>

      {/* Adicionar após o título e antes das Statistics Cards: */}
      <div className="mb-6">
        <XpProgressBar size="lg" />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs text-muted-foreground">Completos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Circle className="h-4 w-4 mr-2 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-xs text-muted-foreground">Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.totalGold}</div>
                <div className="text-xs text-muted-foreground">Ouro Ganho</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Coins className="h-4 w-4 mr-2 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-600">{stats.potentialGold}</div>
                <div className="text-xs text-muted-foreground">Ouro Potencial</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar objetivos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <SessionProfileSelector
                selectedProfile={selectedProfile}
                onProfileChange={setSelectedProfile}
                showAllOption={true}
              />

              <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Completos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                  <SelectItem value="repeatable">Repetíveis</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Data</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="xp">XP</SelectItem>
                  <SelectItem value="gold">Ouro</SelectItem>
                  <SelectItem value="category">Categoria</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives List */}
      <div className="space-y-4">
        {filteredAndSortedObjectives.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Nenhum objetivo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterBy !== "all"
                  ? "Tente ajustar os filtros ou criar um novo objetivo."
                  : "Comece criando seu primeiro objetivo."}
              </p>
              <Link href="/objectives/create-objective">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Objetivo
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedObjectives.map((objective) => {
            const progress = calculateProgress(objective)
            const totalGold = calculateTotalGold(objective)
            const potentialGold = calculatePotentialGold(objective)
            const isExpanded = expandedCards.has(objective.id)
            const isExpired = objective.expiresAt && new Date(objective.expiresAt) <= new Date()

            return (
              <Card key={objective.id} className={`${isExpired ? "border-red-200 bg-red-50" : ""}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{objective.name}</CardTitle>
                        {objective.category && (
                          <Badge variant="secondary" className="text-xs">
                            {objective.category}
                          </Badge>
                        )}
                        {objective.completed && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                        {objective.isRepeatable && (
                          <Badge variant="outline">
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Repetível
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge variant="destructive">
                            <Clock className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        )}
                      </div>

                      {objective.description && (
                        <CardDescription className="mb-3">{objective.description}</CardDescription>
                      )}

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {objective.location?.zone && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {objective.location.zone}
                        </div>
                      )}

                      <Button variant="ghost" size="sm" onClick={() => toggleCardExpansion(objective.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-purple-500" />
                      <div>
                        <div className="text-sm font-medium">
                          {objective.xpReward?.perCompletion || 0}
                          {(objective.xpReward?.perPoint || 0) > 0 ? ` + ${objective.xpReward.perPoint}/pt` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground">XP</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2 text-yellow-500" />
                      <div>
                        <div className="text-sm font-medium text-yellow-600">{totalGold}</div>
                        <div className="text-xs text-muted-foreground">Ouro Ganho</div>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Coins className="h-4 w-4 mr-2 text-amber-500" />
                      <div>
                        <div className="text-sm font-medium text-amber-600">{potentialGold}</div>
                        <div className="text-xs text-muted-foreground">Ouro Potencial</div>
                      </div>
                    </div>

                    {objective.expiresAt && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-red-500" />
                        <div>
                          <div className="text-sm font-medium">
                            {new Date(objective.expiresAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">Expira</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Content */}
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent className="space-y-4">
                      {/* Phases Summary with Controls */}
                      {objective.phases && objective.phases.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">
                            Fases ({objective.phases.filter((p: any) => p.completed).length}/{objective.phases.length})
                          </h4>
                          <div className="space-y-3">
                            {objective.phases.map((phase: any) => {
                              const paginationData = getPaginatedSubObjectives(phase, phase.id)
                              const {
                                items: paginatedSubObjectives,
                                totalItems,
                                totalPages,
                                currentPage,
                                startIndex,
                                endIndex,
                              } = paginationData

                              return (
                                <div key={phase.id} className="border rounded-lg p-3 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      {phase.completed ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <Circle className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <span className="text-sm font-medium">{phase.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                      <span>
                                        {phase.subObjectives?.filter((s: any) => s.completed).length || 0}/
                                        {phase.subObjectives?.length || 0} subs
                                      </span>
                                      <span className="text-yellow-600">{phase.totalGoldEarned || 0} ouro</span>
                                    </div>
                                  </div>

                                  {/* Sub-objectives search and controls */}
                                  {phase.subObjectives && phase.subObjectives.length > 0 && (
                                    <div className="space-y-3 ml-6">
                                      {/* Search bar for subObjectives */}
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                        <Input
                                          placeholder="Buscar subobjetivos..."
                                          value={subObjectiveSearchTerms[phase.id] || ""}
                                          onChange={(e) => {
                                            setSubObjectiveSearchTerms((prev) => ({
                                              ...prev,
                                              [phase.id]: e.target.value,
                                            }))
                                            // Reset to first page when searching
                                            setPhasePageNumber(phase.id, 0)
                                          }}
                                          className="pl-8 text-xs h-8"
                                        />
                                      </div>

                                      {/* Navigation info and controls */}
                                      {totalItems > 0 && (
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                          <span>
                                            Mostrando {startIndex + 1}-{endIndex} de {totalItems} subobjetivos
                                          </span>
                                          {totalPages > 1 && (
                                            <div className="flex items-center gap-1">
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToFirstPage(phase.id)}
                                                disabled={currentPage === 0}
                                                className="h-6 w-6 p-0"
                                              >
                                                <ChevronsLeft className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToPreviousPage(phase.id)}
                                                disabled={currentPage === 0}
                                                className="h-6 w-6 p-0"
                                              >
                                                <ChevronLeft className="h-3 w-3" />
                                              </Button>
                                              <span className="px-2 text-xs">
                                                {currentPage + 1}/{totalPages}
                                              </span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToNextPage(phase.id, totalPages)}
                                                disabled={currentPage === totalPages - 1}
                                                className="h-6 w-6 p-0"
                                              >
                                                <ChevronRight className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => goToLastPage(phase.id, totalPages)}
                                                disabled={currentPage === totalPages - 1}
                                                className="h-6 w-6 p-0"
                                              >
                                                <ChevronsRight className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Paginated subObjectives container */}
                                      <div className="space-y-2 min-h-[200px]">
                                        {paginatedSubObjectives.length === 0 ? (
                                          <div className="flex items-center justify-center h-32 text-muted-foreground">
                                            <div className="text-center">
                                              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                              <p className="text-sm">
                                                {subObjectiveSearchTerms[phase.id]
                                                  ? "Nenhum subobjetivo encontrado"
                                                  : "Nenhum subobjetivo nesta fase"}
                                              </p>
                                            </div>
                                          </div>
                                        ) : (
                                          paginatedSubObjectives.map((subObj: any) => (
                                            <div key={subObj.id} className="bg-muted/30 rounded p-3 space-y-2">
                                              <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">{subObj.name}</div>
                                                  {subObj.description && (
                                                    <div className="text-xs text-muted-foreground">
                                                      {subObj.description}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Detailed Stats */}
                                              <div className="bg-white/50 rounded p-2 space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                  <span className="text-purple-600">🎯 Atual:</span>
                                                  <span className="font-medium">{subObj.currentValue}</span>
                                                  <span className="text-blue-600">🎯 Meta:</span>
                                                  <span className="font-medium">{subObj.targetValue}</span>
                                                  <span className="text-orange-600">➡️ Restante:</span>
                                                  <span className="font-medium">
                                                    {subObj.targetValue - subObj.currentValue}
                                                  </span>
                                                  <span className="text-green-600">⚡ XP:</span>
                                                  <span className="font-medium">
                                                    {subObj.xpReward?.perPoint || 0}/pt
                                                  </span>
                                                </div>
                                                <Progress
                                                  value={(subObj.currentValue / subObj.targetValue) * 100}
                                                  className="h-1"
                                                />
                                              </div>

                                              {/* Point Controls */}
                                              <div className="flex items-center justify-center gap-2 bg-gray-50 rounded p-2">
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleSubObjectivePointChange(objective.id, phase.id, subObj.id, -1)
                                                  }
                                                  disabled={subObj.currentValue <= 0}
                                                >
                                                  <Minus className="h-3 w-3" />
                                                </Button>

                                                <div className="flex items-center gap-1">
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    max={subObj.targetValue}
                                                    value={subObj.currentValue}
                                                    onChange={(e) => {
                                                      const newValue = Math.max(
                                                        0,
                                                        Math.min(
                                                          Number.parseInt(e.target.value) || 0,
                                                          subObj.targetValue,
                                                        ),
                                                      )
                                                      updateSubObjective(objective.id, phase.id, subObj.id, newValue)
                                                    }}
                                                    className="w-16 text-center text-xs"
                                                  />
                                                  <span className="text-xs text-muted-foreground">
                                                    /{subObj.targetValue}
                                                  </span>
                                                </div>

                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() =>
                                                    handleSubObjectivePointChange(objective.id, phase.id, subObj.id, 1)
                                                  }
                                                  disabled={subObj.currentValue >= subObj.targetValue}
                                                >
                                                  <Plus className="h-3 w-3" />
                                                </Button>
                                              </div>

                                              {/* Cooldown Display */}
                                              {subObj.hasCooldown && (
                                                <div className="bg-blue-50 rounded p-2 space-y-1">
                                                  <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-blue-600" />
                                                    <span className="text-xs font-medium text-blue-800">Cooldown</span>
                                                  </div>
                                                  {subObj.cooldownStartTime &&
                                                  subObj.cooldownProgress !== undefined &&
                                                  subObj.cooldownProgress < 100 ? (
                                                    <div className="space-y-1">
                                                      <Progress value={subObj.cooldownProgress} className="h-1" />
                                                      <div className="text-xs text-blue-600">
                                                        Restante:{" "}
                                                        {formatCooldownTime(
                                                          Math.ceil(
                                                            ((subObj.cooldownDuration || 60) * 1000 -
                                                              (Date.now() - subObj.cooldownStartTime)) /
                                                              1000,
                                                          ),
                                                        )}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="text-xs text-blue-600">
                                                      Duração: {formatCooldownTime(subObj.cooldownDuration || 60)}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {!objective.completed && (
                      <Button size="sm" onClick={() => handleCompleteObjective(objective.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Completar
                      </Button>
                    )}

                    {objective.isRepeatable && (
                      <Button variant="outline" size="sm" onClick={() => handleResetObjective(objective.id)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reiniciar
                      </Button>
                    )}

                    <Button variant="outline" size="sm" onClick={() => handleCloneObjective(objective.id)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Clonar
                    </Button>

                    <Link href={`/objective-details/${objective.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Detalhes
                      </Button>
                    </Link>

                    <Link href={`/objectives/edit/${objective.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetObjectiveRepetitions(objective.id)}
                      className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Objetivo
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetAllSubObjectiveRepetitions(objective.id)}
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset Subs
                    </Button>

                    {/* Profile Management */}
                    {profiles.length > 0 && (
                      <Select
                        onValueChange={(profileId) => {
                          if (profileId === "remove") {
                            // Find which profile has this objective and remove it
                            const profileWithObjective = profiles.find((p) => p.objectiveIds.includes(objective.id))
                            if (profileWithObjective) {
                              handleRemoveFromProfile(objective.id, profileWithObjective.id)
                            }
                          } else {
                            handleAddToProfile(objective.id, profileId)
                          }
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Gerenciar Profile" />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              + {profile.name}
                            </SelectItem>
                          ))}
                          {profiles.some((p) => p.objectiveIds.includes(objective.id)) && (
                            <SelectItem value="remove">- Remover do Profile</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
