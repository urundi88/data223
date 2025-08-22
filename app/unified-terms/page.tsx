"use client"

import { useState } from "react"
import { useObjectives } from "@/contexts/objectives-context"
import { useMissions } from "@/contexts/missions-context"
import { useGuides } from "@/contexts/guides-context"
import { useSessionProfiles } from "@/contexts/session-profiles-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import {
  Search,
  Target,
  MapPin,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  Copy,
  Trash2,
  Plus,
  Minus,
  BarChart3,
  Coins,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function UnifiedTermsPage() {
  const { objectives, completeObjective, resetObjective, cloneObjective, deleteObjective, updateSubObjective } =
    useObjectives()
  const { missions, completeMission, resetMission, cloneMission, deleteMission } = useMissions()
  const { guides, deleteGuide, cloneGuide } = useGuides()
  const { profiles, activeProfile } = useSessionProfiles()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProfile, setFilterProfile] = useState("all")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [itemSearchTerms, setItemSearchTerms] = useState<Record<string, string>>({})

  // Estados para pesquisa e navegação de subobjetivos
  const [subObjectiveSearchTerms, setSubObjectiveSearchTerms] = useState<Record<string, string>>({})
  const [phasePages, setPhasePages] = useState<Record<string, number>>({})

  const SUBOBJECTIVES_PER_PAGE = 3

  // Combine all items
  const allItems = [
    ...objectives.map((obj) => ({ ...obj, itemType: "objective" as const })),
    ...missions.map((mission) => ({ ...mission, itemType: "mission" as const })),
    ...guides.map((guide) => ({ ...guide, itemType: "guide" as const })),
  ]

  // Filter items
  const filteredItems = allItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || item.itemType === filterType

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "completed" && item.completed) ||
      (filterStatus === "active" && !item.completed)

    const matchesProfile =
      filterProfile === "all" || (filterProfile === "none" && !item.profileId) || item.profileId === filterProfile

    return matchesSearch && matchesType && matchesStatus && matchesProfile
  })

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

  // Statistics
  const stats = {
    total: allItems.length,
    completed: allItems.filter((item) => item.completed).length,
    objectives: objectives.length,
    missions: missions.length,
    guides: guides.length,
    activeProfile: activeProfile?.name || "Nenhum",
  }

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  const handleItemSearch = (itemId: string, term: string) => {
    setItemSearchTerms((prev) => ({ ...prev, [itemId]: term }))
  }

  const getItemProgress = (item: any) => {
    if (item.itemType === "objective") {
      if (item.phases && item.phases.length > 0) {
        const totalSubObjectives = item.phases.reduce((acc: number, phase: any) => acc + phase.subObjectives.length, 0)
        const completedSubObjectives = item.phases.reduce(
          (acc: number, phase: any) => acc + phase.subObjectives.filter((sub: any) => sub.completed).length,
          0,
        )
        return totalSubObjectives > 0 ? (completedSubObjectives / totalSubObjectives) * 100 : 0
      }
      if (item.collectionItems) {
        const totalItems = item.collectionItems.reduce((acc: number, item: any) => acc + item.targetAmount, 0)
        const currentItems = item.collectionItems.reduce((acc: number, item: any) => acc + item.currentAmount, 0)
        return totalItems > 0 ? (currentItems / totalItems) * 100 : 0
      }
      if (item.totalSteps) {
        return ((item.currentStep || 0) / item.totalSteps) * 100
      }
      if (item.targetPercentage) {
        return ((item.percentage || 0) / item.targetPercentage) * 100
      }
      if (item.targetKills) {
        return ((item.currentKills || 0) / item.targetKills) * 100
      }
    }
    return item.completed ? 100 : 0
  }

  const handleComplete = (item: any) => {
    if (item.itemType === "objective") {
      completeObjective(item.id)
    } else if (item.itemType === "mission") {
      completeMission(item.id)
    }
    toast({
      title: "Item Completado",
      description: `${item.name} foi marcado como completo.`,
    })
  }

  const handleReset = (item: any) => {
    if (item.itemType === "objective") {
      resetObjective(item.id)
    } else if (item.itemType === "mission") {
      resetMission(item.id)
    }
  }

  const handleClone = (item: any) => {
    if (item.itemType === "objective") {
      cloneObjective(item.id)
    } else if (item.itemType === "mission") {
      cloneMission(item.id)
    } else if (item.itemType === "guide") {
      cloneGuide(item.id)
    }
    toast({
      title: "Item Clonado",
      description: `${item.name} foi clonado com sucesso.`,
    })
  }

  const handleDelete = (item: any) => {
    if (item.itemType === "objective") {
      deleteObjective(item.id)
    } else if (item.itemType === "mission") {
      deleteMission(item.id)
    } else if (item.itemType === "guide") {
      deleteGuide(item.id)
    }
    toast({
      title: "Item Deletado",
      description: `${item.name} foi deletado.`,
    })
  }

  const handleSubObjectiveUpdate = (
    objectiveId: string,
    phaseId: string,
    subObjectiveId: string,
    increment: number,
  ) => {
    const objective = objectives.find((obj) => obj.id === objectiveId)
    if (!objective) return

    const phase = objective.phases?.find((p) => p.id === phaseId)
    if (!phase) return

    const subObjective = phase.subObjectives.find((sub) => sub.id === subObjectiveId)
    if (!subObjective) return

    const newValue = Math.max(0, Math.min(subObjective.currentValue + increment, subObjective.targetValue))
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

  const filterItemContent = (item: any, searchTerm: string) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    // Search in basic fields
    if (
      item.name.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    ) {
      return true
    }

    // Search in phases and subObjectives for objectives
    if (item.itemType === "objective" && item.phases) {
      return item.phases.some(
        (phase: any) =>
          phase.name.toLowerCase().includes(searchLower) ||
          phase.description?.toLowerCase().includes(searchLower) ||
          phase.subObjectives.some(
            (sub: any) =>
              sub.name.toLowerCase().includes(searchLower) || sub.description?.toLowerCase().includes(searchLower),
          ),
      )
    }

    // Search in steps for missions
    if (item.itemType === "mission" && item.steps) {
      return item.steps.some(
        (step: any) =>
          step.title?.toLowerCase().includes(searchLower) || step.description?.toLowerCase().includes(searchLower),
      )
    }

    // Search in content for guides
    if (item.itemType === "guide") {
      return (
        item.content?.toLowerCase().includes(searchLower) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      )
    }

    return false
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Termos Unificados</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os seus objetivos, missões e guias em um só lugar
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/objectives/create-objective">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Objetivo
            </Button>
          </Link>
          <Link href="/missions/create">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nova Missão
            </Button>
          </Link>
          <Link href="/guides/create">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Novo Guia
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completos</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Objetivos</p>
                <p className="text-2xl font-bold">{stats.objectives}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Missões</p>
                <p className="text-2xl font-bold">{stats.missions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <div>
                <p className="text-sm font-medium">Guias</p>
                <p className="text-2xl font-bold">{stats.guides}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              <div>
                <p className="text-sm font-medium">Profile Ativo</p>
                <p className="text-sm font-bold truncate">{stats.activeProfile}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar em todos os itens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="objective">Objetivos</SelectItem>
                  <SelectItem value="mission">Missões</SelectItem>
                  <SelectItem value="guide">Guias</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Completos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterProfile} onValueChange={setFilterProfile}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Profiles</SelectItem>
                  <SelectItem value="none">Pool Geral</SelectItem>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-muted-foreground">
                <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum item encontrado</p>
                <p>Tente ajustar os filtros ou criar um novo item.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={`${item.itemType}-${item.id}`} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          item.itemType === "objective"
                            ? "default"
                            : item.itemType === "mission"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {item.itemType === "objective" && <Target className="h-3 w-3 mr-1" />}
                        {item.itemType === "mission" && <MapPin className="h-3 w-3 mr-1" />}
                        {item.itemType === "guide" && <BookOpen className="h-3 w-3 mr-1" />}
                        {item.itemType === "objective" ? "Objetivo" : item.itemType === "mission" ? "Missão" : "Guia"}
                      </Badge>
                      {item.completed && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completo
                        </Badge>
                      )}
                      {item.category && <Badge variant="outline">{item.category}</Badge>}
                      {item.profileId && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <Users className="h-3 w-3 mr-1" />
                          {profiles.find((p) => p.id === item.profileId)?.name || "Profile"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    {item.description && <CardDescription className="mt-1">{item.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(item.id)}>
                      {expandedItems.has(item.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progresso</span>
                    <span>{Math.round(getItemProgress(item))}%</span>
                  </div>
                  <Progress value={getItemProgress(item)} className="h-2" />
                </div>

                {/* Rewards Display */}
                {(item.xpReward || item.goldReward) && (
                  <div className="flex items-center gap-4 text-sm mt-2">
                    {item.xpReward?.perCompletion && item.xpReward.perCompletion > 0 && (
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-purple-500" />
                        <span>{item.xpReward.perCompletion} XP</span>
                        {item.xpReward.perPoint > 0 && <span>+ {item.xpReward.perPoint}/pt</span>}
                      </div>
                    )}
                    {item.goldReward?.perCompletion && item.goldReward.perCompletion > 0 && (
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-600" />
                        <span>{item.goldReward.perCompletion} Ouro</span>
                        {item.goldReward.perPoint > 0 && <span>+ {item.goldReward.perPoint}/pt</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 mt-3">
                  {!item.completed && item.itemType !== "guide" && (
                    <Button size="sm" onClick={() => handleComplete(item)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completar
                    </Button>
                  )}
                  {item.completed && item.itemType !== "guide" && item.isRepeatable && (
                    <Button size="sm" variant="outline" onClick={() => handleReset(item)}>
                      <Clock className="h-4 w-4 mr-1" />
                      Reiniciar
                    </Button>
                  )}
                  <Link
                    href={`/${item.itemType === "objective" ? "objective-details" : item.itemType === "mission" ? "mission-details" : "guide-details"}/${item.id}`}
                  >
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                  <Link href={`/${item.itemType}s/edit/${item.id}`}>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleClone(item)}>
                    <Copy className="h-4 w-4 mr-1" />
                    Clonar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Deletar
                  </Button>
                </div>
              </CardHeader>

              {/* Expandable Content */}
              <Collapsible open={expandedItems.has(item.id)}>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="border-t pt-4">
                      {/* Mini Search for this item */}
                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={`Buscar dentro de ${item.name}...`}
                            value={itemSearchTerms[item.id] || ""}
                            onChange={(e) => handleItemSearch(item.id, e.target.value)}
                            className="pl-10"
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Objective Details */}
                      {item.itemType === "objective" && item.phases && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Fases e Subobjetivos</h4>
                          {item.phases
                            .filter((phase: any) =>
                              filterItemContent({ ...phase, itemType: "phase" }, itemSearchTerms[item.id] || ""),
                            )
                            .map((phase: any, phaseIndex: number) => {
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
                                <div key={phase.id} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium">{phase.name}</h5>
                                    <Badge variant={phase.completed ? "default" : "secondary"}>
                                      {phase.completed ? "Completa" : "Em Progresso"}
                                    </Badge>
                                  </div>
                                  {phase.description && (
                                    <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                                  )}

                                  {/* Sub-objectives search and controls */}
                                  {phase.subObjectives && phase.subObjectives.length > 0 && (
                                    <div className="space-y-3">
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
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{subObj.name}</span>
                                                    {subObj.completed && (
                                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                                    )}
                                                  </div>
                                                  {subObj.description && (
                                                    <div className="text-xs text-muted-foreground mt-1">
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
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() =>
                                                    handleSubObjectiveUpdate(item.id, phase.id, subObj.id, -1)
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
                                                      updateSubObjective(item.id, phase.id, subObj.id, newValue)
                                                    }}
                                                    className="w-16 text-center text-xs"
                                                  />
                                                  <span className="text-xs text-muted-foreground">
                                                    /{subObj.targetValue}
                                                  </span>
                                                </div>
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() =>
                                                    handleSubObjectiveUpdate(item.id, phase.id, subObj.id, 1)
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

                                              {/* Rewards */}
                                              {((subObj.xpReward?.perPoint || 0) > 0 ||
                                                (subObj.xpReward?.perCompletion || 0) > 0 ||
                                                (subObj.goldReward?.perCompletion || 0) > 0 ||
                                                (subObj.goldReward?.perPoint || 0) > 0) && (
                                                <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                                                  <strong>Recompensas:</strong>
                                                  {(subObj.xpReward?.perCompletion || 0) > 0 &&
                                                    ` ${subObj.xpReward.perCompletion} XP/conclusão`}
                                                  {(subObj.xpReward?.perPoint || 0) > 0 &&
                                                    ` ${subObj.xpReward.perPoint} XP/ponto`}
                                                  {(subObj.goldReward?.perCompletion || 0) > 0 &&
                                                    ` ${subObj.goldReward.perCompletion} Ouro/conclusão`}
                                                  {(subObj.goldReward?.perPoint || 0) > 0 &&
                                                    ` ${subObj.goldReward.perPoint} Ouro/ponto`}
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
                      )}

                      {/* Mission Details */}
                      {item.itemType === "mission" && item.steps && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Etapas da Missão</h4>
                          {item.steps
                            .filter((step: any) =>
                              filterItemContent({ ...step, itemType: "step" }, itemSearchTerms[item.id] || ""),
                            )
                            .map((step: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    step.completed ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{step.title}</p>
                                  {step.description && (
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                  )}
                                </div>
                                {step.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Guide Details */}
                      {item.itemType === "guide" && (
                        <div className="space-y-4">
                          <h4 className="font-medium">Conteúdo do Guia</h4>
                          {item.content && (
                            <div className="p-3 bg-muted rounded text-sm">
                              {item.content.substring(0, 300)}
                              {item.content.length > 300 && "..."}
                            </div>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Criado em</p>
                            <p>{new Date(item.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Atualizado em</p>
                            <p>{new Date(item.updatedAt).toLocaleDateString()}</p>
                          </div>
                          {item.xpReward && (
                            <div>
                              <p className="text-muted-foreground">XP Reward</p>
                              <p className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {item.xpReward.perCompletion || 0}
                                {(item.xpReward.perPoint || 0) > 0 && ` + ${item.xpReward.perPoint}/pt`}
                              </p>
                            </div>
                          )}
                          {item.goldReward && (
                            <div>
                              <p className="text-muted-foreground">Gold Reward</p>
                              <p className="flex items-center gap-1">
                                <Coins className="h-3 w-3" />
                                {item.goldReward.perCompletion || 0}
                                {(item.goldReward.perPoint || 0) > 0 && ` + ${item.goldReward.perPoint}/pt`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
