"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

interface Business {
  id: string
  name: string
  category: string | null
  website: string | null
  email: string | null
  phone: string | null
  country: string | null
  state: string | null
  city: string | null
  address: string | null
  websiteStatus: string
  createdAt: string
  updatedAt: string
  pipelineLead: {
    stage: {
      id: number
      name: string
      position: number
    }
  } | null
}

interface Note {
  id: string
  content: string
  createdAt: string
  user: {
    name: string
    email: string
  }
}

interface StageHistory {
  id: string
  fromStage: { name: string }
  toStage: { name: string }
  changedBy: { name: string }
  createdAt: string
  notes: string | null
}

export default function BusinessDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const businessId = params.id as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [newNote, setNewNote] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<StageHistory[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated" && businessId) {
        const fetchData = async () => {
        try {
            const [businessRes, notesRes, historyRes] = await Promise.all([
            fetch(`/api/businesses/${businessId}`),
            fetch(`/api/businesses/${businessId}/notes`),
            fetch(`/api/businesses/${businessId}/history`)
            ])
            
            if (!businessRes.ok) throw new Error("Business not found")
            
            const businessData = await businessRes.json()
            const notesData = await notesRes.json()
            const historyData = await historyRes.json()
            
            setBusiness(businessData)
            setNotes(notesData)
            setHistory(historyData)
        } catch (err) {
            setError("Failed to load business")
            console.error(err)
        } finally {
            setLoading(false)
        }
        }
        fetchData()
    }
  }, [status, businessId])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/businesses/${businessId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote })
      })

      if (!response.ok) throw new Error("Failed to add note")

      const note = await response.json()
      setNotes([note, ...notes])
      setNewNote("")
    } catch (err) {
      console.error("Error adding note:", err)
      alert("Failed to add note")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const response = await fetch(`/api/businesses/${businessId}/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete note")
      }

      // Remove the note from the UI
      setNotes(notes.filter(note => note.id !== noteId))
    } catch (err) {
      console.error("Error deleting note:", err)
      alert(err instanceof Error ? err.message : "Failed to delete note")
    }
  }

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) return null

  if (error || !business) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">{error || "Business not found"}</p>
          <Link href="/businesses" className="text-blue-600 hover:text-blue-900 mt-2 inline-block">
            ← Back to Businesses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <Link href="/businesses" className="text-blue-600 hover:text-blue-900 text-sm">
            ← Back to Businesses
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">{business.name}</h1>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href={`/businesses/${business.id}/edit`}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Edit Business
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Business Information</h3>
              <p className="mt-1 text-sm text-gray-500">Details about the company.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.category || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      business.websiteStatus === "HAS_WEBSITE" ? "bg-green-100 text-green-800" :
                      business.websiteStatus === "NO_WEBSITE" ? "bg-red-100 text-red-800" :
                      business.websiteStatus === "NOT_WORKING" ? "bg-yellow-100 text-yellow-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {business.websiteStatus?.replace(/_/g, " ") || "Unknown"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {business.website ? (
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                        {business.website}
                      </a>
                    ) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {business.email ? (
                      <a href={`mailto:${business.email}`} className="text-blue-600 hover:text-blue-900">
                        {business.email}
                      </a>
                    ) : "-"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {business.phone ? (
                      <a href={`tel:${business.phone}`} className="text-blue-600 hover:text-blue-900">
                        {business.phone}
                      </a>
                    ) : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Location</h3>
              <p className="mt-1 text-sm text-gray-500">Address and geographic information.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.country || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">State/Province</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.state || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">City</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.city || "-"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{business.address || "-"}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pipeline Info */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Pipeline</h3>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <p className="text-sm text-gray-500">Current Stage</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {business.pipelineLead?.stage?.name || "New"}
              </p>
              <p className="mt-4 text-sm text-gray-500">Created</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(business.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm text-gray-500">Last Updated</p>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(business.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Stage History Section */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Stage History</h3>
              <p className="mt-1 text-sm text-gray-500">Track how this lead has moved through the pipeline.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No stage changes yet.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {history.map((change) => (
                    <div key={change.id} className="border-l-4 border-blue-400 pl-4 py-2">
                      <p className="text-sm text-gray-900">
                        Moved from <span className="font-semibold">{change.fromStage.name}</span> → 
                        <span className="font-semibold"> {change.toStage.name}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        By {change.changedBy.name} on {new Date(change.createdAt).toLocaleString()}
                      </p>
                      {change.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">{`"${change.notes}"`}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Notes</h3>
              <p className="mt-1 text-sm text-gray-500">Add and manage notes for this lead.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="mb-6">
                <textarea
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Write a note about this lead..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={submitting || !newNote.trim()}
                  className="mt-2 inline-flex justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Note"}
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No notes yet. Add your first note above.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="border-l-4 border-blue-400 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-900">{note.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            By {note.user.name} on {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {(session.user.role === "ADMIN" || session.user.name === note.user.name) && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}