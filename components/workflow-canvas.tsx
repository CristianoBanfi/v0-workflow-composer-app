"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Workflow, Step } from "@/lib/workflow-types"
import {
  TriggerNode,
  ApprovalNode,
  UpdateNode,
  BranchNode,
  EndNode,
  Connector,
  ApprovedPill,
  RejectedPill,
  BranchPill
} from "./workflow-nodes"
import { Minus, Plus, Maximize2, Lock, Play, Square, Loader2, X } from "lucide-react"

interface WorkflowCanvasProps {
  workflow: Workflow | null
  onWorkflowUpdate?: (workflow: Workflow) => void
}

function buildTree(steps: Step[]): Map<string | null, Step[]> {
  const tree = new Map<string | null, Step[]>()
  
  steps.forEach(step => {
    const key = step.parent
    if (!tree.has(key)) {
      tree.set(key, [])
    }
    tree.get(key)!.push(step)
  })
  
  return tree
}

// Edit Popover Component
function EditPopover({
  step,
  position,
  onClose,
  onApply,
  isLoading,
  error
}: {
  step: Step
  position: { x: number; y: number }
  onClose: () => void
  onApply: (instruction: string) => void
  isLoading: boolean
  error: string | null
}) {
  const [instruction, setInstruction] = useState("")
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="fixed bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-56 z-50"
      style={{ 
        left: position.x + 280, 
        top: position.y,
        transform: "translateY(-50%)"
      }}
    >
      <p className="text-gray-400 text-xs mb-2">{"✏️"} Editar paso</p>
      <textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="¿Qué querés cambiar?"
        rows={3}
        disabled={isLoading}
        className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
      />
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      
      {isLoading ? (
        <div className="flex justify-center mt-2">
          <Loader2 size={16} className="animate-spin text-violet-600" />
        </div>
      ) : (
        <div className="flex gap-2 mt-2">
          <button
            onClick={onClose}
            className="text-gray-400 text-xs hover:text-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onApply(instruction)}
            disabled={!instruction.trim()}
            className="bg-violet-600 text-white text-xs rounded-lg px-3 py-1 hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}

interface RenderStepProps {
  step: Step
  tree: Map<string | null, Step[]>
  isLast: boolean
  onNodeClick: (step: Step, e: React.MouseEvent) => void
  highlightedNodeId: string | null
  simulationState: "idle" | "running" | "complete"
  currentNodeId: string | null
  visitedNodeIds: Set<string>
}

function RenderStep({ step, tree, isLast, onNodeClick, highlightedNodeId, simulationState, currentNodeId, visitedNodeIds }: RenderStepProps) {
  const children = tree.get(step.id) || []
  
  // For approval nodes, split by approved/rejected
  const approvedChildren = children.filter(c => c.branch === "approved")
  const rejectedChildren = children.filter(c => c.branch === "rejected")
  
  // For branch nodes, group by branch condition
  const isBranch = step.type === "branch"
  const branchConditions = isBranch ? step.conditions || [] : []

  const getNodeClasses = () => {
    const classes: string[] = []
    if (highlightedNodeId === step.id) {
      classes.push("ring-2 ring-green-400")
    }
    if (simulationState === "running") {
      if (currentNodeId === step.id) {
        classes.push("ring-2 ring-violet-500 bg-violet-50")
      } else if (visitedNodeIds.has(step.id)) {
        classes.push("bg-gray-50")
      }
    }
    return classes.join(" ")
  }
  
  const renderNode = () => {
    const nodeClasses = getNodeClasses()
    const handleClick = (e: React.MouseEvent) => {
      if (simulationState !== "running") {
        onNodeClick(step, e)
      }
    }
    
    switch (step.type) {
      case "approval":
        return (
          <div onClick={handleClick} className={`cursor-pointer transition-all duration-300 rounded-xl ${nodeClasses}`}>
            <ApprovalNode step={step} />
          </div>
        )
      case "update":
        return (
          <div onClick={handleClick} className={`cursor-pointer transition-all duration-300 rounded-xl ${nodeClasses}`}>
            <UpdateNode step={step} />
          </div>
        )
      case "branch":
        return (
          <div onClick={handleClick} className={`cursor-pointer transition-all duration-300 rounded-xl ${nodeClasses}`}>
            <BranchNode step={step} />
          </div>
        )
      default:
        return null
    }
  }

  // For approval with two branches
  if (step.type === "approval" && (approvedChildren.length > 0 || rejectedChildren.length > 0)) {
    return (
      <div className="flex flex-col items-center">
        {renderNode()}
        <Connector />
        <div className="flex gap-2 justify-center">
          <ApprovedPill />
          <RejectedPill />
        </div>
        <div className="flex gap-8 mt-0">
          {/* Approved branch */}
          <div className="flex flex-col items-center">
            <Connector />
            {approvedChildren.map((child, i) => (
              <RenderStep 
                key={child.id} 
                step={child} 
                tree={tree} 
                isLast={i === approvedChildren.length - 1}
                onNodeClick={onNodeClick}
                highlightedNodeId={highlightedNodeId}
                simulationState={simulationState}
                currentNodeId={currentNodeId}
                visitedNodeIds={visitedNodeIds}
              />
            ))}
            {approvedChildren.length === 0 && <EndNode />}
          </div>
          {/* Rejected branch */}
          <div className="flex flex-col items-center">
            <Connector />
            {rejectedChildren.map((child, i) => (
              <RenderStep 
                key={child.id} 
                step={child} 
                tree={tree} 
                isLast={i === rejectedChildren.length - 1}
                onNodeClick={onNodeClick}
                highlightedNodeId={highlightedNodeId}
                simulationState={simulationState}
                currentNodeId={currentNodeId}
                visitedNodeIds={visitedNodeIds}
              />
            ))}
            {rejectedChildren.length === 0 && <EndNode />}
          </div>
        </div>
      </div>
    )
  }

  // For branch nodes
  if (isBranch && branchConditions.length > 0) {
    return (
      <div className="flex flex-col items-center">
        {renderNode()}
        <Connector />
        <div className="flex gap-2 justify-center flex-wrap">
          {branchConditions.map((cond) => (
            <BranchPill key={cond} label={cond} />
          ))}
        </div>
        <div className="flex gap-6 mt-0">
          {branchConditions.map((cond) => {
            const branchChildren = children.filter(c => c.branch === cond)
            return (
              <div key={cond} className="flex flex-col items-center">
                <Connector />
                {branchChildren.map((child, i) => (
                  <RenderStep 
                    key={child.id} 
                    step={child} 
                    tree={tree} 
                    isLast={i === branchChildren.length - 1}
                    onNodeClick={onNodeClick}
                    highlightedNodeId={highlightedNodeId}
                    simulationState={simulationState}
                    currentNodeId={currentNodeId}
                    visitedNodeIds={visitedNodeIds}
                  />
                ))}
                {branchChildren.length === 0 && <EndNode />}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Simple linear flow
  return (
    <div className="flex flex-col items-center">
      {renderNode()}
      {children.length > 0 && (
        <>
          <Connector />
          {children.map((child, i) => (
            <RenderStep 
              key={child.id} 
              step={child} 
              tree={tree} 
              isLast={i === children.length - 1}
              onNodeClick={onNodeClick}
              highlightedNodeId={highlightedNodeId}
              simulationState={simulationState}
              currentNodeId={currentNodeId}
              visitedNodeIds={visitedNodeIds}
            />
          ))}
        </>
      )}
      {children.length === 0 && !isLast && (
        <>
          <Connector />
          <EndNode />
        </>
      )}
      {children.length === 0 && isLast && (
        <>
          <Connector />
          <EndNode />
        </>
      )}
    </div>
  )
}

export function WorkflowCanvas({ workflow, onWorkflowUpdate }: WorkflowCanvasProps) {
  const [zoom, setZoom] = useState(100)
  
  // Edit popover state
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null)
  
  // Simulation state
  const [simulationState, setSimulationState] = useState<"idle" | "running" | "complete">("idle")
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null)
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set())
  const [currentNodeName, setCurrentNodeName] = useState<string>("")
  const simulationTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 150))
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50))
  const handleReset = () => setZoom(100)

  // Clear simulation when workflow changes
  useEffect(() => {
    stopSimulation()
  }, [workflow])

  // Clear highlight after 1.5s
  useEffect(() => {
    if (highlightedNodeId) {
      const timer = setTimeout(() => setHighlightedNodeId(null), 1500)
      return () => clearTimeout(timer)
    }
  }, [highlightedNodeId])

  const handleNodeClick = useCallback((step: Step, e: React.MouseEvent) => {
    if (simulationState === "running") return
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopoverPosition({ x: rect.right, y: rect.top + rect.height / 2 })
    setEditingStep(step)
    setEditError(null)
  }, [simulationState])

  const handleClosePopover = useCallback(() => {
    setEditingStep(null)
    setEditError(null)
    setIsEditing(false)
  }, [])

  const handleApplyEdit = useCallback(async (instruction: string) => {
    if (!editingStep || !workflow || !onWorkflowUpdate) return
    
    setIsEditing(true)
    setEditError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: `This is the current HWL workflow JSON: ${JSON.stringify(workflow)}. The user clicked on node '${editingStep.id}' and wants to change it: ${instruction}. Return the complete updated HWL JSON. Modify ONLY that node. Keep all other nodes, edges, positions, and structure exactly the same. Return only valid JSON, no explanation.`,
          currentWorkflow: workflow
        })
      })

      const data = await response.json()

      if (data.error || !data.workflow) {
        setEditError("No se pudo aplicar el cambio. Intentá de nuevo.")
      } else {
        onWorkflowUpdate(data.workflow)
        setHighlightedNodeId(editingStep.id)
        handleClosePopover()
      }
    } catch {
      setEditError("No se pudo aplicar el cambio. Intentá de nuevo.")
    } finally {
      setIsEditing(false)
    }
  }, [editingStep, workflow, onWorkflowUpdate, handleClosePopover])

  // Get traversal order for simulation
  const getTraversalOrder = useCallback((wf: Workflow): Step[] => {
    const result: Step[] = []
    const tree = buildTree(wf.steps)
    
    const traverse = (parentId: string | null) => {
      const children = tree.get(parentId) || []
      for (const child of children) {
        result.push(child)
        // For branches, take the first branch (approved or first condition)
        if (child.type === "approval") {
          traverse(child.id)
          break // Only traverse approved branch
        } else if (child.type === "branch" && child.conditions?.length) {
          // Continue to first branch
          const firstBranch = child.conditions[0]
          const branchChildren = children.filter(c => c.branch === firstBranch)
          if (branchChildren.length === 0) {
            traverse(child.id)
          }
          break
        } else {
          traverse(child.id)
        }
      }
    }
    
    traverse(null)
    return result
  }, [])

  const startSimulation = useCallback(() => {
    if (!workflow) return
    
    setSimulationState("running")
    setVisitedNodeIds(new Set())
    setCurrentNodeId(null)
    setCurrentNodeName(workflow.trigger)

    const steps = getTraversalOrder(workflow)
    const timeouts: NodeJS.Timeout[] = []

    // Animate through each step
    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentNodeId(step.id)
        setCurrentNodeName(step.label)
        setVisitedNodeIds(prev => {
          const newSet = new Set(prev)
          if (index > 0) {
            newSet.add(steps[index - 1].id)
          }
          return newSet
        })
      }, (index + 1) * 750)
      timeouts.push(timeout)
    })

    // Mark completion
    const completeTimeout = setTimeout(() => {
      if (steps.length > 0) {
        setVisitedNodeIds(prev => {
          const newSet = new Set(prev)
          newSet.add(steps[steps.length - 1].id)
          return newSet
        })
      }
      setCurrentNodeId(null)
      setSimulationState("complete")
      setCurrentNodeName("")
      
      // Auto-reset after 2 seconds
      const resetTimeout = setTimeout(() => {
        setSimulationState("idle")
        setVisitedNodeIds(new Set())
      }, 2000)
      timeouts.push(resetTimeout)
    }, (steps.length + 1) * 750 + 900)
    timeouts.push(completeTimeout)

    simulationTimeoutsRef.current = timeouts
  }, [workflow, getTraversalOrder])

  const stopSimulation = useCallback(() => {
    simulationTimeoutsRef.current.forEach(clearTimeout)
    simulationTimeoutsRef.current = []
    setSimulationState("idle")
    setCurrentNodeId(null)
    setVisitedNodeIds(new Set())
    setCurrentNodeName("")
  }, [])

  if (!workflow) {
    return (
      <div 
        className="flex-1 flex flex-col items-center justify-center"
        style={{
          background: "radial-gradient(circle, #D4D4D8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "#F4F4F5"
        }}
      >
        <div className="text-6xl mb-4">{"🗂️"}</div>
        <p className="text-[15px] text-[#6B7280]">El workflow aparece acá</p>
        <p className="text-[12px] text-muted-foreground mt-1">
          Elegí un template o describí el flujo
        </p>
      </div>
    )
  }

  const tree = buildTree(workflow.steps)
  const rootSteps = tree.get(null) || []

  return (
    <div 
      className="flex-1 overflow-auto relative"
      style={{
        background: "radial-gradient(circle, #D4D4D8 1px, transparent 1px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#F4F4F5"
      }}
    >
      <div 
        className="flex flex-col items-center py-8 min-h-full"
        style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
      >
        <div className={`transition-all duration-300 ${simulationState === "running" && !currentNodeId ? "ring-2 ring-violet-500 bg-violet-50 rounded-xl" : ""}`}>
          <TriggerNode trigger={workflow.trigger} />
        </div>
        <Connector />
        {rootSteps.map((step, i) => (
          <RenderStep 
            key={step.id} 
            step={step} 
            tree={tree}
            isLast={i === rootSteps.length - 1}
            onNodeClick={handleNodeClick}
            highlightedNodeId={highlightedNodeId}
            simulationState={simulationState}
            currentNodeId={currentNodeId}
            visitedNodeIds={visitedNodeIds}
          />
        ))}
        {rootSteps.length === 0 && <EndNode />}
      </div>

      {/* Edit Popover */}
      {editingStep && (
        <EditPopover
          step={editingStep}
          position={popoverPosition}
          onClose={handleClosePopover}
          onApply={handleApplyEdit}
          isLoading={isEditing}
          error={editError}
        />
      )}

      {/* Simulation controls - bottom left */}
      <div className="fixed bottom-4 left-[316px] flex flex-col items-start gap-2">
        {/* Status bar */}
        {simulationState !== "idle" && (
          <div className="bg-white shadow-sm border border-gray-100 text-xs text-gray-600 px-3 py-1 rounded-full flex items-center gap-1.5">
            {simulationState === "running" ? (
              <>
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                <span>Ejecutando: {currentNodeName || "Inicio"}</span>
              </>
            ) : (
              <>
                <span className="text-green-600">{"✓"}</span>
                <span className="text-green-600">Flujo completado</span>
              </>
            )}
          </div>
        )}
        
        {/* Simulate button */}
        <button
          onClick={simulationState === "running" ? stopSimulation : startSimulation}
          className={`flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 shadow-sm transition-colors ${
            simulationState === "running" 
              ? "text-red-500 hover:bg-red-50" 
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {simulationState === "running" ? (
            <>
              <Square size={14} />
              Detener
            </>
          ) : (
            <>
              <Play size={14} />
              Simular ejecución
            </>
          )}
        </button>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-4 right-4 flex items-center gap-1 bg-card rounded-full px-2 py-1 shadow-md border border-border">
        <button 
          onClick={handleZoomOut}
          className="p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Alejar"
        >
          <Minus size={16} className="text-muted-foreground" />
        </button>
        <button 
          onClick={handleReset}
          className="px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {zoom}%
        </button>
        <button 
          onClick={handleZoomIn}
          className="p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Acercar"
        >
          <Plus size={16} className="text-muted-foreground" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button 
          onClick={handleReset}
          className="p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Ajustar"
        >
          <Maximize2 size={16} className="text-muted-foreground" />
        </button>
        <button 
          className="p-1 hover:bg-muted rounded-full transition-colors"
          aria-label="Bloquear"
        >
          <Lock size={16} className="text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}
