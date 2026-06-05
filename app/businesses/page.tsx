"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

interface Business {
  id: string
  name: string
  category: string | null
  website: string | null
  email: string | null
  phone: string | null
  country: string | null
  city: string | null
  websiteStatus: string
  createdAt: string
  pipelineLead: {
    stage: {
      name: string
    }
  } | null
}

const columnHelper = createColumnHelper<Business>()

export default function BusinessesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  
  // Search and filter states
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({
    country: "",
    city: "",
    category: "",
    websiteStatus: "",
  })
  
  // Unique values for filter dropdowns
  const [countries, setCountries] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchBusinesses = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (filters.country) params.append("country", filters.country)
      if (filters.city) params.append("city", filters.city)
      if (filters.category) params.append("category", filters.category)
      if (filters.websiteStatus) params.append("websiteStatus", filters.websiteStatus)
      
      const response = await fetch(`/api/businesses?${params.toString()}`)
      const data = await response.json()
      setBusinesses(data)
      
      // Extract unique values for filters
      if (data.length > 0) {
        const uniqueCountries = [...new Set(data.map((b: Business) => b.country).filter(Boolean))]
        const uniqueCities = [...new Set(data.map((b: Business) => b.city).filter(Boolean))]
        const uniqueCategories = [...new Set(data.map((b: Business) => b.category).filter(Boolean))]
        
        setCountries(uniqueCountries as string[])
        setCities(uniqueCities as string[])
        setCategories(uniqueCategories as string[])
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
    } finally {
      setLoading(false)
    }
  }, [search, filters])

  useEffect(() => {
    if (status === "authenticated") {
      const loadBusinesses = async () => {
        await fetchBusinesses()
      }
      loadBusinesses()
    }
  }, [status, fetchBusinesses])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setSearch("")
    setFilters({
      country: "",
      city: "",
      category: "",
      websiteStatus: "",
    })
  }

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this business?")) return
    
    try {
      const response = await fetch(`/api/businesses/${id}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        await fetchBusinesses()
      } else {
        alert("Failed to delete business")
      }
    } catch (error) {
      console.error("Error deleting business:", error)
    }
  }, [fetchBusinesses])

  // Define table columns
  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <Link href={`/businesses/${info.row.original.id}`} className="text-blue-600 hover:text-blue-900">
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor((row) => `${row.city || ""}, ${row.country || ""}`, {
      id: "location",
      header: "Location",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("websiteStatus", {
      header: "Website Status",
      cell: (info) => {
        const status = info.getValue()
        return (
          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            status === "HAS_WEBSITE" ? "bg-green-100 text-green-800" :
            status === "NO_WEBSITE" ? "bg-red-100 text-red-800" :
            status === "NOT_WORKING" ? "bg-yellow-100 text-yellow-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {status?.replace(/_/g, " ") || "Unknown"}
          </span>
        )
      },
    }),
    columnHelper.accessor((row) => row.pipelineLead?.stage?.name || "New", {
      id: "stage",
      header: "Pipeline Stage",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => (
        <div className="flex gap-2">
          <Link
            href={`/businesses/${info.row.original.id}/edit`}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </Link>
          {session?.user?.role === "ADMIN" && (
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="text-red-600 hover:text-red-900"
            >
              Delete
            </button>
          )}
        </div>
      ),
    }),
  ], [session, handleDelete])

  const table = useReactTable({
    data: businesses,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (status === "loading" || loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session) return null

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Businesses</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all businesses in your lead pipeline.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/businesses/new"
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Add Business
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone, or website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <button
            onClick={clearFilters}
            className="rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <select
          value={filters.country}
          onChange={(e) => handleFilterChange("country", e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Countries</option>
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>

        <select
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={filters.websiteStatus}
          onChange={(e) => handleFilterChange("websiteStatus", e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Website Status</option>
          <option value="HAS_WEBSITE">Has Website</option>
          <option value="NO_WEBSITE">No Website</option>
          <option value="NOT_WORKING">Website Not Working</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {businesses.length} business{businesses.length !== 1 ? "es" : ""}
      </div>

      {/* TanStack Table */}
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-12 text-gray-500">
                        No businesses found. Click &quot;Add Business&quot; to get started.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}