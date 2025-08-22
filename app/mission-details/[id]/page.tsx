// app/mission-details/[id]/page.tsx
// This is a new file, so we'll create a basic structure and incorporate the updates.

import type React from "react"
import { Circle, Trophy, ArrowRight, Clock } from "lucide-react" // Assuming you are using lucide-react for icons

interface Mission {
  id: string
  name: string
  description: string
  xpReward: number
  objectives: MissionObjective[]
}

interface MissionObjective {
  id: string
  name: string
  description: string
  xpReward: number
  details: ObjectiveDetails
}

interface ObjectiveDetails {
  currentValue: number
  totalValue: number
  missingValue: number
}

interface Props {
  params: { id: string }
}

const MissionDetailsPage: React.FC<Props> = ({ params }) => {
  // Dummy data for demonstration purposes
  const mission: Mission = {
    id: params.id,
    name: `Mission ${params.id}`,
    description: `Details for mission ${params.id}`,
    xpReward: 100,
    objectives: [
      {
        id: "1",
        name: "Objective 1",
        description: "Complete this objective",
        xpReward: 20,
        details: { currentValue: 5, totalValue: 10, missingValue: 5 },
      },
      {
        id: "2",
        name: "Objective 2",
        description: "Another objective to complete",
        xpReward: 30,
        details: { currentValue: 2, totalValue: 8, missingValue: 6 },
      },
    ],
  }

  const missionObjectives = mission.objectives
  const completedObjectives = missionObjectives.filter(
    (objective) => objective.details.currentValue >= objective.details.totalValue,
  ).length

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{mission.name}</h1>
      <p className="mb-4">{mission.description}</p>

      {/* Add information points next to the mission details */}
      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex items-center">
          <Circle className="h-4 w-4 mr-2 text-purple-500" />
          <div>
            <div className="text-muted-foreground">Objetivos Completos</div>
            <div className="font-medium">{completedObjectives}</div>
          </div>
        </div>
        <div className="flex items-center">
          <Trophy className="h-4 w-4 mr-2 text-purple-500" />
          <div>
            <div className="text-muted-foreground">Objetivos Totais</div>
            <div className="font-medium">{missionObjectives.length}</div>
          </div>
        </div>
        <div className="flex items-center">
          <ArrowRight className="h-4 w-4 mr-2 text-purple-500" />
          <div>
            <div className="text-muted-foreground">Objetivos Faltando</div>
            <div className="font-medium">{missionObjectives.length - completedObjectives}</div>
          </div>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-purple-500" />
          <div>
            <div className="text-muted-foreground">XP Recompensa</div>
            <div className="font-medium">{mission.xpReward}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-2">Objectives</h2>
      <ul>
        {mission.objectives.map((objective) => (
          <li key={objective.id} className="mb-2 p-2 border rounded">
            <h3 className="font-medium">{objective.name}</h3>
            <p className="text-sm text-gray-600">{objective.description}</p>

            {/* Add information next to each mission objective */}
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div className="flex items-center bg-muted/30 p-1 rounded">
                <Circle className="h-3 w-3 mr-1 text-purple-500" />
                <span className="text-muted-foreground">Pontos Atuais:</span>
                <span className="font-medium ml-auto">{objective.details.currentValue}</span>
              </div>
              <div className="flex items-center bg-muted/30 p-1 rounded">
                <Trophy className="h-3 w-3 mr-1 text-purple-500" />
                <span className="text-muted-foreground">Pontos Totais:</span>
                <span className="font-medium ml-auto">{objective.details.totalValue}</span>
              </div>
              <div className="flex items-center bg-muted/30 p-1 rounded">
                <ArrowRight className="h-3 w-3 mr-1 text-purple-500" />
                <span className="text-muted-foreground">Pontos Faltando:</span>
                <span className="font-medium ml-auto">{objective.details.missingValue}</span>
              </div>
              <div className="flex items-center bg-muted/30 p-1 rounded">
                <Clock className="h-3 w-3 mr-1 text-purple-500" />
                <span className="text-muted-foreground">XP Recompensa:</span>
                <span className="font-medium ml-auto">{objective.xpReward}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default MissionDetailsPage
