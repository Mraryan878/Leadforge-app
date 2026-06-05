"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Link from "next/link"
import { useState } from "react"

interface Business {
  id: string
  name: string
  category: string | null
  websiteStatus: string
  pipelineLead?: {
    stage?: {
      name: string
    }
  } | null
}

interface SortableItemProps {
  id: string
  business: Business
  isLoading?: boolean
  onStageChange?: (businessId: string, newStage: string) => void
  stages?: { id: number; name: string }[]
}

export function SortableItem({ id, business, isLoading, onStageChange, stages = [] }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const [showDropdown, setShowDropdown] = useState(false)
  const [currentStage, setCurrentStage] = useState(business.pipelineLead?.stage?.name || "New")

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "HAS_WEBSITE":
        return "bg-green-100 text-green-800"
      case "NO_WEBSITE":
        return "bg-red-100 text-red-800"
      case "NOT_WORKING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleStageChange = async (newStage: string) => {
    setShowDropdown(false)
    if (newStage === currentStage) return
    
    setCurrentStage(newStage)
    if (onStageChange) {
      await onStageChange(business.id, newStage)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        isLoading ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        {/* Drag handle - only this area is draggable */}
        <div
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab active:cursor-grabbing"
        >
          <Link href={`/businesses/${business.id}`}>
            <h4 className="font-medium text-gray-900 hover:text-blue-600 truncate">
              {business.name}
            </h4>
          </Link>
          {business.category && (
            <p className="text-sm text-gray-500 mt-1 truncate">{business.category}</p>
          )}
          <div className="mt-2">
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(business.websiteStatus)}`}>
              {business.websiteStatus?.replace(/_/g, " ") || "Unknown"}
            </span>
          </div>
        </div>
        
        {/* Stage Dropdown Button - NOT draggable */}
        <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowDropdown(!showDropdown)
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-2 py-1 text-gray-700 cursor-pointer"
          >
            {currentStage} ▼
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStageChange(stage.name)
                  }}
                  className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                    currentStage === stage.name ? "bg-blue-50 text-blue-600" : "text-gray-700"
                  }`}
                >
                  {stage.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}