"use client"

import { useEffect, useState, useMemo } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ShippingCharts } from "@/components/shipping-charts"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ShippingData {
  month: string
  [key: string]: number | null | string
}

interface ApiResponse {
  success: boolean
  data: ShippingData[]
}

interface YearGroup {
  year: string
  type: string
  boxKey: string
  teusKey: string
  label: string
}

interface Upload {
  id: number
  filename: string
  upload_date: string
  total_rows: number
  status: string
}

export default function Page() {
  const [data, setData] = useState<ShippingData[]>([])
  const [uploads, setUploads] = useState<Upload[]>([])
  const [selectedUploadId, setSelectedUploadId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const yearGroups = useMemo(() => {
    if (data.length === 0) return []

    const keys = Object.keys(data[0]).filter(k => k !== 'month')
    const groups: YearGroup[] = []

    keys.forEach(key => {
      const match = key.match(/(\d{4})_(\w+)_(box|teus)/i)
      if (match) {
        const year = match[1]
        const type = match[2]
        const metric = match[3]

        const existingGroup = groups.find(g => g.year === year && g.type === type)

        if (metric === 'box') {
          if (existingGroup) {
            existingGroup.boxKey = key
          } else {
            groups.push({
              year,
              type,
              boxKey: key,
              teusKey: '',
              label: `${year} ${type.charAt(0).toUpperCase() + type.slice(1)}`
            })
          }
        } else if (metric === 'teus') {
          if (existingGroup) {
            existingGroup.teusKey = key
          } else {
            groups.push({
              year,
              type,
              boxKey: '',
              teusKey: key,
              label: `${year} ${type.charAt(0).toUpperCase() + type.slice(1)}`
            })
          }
        }
      }
    })

    groups.sort((a, b) => {
      if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year)
      return a.type.localeCompare(b.type)
    })

    return groups
  }, [data])

  const fetchData = async (uploadId?: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const url = uploadId
        ? `/api/shipping-data?format=table&uploadId=${uploadId}`
        : '/api/shipping-data?format=table'
      const response = await fetch(url)
      const result: ApiResponse = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError('Failed to fetch shipping data')
      }
    } catch (err) {
      console.error('Failed to fetch shipping data:', err)
      setError('Failed to fetch shipping data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch('/api/uploads')
        const result = await response.json()

        if (result.success && result.data.length > 0) {
          setUploads(result.data)
          // Select the most recent upload by default
          setSelectedUploadId(result.data[0].id)
          fetchData(result.data[0].id)
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to fetch uploads:', err)
        setError('Failed to fetch uploads')
        setIsLoading(false)
      }
    }

    fetchUploads()
  }, [])

  const handleUploadChange = (uploadId: string) => {
    const id = parseInt(uploadId)
    setSelectedUploadId(id)
    fetchData(id)
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            {uploads.length > 0 && (
              <Select
                value={selectedUploadId?.toString()}
                onValueChange={handleUploadChange}
              >
                <SelectTrigger className="w-62.5">
                  <SelectValue placeholder="Select a file" />
                </SelectTrigger>
                <SelectContent>
                  {uploads.map((upload) => (
                    <SelectItem key={upload.id} value={upload.id.toString()}>
                      {upload.filename}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {isLoading ? (
            <>
              <div className="flex gap-4 my-6 rounded-lg bg-card border px-4 py-2 shadow-sm w-fit">
                <div className="w-16">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="border-l border-border pl-4 w-16">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="border-l border-border pl-4 w-16">
                  <Skeleton className="h-3 w-12 mb-1" />
                  <Skeleton className="h-6 w-8" />
                </div>
              </div>
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <Skeleton className="h-7 w-48 mb-4" />
                <Skeleton className="h-75 w-full" />
              </div>
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <Skeleton className="h-7 w-48 mb-4" />
                <Skeleton className="h-75 w-full" />
              </div>
            </>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              {error}
            </div>
          ) : (
            <>
              <div className="flex gap-4 my-6 rounded-lg bg-card border px-4 py-2 shadow-sm w-fit">
                <div>
                  <p className="text-xs text-muted-foreground">Total Months</p>
                  <p className="text-xl font-bold">{data.length}</p>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="text-xs text-muted-foreground">Periods</p>
                  <p className="text-xl font-bold">{yearGroups.length}</p>
                </div>
                <div className="border-l border-border pl-4">
                  <p className="text-xs text-muted-foreground">Data Points</p>
                  <p className="text-xl font-bold">
                    {data.reduce((sum, item) => {
                      return sum + Object.values(item).filter(v => typeof v === 'number').length
                    }, 0)}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Monthly Box Comparison</h3>
                <div className="h-75">
                  <ShippingCharts data={data} yearGroups={yearGroups} type="bar" />
                </div>
              </div>
              <div className="p-6 bg-card rounded-xl border shadow-sm">
                <h3 className="text-lg font-semibold mb-4">TEUs Trend Over Time</h3>
                <div className="h-75">
                  <ShippingCharts data={data} yearGroups={yearGroups} type="line" />
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
