"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Trophy, Coins, Target, BookOpen, CheckCircle } from "lucide-react"
import { usePlayer } from "@/contexts/player-context"
import { useObjectives } from "@/contexts/objectives-context"
import { useMissions } from "@/contexts/missions-context"
import { useGuides } from "@/contexts/guides-context"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  const { playerStats } = usePlayer()
  const { objectives } = useObjectives()
  const { missions } = useMissions()
  const { guides } = useGuides()

  // Calculate stats
  const completedObjectives = objectives.filter((obj) => obj.completed).length
  const completedMissions = missions.filter((mission) => mission.completed).length
  const completedGuides = guides.filter((guide) => guide.completed).length

  const totalObjectiveGold = objectives.reduce((sum, obj) => sum + obj.totalGoldEarned, 0)
  const totalMissionGold = missions.reduce((sum, mission) => sum + mission.totalGoldEarned, 0)
  const totalGuideGold = guides.reduce((sum, guide) => sum + guide.totalGoldEarned, 0)

  const xpProgress = (playerStats.xp / playerStats.nextLevelXp) * 100

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Player Stats Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Status do Jogador</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nível</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.level}</div>
              <Progress value={xpProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {playerStats.xp}/{playerStats.nextLevelXp} XP
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ouro Total</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{playerStats.gold}</div>
              <p className="text-xs text-muted-foreground">Ouro atual</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ouro Ganho</CardTitle>
              <Coins className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {totalObjectiveGold + totalMissionGold + totalGuideGold}
              </div>
              <p className="text-xs text-muted-foreground">Total de recompensas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">XP Total</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{playerStats.xp}</div>
              <p className="text-xs text-muted-foreground">Experiência atual</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Progress Stats Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Progresso Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedObjectives}</div>
              <p className="text-xs text-muted-foreground">
                {completedObjectives}/{objectives.length} completos
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-yellow-600">Ouro: {totalObjectiveGold}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missões</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedMissions}</div>
              <p className="text-xs text-muted-foreground">
                {completedMissions}/{missions.length} completas
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-yellow-600">Ouro: {totalMissionGold}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guias</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedGuides}</div>
              <p className="text-xs text-muted-foreground">
                {completedGuides}/{guides.length} completos
              </p>
              <div className="mt-2 space-y-1">
                <div className="text-xs text-yellow-600">Ouro: {totalGuideGold}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Navegação Rápida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/profiles">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Perfis</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Gerenciar</div>
                <p className="text-xs text-muted-foreground">Salvar e carregar perfis</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/objectives">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{objectives.length}</div>
                <p className="text-xs text-muted-foreground">Gerenciar objetivos</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/missions">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Missões</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{missions.length}</div>
                <p className="text-xs text-muted-foreground">Gerenciar missões</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/guides">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guias</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{guides.length}</div>
                <p className="text-xs text-muted-foreground">Gerenciar guias</p>
              </CardContent>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  )
}
