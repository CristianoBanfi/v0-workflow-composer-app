import { NextResponse } from "next/server"
import { EMPRESA } from "@/lib/workflow-types"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export interface ClarificationQuestion {
  id: string
  question: string
  options: string[]
}

export interface InterpretResponse {
  needs_clarification: boolean
  questions?: ClarificationQuestion[]
}

export async function POST(request: Request) {
  try {
    const { userText } = await request.json()

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key de Anthropic no configurada" },
        { status: 500 }
      )
    }

    // Build approvers list with department info
    const approversWithDept = EMPRESA.usuarios.map((user, idx) => {
      const deptIndex = idx % EMPRESA.departamentos.length
      const roleIndex = idx % EMPRESA.roles.length
      return `${user} - ${EMPRESA.roles[roleIndex]} - ${EMPRESA.departamentos[deptIndex]}`
    })

    const systemPrompt = `Sos un asistente que ayuda a configurar workflows de RRHH para la empresa ${EMPRESA.nombre}. Tenés acceso a estos datos reales de la empresa:

Departamentos: ${EMPRESA.departamentos.join(", ")}
Aprobadores:
${approversWithDept.join("\n")}
Servicios: ${EMPRESA.servicios.join(", ")}

El usuario describió un workflow en español informal y coloquial.
Tu trabajo es:
1. Identificar referencias ambiguas que necesiten aclaración antes de generar el workflow. Una referencia es ambigua cuando:
   - El usuario menciona un departamento pero hay múltiples aprobadores en ese departamento (preguntá cuál)
   - El usuario menciona un rol pero varias personas tienen ese rol (preguntá cuál)
   - El usuario menciona un paso que podría corresponder a múltiples servicios (preguntá cuál)
   - Una condición o resultado no está claro (preguntá qué debería pasar)
2. Si hay ambiguedades, respondé SOLO con un JSON:
   {
     "needs_clarification": true,
     "questions": [
       {
         "id": "q1",
         "question": "En Marketing hay varias personas. ¿Quién debería aprobar?",
         "options": ["Laura Méndez - Jefa de Marketing", "Carlos Soto - Analista"]
       }
     ]
   }
3. Si la descripción es lo suficientemente clara para generar el workflow, respondé:
   { "needs_clarification": false }

Siempre respondé en español. Mantené las preguntas cortas y amigables.
NUNCA generes el workflow JSON en este paso.
Respondé SOLO con JSON válido, sin markdown ni explicaciones.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Descripción del usuario: "${userText}"`
          }
        ],
        system: systemPrompt
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Anthropic API error:", errorData)
      return NextResponse.json(
        { error: "Error al comunicarse con la API de Anthropic" },
        { status: 500 }
      )
    }

    const data = await response.json()
    const content = data.content[0]?.text

    if (!content) {
      return NextResponse.json(
        { error: "Respuesta vacía de la API" },
        { status: 500 }
      )
    }

    try {
      // Clean up content - remove markdown if present
      let cleanContent = content.trim()
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7)
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3)
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3)
      }
      cleanContent = cleanContent.trim()

      const result: InterpretResponse = JSON.parse(cleanContent)
      return NextResponse.json(result)
    } catch {
      console.error("Failed to parse interpretation JSON:", content)
      // If parsing fails, assume no clarification needed
      return NextResponse.json({ needs_clarification: false })
    }
  } catch (error) {
    console.error("Interpret error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
