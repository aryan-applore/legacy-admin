import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, X, Check } from 'lucide-react'

export function MultiSelect({
    value = [],
    onChange,
    options = [],
    placeholder = 'Select options...',
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

    // Calculate dropdown position
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
                    // Position above
                    bottom = window.innerHeight - rect.top + 4
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
        const newValue = [...value]

        const index = newValue.indexOf(optionValue)
        if (index > -1) {
            newValue.splice(index, 1) // Remove if exists
        } else {
            newValue.push(optionValue) // Add if not exists
        }

        onChange(newValue)
        // Don't close dropdown for multi-select
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    const handleRemove = (e, valToRemove) => {
        e.stopPropagation()
        const newValue = value.filter(v => v !== valToRemove)
        onChange(newValue)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange([])
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

    // Get selected options objects to display labels
    const getSelectedOptions = () => {
        return options.filter(opt => value.includes(getOptionValue(opt)))
    }

    return (
        <div ref={containerRef} className="relative w-full">
            <div
                className={`
          flex min-h-[38px] w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm
          ring-offset-background focus-within:outline-none focus-within:ring-1 focus-within:ring-ring
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex flex-1 flex-wrap gap-1">
                    {value.length === 0 && (
                        <span className="text-muted-foreground py-1">{placeholder}</span>
                    )}

                    {getSelectedOptions().map((opt) => (
                        <span
                            key={getOptionValue(opt)}
                            className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {getOptionLabel(opt)}
                            <button
                                type="button"
                                className="ml-0.5 hover:text-foreground"
                                onClick={(e) => handleRemove(e, getOptionValue(opt))}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}

                    {value.length > 0 && value.length > getSelectedOptions().length && (
                        <span className="text-xs text-muted-foreground py-1">
                            +{value.length - getSelectedOptions().length} more (loading...)
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                    {value.length > 0 && !disabled && (
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
                                const isSelected = value.includes(optionValue)
                                const isHighlighted = index === highlightedIndex

                                return (
                                    <div
                                        key={optionValue}
                                        className={`
                      relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm
                      outline-none hover:bg-accent hover:text-accent-foreground
                      ${isHighlighted ? 'bg-accent text-accent-foreground' : ''}
                    `}
                                        onClick={() => handleSelect(option)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                    >
                                        <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                        {getOptionLabel(option)}
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
