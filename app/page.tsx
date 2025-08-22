"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePlayer } from "@/contexts/player-context"
import { Progress } from "@/components/ui/progress"
import { Play, Settings } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { playerStats } = usePlayer()
  const [appWindow, setAppWindow] = useState<Window | null>(null)

  useEffect(() => {
    // Verificar se a janela ainda está aberta
    const checkWindow = setInterval(() => {
      if (appWindow && appWindow.closed) {
        setAppWindow(null)
      }
    }, 1000)

    return () => clearInterval(checkWindow)
  }, [appWindow])

  const launchApp = () => {
    // Fechar janela anterior se existir
    if (appWindow && !appWindow.closed) {
      appWindow.focus()
      return
    }

    // Abrir nova janela compacta
    const newWindow = window.open(
      "/dashboard",
      "game_tracker_app",
      "width=800,height=600,resizable=yes,scrollbars=yes,status=yes",
    )

    if (newWindow) {
      setAppWindow(newWindow)
    }
  }

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Game Objective Tracker</CardTitle>
          <CardDescription>Acompanhe seus objetivos, missões e guias de jogo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Nível {playerStats.level}</span>
              <span>
                {playerStats.xp} / {playerStats.nextLevelXp} XP
              </span>
            </div>
            <Progress value={(playerStats.xp / playerStats.nextLevelXp) * 100} />
          </div>

          <Button className="w-full h-16 text-lg" onClick={launchApp} disabled={!!appWindow && !appWindow.closed}>
            <Play className="mr-2 h-5 w-5" />
            {appWindow && !appWindow.closed ? "App Aberto" : "Iniciar Aplicativo"}
          </Button>

          <div className="flex justify-center">
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
