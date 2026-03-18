"use client"

import { useState, useCallback, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { WorkflowTopbar } from "@/components/workflow-topbar"
import { WorkflowSidebar } from "@/components/workflow-sidebar"
import { WorkflowCanvas } from "@/components/workflow-canvas"
import { DEFAULT_WORKFLOW, TEMPLATES, type Workflow, type ChatMessage } from "@/lib/workflow-types"
import type { CommunityData } from "@/app/api/community/route"
import { getWorkflowById, updateWorkflow } from "@/lib/workflows-store"
import { Toaster, toast } from "sonner"

export default function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [workflow, setWorkflow] = useState<Workflow | null>(DEFAULT_WORKFLOW)
  const [workflowName, setWorkflowName] = useState("")
  const [isDraft, setIsDraft] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasApiKey] = useState(!!process.env.NEXT_PUBLIC_HAS_ANTHROPIC_KEY)
  const [generationError, setGenerationError] = useState<string | null>(null)
  
  // Community data state
  const [communityData, setCommunityData] = useState<CommunityData | null>(null)
  const [communityError, setCommunityError] = useState<string | null>(null)
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false)

  // Load workflow data from store
  useEffect(() => {
    const storedWorkflow = getWorkflowById(id)
    if (storedWorkflow) {
      setWorkflowName(storedWorkflow.name)
      setIsDraft(storedWorkflow.status === "Borrador")
    } else {
      // Workflow not found, use default name
      setWorkflowName("Nuevo flujo de trabajo")
    }
  }, [id])

  // Update store when name changes
  const handleNameChange = useCallback((newName: string) => {
    setWorkflowName(newName)
    updateWorkflow(id, { name: newName })
  }, [id])

  const handleBack = useCallback(() => {
    router.push("/workflows")
  }, [router])

  const handleSelectTemplate = useCallback((templateWorkflow: Workflow) => {
    setWorkflow(templateWorkflow)
    setIsDraft(true)
    const template = TEMPLATES.find(t => t.workflow.trigger === templateWorkflow.trigger)
    setSelectedTemplateId(template?.id || null)
    setMessages([])
  }, [])

  const handleGenerate = useCallback(async (text: string, clarifications?: Record<string, string>) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: clarifications 
        ? `${text} (con aclaraciones: ${Object.values(clarifications).join(", ")})`
        : text
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
          currentWorkflow: workflow,
          clarifications
        })
      })

      const data = await response.json()

      if (data.error) {
        if (data.error.includes("parsear") || data.error.includes("invalida")) {
          setGenerationError("No se pudo generar el workflow. Intenta con una descripcion mas detallada.")
        } else {
          setGenerationError("Error de conexion. Revisa tu API key e intenta de nuevo.")
        }
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${data.error}`
        }
        setMessages(prev => [...prev, errorMsg])
      } else if (data.workflow) {
        setWorkflow(data.workflow)
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
      setGenerationError("Error de conexion. Revisa tu API key e intenta de nuevo.")
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
    updateWorkflow(id, { status: "Activo" })
    toast.success("Workflow publicado correctamente", {
      duration: 3000,
    })
  }, [id])

  return (
    <div className="h-screen flex flex-col bg-background">
      <Toaster position="top-center" richColors />
      <WorkflowTopbar
        workflowName={workflowName}
        onNameChange={handleNameChange}
        isDraft={isDraft}
        onPublish={handlePublish}
        workflow={workflow}
        communityData={communityData}
        onBack={handleBack}
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
          communityData={communityData}
          onCommunityChange={setCommunityData}
          communityError={communityError}
          onCommunityError={setCommunityError}
          isLoadingCommunity={isLoadingCommunity}
          onLoadingCommunity={setIsLoadingCommunity}
        />
        <WorkflowCanvas 
          workflow={workflow} 
          onWorkflowUpdate={setWorkflow}
        />
      </div>
    </div>
  )
}
