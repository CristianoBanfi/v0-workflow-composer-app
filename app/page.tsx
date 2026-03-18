"use client"

import { useState, useCallback } from "react"
import { WorkflowTopbar } from "@/components/workflow-topbar"
import { WorkflowSidebar } from "@/components/workflow-sidebar"
import { WorkflowCanvas } from "@/components/workflow-canvas"
import { DEFAULT_WORKFLOW, TEMPLATES, type Workflow, type ChatMessage } from "@/lib/workflow-types"
import { Toaster, toast } from "sonner"

export default function WorkflowComposer() {
  const [workflow, setWorkflow] = useState<Workflow | null>(DEFAULT_WORKFLOW)
  const [workflowName, setWorkflowName] = useState("Solicitud de vacaciones")
  const [isDraft, setIsDraft] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>("vacaciones")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasApiKey] = useState(!!process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const handleSelectTemplate = useCallback((templateWorkflow: Workflow) => {
    setWorkflow(templateWorkflow)
    setWorkflowName(templateWorkflow.trigger)
    setIsDraft(true)
    const template = TEMPLATES.find(t => t.workflow.trigger === templateWorkflow.trigger)
    setSelectedTemplateId(template?.id || null)
    setMessages([])
  }, [])

  const handleGenerate = useCallback(async (text: string) => {
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text
    }
    setMessages(prev => [...prev, userMsg])
    setIsGenerating(true)
    setGenerationError(null)

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          currentWorkflow: workflow
        })
      })

      const data = await response.json()

      if (data.error) {
        // Check if it's a parsing/validation error or connection error
        if (data.error.includes("parsear") || data.error.includes("inválida")) {
          setGenerationError("No se pudo generar el workflow. Intentá con una descripción más detallada.")
        } else {
          setGenerationError("Error de conexión. Revisá tu API key e intentá de nuevo.")
        }
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${data.error}`
        }
        setMessages(prev => [...prev, errorMsg])
      } else if (data.workflow) {
        setWorkflow(data.workflow)
        setWorkflowName(data.workflow.trigger)
        setSelectedTemplateId(null)
        setIsDraft(true)
        
        const successMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Workflow generado: "${data.workflow.trigger}" con ${data.workflow.steps.length} pasos.`
        }
        setMessages(prev => [...prev, successMsg])
      }
    } catch {
      setGenerationError("Error de conexión. Revisá tu API key e intentá de nuevo.")
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error al conectar con el servidor."
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsGenerating(false)
    }
  }, [workflow])

  const handleClearError = useCallback(() => {
    setGenerationError(null)
  }, [])

  const handlePublish = useCallback(() => {
    setIsDraft(false)
    toast.success("Workflow publicado correctamente", {
      duration: 3000,
      icon: "✅"
    })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toaster position="top-center" richColors />
      <WorkflowTopbar
        workflowName={workflowName}
        onNameChange={setWorkflowName}
        isDraft={isDraft}
        onPublish={handlePublish}
        workflow={workflow}
      />
      <div className="flex flex-1 overflow-hidden">
        <WorkflowSidebar
          onSelectTemplate={handleSelectTemplate}
          onGenerate={handleGenerate}
          selectedTemplateId={selectedTemplateId}
          messages={messages}
          isGenerating={isGenerating}
          hasApiKey={hasApiKey}
          generationError={generationError}
          onClearError={handleClearError}
        />
        <WorkflowCanvas 
          workflow={workflow} 
          onWorkflowUpdate={setWorkflow}
        />
      </div>
    </div>
  )
}
