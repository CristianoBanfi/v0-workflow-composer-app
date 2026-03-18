"use client"

import { useState } from "react"
import { 
  Menu, 
  ChevronRight, 
  ChevronDown,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  UserPlus,
  Award,
  Folder,
  FileCheck,
  Zap,
  Palmtree,
  BarChart3
} from "lucide-react"

interface NavItem {
  label: string
  icon: React.ReactNode
  href?: string
  badge?: string
  badgeColor?: string
  children?: { label: string; href?: string; active?: boolean; badge?: string; badgeColor?: string }[]
  expandable?: boolean
}

const navItems: NavItem[] = [
  { label: "Encuestas", icon: <FileText size={18} /> },
  { label: "People Experience", icon: <Users size={18} />, expandable: true },
  { label: "Aprendizaje", icon: <GraduationCap size={18} />, expandable: true },
  { 
    label: "Gestion de servicios", 
    icon: <Briefcase size={18} />, 
    expandable: true,
    children: [
      { label: "Catalogo de servicios" },
      { label: "Gestion de agentes" },
      { label: "Flujos de trabajo", active: true, badge: "Nuevo", badgeColor: "green" },
      { label: "Metricas" }
    ]
  },
  { label: "Onboarding", icon: <UserPlus size={18} /> },
  { label: "Reconocimientos", icon: <Award size={18} /> },
  { label: "Archivos", icon: <Folder size={18} /> },
  { label: "Documentos personales", icon: <FileCheck size={18} /> },
  { label: "Accesos rapidos", icon: <Zap size={18} /> },
  { label: "Vacaciones y permisos", icon: <Palmtree size={18} /> },
  { label: "Desempeno", icon: <BarChart3 size={18} />, expandable: true }
]

export function AppSidebar() {
  const [expandedItems, setExpandedItems] = useState<string[]>(["Gestion de servicios"])

  const toggleExpand = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Top bar */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100">
        <button className="p-1 hover:bg-gray-100 rounded transition-colors">
          <Menu size={20} className="text-gray-600" />
        </button>
        <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center">
          <span className="text-white text-xs font-bold">H</span>
        </div>
        <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto py-2">
        {navItems.map((item) => {
          const isExpanded = expandedItems.includes(item.label)
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.label}>
              <button
                onClick={() => hasChildren && toggleExpand(item.label)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  isExpanded && hasChildren ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
              >
                <span className="text-gray-500">{item.icon}</span>
                <span className={hasChildren && isExpanded ? "text-gray-900 font-medium" : "text-gray-600"}>
                  {item.label}
                </span>
                {item.expandable && (
                  <span className="ml-auto text-gray-400">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                )}
              </button>

              {/* Children */}
              {hasChildren && isExpanded && (
                <div className="ml-4">
                  {item.children!.map((child) => (
                    <a
                      key={child.label}
                      href={child.active ? "#" : undefined}
                      className={`block pl-8 pr-4 py-2 text-sm transition-colors ${
                        child.active 
                          ? "text-gray-900 font-semibold" 
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {child.label}
                        {child.badge && (
                          <span className={`text-xs rounded-full px-2 py-0.5 ${
                            child.badgeColor === "green" 
                              ? "bg-green-100 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {child.badge}
                          </span>
                        )}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
