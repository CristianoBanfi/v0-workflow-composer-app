"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface NewWorkflowDrawerProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => void
}

export function NewWorkflowDrawer({ isOpen, onClose, onCreate }: NewWorkflowDrawerProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setName("")
      setDescription("")
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), description.trim())
    }
  }

  const isValid = name.trim().length > 0

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-screen w-[520px] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Nuevo flujo de trabajo
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Elegi un nombre y una descripcion para comenzar un nuevo flujo de trabajo
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-6 flex flex-col gap-6 overflow-auto">
          {/* Name field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del flujo de trabajo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 255))}
              placeholder="Escribi aca"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {name.length}/255
            </p>
          </div>

          {/* Description field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 650))}
              placeholder="Escribi aca"
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-400 text-right mt-1">
              {description.length}/650
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 rounded-lg text-sm text-gray-600 py-2.5 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className={`flex-1 rounded-lg text-sm font-medium py-2.5 transition-colors ${
              isValid
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Crear
          </button>
        </div>
      </div>
    </>
  )
}
