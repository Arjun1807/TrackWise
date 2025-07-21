"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Search, MoreHorizontal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { api } from "@/lib/api"

const availableIcons = [
  // Food & Dining
  "🍽️",
  "🍕",
  "🍔",
  "🍟",
  "🌮",
  "🍜",
  "🍱",
  "🥗",
  "🍰",
  "☕",
  "🍺",
  "🥤",
  "🍎",
  "🥖",
  "🧀",
  // Transportation
  "🚗",
  "🚕",
  "🚌",
  "🚇",
  "✈️",
  "🚲",
  "🛵",
  "⛽",
  "🚁",
  "🚢",
  "🚂",
  "🚐",
  "🏍️",
  "🛻",
  "🚙",
  // Shopping & Retail
  "🛍️",
  "🛒",
  "👕",
  "👗",
  "👠",
  "💄",
  "📱",
  "💻",
  "📺",
  "🎮",
  "📚",
  "🎵",
  "🎨",
  "⌚",
  "💍",
  // Entertainment & Leisure
  "🎬",
  "🎭",
  "🎪",
  "🎸",
  "🎤",
  "🎯",
  "🎲",
  "🎳",
  "🏀",
  "⚽",
  "🎾",
  "🏊",
  // Health & Medical
  "🏥",
  "💊",
  "🩺",
  "💉",
  "🦷",
  "👓",
  "🧘",
  "🏃",
  "💪",
  "🧴",
  "🩹",
  "🌡️",
  "🚑",
  "⚕️",
  "🔬",
  // Home & Utilities
  "🏠",
  "⚡",
  "💡",
  "🔥",
  "💧",
  "📞",
  "🛏️",
  "🛋️",
  "🚿",
  "🧹",
  "🔧",
  "🔨",
  "🪑",
  "🚪",
  // Work & Business
  "💼",
  "📊",
  "📈",
  "📉",
  "💰",
  "💳",
  "🏢",
  "📝",
  "📋",
  "🖨️",
  "✉️",
  "📧",
  // Education
  "🎓",
  "✏️",
  "🖊️",
  "📐",
  "🧮",
  "🌍",
  "📖",
  "📓",
  "🎒",
  "👨‍🎓",
  "👩‍🎓",
  "🏫",
  // Finance & Investment
  "💎",
  "🏦",
  "💸",
  "🪙",
  "💵",
  "💴",
  "💶",
  "💷",
  "🧾",
  // Travel & Vacation
  "🏖️",
  "🗺️",
  "🧳",
  "📷",
  "🏨",
  "🎫",
  "🎡",
  "🎢",
  "🏰",
  "🗽",
  "🌴",
  "⛱️",
  // Gifts & Special Occasions
  "🎁",
  "🎂",
  "🎉",
  "🎊",
  "💐",
  "🌹",
  "💝",
  "🎈",
  "🎀",
  "💒",
  "👰",
  "🤵",
  "🍾",
  "🥂",
  // Miscellaneous
  "📦",
  "🔑",
  "🧸",
  "🧩",
  "🎠",
  "🃏",
]

const availableColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff88",
  "#ff0088",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
  "#f43f5e",
  "#8b5a2b",
  "#64748b",
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#7c2d12",
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "🍽️",
    color: "#8884d8",
    type: "expense",
    budget: "",
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const response = await api.getCategories()
      setCategories(response.categories)
    } catch (error: any) {
      setError(error.message || "Failed to load categories")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || category.type === selectedType
    return matchesSearch && matchesType
  })

  const handleAddCategory = async () => {
    if (newCategory.name) {
      try {
        const categoryData = {
          name: newCategory.name,
          icon: newCategory.icon,
          color: newCategory.color,
          type: newCategory.type,
          budget:
            newCategory.type === "expense" && newCategory.budget ? Number.parseFloat(newCategory.budget) : undefined,
        }

        const response = await api.createCategory(categoryData)
        setCategories([...categories, response.category])
        setNewCategory({
          name: "",
          icon: "🍽️",
          color: "#8884d8",
          type: "expense",
          budget: "",
        })
        setIsAddDialogOpen(false)
      } catch (error: any) {
        setError(error.message || "Failed to create category")
      }
    }
  }

  const handleEditCategory = async () => {
    if (selectedCategory && newCategory.name) {
      try {
        const categoryData = {
          name: newCategory.name,
          icon: newCategory.icon,
          color: newCategory.color,
          budget:
            newCategory.type === "expense" && newCategory.budget ? Number.parseFloat(newCategory.budget) : undefined,
        }

        const response = await api.updateCategory(selectedCategory._id, categoryData)
        const updatedCategories = categories.map((cat) => (cat._id === selectedCategory._id ? response.category : cat))
        setCategories(updatedCategories)
        setIsEditDialogOpen(false)
        setSelectedCategory(null)
      } catch (error: any) {
        setError(error.message || "Failed to update category")
      }
    }
  }

  const handleDeleteCategory = async () => {
    if (selectedCategory) {
      try {
        await api.deleteCategory(selectedCategory._id)
        setCategories(categories.filter((cat) => cat._id !== selectedCategory._id))
        setIsDeleteDialogOpen(false)
        setSelectedCategory(null)
      } catch (error: any) {
        setError(error.message || "Failed to delete category")
      }
    }
  }

  const openEditDialog = (category: any) => {
    setSelectedCategory(category)
    setNewCategory({
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      budget: category.budget?.toString() || "",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category)
    setIsDeleteDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const expenseCategories = filteredCategories.filter((cat) => cat.type === "expense")
  const incomeCategories = filteredCategories.filter((cat) => cat.type === "income")

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">Organize your income and expenses with custom categories</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>Add a new category to organize your transactions.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter category name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value) => setNewCategory({ ...newCategory, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon</Label>
                  <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        className={`w-8 h-8 rounded border-2 flex items-center justify-center text-lg hover:bg-accent ${
                          newCategory.icon === icon ? "border-primary bg-primary/10" : "border-gray-300"
                        }`}
                        onClick={() => setNewCategory({ ...newCategory, icon })}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="grid grid-cols-8 gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          newCategory.color === color ? "border-gray-900 dark:border-gray-100" : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewCategory({ ...newCategory, color })}
                      />
                    ))}
                  </div>
                </div>
                {newCategory.type === "expense" && (
                  <div className="grid gap-2">
                    <Label htmlFor="budget">Monthly Budget (Optional)</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newCategory.budget}
                      onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddCategory}>
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                {expenseCategories.length} expense, {incomeCategories.length} income
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expense Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expenseCategories.length}</div>
              <p className="text-xs text-muted-foreground">For tracking expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Income Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{incomeCategories.length}</div>
              <p className="text-xs text-muted-foreground">For tracking income</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <Badge variant={category.type === "expense" ? "destructive" : "default"} className="text-xs">
                      {category.type}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteDialog(category)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.budget && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Budget</span>
                      <span className="font-medium">{formatCurrency(category.budget)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">No categories found matching your criteria.</div>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  placeholder="Enter category name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {availableIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center text-lg hover:bg-accent ${
                        newCategory.icon === icon ? "border-primary bg-primary/10" : "border-gray-300"
                      }`}
                      onClick={() => setNewCategory({ ...newCategory, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategory.color === color ? "border-gray-900 dark:border-gray-100" : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                </div>
              </div>
              {selectedCategory?.type === "expense" && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-budget">Monthly Budget (Optional)</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleEditCategory}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category "{selectedCategory?.name}" and
                may affect existing transactions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
