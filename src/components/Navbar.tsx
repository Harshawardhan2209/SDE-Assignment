"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Github, Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
  { name: "Home", href: "#hero" },
  { name: "Features", href: "#features" },
  { name: "Library", href: "#library" },
  { name: "About", href: "#about" },
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNavClick = useCallback((href: string) => {
    if (href.startsWith("#")) {
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
    setMenuOpen(false)
  }, [])

  return (
    <header>
      <nav className="sticky top-4 z-50 w-full">
        <div
          className={cn(
            "mx-auto max-w-6xl transition-all duration-300 px-6 rounded-xl border",
            isScrolled ? "bg-background/70 shadow-sm backdrop-blur" : "bg-background/95"
          )}
        >
          <div className="relative flex items-center justify-between py-3">
            
            {/* Left: Logo */}
            <Link href="/" aria-label="home" className="font-semibold text-lg">
              📖 ReadUp
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close Menu" : "Open Menu"}
              className="block p-2 lg:hidden"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Center Nav (desktop) */}
            <div className="hidden lg:flex gap-8 text-sm font-medium text-muted-foreground">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.href)}
                  className="hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Right (desktop) */}
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="https://github.com/Harshawardhan2209/SDE-Assignment"
                target="_blank"
                className="text-muted-foreground hover:text-foreground"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Button asChild className="rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90">
                <Link href="/add">+ Add Book</Link>
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="mt-3 flex flex-col gap-6 rounded-md border bg-background p-6 shadow-lg lg:hidden">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item.href)}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </button>
              ))}
              <div className="flex items-center justify-between">
                <Link
                  href="https://github.com/Harshawardhan2209/readup-v1"
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-5 w-5" />
                </Link>
                <Button asChild className="rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90">
                  <Link href="/add">+ Add Book</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
