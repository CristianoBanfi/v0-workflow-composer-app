"use client"

import { useState } from "react"
import { ArrowLeft, ChevronDown, FileJson, X } from "lucide-react"
import type { Workflow } from "@/lib/workflow-types"
import { EMPRESA } from "@/lib/workflow-types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"

interface WorkflowTopbarProps {
  workflowName: string
  onNameChange: (name: string) => void
  isDraft: boolean
  onPublish: () => void
  workflow: Workflow | null
}

export function WorkflowTopbar({
  workflowName,
  onNameChange,
  isDraft,
  onPublish,
  workflow
}: WorkflowTopbarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(workflowName)
  const [showDataModal, setShowDataModal] = useState(false)

  const handleSave = () => {
    onNameChange(editValue)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setEditValue(workflowName)
      setIsEditing(false)
    }
  }

  const handleExport = () => {
    if (!workflow) return
    const dataStr = JSON.stringify(workflow, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "workflow.hwl.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <header className="h-[52px] bg-card border-b border-border flex items-center px-4 gap-4">
      {/* Back button */}
      <button 
        className="p-1 hover:bg-muted rounded transition-colors"
        aria-label="Volver"
      >
        <ArrowLeft size={20} className="text-muted-foreground" />
      </button>

      {/* Workflow name */}
      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="text-[14px] font-bold text-foreground bg-muted px-2 py-1 rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[14px] font-bold text-foreground hover:bg-muted px-2 py-1 rounded transition-colors"
          >
            {workflowName}
          </button>
        )}

        {/* Status badge */}
        {isDraft ? (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
            Borrador
          </span>
        ) : (
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#F0FDF4] text-[#16A34A]">
            Activo
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side buttons */}
      <div className="flex items-center gap-2">
        {/* View company data */}
        <Dialog open={showDataModal} onOpenChange={setShowDataModal}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted rounded-lg transition-colors">
              {"📋"} Ver datos empresa
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {"🏢"} {EMPRESA.nombre}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <h3 className="text-[12px] font-bold text-foreground mb-2">Servicios</h3>
                <div className="space-y-1 max-h-60 overflow-auto">
                  {EMPRESA.servicios.map((s) => (
                    <p key={s} className="text-[11px] text-muted-foreground">{s}</p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-foreground mb-2">Departamentos</h3>
                <div className="space-y-1">
                  {EMPRESA.departamentos.map((d) => (
                    <p key={d} className="text-[11px] text-muted-foreground">{d}</p>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[12px] font-bold text-foreground mb-2">Aprobadores + Roles</h3>
                <div className="space-y-1 mb-4">
                  {EMPRESA.usuarios.map((u) => (
                    <p key={u} className="text-[11px] text-muted-foreground">{u}</p>
                  ))}
                </div>
                <h4 className="text-[11px] font-medium text-foreground mb-1">Roles:</h4>
                <div className="space-y-1">
                  {EMPRESA.roles.map((r) => (
                    <p key={r} className="text-[11px] text-muted-foreground">{r}</p>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Export JSON */}
        <button 
          onClick={handleExport}
          disabled={!workflow}
          className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileJson size={14} />
          JSON
        </button>

        {/* Actualizar */}
        <button 
          disabled
          className="px-3 py-1.5 text-[12px] text-muted-foreground bg-muted rounded-lg cursor-not-allowed opacity-60"
        >
          Actualizar
        </button>

        {/* Publicar */}
        <button 
          onClick={onPublish}
          disabled={!workflow}
          className="px-4 py-1.5 text-[12px] font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publicar
        </button>
      </div>
    </header>
  )
}
