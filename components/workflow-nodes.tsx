"use client"

import type { Step } from "@/lib/workflow-types"

interface NodeProps {
  step?: Step
  trigger?: string
}

export function TriggerNode({ trigger }: { trigger: string }) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-xl border-[1.5px] border-border shadow-sm w-[260px] p-3">
      <div className="w-[34px] h-[34px] rounded-lg bg-[#22C55E] flex items-center justify-center text-lg">
        {"⚡"}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-[#A1A1AA]">Disparador</span>
        <span className="text-[13px] font-bold text-foreground">{trigger}</span>
      </div>
    </div>
  )
}

export function ApprovalNode({ step }: NodeProps) {
  if (!step) return null
  return (
    <div className="bg-card rounded-xl border-[1.5px] border-border shadow-sm w-[260px] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-[34px] h-[34px] rounded-lg bg-[#6366F1] flex items-center justify-center text-lg">
          {"✅"}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#A1A1AA]">Solicitar aprobación</span>
          <span className="text-[13px] font-bold text-foreground">{step.label}</span>
        </div>
      </div>
      <div className="border-t border-[#F3F4F6] px-[14px] py-[5px] pb-[10px]">
        <div className="text-[10px] text-[#A1A1AA]">
          {"👤"} {step.approvers?.join(", ") || "Sin aprobadores"}
        </div>
        {step.condition && (
          <div className="text-[10px] text-[#A1A1AA]">{step.condition}</div>
        )}
      </div>
    </div>
  )
}

export function UpdateNode({ step }: NodeProps) {
  if (!step) return null
  return (
    <div className="bg-card rounded-xl border-[1.5px] border-border shadow-sm w-[260px] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-[34px] h-[34px] rounded-lg bg-[#10B981] flex items-center justify-center text-lg">
          {"🔄"}
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#A1A1AA]">Actualizar solicitud</span>
          <span className="text-[13px] font-bold text-foreground">{step.label}</span>
        </div>
      </div>
      {step.status && (
        <div className="border-t border-[#F3F4F6] px-[14px] py-[5px] pb-[10px]">
          <div className="text-[10px] text-[#A1A1AA]">
            Estado → {step.status}
          </div>
        </div>
      )}
    </div>
  )
}

export function BranchNode({ step }: NodeProps) {
  if (!step) return null
  return (
    <div className="bg-card rounded-xl border-[1.5px] border-border shadow-sm w-[260px] overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-[34px] h-[34px] rounded-lg bg-[#F59E0B] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#A1A1AA]">Ramas</span>
          <span className="text-[13px] font-bold text-foreground">{step.label}</span>
        </div>
      </div>
      {step.conditions && step.conditions.length > 0 && (
        <div className="border-t border-[#F3F4F6] px-[14px] py-[5px] pb-[10px]">
          {step.conditions.map((cond, i) => (
            <div key={i} className="text-[10px] text-[#A1A1AA]">{cond}</div>
          ))}
          <div className="text-[10px] text-[#D1D5DB]">Rama por defecto</div>
        </div>
      )}
    </div>
  )
}

export function EndNode() {
  return (
    <div className="border-dashed border-[1.5px] border-[#D4D4D8] bg-[#F9FAFB] rounded-lg px-5 py-[7px]">
      <span className="text-[11px] text-[#9CA3AF]">Fin de flujo</span>
    </div>
  )
}

export function Connector({ height = 20 }: { height?: number }) {
  return (
    <div 
      className="w-[2px] bg-[#D4D4D8] mx-auto"
      style={{ height: `${height}px` }}
    />
  )
}

export function ApprovedPill() {
  return (
    <span className="inline-block rounded-full px-3 py-[3px] text-[11px] font-bold text-[#16A34A] bg-[#DCFCE7]">
      {"✓"} Aprobado
    </span>
  )
}

export function RejectedPill() {
  return (
    <span className="inline-block rounded-full px-3 py-[3px] text-[11px] font-bold text-[#DC2626] bg-[#FEE2E2]">
      {"✕"} Rechazado
    </span>
  )
}

export function BranchPill({ label }: { label: string }) {
  return (
    <span className="inline-block rounded-full px-3 py-[3px] text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF]">
      {label}
    </span>
  )
}
