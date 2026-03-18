import { NextResponse } from "next/server"

// Redash API configuration
const REDASH_API_KEY = process.env.REDASH_API_KEY
const REDASH_BASE_URL = process.env.REDASH_BASE_URL || "https://redash.humand.co"

export interface CommunityData {
  instanceId: string
  nombre: string
  departamentos: string[]
  usuarios: { nombre: string; rol: string }[]
  servicios: string[]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instanceId = searchParams.get("instanceId")

  if (!instanceId) {
    return NextResponse.json(
      { error: "Instance ID requerido" },
      { status: 400 }
    )
  }

  // For demo/development without Redash API key, return mock data
  if (!REDASH_API_KEY) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Mock data for demo purposes
    const mockCommunities: Record<string, CommunityData> = {
      "5924": {
        instanceId: "5924",
        nombre: "TechCorp Argentina",
        departamentos: ["Recursos Humanos", "Tecnologia", "Finanzas", "Marketing", "Operaciones", "Legal"],
        usuarios: [
          { nombre: "Maria Garcia", rol: "Jefe de RRHH" },
          { nombre: "Carlos Rodriguez", rol: "Gerente de TI" },
          { nombre: "Ana Martinez", rol: "Directora Financiera" },
          { nombre: "Juan Lopez", rol: "CEO" }
        ],
        servicios: [
          "Solicitud de vacaciones",
          "Solicitud de home office", 
          "Reembolso de gastos",
          "Licencia medica",
          "Pedido de equipamiento",
          "Alta de proveedor",
          "Solicitud de capacitacion"
        ]
      },
      "1234": {
        instanceId: "1234",
        nombre: "Startup Labs",
        departamentos: ["Producto", "Ingenieria", "People", "Growth"],
        usuarios: [
          { nombre: "Sofia Fernandez", rol: "People Lead" },
          { nombre: "Diego Ramirez", rol: "CTO" }
        ],
        servicios: [
          "Pedido de hardware",
          "Vacaciones",
          "Remote work"
        ]
      },
      "9999": {
        instanceId: "9999",
        nombre: "Corporacion Global SA",
        departamentos: ["RRHH", "IT", "Finanzas", "Comercial", "Logistica", "Calidad", "Compras", "Legales"],
        usuarios: [
          { nombre: "Roberto Sanchez", rol: "Director RRHH" },
          { nombre: "Laura Perez", rol: "Gerente IT" },
          { nombre: "Martin Gomez", rol: "CFO" },
          { nombre: "Patricia Ruiz", rol: "Gerente Comercial" },
          { nombre: "Eduardo Torres", rol: "CEO" }
        ],
        servicios: [
          "Solicitud de vacaciones",
          "Home office",
          "Reembolso de gastos",
          "Licencia medica",
          "Alta de personal",
          "Baja de personal",
          "Solicitud de compras",
          "Pedido de viaje",
          "Adelanto de sueldo",
          "Reclamo interno"
        ]
      }
    }

    const community = mockCommunities[instanceId]
    if (community) {
      return NextResponse.json({ community })
    } else {
      return NextResponse.json(
        { error: "Comunidad no encontrada" },
        { status: 404 }
      )
    }
  }

  try {
    // Real Redash API call
    const response = await fetch(
      `${REDASH_BASE_URL}/api/queries/YOUR_QUERY_ID/results?api_key=${REDASH_API_KEY}&p_instance_id=${instanceId}`,
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Error de conexion con Redash" },
        { status: 500 }
      )
    }

    const data = await response.json()
    
    // Parse Redash response - adjust based on actual query structure
    const rows = data.query_result?.data?.rows || []
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Comunidad no encontrada" },
        { status: 404 }
      )
    }

    // Transform Redash data to CommunityData format
    const community: CommunityData = {
      instanceId,
      nombre: rows[0]?.company_name || "Sin nombre",
      departamentos: [...new Set(rows.map((r: { department: string }) => r.department).filter(Boolean))] as string[],
      usuarios: rows
        .filter((r: { user_name: string }) => r.user_name)
        .map((r: { user_name: string; role: string }) => ({ nombre: r.user_name, rol: r.role || "Usuario" })),
      servicios: [...new Set(rows.map((r: { service: string }) => r.service).filter(Boolean))] as string[]
    }

    return NextResponse.json({ community })
  } catch (error) {
    console.error("Redash API error:", error)
    return NextResponse.json(
      { error: "Error de conexion" },
      { status: 500 }
    )
  }
}
