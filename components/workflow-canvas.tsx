"use client"

import { useState } from "react"
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
import { Minus, Plus, Maximize2, Lock } from "lucide-react"

interface WorkflowCanvasProps {
  workflow: Workflow | null
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

function RenderStep({ step, tree, isLast }: { step: Step; tree: Map<string | null, Step[]>; isLast: boolean }) {
  const children = tree.get(step.id) || []
  
  // For approval nodes, split by approved/rejected
  const approvedChildren = children.filter(c => c.branch === "approved")
  const rejectedChildren = children.filter(c => c.branch === "rejected")
  
  // For branch nodes, group by branch condition
  const isBranch = step.type === "branch"
  const branchConditions = isBranch ? step.conditions || [] : []
  
  const renderNode = () => {
    switch (step.type) {
      case "approval":
        return <ApprovalNode step={step} />
      case "update":
        return <UpdateNode step={step} />
      case "branch":
        return <BranchNode step={step} />
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

export function WorkflowCanvas({ workflow }: WorkflowCanvasProps) {
  const [zoom, setZoom] = useState(100)

  const handleZoomIn = () => setZoom(Math.min(zoom + 10, 150))
  const handleZoomOut = () => setZoom(Math.max(zoom - 10, 50))
  const handleReset = () => setZoom(100)

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
        <TriggerNode trigger={workflow.trigger} />
        <Connector />
        {rootSteps.map((step, i) => (
          <RenderStep 
            key={step.id} 
            step={step} 
            tree={tree}
            isLast={i === rootSteps.length - 1}
          />
        ))}
        {rootSteps.length === 0 && <EndNode />}
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
