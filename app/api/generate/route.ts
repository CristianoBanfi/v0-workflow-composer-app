import { NextResponse } from "next/server"
import { EMPRESA, type Workflow, type Step } from "@/lib/workflow-types"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(request: Request) {
  try {
    const { userText, currentWorkflow } = await request.json()

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "API key de Anthropic no configurada" },
        { status: 500 }
      )
    }

    const systemPrompt = `Sos un asistente que genera workflows de automatización para una plataforma de RRHH llamada Humand.

DATOS DE LA EMPRESA:
- Nombre: ${EMPRESA.nombre}
- Servicios disponibles: ${EMPRESA.servicios.join(", ")}
- Departamentos: ${EMPRESA.departamentos.join(", ")}
- Usuarios/Aprobadores: ${EMPRESA.usuarios.join(", ")}
- Roles de aprobación: ${EMPRESA.roles.join(", ")}

TIPOS DE DATOS:
\`\`\`typescript
type StepType = "approval" | "update" | "branch"

interface Step {
  id: string
  type: StepType
  label: string
  parent: string | null
  branch: string | null
  // approval
  approvers?: string[]
  condition?: "Todos deben aprobar" | "Al menos uno debe aprobar"
  // update
  status?: "En proceso" | "En espera" | "Cerrada" | "Cancelada"
  // branch
  conditions?: string[]
}

interface Workflow {
  trigger: string
  steps: Step[]
}
\`\`\`

REGLAS:
1. Solo devolvé JSON puro que coincida exactamente con el tipo Workflow
2. NO incluyas markdown, explicaciones ni texto adicional
3. Los IDs de steps deben ser únicos (s1, s2, s3, etc.)
4. El trigger debe ser uno de los servicios disponibles
5. Los approvers deben ser roles válidos (Jefe directo, Jefe de segundo nivel, Aprobador designado) o nombres de usuarios
6. Los status válidos son: "En proceso", "En espera", "Cerrada", "Cancelada"
7. branch puede ser "approved", "rejected" o una condición del branch node
8. Para approval nodes, siempre incluí los dos outcomes: approved (Cerrada) y rejected (Cancelada)
${currentWorkflow ? "\n9. IMPORTANTE: Modificá el workflow existente sin eliminar pasos existentes, solo agregá o modificá según lo pedido." : ""}

${currentWorkflow ? `WORKFLOW ACTUAL:\n${JSON.stringify(currentWorkflow, null, 2)}` : ""}

Respondé SOLO con el JSON del Workflow.`

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: userText
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
      // Try to parse the JSON response
      let workflow: Workflow
      
      // Remove any markdown code blocks if present
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

      workflow = JSON.parse(cleanContent)

      // Validate basic structure
      if (!workflow.trigger || !Array.isArray(workflow.steps)) {
        throw new Error("Estructura de workflow inválida")
      }

      return NextResponse.json({ workflow })
    } catch {
      console.error("Failed to parse workflow JSON:", content)
      return NextResponse.json(
        { error: "Error al parsear la respuesta del modelo" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate workflow error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
