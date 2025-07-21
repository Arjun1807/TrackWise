"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, Download, Upload, TrendingUp, MoreHorizontal } from "lucide-react"
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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
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
import { useData } from "@/contexts/DataContext"
import { api } from "@/lib/api"

export default function IncomePage() {
  const [income, setIncome] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSource, setSelectedSource] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [newIncome, setNewIncome] = useState({
    description: "",
    amount: "",
    source: "",
    date: new Date(),
    recurring: false,
    notes: "",
  })

  const { refreshData, refreshTrigger } = useData()

  useEffect(() => {
    fetchData()
  }, [refreshTrigger]) // Listen for refresh triggers

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [incomeResponse, categoriesResponse] = await Promise.all([
        api.getIncome({ limit: 100 }),
        api.getCategories("income"),
      ])
      setIncome(incomeResponse.income)
      setCategories(categoriesResponse.categories)
    } catch (error: any) {
      setError(error.message || "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredIncome = income.filter((item) => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSource = selectedSource === "all" || item.source?._id === selectedSource
    return matchesSearch && matchesSource
  })

  const handleAddIncome = async () => {
    if (newIncome.description && newIncome.amount && newIncome.source) {
      try {
        const incomeData = {
          description: newIncome.description,
          amount: Number.parseFloat(newIncome.amount),
          source: newIncome.source,
          date: newIncome.date.toISOString(),
          recurring: newIncome.recurring,
          notes: newIncome.notes,
        }

        const response = await api.createIncome(incomeData)
        setIncome([response.income, ...income])
        setNewIncome({
          description: "",
          amount: "",
          source: "",
          date: new Date(),
          recurring: false,
          notes: "",
        })
        setIsAddDialogOpen(false)

        // Trigger data refresh across the app
        refreshData()
      } catch (error: any) {
        setError(error.message || "Failed to create income")
      }
    }
  }

  const handleDeleteIncome = async () => {
    if (selectedIncome) {
      try {
        await api.deleteIncome(selectedIncome._id)
        setIncome(income.filter((item) => item._id !== selectedIncome._id))
        setIsDeleteDialogOpen(false)
        setSelectedIncome(null)

        // Trigger data refresh across the app
        refreshData()
      } catch (error: any) {
        setError(error.message || "Failed to delete income")
      }
    }
  }

  const openDeleteDialog = (incomeItem: any) => {
    setSelectedIncome(incomeItem)
    setIsDeleteDialogOpen(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0)
  const recurringIncome = filteredIncome.filter((item) => item.recurring).reduce((sum, item) => sum + item.amount, 0)
  const oneTimeIncome = filteredIncome.filter((item) => !item.recurring).reduce((sum, item) => sum + item.amount, 0)

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
            <h1 className="text-3xl font-bold tracking-tight">Income</h1>
            <p className="text-muted-foreground">Track and manage your income sources</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
                <DialogDescription>Enter the details of your income source here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Enter income description"
                    value={newIncome.description}
                    onChange={(e) => setNewIncome({ ...newIncome, description: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={newIncome.source}
                    onValueChange={(value) => setNewIncome({ ...newIncome, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select income source" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((source) => (
                        <SelectItem key={source._id} value={source._id}>
                          <div className="flex items-center gap-2">
                            <span>{source.icon}</span>
                            <span>{source.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newIncome.date, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newIncome.date}
                        onSelect={(date) => date && setNewIncome({ ...newIncome, date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={newIncome.recurring}
                    onChange={(e) => setNewIncome({ ...newIncome, recurring: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="recurring">Recurring income</Label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes..."
                    value={newIncome.notes}
                    onChange={(e) => setNewIncome({ ...newIncome, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddIncome}>
                  Add Income
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
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-muted-foreground">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recurring Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(recurringIncome)}</div>
              <p className="text-xs text-muted-foreground">Monthly recurring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">One-time Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(oneTimeIncome)}</div>
              <p className="text-xs text-muted-foreground">Non-recurring</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search income..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {categories.map((source) => (
                      <SelectItem key={source._id} value={source._id}>
                        <div className="flex items-center gap-2">
                          <span>{source.icon}</span>
                          <span>{source.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Income List */}
        <Card>
          <CardHeader>
            <CardTitle>Income Transactions</CardTitle>
            <CardDescription>{filteredIncome.length} income sources found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredIncome.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{item.source?.icon || "💰"}</div>
                      <div className="flex flex-col">
                        <div className="font-medium">{item.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {item.notes && <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary">{item.source?.name || "Other"}</Badge>
                      {item.recurring && (
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">+{formatCurrency(item.amount)}</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-red-600">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {filteredIncome.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No income found matching your criteria.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the income "{selectedIncome?.description}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteIncome} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
