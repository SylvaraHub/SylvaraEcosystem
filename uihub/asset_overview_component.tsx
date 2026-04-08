import React, { useEffect, useState } from "react"

interface AssetOverviewPanelProps {
  assetId: string
}

interface AssetOverview {
  name: string
  priceUsd: number
  supply: number
  holders: number
}

export const AssetOverviewPanel: React.FC<AssetOverviewPanelProps> = ({ assetId }) => {
  const [info, setInfo] = useState<AssetOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function fetchInfo() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/assets/${encodeURIComponent(assetId)}`)
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`)
        }
        const json = (await res.json()) as AssetOverview
        if (mounted) setInfo(json)
      } catch (err: any) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchInfo()
    return () => {
      mounted = false
    }
  }, [assetId])

  if (loading) {
    return <div className="p-4 bg-white rounded shadow">Loading asset overview…</div>
  }

  if (error) {
    return (
      <div className="p-4 bg-white rounded shadow text-red-600">
        Error loading asset overview: {error}
      </div>
    )
  }

  if (!info) {
    return (
      <div className="p-4 bg-white rounded shadow">
        No data available for asset <strong>{assetId}</strong>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-3">Asset Overview</h2>
      <dl className="space-y-1">
        <div>
          <dt className="font-medium">ID:</dt>
          <dd className="ml-2 inline">{assetId}</dd>
        </div>
        <div>
          <dt className="font-medium">Name:</dt>
          <dd className="ml-2 inline">{info.name}</dd>
        </div>
        <div>
          <dt className="font-medium">Price (USD):</dt>
          <dd className="ml-2 inline">${info.priceUsd.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="font-medium">Circulating Supply:</dt>
          <dd className="ml-2 inline">{info.supply.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="font-medium">Holders:</dt>
          <dd className="ml-2 inline">{info.holders.toLocaleString()}</dd>
        </div>
      </dl>
    </div>
  )
}

export default AssetOverviewPanel
