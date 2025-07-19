"use client"

import { HomeIcon, SearchIcon, BarChartIcon, SettingsIcon, UsersIcon, PlusCircleIcon } from "lucide-react"
import Link from "next/link"

export default function SidebarNav() {
  return (
    <div className="flex flex-col items-center w-16 bg-gray-900 border-r border-gray-800 py-4 space-y-6">
      <Link href="#" className="text-cyan-500 hover:text-cyan-400" aria-label="Home">
        <HomeIcon className="h-6 w-6" />
      </Link>
      <Link href="#" className="text-gray-400 hover:text-white" aria-label="Search">
        <SearchIcon className="h-6 w-6" />
      </Link>
      <Link href="#" className="text-gray-400 hover:text-white" aria-label="Charts">
        <BarChartIcon className="h-6 w-6" />
      </Link>
      <Link href="#" className="text-gray-400 hover:text-white" aria-label="Profile">
        <UsersIcon className="h-6 w-6" />
      </Link>
      <Link href="#" className="text-gray-400 hover:text-white" aria-label="Settings">
        <SettingsIcon className="h-6 w-6" />
      </Link>
      <div className="flex-1" /> {/* Spacer */}
      <Link href="#" className="text-green-500 hover:text-green-400" aria-label="Create New Coin">
        <PlusCircleIcon className="h-8 w-8" />
      </Link>
    </div>
  )
}
