"use client"

import { useState } from "react"
import { useSessionProfiles } from "@/contexts/session-profiles-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Package, Plus, Settings, X } from "lucide-react"
import Link from "next/link"

interface SessionProfileSelectorProps {
  selectedProfileId?: string | null
  onProfileChange?: (profileId: string | null) => void
  showCreateButton?: boolean
  showManageButton?: boolean
  compact?: boolean
}

export function SessionProfileSelector({
  selectedProfileId,
  onProfileChange,
  showCreateButton = true,
  showManageButton = true,
  compact = false,
}: SessionProfileSelectorProps) {
  const { profiles, activeProfile, setActiveProfile } = useSessionProfiles()
  const [isOpen, setIsOpen] = useState(false)

  const currentProfile = selectedProfileId ? profiles.find((p) => p.id === selectedProfileId) : activeProfile

  const handleProfileSelect = (profileId: string | null) => {
    if (onProfileChange) {
      onProfileChange(profileId)
    } else {
      const profile = profileId ? profiles.find((p) => p.id === profileId) : null
      setActiveProfile(profile || null)
    }
    setIsOpen(false)
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Select
          value={currentProfile?.id || "none"}
          onValueChange={(value) => handleProfileSelect(value === "none" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {currentProfile ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentProfile.color || "#6366f1" }}
                  />
                  <span className="truncate">{currentProfile.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Nenhum profile</span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-muted-foreground">Nenhum profile</span>
            </SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: profile.color || "#6366f1" }} />
                  <span>{profile.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCreateButton && (
          <Link href="/content-packs">
            <Button size="sm" variant="outline">
              <Plus className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Sub-Profile de Sessão</h3>
        <div className="flex gap-1">
          {showCreateButton && (
            <Link href="/content-packs">
              <Button size="sm" variant="outline">
                <Plus className="h-3 w-3 mr-1" />
                Novo
              </Button>
            </Link>
          )}
          {showManageButton && (
            <Link href="/content-packs">
              <Button size="sm" variant="outline">
                <Settings className="h-3 w-3 mr-1" />
                Gerenciar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {currentProfile ? (
        <div className="p-3 rounded-lg border bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: currentProfile.color || "#6366f1" }} />
              <div>
                <div className="font-medium text-sm">{currentProfile.name}</div>
                {currentProfile.description && (
                  <div className="text-xs text-muted-foreground">{currentProfile.description}</div>
                )}
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => handleProfileSelect(null)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Package className="h-4 w-4 mr-2" />
              Selecionar Sub-Profile
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Escolher Sub-Profile</h4>
              <div className="space-y-1">
                {profiles.length === 0 ? (
                  <div className="text-center py-4">
                    <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground mb-2">Nenhum sub-profile criado</p>
                    <Link href="/content-packs">
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        Criar Primeiro
                      </Button>
                    </Link>
                  </div>
                ) : (
                  profiles.map((profile) => (
                    <Button
                      key={profile.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2"
                      onClick={() => handleProfileSelect(profile.id)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: profile.color || "#6366f1" }}
                        />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{profile.name}</div>
                          {profile.description && (
                            <div className="text-xs text-muted-foreground truncate">{profile.description}</div>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
