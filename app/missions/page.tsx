"use client"

import { useState } from "react"
import { useMissions } from "@/contexts/missions-context"
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

export default function MissionsPage() {
  const { missions, categories, deleteMission, completeMission } = useMissions()
  const { activeProfile, addMissionToProfile, removeMissionFromProfile } = useSessionProfiles()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  // Filtrar missões baseado no profile ativo
  const profileFilteredMissions = activeProfile
    ? missions.filter((mission) => activeProfile.missionIds.includes(mission.id))
    : missions

  const filteredMissions = profileFilteredMissions
    .filter(
      (mission) =>
        (activeTab === "all" || mission.type === activeTab) &&
        (selectedCategory === "all" || mission.category === selectedCategory),
    )
    .sort((a, b) => {
      // Sort by completion status first, then by creation date
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const handleToggleMissionInProfile = (missionId: string) => {
    if (!activeProfile) return

    const isInProfile = activeProfile.missionIds.includes(missionId)
    if (isInProfile) {
      removeMissionFromProfile(activeProfile.id, missionId)
      toast({
        title: "Missão Removida",
        description: `Missão removida do profile "${activeProfile.name}".`,
      })
    } else {
      addMissionToProfile(activeProfile.id, missionId)
      toast({
        title: "Missão Adicionada",
        description: `Missão adicionada ao profile "${activeProfile.name}".`,
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
          <h1 className="text-3xl font-bold">Missions</h1>
        </div>
        <Link href="/missions/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Mission
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
            <TabsTrigger value="kill">Kill</TabsTrigger>
            <TabsTrigger value="dungeon">Dungeon</TabsTrigger>
            <TabsTrigger value="resource">Resource</TabsTrigger>
            <TabsTrigger value="collection">Collection</TabsTrigger>
            <TabsTrigger value="achievement">Achievement</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
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

      {filteredMissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {activeProfile ? `No missions found in profile "${activeProfile.name}".` : "No missions found."}
          </p>
          <Link href="/missions/create">
            <Button variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create New Mission
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className={mission.completed ? "border-green-500" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {mission.name}
                    {activeProfile && (
                      <Badge
                        variant={activeProfile.missionIds.includes(mission.id) ? "default" : "outline"}
                        className="text-xs"
                      >
                        {activeProfile.missionIds.includes(mission.id) ? "In Profile" : "Not in Profile"}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Badge variant="outline">{mission.category}</Badge>
                    <Badge variant={mission.completed ? "success" : "secondary"}>{mission.type}</Badge>
                  </div>
                </div>
                <CardDescription>{mission.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium">Objectives: </span>
                    <span className="text-sm">{mission.objectiveIds.length}</span>
                  </div>

                  {mission.rewards.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Rewards: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {mission.rewards.map((reward, index) => (
                          <Badge key={index} variant="outline">
                            {reward.amount} {reward.name} ({reward.type})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {mission.expiresAt && (
                    <div className="flex items-center mt-2 text-amber-500">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Expires: {new Date(mission.expiresAt).toLocaleString()}</span>
                    </div>
                  )}

                  {(typeof mission.xpReward === "object" ? mission.xpReward.perCompletion : mission.xpReward) > 0 && (
                    <div className="mt-2">
                      <Badge variant="outline">
                        XP:{" "}
                        {typeof mission.xpReward === "object"
                          ? `${mission.xpReward.perCompletion}${mission.xpReward.perPoint > 0 ? ` + ${mission.xpReward.perPoint}/pt` : ""}`
                          : mission.xpReward}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                  <Link href={`/missions/${mission.id}`}>
                    <Button variant="outline" size="sm">
                      Details
                    </Button>
                  </Link>
                  {activeProfile && (
                    <Button
                      variant={activeProfile.missionIds.includes(mission.id) ? "destructive" : "default"}
                      size="sm"
                      onClick={() => handleToggleMissionInProfile(mission.id)}
                    >
                      {activeProfile.missionIds.includes(mission.id) ? "Remove" : "Add"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {!mission.completed && (
                    <Button variant="outline" size="sm" onClick={() => completeMission(mission.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => deleteMission(mission.id)}>
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
