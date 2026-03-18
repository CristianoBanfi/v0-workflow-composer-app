"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

export interface ClarificationQuestion {
  id: string
  question: string
  options: string[]
}

interface ClarificationQuestionsProps {
  questions: ClarificationQuestion[]
  onSubmit: (answers: Record<string, string>) => void
  isSubmitting: boolean
  onCancel: () => void
}

export function ClarificationQuestions({
  questions,
  onSubmit,
  isSubmitting,
  onCancel
}: ClarificationQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  const allAnswered = questions.every(q => answers[q.id] && answers[q.id].trim() !== "")

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }))
    // Hide custom input if an option is selected
    setShowCustomInput(prev => ({ ...prev, [questionId]: false }))
  }

  const handleShowCustomInput = (questionId: string) => {
    setShowCustomInput(prev => ({ ...prev, [questionId]: true }))
  }

  const handleCustomValueChange = (questionId: string, value: string) => {
    setCustomValues(prev => ({ ...prev, [questionId]: value }))
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = () => {
    if (allAnswered && !isSubmitting) {
      onSubmit(answers)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Necesito algunas aclaraciones
        </p>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>

      {questions.map((question) => (
        <div key={question.id} className="space-y-2">
          <p className="text-sm text-foreground">{question.question}</p>
          
          <div className="flex flex-wrap gap-1.5">
            {question.options.map((option) => (
              <button
                key={option}
                onClick={() => handleSelectOption(question.id, option)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  answers[question.id] === option
                    ? "bg-[#5B5BD6] text-white border border-[#5B5BD6]"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          {!showCustomInput[question.id] ? (
            <button
              onClick={() => handleShowCustomInput(question.id)}
              className="text-xs text-[#5B5BD6] hover:underline"
            >
              + Escribir otra opcion
            </button>
          ) : (
            <input
              type="text"
              value={customValues[question.id] || ""}
              onChange={(e) => handleCustomValueChange(question.id, e.target.value)}
              placeholder="Escribi tu respuesta..."
              className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B5BD6] focus:border-transparent"
              autoFocus
            />
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || isSubmitting}
        className={`w-full py-2 px-4 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2 ${
          allAnswered && !isSubmitting
            ? "bg-[#5B5BD6] text-white hover:bg-[#5B5BD6]/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Generando workflow...
          </>
        ) : (
          "Confirmar y generar"
        )}
      </button>
    </div>
  )
}
