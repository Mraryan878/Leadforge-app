"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalBusinesses: number
  newLeads: number
  contactedLeads: number
  interestedLeads: number
  wonLeads: number
  lostLeads: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      const loadStats = async () => {
        await fetchStats()
      }

      void loadStats()
    }
  }, [status])

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) return null

  const statCards = [
    { title: "Total Businesses", value: stats?.totalBusinesses || 0, color: "bg-blue-500" },
    { title: "New Leads", value: stats?.newLeads || 0, color: "bg-purple-500" },
    { title: "Contacted", value: stats?.contactedLeads || 0, color: "bg-yellow-500" },
    { title: "Interested", value: stats?.interestedLeads || 0, color: "bg-green-500" },
    { title: "Won", value: stats?.wonLeads || 0, color: "bg-emerald-500" },
    { title: "Lost", value: stats?.lostLeads || 0, color: "bg-red-500" },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Welcome back, {session.user?.name}! Here&apos;s your lead pipeline overview.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${stat.color}`}>
                <div className="h-6 w-6 text-white" />
              </div>
              <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.title}</p>
            </dt>
            <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </dd>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Add new leads or manage your existing business pipeline.</p>
          </div>
          <div className="mt-5">
            <a
              href="/businesses/new"
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Add New Business
            </a>
            <a
              href="/businesses"
              className="ml-3 inline-flex items-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
            >
              View All Businesses
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}