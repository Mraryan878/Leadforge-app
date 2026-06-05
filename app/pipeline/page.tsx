"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import { SortableItem } from "../../components/pipeline/SortableItem"

interface Business {
  id: string
  name: string
  category: string | null
  websiteStatus: string
  pipelineLead: {
    stage: {
      id: number
      name: string
      position: number
    }
  } | null
}

interface Stage {
  id: number
  name: string
  position: number
  businesses: Business[]
}

export default function PipelinePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchPipelineData = useCallback(async () => {
    try {
        const response = await fetch("/api/businesses")
        const businesses: Business[] = await response.json()

        const stagesResponse = await fetch("/api/pipeline/stages")
        const allStages: { id: number; name: string; position: number }[] = await stagesResponse.json()

        const stagesWithBusinesses = allStages.map((stage) => ({
        ...stage,
        businesses: businesses.filter(
            (b) => b.pipelineLead?.stage?.name === stage.name
        ),
        }))

        setStages(stagesWithBusinesses)
    } catch (error) {
        console.error("Error fetching pipeline data:", error)
    } finally {
        setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      const loadPipeline = async () => {
        await fetchPipelineData()
      }
      loadPipeline()
    }
  }, [status, fetchPipelineData])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
    
    for (const stage of stages) {
      const business = stage.businesses.find(b => b.id === active.id)
      if (business) {
        setActiveBusiness(business)
        break
      }
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event
  console.log("=== DRAG END ===")
  console.log("Active ID:", active?.id)
  console.log("Over ID:", over?.id)
  
  setActiveId(null)
  setActiveBusiness(null)

  if (!over) {
    console.log("No drop target - exiting")
    return
  }

  const activeId = active.id as string
  const overId = over.id as string

  // Get the drop target element from the DOM
  let targetStageName: string | null = null
  
  // Try to find the drop target by ID
  let dropTarget = document.getElementById(overId)
  
  // If not found, try to find by data attribute
  if (!dropTarget) {
    dropTarget = document.querySelector(`[data-id="${overId}"]`)
  }
  
  // If we have a drop target, find its closest column
  if (dropTarget) {
    const column = dropTarget.closest('[data-stage]')
    if (column) {
      targetStageName = column.getAttribute('data-stage')
      console.log("Found stage from column via DOM:", targetStageName)
    }
  }
  
  // If still not found, check all columns to see where the drop occurred
  if (!targetStageName) {
    // Get mouse position from the event
    const dragEvent = event.activatorEvent as MouseEvent
    if (dragEvent) {
      // Find element at the drop position
      const elementAtDrop = document.elementsFromPoint(dragEvent.clientX, dragEvent.clientY)[0] as HTMLElement
      if (elementAtDrop) {
        const column = elementAtDrop.closest('[data-stage]')
        if (column) {
          targetStageName = column.getAttribute('data-stage')
          console.log("Found stage from mouse position:", targetStageName)
        }
      }
    }
  }

  if (!targetStageName) {
    console.log("Could not find target stage name. Available columns:")
    document.querySelectorAll('[data-stage]').forEach(el => {
      console.log(" -", el.getAttribute("data-stage"))
    })
    return
  }

  // Find the target stage
  const targetStage = stages.find(stage => stage.name === targetStageName)
  if (!targetStage) {
    console.log("Target stage not found:", targetStageName)
    return
  }
  console.log("Target stage:", targetStage.name)

  // Find the business being moved
  let sourceStage: Stage | undefined
  let movingBusiness: Business | undefined

  for (const stage of stages) {
    const business = stage.businesses.find(b => b.id === activeId)
    if (business) {
      sourceStage = stage
      movingBusiness = business
      console.log("Found business in stage:", stage.name)
      break
    }
  }

  if (!sourceStage || !movingBusiness) {
    console.log("Source stage or moving business not found")
    return
  }
  
  if (sourceStage.id === targetStage.id) {
    console.log("Same stage - ignoring")
    return
  }

  console.log(`Moving "${movingBusiness.name}" from ${sourceStage.name} to ${targetStage.name}`)

  // Update stage in database
  try {
    const response = await fetch(`/api/businesses/${activeId}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageName: targetStage.name })
    })

    console.log("API response status:", response.status)

    if (response.ok) {
      // Update local state
      const newStages = stages.map(stage => {
        if (stage.id === sourceStage!.id) {
          return {
            ...stage,
            businesses: stage.businesses.filter(b => b.id !== activeId)
          }
        }
        if (stage.id === targetStage.id) {
          return {
            ...stage,
            businesses: [...stage.businesses, movingBusiness]
          }
        }
        return stage
      })
      setStages(newStages)
      console.log("State updated successfully!")
    } else {
      const error = await response.json()
      console.error("API error:", error)
      alert(error.error || "Failed to move business")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Failed to move business")
  }
}
const handleStageChange = async (businessId: string, newStageName: string) => {
  try {
    const response = await fetch(`/api/businesses/${businessId}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stageName: newStageName })
    })

    if (response.ok) {
      // Refresh the pipeline data
      await fetchPipelineData()
      console.log(`Moved business to ${newStageName}`)
    } else {
      console.error("Failed to update stage")
      alert("Failed to move business")
    }
  } catch (error) {
    console.error("Error:", error)
    alert("Failed to move business")
  }
}

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) return null

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Sales Pipeline</h1>
          <p className="mt-2 text-sm text-gray-700">
            Drag and drop leads between stages to update their progress.
          </p>
        </div>
        <button
          onClick={() => fetchPipelineData()}
          className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 pb-4" style={{ minWidth: "1200px" }}>
            {stages.map((stage) => (
              <div
                key={stage.id}
                id={`stage-${stage.name}`}
                data-stage={stage.name}
                className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4"
                style={{ minHeight: "500px" }}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {stage.businesses.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {stage.businesses.map((business) => (
                    <SortableItem
                        key={business.id}
                        id={business.id}
                        business={business}
                        isLoading={false}
                        onStageChange={handleStageChange}
                        stages={stages.map(s => ({ id: s.id, name: s.name }))}
                    />
                  ))}
                  
                  {stage.businesses.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeId && activeBusiness ? (
              <div className="bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 w-80">
                <h4 className="font-medium text-gray-900">{activeBusiness.name}</h4>
                {activeBusiness.category && (
                  <p className="text-sm text-gray-500 mt-1">{activeBusiness.category}</p>
                )}
                <div className="mt-2">
                  <span className="inline-flex rounded-full px-2 text-xs font-semibold leading-5 bg-gray-100 text-gray-800">
                    {activeBusiness.websiteStatus?.replace(/_/g, " ") || "Unknown"}
                  </span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}