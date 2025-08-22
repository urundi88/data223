import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { PlayerProvider } from "@/contexts/player-context"
import { InventoryProvider } from "@/contexts/inventory-context"
import { ObjectivesProvider } from "@/contexts/objectives-context"
import { MissionsProvider } from "@/contexts/missions-context"
import { GuidesProvider } from "@/contexts/guides-context"
import { ProfilesProvider } from "@/contexts/profiles-context"
import { QuickMissionsProvider } from "@/contexts/quick-missions-context"
import { SessionProfilesProvider } from "@/contexts/session-profiles-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProfilesProvider>
          <SessionProfilesProvider>
            <PlayerProvider>
              <InventoryProvider>
                <ObjectivesProvider>
                  <MissionsProvider>
                    <GuidesProvider>
                      <QuickMissionsProvider>
                        {children}
                        <Toaster />
                      </QuickMissionsProvider>
                    </GuidesProvider>
                  </MissionsProvider>
                </ObjectivesProvider>
              </InventoryProvider>
            </PlayerProvider>
          </SessionProfilesProvider>
        </ProfilesProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
