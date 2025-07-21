"use client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("token")
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`
    const config = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem("token")
        window.location.href = "/login"
        throw new Error("Unauthorized - Please log in")
      }
      const error = await response.json().catch(() => ({ message: "An error occurred" }))
      throw new Error(error.message || "An error occurred")
    }

    return response.json()
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem("token", response.token)
    return response
  }

  async register(userData: { firstName: string; lastName: string; email: string; password: string }) {
    const response = await this.request<{ token: string; user: any }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
    localStorage.setItem("token", response.token)
    return response
  }

  async getMe() {
    return this.request<{ user: any }>("/auth/me")
  }

  logout() {
    localStorage.removeItem("token")
  }

  // Categories
  async getCategories(type?: "expense" | "income") {
    const params = type ? `?type=${type}` : ""
    return this.request<{ categories: any[] }>(`/categories${params}`)
  }

  async createCategory(categoryData: any) {
    return this.request<{ category: any }>("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    })
  }

  async updateCategory(id: string, categoryData: any) {
    return this.request<{ category: any }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    })
  }

  async deleteCategory(id: string) {
    return this.request<{ message: string }>(`/categories/${id}`, {
      method: "DELETE",
    })
  }

  // Expenses
  async getExpenses(params?: {
    startDate?: string
    endDate?: string
    category?: string
    limit?: number
    page?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const queryString = searchParams.toString()
    return this.request<{ expenses: any[]; pagination: any }>(`/expenses${queryString ? `?${queryString}` : ""}`)
  }

  async createExpense(expenseData: any) {
    return this.request<{ expense: any }>("/expenses", {
      method: "POST",
      body: JSON.stringify(expenseData),
    })
  }

  async updateExpense(id: string, expenseData: any) {
    return this.request<{ expense: any }>(`/expenses/${id}`, {
      method: "PUT",
      body: JSON.stringify(expenseData),
    })
  }

  async deleteExpense(id: string) {
    return this.request<{ message: string }>(`/expenses/${id}`, {
      method: "DELETE",
    })
  }

  // Income
  async getIncome(params?: {
    startDate?: string
    endDate?: string
    source?: string
    recurring?: boolean
    limit?: number
    page?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }
    const queryString = searchParams.toString()
    return this.request<{ income: any[]; pagination: any }>(`/income${queryString ? `?${queryString}` : ""}`)
  }

  async createIncome(incomeData: any) {
    return this.request<{ income: any }>("/income", {
      method: "POST",
      body: JSON.stringify(incomeData),
    })
  }

  async updateIncome(id: string, incomeData: any) {
    return this.request<{ income: any }>(`/income/${id}`, {
      method: "PUT",
      body: JSON.stringify(incomeData),
    })
  }

  async deleteIncome(id: string) {
    return this.request<{ message: string }>(`/income/${id}`, {
      method: "DELETE",
    })
  }

  // Budgets
  async getBudgets(period?: string) {
    const params = period ? `?period=${period}` : ""
    return this.request<{ budgets: any[] }>(`/budgets${params}`)
  }

  async createBudget(budgetData: any) {
    return this.request<{ budget: any }>("/budgets", {
      method: "POST",
      body: JSON.stringify(budgetData),
    })
  }

  async updateBudget(id: string, budgetData: any) {
    return this.request<{ budget: any }>(`/budgets/${id}`, {
      method: "PUT",
      body: JSON.stringify(budgetData),
    })
  }

  async deleteBudget(id: string) {
    return this.request<{ message: string }>(`/budgets/${id}`, {
      method: "DELETE",
    })
  }

  // Financial Goals
  async getGoals(category?: string) {
    const params = category ? `?category=${category}` : ""
    return this.request<{ goals: any[] }>(`/goals${params}`)
  }

  async createGoal(goalData: any) {
    return this.request<{ goal: any }>("/goals", {
      method: "POST",
      body: JSON.stringify(goalData),
    })
  }

  async updateGoal(id: string, goalData: any) {
    return this.request<{ goal: any }>(`/goals/${id}`, {
      method: "PUT",
      body: JSON.stringify(goalData),
    })
  }

  async deleteGoal(id: string) {
    return this.request<{ message: string }>(`/goals/${id}`, {
      method: "DELETE",
    })
  }

  async addFundsToGoal(id: string, amount: number) {
    return this.request<{ goal: any; progress: number }>(`/goals/${id}/fund`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  // Analytics
  async getAnalyticsOverview(period?: string) {
    const params = period ? `?period=${period}` : ""
    return this.request<{ overview: any }>(`/analytics/overview${params}`)
  }
}

export const api = new ApiClient()
