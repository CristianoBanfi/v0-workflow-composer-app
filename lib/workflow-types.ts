export type StepType = "approval" | "update" | "branch"

export interface Step {
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

export interface Workflow {
  trigger: string
  steps: Step[]
}

export const EMPRESA = {
  nombre: "TechCorp S.A.",
  servicios: [
    "Alta de empleado",
    "Baja de empleado",
    "Solicitud de vacaciones",
    "Reembolso de gastos",
    "Solicitud de equipamiento",
    "Cambio de puesto",
    "Aprobación de horas extra",
    "Capacitación externa",
    "Acceso a sistemas",
    "Adelanto de sueldo",
    "Evaluación de desempeño",
    "Solicitud de home office",
    "Licencia por maternidad/paternidad",
    "Certificado de trabajo",
    "Renovación de contrato",
    "Traslado de oficina",
    "Solicitud de bono",
    "Cambio de horario",
    "Incorporación de contratista",
    "Reporte de accidente laboral"
  ],
  departamentos: [
    "Tecnología",
    "Recursos Humanos",
    "Finanzas",
    "Ventas",
    "Marketing",
    "Legal",
    "Operaciones",
    "Producto",
    "Soporte",
    "Administración"
  ],
  usuarios: [
    "Diego Ramírez",
    "Laura Méndez",
    "Carlos Soto",
    "Ana Gómez",
    "Lucía Fernández",
    "Martín Ruiz",
    "Sofía Castro",
    "Tomás Herrera"
  ],
  roles: ["Jefe directo", "Jefe de segundo nivel", "Aprobador designado"]
}

export const DEFAULT_WORKFLOW: Workflow = {
  trigger: "Solicitud de vacaciones",
  steps: [
    {
      id: "s1",
      type: "approval",
      label: "Aprobación manager",
      approvers: ["Jefe directo"],
      condition: "Al menos uno debe aprobar",
      parent: null,
      branch: null
    },
    {
      id: "s2a",
      type: "update",
      label: "Actualizar: Cerrada",
      status: "Cerrada",
      parent: "s1",
      branch: "approved"
    },
    {
      id: "s2b",
      type: "update",
      label: "Actualizar: Cancelada",
      status: "Cancelada",
      parent: "s1",
      branch: "rejected"
    }
  ]
}

export interface Template {
  id: string
  emoji: string
  title: string
  description: string
  workflow: Workflow
}

export const TEMPLATES: Template[] = [
  {
    id: "vacaciones",
    emoji: "🏖️",
    title: "Solicitud de vacaciones",
    description: "Aprobación por jefe directo",
    workflow: DEFAULT_WORKFLOW
  },
  {
    id: "reembolso",
    emoji: "💳",
    title: "Reembolso de gastos",
    description: "Rama por depto + aprobación",
    workflow: {
      trigger: "Reembolso de gastos",
      steps: [
        {
          id: "b1",
          type: "branch",
          label: "¿Cuál es el departamento?",
          conditions: ["Tecnología", "Finanzas", "Otros"],
          parent: null,
          branch: null
        },
        {
          id: "s1a",
          type: "approval",
          label: "Aprobación IT Manager",
          approvers: ["Jefe directo"],
          condition: "Al menos uno debe aprobar",
          parent: "b1",
          branch: "Tecnología"
        },
        {
          id: "s1b",
          type: "approval",
          label: "Aprobación CFO",
          approvers: ["Jefe de segundo nivel"],
          condition: "Al menos uno debe aprobar",
          parent: "b1",
          branch: "Finanzas"
        },
        {
          id: "s1c",
          type: "approval",
          label: "Aprobación Gerente",
          approvers: ["Jefe directo"],
          condition: "Al menos uno debe aprobar",
          parent: "b1",
          branch: "Otros"
        },
        {
          id: "s2a",
          type: "update",
          label: "Actualizar: Cerrada",
          status: "Cerrada",
          parent: "s1a",
          branch: "approved"
        },
        {
          id: "s2b",
          type: "update",
          label: "Actualizar: Cancelada",
          status: "Cancelada",
          parent: "s1a",
          branch: "rejected"
        }
      ]
    }
  },
  {
    id: "alta",
    emoji: "👤",
    title: "Alta de empleado",
    description: "IT requiere doble firma",
    workflow: {
      trigger: "Alta de empleado",
      steps: [
        {
          id: "s1",
          type: "approval",
          label: "Aprobación RRHH",
          approvers: ["Jefe directo"],
          condition: "Al menos uno debe aprobar",
          parent: null,
          branch: null
        },
        {
          id: "s2",
          type: "approval",
          label: "Aprobación IT",
          approvers: ["Jefe directo", "Jefe de segundo nivel"],
          condition: "Todos deben aprobar",
          parent: "s1",
          branch: "approved"
        },
        {
          id: "s3a",
          type: "update",
          label: "Actualizar: En proceso",
          status: "En proceso",
          parent: "s2",
          branch: "approved"
        },
        {
          id: "s3b",
          type: "update",
          label: "Actualizar: Cancelada",
          status: "Cancelada",
          parent: "s2",
          branch: "rejected"
        },
        {
          id: "s1r",
          type: "update",
          label: "Actualizar: Cancelada",
          status: "Cancelada",
          parent: "s1",
          branch: "rejected"
        }
      ]
    }
  },
  {
    id: "homeoffice",
    emoji: "🏠",
    title: "Solicitud de home office",
    description: "Aprobación simple",
    workflow: {
      trigger: "Solicitud de home office",
      steps: [
        {
          id: "s1",
          type: "approval",
          label: "Aprobación jefe",
          approvers: ["Jefe directo"],
          condition: "Al menos uno debe aprobar",
          parent: null,
          branch: null
        },
        {
          id: "s2a",
          type: "update",
          label: "Actualizar: Cerrada",
          status: "Cerrada",
          parent: "s1",
          branch: "approved"
        },
        {
          id: "s2b",
          type: "update",
          label: "Actualizar: Cancelada",
          status: "Cancelada",
          parent: "s1",
          branch: "rejected"
        }
      ]
    }
  }
]

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
}
