"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  Circle,
  ArrowRight,
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  Search,
  Coins,
  MapPin,
  GripVertical,
  Clock,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import type { SubObjective } from "@/contexts/objectives-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface DraggableSubObjectivesProps {
  subObjectives: SubObjective[]
  onUpdateSubObjective: (subObjectiveId: string, value: number) => void
  onCompleteSubObjective: (subObjectiveId: string) => void
  onResetSubObjective: (subObjectiveId: string) => void
  onResetSubObjectiveRepetitions?: (subObjectiveId: string) => void
  onReorderSubObjectives: (startIndex: number, endIndex: number) => void
  inputValue: number
  setInputValue: (value: number) => void
  searchTerm?: string
}

export default function DraggableSubObjectives({
  subObjectives,
  onUpdateSubObjective,
  onCompleteSubObjective,
  onResetSubObjective,
  onResetSubObjectiveRepetitions,
  onReorderSubObjectives,
  inputValue,
  setInputValue,
  searchTerm = "",
}: DraggableSubObjectivesProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 3

  // Filtrar subobjetivos baseado na busca
  const filteredSubObjectives = subObjectives.filter((subObj) => {
    const searchQuery = searchTerm || localSearchTerm
    if (!searchQuery) return true
    return (
      subObj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subObj.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Calcular paginação
  const totalPages = Math.ceil(filteredSubObjectives.length / itemsPerPage)
  const startIndex = currentPage * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPageItems = filteredSubObjectives.slice(startIndex, endIndex)

  // Resetar página quando a busca muda
  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value)
    setCurrentPage(0)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const startIndex = result.source.index + currentPage * itemsPerPage
    const endIndex = result.destination.index + currentPage * itemsPerPage

    if (startIndex !== endIndex) {
      onReorderSubObjectives(startIndex, endIndex)
    }
  }

  const handleUpdateSubObjective = (subObjectiveId: string, increment: boolean) => {
    const subObj = subObjectives.find((s) => s.id === subObjectiveId)
    if (subObj) {
      const newValue = increment
        ? Math.min(subObj.currentValue + inputValue, subObj.targetValue)
        : Math.max(subObj.currentValue - inputValue, 0)
      onUpdateSubObjective(subObjectiveId, newValue)
    }
  }

  // Função para verificar se pode repetir
  const canRepeat = (subObj: SubObjective) => {
    if (!subObj.isRepeatable || !subObj.completed) return false

    // Se é loop infinito, sempre pode repetir
    if (subObj.isInfiniteLoop) return true

    // Se tem limite máximo, verificar se ainda não atingiu
    if (subObj.maxRepetitions && subObj.currentRepetitions >= subObj.maxRepetitions) {
      return false
    }

    return true
  }

  const handleScrollUp = () => {
    setCurrentPage(Math.max(0, currentPage - 1))
  }

  const handleScrollDown = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {!searchTerm && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar subobjetivos..."
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredSubObjectives.length)} de{" "}
            {filteredSubObjectives.length} subobjetivos
          </span>
          {totalPages > 1 && (
            <Badge variant="outline" className="text-xs">
              Página {currentPage + 1} de {totalPages}
            </Badge>
          )}
        </div>

        {/* Scroll Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollUp}
              disabled={currentPage === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {currentPage + 1}/{totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleScrollDown}
              disabled={currentPage === totalPages - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Draggable List - Limited to 3 items */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="subobjectives">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`space-y-3 min-h-[200px] ${snapshot.isDraggingOver ? "bg-muted/20 rounded-lg p-2" : ""}`}
            >
              {currentPageItems.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Circle className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhum subobjetivo encontrado</p>
                  </div>
                </div>
              ) : (
                currentPageItems.map((subObj, index) => (
                  <Draggable key={subObj.id} draggableId={subObj.id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`p-4 transition-all ${
                          snapshot.isDragging ? "shadow-lg rotate-2 bg-background border-primary" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="flex items-center justify-center w-6 h-6 rounded bg-muted hover:bg-muted/80 cursor-grab active:cursor-grabbing mt-1"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{subObj.name}</h4>
                                {subObj.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{subObj.description}</p>
                                )}

                                {/* Additional Info */}
                                <div className="flex items-center gap-2 mt-2">
                                  {subObj.isRepeatable && (
                                    <Badge
                                      variant={
                                        subObj.maxRepetitions && subObj.currentRepetitions >= subObj.maxRepetitions
                                          ? "destructive"
                                          : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      Rep: {subObj.currentRepetitions}
                                      {subObj.isInfiniteLoop ? "/∞" : `/${subObj.maxRepetitions || "?"}`}
                                      {subObj.maxRepetitions &&
                                        subObj.currentRepetitions >= subObj.maxRepetitions &&
                                        " (Máx)"}
                                    </Badge>
                                  )}
                                  {subObj.location && (
                                    <Badge variant="outline" className="text-xs text-blue-600">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {subObj.location.zone || subObj.location.coordinates || "Localização"}
                                    </Badge>
                                  )}
                                  {(subObj.totalGoldEarned > 0 ||
                                    subObj.goldReward.perCompletion > 0 ||
                                    subObj.goldReward.perPoint > 0) && (
                                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                      <Coins className="h-3 w-3 mr-1" />
                                      {subObj.totalGoldEarned}
                                      {!subObj.completed &&
                                        subObj.goldReward.perCompletion > 0 &&
                                        ` (+${subObj.goldReward.perCompletion})`}
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Badge variant={subObj.completed ? "default" : "outline"}>
                                  {subObj.currentValue}/{subObj.targetValue}
                                </Badge>
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                              <Progress value={(subObj.currentValue / subObj.targetValue) * 100} className="h-2" />

                              {/* Stats Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div className="flex items-center bg-muted/30 p-1 rounded">
                                  <Circle className="h-3 w-3 mr-1 text-purple-500" />
                                  <span className="text-muted-foreground">Atual:</span>
                                  <span className="font-medium ml-auto">{subObj.currentValue}</span>
                                </div>
                                <div className="flex items-center bg-muted/30 p-1 rounded">
                                  <Trophy className="h-3 w-3 mr-1 text-purple-500" />
                                  <span className="text-muted-foreground">Meta:</span>
                                  <span className="font-medium ml-auto">{subObj.targetValue}</span>
                                </div>
                                <div className="flex items-center bg-muted/30 p-1 rounded">
                                  <ArrowRight className="h-3 w-3 mr-1 text-purple-500" />
                                  <span className="text-muted-foreground">Restante:</span>
                                  <span className="font-medium ml-auto">
                                    {subObj.targetValue - subObj.currentValue}
                                  </span>
                                </div>
                                <div className="flex items-center bg-muted/30 p-1 rounded">
                                  <Clock className="h-3 w-3 mr-1 text-purple-500" />
                                  <span className="text-muted-foreground">XP:</span>
                                  <span className="font-medium ml-auto">
                                    {typeof subObj.xpReward === "object" ? subObj.xpReward.perPoint : subObj.xpReward}
                                    /pt
                                  </span>
                                </div>
                              </div>

                              {/* Gold Stats */}
                              {(subObj.totalGoldEarned > 0 ||
                                subObj.goldReward.perCompletion > 0 ||
                                subObj.goldReward.perPoint > 0) && (
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="flex items-center bg-yellow-50 p-1 rounded border border-yellow-200">
                                    <Coins className="h-3 w-3 mr-1 text-yellow-600" />
                                    <span className="text-muted-foreground">Ganho:</span>
                                    <span className="font-medium ml-auto text-yellow-700">
                                      {subObj.totalGoldEarned}
                                    </span>
                                  </div>
                                  <div className="flex items-center bg-yellow-50 p-1 rounded border border-yellow-200">
                                    <Coins className="h-3 w-3 mr-1 text-yellow-600" />
                                    <span className="text-muted-foreground">Conclusão:</span>
                                    <span className="font-medium ml-auto text-yellow-700">
                                      {subObj.goldReward.perCompletion}
                                    </span>
                                  </div>
                                  <div className="flex items-center bg-yellow-50 p-1 rounded border border-yellow-200">
                                    <Coins className="h-3 w-3 mr-1 text-yellow-600" />
                                    <span className="text-muted-foreground">Ponto:</span>
                                    <span className="font-medium ml-auto text-yellow-700">
                                      {subObj.goldReward.perPoint}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-r-none"
                                  onClick={() => handleUpdateSubObjective(subObj.id, false)}
                                  disabled={subObj.completed || subObj.currentValue <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={inputValue}
                                  onChange={(e) => setInputValue(Number(e.target.value))}
                                  className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  min={1}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-l-none"
                                  onClick={() => handleUpdateSubObjective(subObj.id, true)}
                                  disabled={subObj.completed}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {!subObj.completed && (
                                <Button variant="outline" size="sm" onClick={() => onCompleteSubObjective(subObj.id)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Completar
                                </Button>
                              )}

                              {canRepeat(subObj) && (
                                <Button variant="outline" size="sm" onClick={() => onResetSubObjective(subObj.id)}>
                                  <RotateCcw className="h-4 w-4 mr-1" />
                                  Repetir
                                </Button>
                              )}

                              {subObj.isRepeatable &&
                                subObj.currentRepetitions > 0 &&
                                onResetSubObjectiveRepetitions && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Reset Rep.
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Resetar Repetições</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja resetar as repetições deste subobjetivo para zero? Esta
                                          ação não pode ser desfeita.
                                          <br />
                                          <br />
                                          <strong>Repetições atuais:</strong> {subObj.currentRepetitions}
                                          {subObj.maxRepetitions && (
                                            <>
                                              <br />
                                              <strong>Limite máximo:</strong> {subObj.maxRepetitions}
                                            </>
                                          )}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onResetSubObjectiveRepetitions(subObj.id)}>
                                          Confirmar Reset
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}

                              {/* Indicador quando atingiu limite máximo */}
                              {subObj.isRepeatable &&
                                !subObj.isInfiniteLoop &&
                                subObj.maxRepetitions &&
                                subObj.currentRepetitions >= subObj.maxRepetitions && (
                                  <Badge variant="destructive" className="text-xs">
                                    Limite Atingido
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Page Navigation Summary */}
      {totalPages > 1 && (
        <Card className="p-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredSubObjectives.length > itemsPerPage && (
                <>
                  <span className="font-medium">{filteredSubObjectives.length - endIndex} subobjetivos restantes</span>
                  {currentPage < totalPages - 1 && (
                    <span className="ml-2">
                      (Use <ChevronDown className="inline h-3 w-3" /> para ver mais)
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="text-xs"
              >
                Primeiro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
                className="text-xs"
              >
                Último
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
