"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, HelpCircle, Globe, MoreVertical } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { NewWorkflowDrawer } from "@/components/new-workflow-drawer"
import { getWorkflows, addWorkflow, formatTodayDate, type WorkflowListItem } from "@/lib/workflows-store"

export default function WorkflowsListPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<WorkflowListItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    setWorkflows(getWorkflows())
  }, [])

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateWorkflow = (name: string, description: string) => {
    const newWorkflow = addWorkflow({
      name,
      description,
      status: "Activo",
      lastEditedDate: formatTodayDate(),
      lastEditedBy: "Cristiano Banfi"
    })
    
    setIsDrawerOpen(false)
    router.push(`/workflow/${newWorkflow.id}`)
  }

  const handleRowClick = (id: string) => {
    router.push(`/workflow/${id}`)
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Left sidebar */}
      <AppSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-end px-6 gap-3">
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell size={16} />
            Nuevos lanzamientos
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <HelpCircle size={18} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Globe size={18} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-white text-sm font-medium">CB</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Flujos de trabajo</h1>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="bg-violet-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-violet-700 transition-colors"
            >
              + Nuevo flujo
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nombre del flujo"
              className="w-full border border-gray-200 rounded-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-[1fr_120px_180px_40px] gap-4">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre del flujo
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ultima edicion
              </span>
              <span></span>
            </div>

            {/* Rows */}
            {filteredWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleRowClick(workflow.id)}
                className="px-4 py-3 grid grid-cols-[1fr_120px_180px_40px] gap-4 items-center border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <span className="font-medium text-gray-900">{workflow.name}</span>
                <span>
                  <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
                    workflow.status === "Activo"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {workflow.status}
                  </span>
                </span>
                <div>
                  <p className="text-sm text-gray-900">{workflow.lastEditedDate}</p>
                  <p className="text-xs text-gray-400">Por {workflow.lastEditedBy}</p>
                </div>
                <button 
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <MoreVertical size={18} />
                </button>
              </div>
            ))}

            {filteredWorkflows.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No se encontraron flujos de trabajo
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                &lt;
              </button>
              <span className="bg-white border border-gray-200 shadow-sm rounded px-3 py-1 text-sm">
                1
              </span>
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                &gt;
              </button>
            </div>
            <select className="border border-gray-200 rounded text-sm px-2 py-1 text-gray-600">
              <option>10/pagina</option>
              <option>25/pagina</option>
              <option>50/pagina</option>
            </select>
          </div>
        </main>
      </div>

      {/* New workflow drawer */}
      <NewWorkflowDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCreate={handleCreateWorkflow}
      />
    </div>
  )
}
