import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X } from 'lucide-react'

export function SearchableSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select...', 
  required = false,
  disabled = false,
  getOptionLabel = (option) => option.label || option.name || option.email || String(option),
  getOptionValue = (option) => option.id || option._id || option.value || option
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0, positionAbove: false })
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  // Filter options based on search query
  const filteredOptions = options.filter(option => {
    if (!searchQuery) return true
    const label = getOptionLabel(option).toLowerCase()
    const query = searchQuery.toLowerCase()
    return label.includes(query)
  })

  // Find selected option
  const selectedOption = options.find(opt => {
    const optValue = getOptionValue(opt)
    const currentValue = value === null || value === undefined ? '' : value
    return optValue === currentValue || String(optValue) === String(currentValue)
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Calculate dropdown position and focus input when dropdown opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownMaxHeight = 250 // Max height including padding
        
        // Determine if we should position above
        const positionAbove = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow
        
        // Calculate position using viewport coordinates (fixed positioning)
        let top = rect.bottom + 4 // Default: position below with 4px margin
        let bottom = undefined
        
        if (positionAbove) {
          // Position above: use bottom property to anchor to the input top
          bottom = window.innerHeight - rect.top + 4 // 4px margin above input
          top = undefined
        }
        
        setDropdownPosition({
          top,
          bottom,
          left: rect.left,
          width: rect.width,
          positionAbove
        })
      }
      
      updatePosition()
      
      // Update position on scroll or resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen, filteredOptions.length])

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option)
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    setHighlightedIndex(-1)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchQuery('')
  }

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        setHighlightedIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`
          flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm
          ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${!selectedOption && !value ? 'text-muted-foreground' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </div>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-sm hover:bg-accent p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown 
            className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-[9999] rounded-md border bg-popover text-popover-foreground shadow-md"
          style={{
            ...(dropdownPosition.positionAbove 
              ? { bottom: `${dropdownPosition.bottom}px` }
              : { top: `${dropdownPosition.top}px` }
            ),
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`
          }}
        >
          <div className="p-1">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No options found
              </div>
            ) : (
              filteredOptions.map((option, index) => {
                const optionValue = getOptionValue(option)
                const currentValue = value === null || value === undefined ? '' : value
                const isSelected = optionValue === currentValue || String(optionValue) === String(currentValue)
                const isHighlighted = index === highlightedIndex

                return (
                  <div
                    key={optionValue}
                    className={`
                      relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm
                      outline-none hover:bg-accent hover:text-accent-foreground
                      ${isSelected ? 'bg-accent text-accent-foreground' : ''}
                      ${isHighlighted ? 'bg-accent text-accent-foreground' : ''}
                    `}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {getOptionLabel(option)}
                    {isSelected && (
                      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
                        ✓
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

