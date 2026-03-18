"use client"

export interface WorkflowListItem {
  id: string
  name: string
  description: string
  status: "Activo" | "Borrador"
  lastEditedDate: string
  lastEditedBy: string
}

// Simple in-memory store with localStorage persistence
const STORAGE_KEY = "workflow-composer-workflows"

function getInitialWorkflows(): WorkflowListItem[] {
  if (typeof window === "undefined") {
    return [
      {
        id: "1",
        name: "ejemplo",
        description: "",
        status: "Activo",
        lastEditedDate: "18/MAR/2026",
        lastEditedBy: "Cristiano Banfi"
      },
      {
        id: "2",
        name: "prueba solicitud computadora",
        description: "",
        status: "Activo",
        lastEditedDate: "18/FEB/2026",
        lastEditedBy: "Cristiano Banfi"
      }
    ]
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  
  // Default workflows
  const defaults: WorkflowListItem[] = [
    {
      id: "1",
      name: "ejemplo",
      description: "",
      status: "Activo",
      lastEditedDate: "18/MAR/2026",
      lastEditedBy: "Cristiano Banfi"
    },
    {
      id: "2",
      name: "prueba solicitud computadora",
      description: "",
      status: "Activo",
      lastEditedDate: "18/FEB/2026",
      lastEditedBy: "Cristiano Banfi"
    }
  ]
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  return defaults
}

let workflows: WorkflowListItem[] = []

export function getWorkflows(): WorkflowListItem[] {
  if (workflows.length === 0) {
    workflows = getInitialWorkflows()
  }
  return workflows
}

export function getWorkflowById(id: string): WorkflowListItem | undefined {
  return getWorkflows().find(w => w.id === id)
}

export function addWorkflow(workflow: Omit<WorkflowListItem, "id">): WorkflowListItem {
  const newWorkflow: WorkflowListItem = {
    ...workflow,
    id: Date.now().toString()
  }
  
  workflows = [newWorkflow, ...getWorkflows()]
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
  }
  
  return newWorkflow
}

export function updateWorkflow(id: string, updates: Partial<WorkflowListItem>): void {
  workflows = getWorkflows().map(w => 
    w.id === id ? { ...w, ...updates } : w
  )
  
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows))
  }
}

export function formatTodayDate(): string {
  const months = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"]
  const now = new Date()
  const day = now.getDate().toString().padStart(2, "0")
  const month = months[now.getMonth()]
  const year = now.getFullYear()
  return `${day}/${month}/${year}`
}
