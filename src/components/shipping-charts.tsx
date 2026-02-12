"use client"

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { ShippingData } from "@/types/shipping"

interface ShippingChartsProps {
  data: ShippingData[]
  yearGroups: Array<{
    year: string
    type: string
    boxKey: string
    teusKey: string
    label: string
  }>
  type?: 'bar' | 'line' | 'all'
}

export function ShippingCharts({ data, yearGroups, type = 'all' }: ShippingChartsProps) {
  const barChartData = data.map((item) => {
    const chartItem: any = { month: item.month.slice(0, 3) }
    yearGroups.forEach((group) => {
      chartItem[`${group.label} - Box`] = item[group.boxKey] || 0
      chartItem[`${group.label} - TEUS`] = item[group.teusKey] || 0
    })
    return chartItem
  })

  const lineChartData = data.map((item) => {
    const chartItem: any = { month: item.month.slice(0, 3) }
    yearGroups.forEach((group) => {
      chartItem[group.label] = item[group.teusKey] || 0
    })
    return chartItem
  })

  const barKeys = yearGroups.map((group) => `${group.label} - Box`)
  const lineKeys = yearGroups.map((group) => group.label)

  const allTeusValues = lineChartData.flatMap(item =>
    lineKeys.map(key => item[key] || 0)
  ).filter(v => v > 0)

  const minTeus = allTeusValues.length > 0 ? Math.min(...allTeusValues) : 0
  const maxTeus = allTeusValues.length > 0 ? Math.max(...allTeusValues) : 100

  const range = maxTeus - minTeus
  const roughStep = range / 5

  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const normalizedStep = roughStep / magnitude
  let niceStep: number

  if (normalizedStep < 1.5) niceStep = 1 * magnitude
  else if (normalizedStep < 3) niceStep = 2 * magnitude
  else if (normalizedStep < 7) niceStep = 5 * magnitude
  else niceStep = 10 * magnitude

  const niceMin = Math.floor(minTeus / niceStep) * niceStep
  const niceMax = Math.ceil(maxTeus / niceStep) * niceStep
  const niceTicks = []
  for (let tick = niceMin; tick <= niceMax; tick += niceStep) {
    niceTicks.push(tick)
  }

  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#06b6d4", "#f59e0b", "#8b5cf6"]

  // Create gradient defs
  const gradients = (
    <defs>
      {colors.map((color, index) => (
        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={1} />
          <stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </linearGradient>
      ))}
    </defs>
  )

  return (
    <>
      {(type === 'all' || type === 'bar') && (
        <ResponsiveContainer width="100%" height={type === 'all' ? 300 : '100%'}>
          <BarChart data={barChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            {gradients}
            {barKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={`url(#gradient-${index})`} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {(type === 'all' || type === 'line') && (
        <ResponsiveContainer width="100%" height={type === 'all' ? 300 : '100%'}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[niceMin, niceMax]} ticks={niceTicks} />
            <Tooltip />
            <Legend />
            {lineKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </>
  )
}
