"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, MapPin, Search } from "lucide-react"

interface Business {
  id: string
  name: string
  slug: string
  address: string | null
  ownerName: string | null
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export function BusinessSearch() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    async function search() {
      if (debouncedQuery.length < 3) {
        setResults([])
        setSearched(false)
        return
      }
      setLoading(true)
      setSearched(false)
      try {
        const data: Business[] = await fetch(`/api/public/businesses?q=${encodeURIComponent(debouncedQuery)}`).then((r) => r.json())
        setResults(data)
        setSearched(true)
      } finally {
        setLoading(false)
      }
    }
    search()
  }, [debouncedQuery])

  function handleSelect(business: Business) {
    router.push(`/reserve/${business.slug}`)
  }

  const showDropdown = query.length >= 3

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="font-display font-light text-3xl sm:text-4xl leading-[1.05]">
          ¿En qué negocio<br />deseas reservar?
        </h1>
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe el nombre del negocio..."
            className="w-full h-14 pl-12 pr-12 rounded-2xl border border-border bg-card text-base shadow-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all"
            autoComplete="off"
            role="combobox"
            aria-label="Buscar negocio"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
            aria-controls="business-search-listbox"
          />
          {loading && (
            <Loader2 className="absolute right-4 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {showDropdown && (
          <div
            id="business-search-listbox"
            role="listbox"
            aria-label="Resultados de búsqueda"
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-lg overflow-hidden z-50"
          >
            {loading && results.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searched && results.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No encontramos negocios con ese nombre.
                </p>
              </div>
            ) : (
              <ul>
                {results.map((business, i) => (
                  <li key={business.id}>
                    <button
                      role="option"
                      aria-selected="false"
                      onClick={() => handleSelect(business)}
                      className={`w-full text-left px-5 py-4 hover:bg-muted/50 active:bg-muted transition-colors flex items-center gap-3 ${
                        i < results.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {business.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{business.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {business.ownerName && (
                            <span className="text-xs text-muted-foreground">
                              {business.ownerName}
                            </span>
                          )}
                          {business.address && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{business.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {!query && (
        <p className="text-center text-sm text-muted-foreground mt-4">
          O accede directamente al link que te compartió el negocio.
        </p>
      )}
    </div>
  )
}
