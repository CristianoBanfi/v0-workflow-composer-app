"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Workflow, ChatMessage } from "@/lib/workflow-types"
import { TEMPLATES } from "@/lib/workflow-types"
import { ChevronRight, ChevronDown, AlertTriangle, Loader2 } from "lucide-react"
import { ClarificationQuestions, type ClarificationQuestion } from "./clarification-questions"
import type { CommunityData } from "@/app/api/community/route"

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
  communityData: CommunityData | null
  onCommunityChange: (data: CommunityData | null) => void
  communityError: string | null
  onCommunityError: (error: string | null) => void
  isLoadingCommunity: boolean
  onLoadingCommunity: (loading: boolean) => void
}

export function WorkflowSidebar({
  onSelectTemplate,
  onGenerate,
  selectedTemplateId,
  messages,
  isGenerating,
  hasApiKey,
  generationError,
  onClearError,
  communityData,
  onCommunityChange,
  communityError,
  onCommunityError,
  isLoadingCommunity,
  onLoadingCommunity
}: WorkflowSidebarProps) {
  const [inputText, setInputText] = useState("")
  const [templatesExpanded, setTemplatesExpanded] = useState(false)
  const [historialExpanded, setHistorialExpanded] = useState(false)
  const [phase, setPhase] = useState<GenerationPhase>("idle")
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([])
  const [originalDescription, setOriginalDescription] = useState("")
  const [instanceId, setInstanceId] = useState("")
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch community data with debounce
  const fetchCommunityData = useCallback(async (id: string) => {
    if (!id.trim()) {
      onCommunityChange(null)
      onCommunityError(null)
      return
    }

    onLoadingCommunity(true)
    onCommunityError(null)

    try {
      const response = await fetch(`/api/community?instanceId=${encodeURIComponent(id.trim())}`)
      const data = await response.json()

      if (data.error) {
        onCommunityError(data.error)
        onCommunityChange(null)
      } else if (data.community) {
        onCommunityChange(data.community)
        onCommunityError(null)
      }
    } catch {
      onCommunityError("Error de conexion")
      onCommunityChange(null)
    } finally {
      onLoadingCommunity(false)
    }
  }, [onCommunityChange, onCommunityError, onLoadingCommunity])

  // Handle instance ID change with debounce
  const handleInstanceIdChange = useCallback((value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/\D/g, "")
    setInstanceId(numericValue)

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce API call
    debounceRef.current = setTimeout(() => {
      fetchCommunityData(numericValue)
    }, 600)
  }, [fetchCommunityData])

  // Handle blur - fetch immediately
  const handleInstanceIdBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    fetchCommunityData(instanceId)
  }, [instanceId, fetchCommunityData])

  // Fill textarea with history item
  const handleHistoryClick = useCallback((content: string) => {
    setInputText(content)
  }, [])

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
          rows={8}
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

      {/* Instance ID Input */}
      <div className="p-4 border-b border-border">
        <label className="text-xs font-medium text-gray-400 tracking-wider uppercase block mb-2">
          COMUNIDAD
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            value={instanceId}
            onChange={(e) => handleInstanceIdChange(e.target.value)}
            onBlur={handleInstanceIdBlur}
            placeholder="Instance ID (ej: 5924)"
            className={`w-full border rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 ${
              communityError ? "border-red-300" : "border-gray-200"
            }`}
          />
          {isLoadingCommunity && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-violet-400" />
            </div>
          )}
        </div>

        {/* Error state */}
        {communityError && (
          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
            <span>⚠</span> {communityError}
          </p>
        )}

        {/* Success state - Community data card */}
        {communityData && !communityError && (
          <div className="mt-3">
            <p className="font-semibold text-sm text-gray-800">
              {communityData.nombre}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 px-2 py-0.5">
                🏢 {communityData.departamentos.length} departamentos
              </span>
              <span className="bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 px-2 py-0.5">
                👤 {communityData.usuarios.length} usuarios
              </span>
              <span className="bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 px-2 py-0.5">
                ⚙️ {communityData.servicios.length} servicios
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-xs text-green-500">Conectado</span>
            </div>
            <p className="text-[9px] text-primary mt-2">
              Claude conoce estos datos al generar
            </p>
          </div>
        )}
      </div>

      {/* Historial - collapsible */}
      <div className="border-t border-border">
        <button
          onClick={() => setHistorialExpanded(!historialExpanded)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <span className="text-xs text-gray-300 tracking-wide">HISTORIAL</span>
          {historialExpanded ? (
            <ChevronDown size={12} className="text-gray-300" />
          ) : (
            <ChevronRight size={12} className="text-gray-300" />
          )}
        </button>
        
        {historialExpanded && (
          <div className="px-4 pb-3 space-y-1">
            {messages.filter(m => m.role === "user").slice(-3).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin historial</p>
            ) : (
              messages
                .filter(m => m.role === "user")
                .slice(-3)
                .map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => handleHistoryClick(msg.content)}
                    className="w-full text-left text-xs text-gray-400 truncate hover:text-gray-600 transition-colors py-0.5"
                    title={msg.content}
                  >
                    {msg.content}
                  </button>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
