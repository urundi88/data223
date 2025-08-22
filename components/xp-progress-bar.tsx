"use client"

import { usePlayer } from "@/contexts/player-context"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trophy, Zap } from "lucide-react"

interface XpProgressBarProps {
  className?: string
  showLevel?: boolean
  showNumbers?: boolean
  size?: "sm" | "md" | "lg"
}

export function XpProgressBar({
  className = "",
  showLevel = true,
  showNumbers = true,
  size = "md",
}: XpProgressBarProps) {
  const { playerStats } = usePlayer()

  const progress = (playerStats.xp / playerStats.nextLevelXp) * 100

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLevel && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Trophy className="h-3 w-3" />
          Nível {playerStats.level}
        </Badge>
      )}

      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-500" />
            <span className={`font-medium text-blue-600 ${textSizes[size]}`}>XP</span>
          </div>
          {showNumbers && (
            <span className={`${textSizes[size]} text-muted-foreground`}>
              {playerStats.xp.toLocaleString()} / {playerStats.nextLevelXp.toLocaleString()}
            </span>
          )}
        </div>
        <Progress value={progress} className={`${sizeClasses[size]} bg-blue-100`} />
        {showNumbers && (
          <div className={`text-right mt-1 ${textSizes[size]} text-muted-foreground`}>{Math.round(progress)}%</div>
        )}
      </div>
    </div>
  )
}
