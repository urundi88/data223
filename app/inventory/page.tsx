"use client"

import { useState } from "react"
import { useInventory, type ItemType } from "@/contexts/inventory-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash, ChevronLeft, ChevronRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function InventoryPage() {
  const { items, addItem, removeItem } = useInventory()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<ItemType>("item")
  const [searchTerm, setSearchTerm] = useState("")

  // New item form state
  const [newItemName, setNewItemName] = useState("")
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [newItemDescription, setNewItemDescription] = useState("")

  const filteredItems = items
    .filter(
      (item) =>
        item.type === activeTab && (searchTerm === "" || item.name.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleAddNewItem = () => {
    if (!newItemName) {
      toast({
        title: "Error",
        description: "Item name is required",
        variant: "destructive",
      })
      return
    }

    addItem({
      name: newItemName,
      type: activeTab,
      quantity: newItemQuantity,
      description: newItemDescription || undefined,
    })

    // Reset form
    setNewItemName("")
    setNewItemQuantity(1)
    setNewItemDescription("")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Inventory</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Your Items</CardTitle>
                <div className="w-64">
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="item" value={activeTab} onValueChange={(value) => setActiveTab(value as ItemType)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="item">Items</TabsTrigger>
                  <TabsTrigger value="resource">Resources</TabsTrigger>
                  <TabsTrigger value="currency">Currencies</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No {activeTab}s found.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center p-3 border rounded-md hover:bg-accent"
                        >
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{item.quantity}</Badge>
                            <Button variant="destructive" size="icon" onClick={() => removeItem(item.id)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New {activeTab}</CardTitle>
              <CardDescription>Add a new {activeTab} to your inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="itemName">Name</Label>
                <Input
                  id="itemName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={`${activeTab} name`}
                />
              </div>

              <div>
                <Label htmlFor="itemQuantity">Quantity</Label>
                <Input
                  id="itemQuantity"
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(Number(e.target.value))}
                  min={1}
                />
              </div>

              <div>
                <Label htmlFor="itemDescription">Description (Optional)</Label>
                <Input
                  id="itemDescription"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="Description"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleAddNewItem} className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Add {activeTab}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <Link href="/dashboard">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar para Dashboard
          </Button>
        </Link>
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
        <Button variant="outline" disabled>
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
