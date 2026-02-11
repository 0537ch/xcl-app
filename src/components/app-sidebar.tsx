"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { BarChart3, FileSpreadsheet, Settings, Upload, Package2 } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props} collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Package2 className="h-4 w-4" />
          </div>
          <div className="grid flex-1 text-sm font-medium leading-tight">
            <span className="truncate font-semibold">Petikemas</span>
            <span className="truncate text-xs text-muted-foreground">Dashboard</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={[
            {
              title: "Dashboard",
              url: "/dashboard",
              icon: <BarChart3 />,
              isActive: false,
              items: [],
            },
            {
              title: "Shipping Data",
              url: "/",
              icon: <FileSpreadsheet />,
              isActive: true,
              items: [],
            },
            {
              title: "Upload Data",
              url: "/",
              icon: <Upload />,
              isActive: false,
              items: [],
            },
          ]}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
