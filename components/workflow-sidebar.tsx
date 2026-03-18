"use client"

import { useState, useEffect, useCallback } from "react"
import type { Workflow, ChatMessage } from "@/lib/workflow-types"
import { TEMPLATES, EMPRESA } from "@/lib/workflow-types"
import { ChevronRight, ChevronDown, AlertTriangle, Loader2 } from "lucide-react"
import { ClarificationQuestions, type ClarificationQuestion } from "./clarification-questions"

type GenerationPhase = "idle" | "interpreting" | "clarifying" | "generating"

interface WorkflowSidebarProps {
  onSelectTemplate: (workflow: Workflow) => void
  onGenerate: (text: string, clarifications?: Record<string, string>) => Promise<void>
  selectedTemplateId: string | null
  messages: ChatMessage[]
  isGenerating: boolean
  hasApiKey: boolean
  generationError: string | null
  onClearError: () => void
}

export function WorkflowSidebar({
  onSelectTemplate,
  onGenerate,
  selectedTemplateId,
  messages,
  isGenerating,
  hasApiKey,
  generationError,
  onClearError
}: WorkflowSidebarProps) {
  const [inputText, setInputText] = useState("")
  const [templatesExpanded, setTemplatesExpanded] = useState(false)
  const [phase, setPhase] = useState<GenerationPhase>("idle")
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([])
  const [originalDescription, setOriginalDescription] = useState("")

  // Clear error when user starts typing
  useEffect(() => {
    if (inputText && generationError) {
      onClearError()
    }
  }, [inputText, generationError, onClearError])

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (generationError) {
      const timer = setTimeout(() => {
        onClearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [generationError, onClearError])

  const handleSubmit = useCallback(async () => {
    if (!inputText.trim() || phase !== "idle") return
    
    const text = inputText.trim()
    setOriginalDescription(text)
    setPhase("interpreting")

    try {
      // Step 1: Interpretation - check if clarification is needed
      const interpretResponse = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: text })
      })

      const interpretData = await interpretResponse.json()

      if (interpretData.error) {
        // If interpretation fails, go directly to generation
        setPhase("generating")
        setInputText("")
        await onGenerate(text)
        setPhase("idle")
        return
      }

      if (interpretData.needs_clarification && interpretData.questions?.length > 0) {
        // Need clarification - show questions
        setClarificationQuestions(interpretData.questions)
        setPhase("clarifying")
      } else {
        // No clarification needed - generate directly
        setPhase("generating")
        setInputText("")
        await onGenerate(text)
        setPhase("idle")
      }
    } catch {
      // On error, try direct generation
      setPhase("generating")
      setInputText("")
      await onGenerate(text)
      setPhase("idle")
    }
  }, [inputText, phase, onGenerate])

  const handleClarificationSubmit = useCallback(async (answers: Record<string, string>) => {
    setPhase("generating")
    setInputText("")
    setClarificationQuestions([])
    await onGenerate(originalDescription, answers)
    setPhase("idle")
    setOriginalDescription("")
  }, [onGenerate, originalDescription])

  const handleCancelClarification = useCallback(() => {
    setPhase("idle")
    setClarificationQuestions([])
    setOriginalDescription("")
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isDisabled = phase !== "idle"
  const buttonLabel = phase === "interpreting" 
    ? "Analizando..." 
    : phase === "generating" 
    ? "Generando workflow..." 
    : "Generar workflow"

  return (
    <div className="w-[300px] bg-card border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-[13px] font-bold text-foreground flex items-center gap-1">
          Workflow Composer
        </h1>
        <p className="text-[11px] text-muted-foreground mt-1">
          Describi el proceso y Claude genera el workflow automaticamente.
        </p>
      </div>

      {/* Input area */}
      <div className="p-4 border-b border-border">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describi el proceso... Ej: solicitud de vacaciones con aprobacion del jefe. Si aprueba, cerrada. Si rechaza, cancelada."
          rows={4}
          className="w-full p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-[12px] resize-none placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isDisabled}
        />
        
        {/* Clarification questions - inline below textarea */}
        {phase === "clarifying" && clarificationQuestions.length > 0 && (
          <div className="mt-3 p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg">
            <ClarificationQuestions
              questions={clarificationQuestions}
              onSubmit={handleClarificationSubmit}
              isSubmitting={phase === "generating"}
              onCancel={handleCancelClarification}
            />
          </div>
        )}
        
        {/* Main button - hidden during clarification */}
        {phase !== "clarifying" && (
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isDisabled}
            className={`w-full mt-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
              inputText.trim() && !isDisabled
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            {isDisabled ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {buttonLabel}
              </>
            ) : (
              buttonLabel
            )}
          </button>
        )}
        
        {/* Error message */}
        {generationError && (
          <div className="mt-2 flex items-start gap-1.5 text-red-500">
            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs">{generationError}</p>
          </div>
        )}
        
        {!hasApiKey && !generationError && phase === "idle" && (
          <p className="text-[10px] text-[#F59E0B] text-center mt-2">
            Necesitas la API key para generacion real
          </p>
        )}
      </div>

      {/* Templates - COLLAPSIBLE */}
      <div className="border-b border-border">
        <button
          onClick={() => setTemplatesExpanded(!templatesExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <p className="text-[10px] uppercase text-muted-foreground font-medium tracking-wide">
            TEMPLATES
          </p>
          {templatesExpanded ? (
            <ChevronDown size={14} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={14} className="text-muted-foreground" />
          )}
        </button>
        
        {templatesExpanded && (
          <div className="px-4 pb-4 flex flex-col gap-2">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.workflow)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedTemplateId === template.id
                    ? "bg-muted border-2 border-primary"
                    : "bg-muted border-2 border-transparent hover:border-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{template.emoji}</span>
                  <div>
                    <p className="text-[12px] font-medium text-foreground">
                      {template.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {template.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Company snapshot */}
      <div className="p-4 border-b border-border">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-[12px] font-bold text-foreground">
            {EMPRESA.nombre}
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-[10px] text-muted-foreground">
              {EMPRESA.servicios.length} servicios
            </p>
            <p className="text-[10px] text-muted-foreground">
              {EMPRESA.departamentos.length} departamentos
            </p>
            <p className="text-[10px] text-muted-foreground">
              {EMPRESA.usuarios.length} aprobadores
            </p>
          </div>
          <p className="text-[9px] text-primary mt-3">
            Claude conoce estos datos al generar
          </p>
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-auto p-4">
        <p className="text-[10px] uppercase text-muted-foreground font-medium mb-2 tracking-wide">
          HISTORIAL
        </p>
        <div className="space-y-2">
          {messages.length === 0 ? (
            <p className="text-[11px] text-muted-foreground italic">
              Usa un template o describi el flujo...
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg text-[11px] ${
                  msg.role === "user"
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-primary"
                }`}
              >
                {msg.content}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
