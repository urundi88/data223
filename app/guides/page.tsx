"use client"

import { useState } from "react"
import { useGuides } from "@/contexts/guides-context"
import { useSessionProfiles } from "@/contexts/session-profiles-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, Clock, Plus, Trash, ChevronLeft, ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { SessionProfileSelector } from "@/components/session-profile-selector"
import { XpProgressBar } from "@/components/xp-progress-bar"

export default function GuidesPage() {
  const { guides, categories, deleteGuide, completeGuide } = useGuides()
  const { activeProfile, addGuideToProfile, removeGuideFromProfile } = useSessionProfiles()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Filtrar guias baseado no profile ativo
  const profileFilteredGuides = activeProfile
    ? guides.filter((guide) => activeProfile.guideIds.includes(guide.id))
    : guides

  const filteredGuides = profileFilteredGuides
    .filter(
      (guide) =>
        (activeTab === "all" ||
          (activeTab === "completed" && guide.completed) ||
          (activeTab === "active" && !guide.completed)) &&
        (selectedCategory === "all" || guide.category === selectedCategory),
    )
    .sort((a, b) => {
      // Sort by completion status first, then by creation date
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const handleToggleGuideInProfile = (guideId: string) => {
    if (!activeProfile) return

    const isInProfile = activeProfile.guideIds.includes(guideId)
    if (isInProfile) {
      removeGuideFromProfile(activeProfile.id, guideId)
      toast({
        title: "Guia Removido",
        description: `Guia removido do profile "${activeProfile.name}".`,
      })
    } else {
      addGuideToProfile(activeProfile.id, guideId)
      toast({
        title: "Guia Adicionado",
        description: `Guia adicionado ao profile "${activeProfile.name}".`,
      })
    }
  }

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
          <h1 className="text-3xl font-bold">Guides</h1>
        </div>
        <Link href="/guides/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Guide
          </Button>
        </Link>
      </div>

      {/* Adicionar após o título e antes dos filtros: */}
      <div className="mb-6">
        <XpProgressBar size="lg" />
      </div>

      {/* Session Profile Selector */}
      <div className="mb-6">
        <SessionProfileSelector />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredGuides.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {activeProfile ? `No guides found in profile "${activeProfile.name}".` : "No guides found."}
          </p>
          <Link href="/guides/create">
            <Button variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create New Guide
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map((guide) => (
            <Card key={guide.id} className={guide.completed ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {guide.name}
                    {activeProfile && (
                      <Badge
                        variant={activeProfile.guideIds.includes(guide.id) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {activeProfile.guideIds.includes(guide.id) ? "In Profile" : "Not in Profile"}
                      </Badge>
                    )}
                  </CardTitle>
                  <Badge variant="outline">{guide.category}</Badge>
                </div>
                <CardDescription>{guide.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Steps: </span>
                    <span className="text-sm">
                      {guide.steps.filter((step) => step.completed).length}/{guide.steps.length} completed
                    </span>
                  </div>

                  {guide.expiresAt && (
                    <div className="flex items-center mt-2 text-amber-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Expires: {new Date(guide.expiresAt).toLocaleString()}</span>
                    </div>
                  )}

                  {(typeof guide.xpReward === "object" ? guide.xpReward.perCompletion : guide.xpReward) > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline">
                        XP:{" "}
                        {typeof guide.xpReward === "object"
                          ? `${guide.xpReward.perCompletion}${guide.xpReward.perPoint > 0 ? ` + ${guide.xpReward.perPoint}/pt` : ""}`
                          : guide.xpReward}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Link href={`/guides/${guide.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                  {activeProfile && (
                    <Button
                      variant={activeProfile.guideIds.includes(guide.id) ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleGuideInProfile(guide.id)}
                    >
                      {activeProfile.guideIds.includes(guide.id) ? "Remove" : "Add"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!guide.completed && (
                    <Button variant="outline" size="sm" onClick={() => completeGuide(guide.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => deleteGuide(guide.id)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <Button variant="outline">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
        </div>
        <Button variant="outline">
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
