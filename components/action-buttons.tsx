"use client"

import { Button } from "@/components/ui/button"
import { ExternalLinkIcon } from "lucide-react"

export default function ActionButtons() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-900 rounded-lg border border-gray-800 mt-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700">
          db_butt_token
        </Button>
        <Button variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700">
          db_butt_
        </Button>
        <Button variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700">
          pumpportal.fun
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700">
          View on Advanced
          <ExternalLinkIcon className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="secondary" className="bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700">
          Trade on MEXC
          <ExternalLinkIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
