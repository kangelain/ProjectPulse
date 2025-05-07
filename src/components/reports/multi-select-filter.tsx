
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Slot } from "@radix-ui/react-slot"; // Changed import
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Filter as FilterIcon } from 'lucide-react';

interface MultiSelectFilterProps {
  title: string;
  options: readonly string[];
  selectedValues: Set<string>;
  onValueChange: (item: string) => void;
  onClear: () => void;
  buttonClassName?: string;
  popoverContentClassName?: string;
}

export function MultiSelectFilter({
  title,
  options,
  selectedValues,
  onValueChange,
  onClear,
  buttonClassName,
  popoverContentClassName
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);

  const getDisplayValue = () => {
    if (selectedValues.size === 0) return title;
    if (selectedValues.size === 1) return Array.from(selectedValues)[0];
    return `${title} (${selectedValues.size} selected)`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Slot> {/* Changed FormControl to Slot */}
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={buttonClassName || "w-full sm:w-[180px] justify-between h-9 text-xs px-3"}
          >
            <div className="flex items-center truncate">
              <FilterIcon className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-50" />
              <span className="truncate">{getDisplayValue()}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </Slot>
      </PopoverTrigger>
      <PopoverContent className={popoverContentClassName || "w-[200px] p-0"}>
        <Command>
          <CommandInput placeholder={`Search ${title.toLowerCase()}...`} className="text-xs h-9" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => {
                    onValueChange(option);
                    // Potentially keep popover open for multi-select: setOpen(false) if single select behavior desired after click
                  }}
                  className="text-xs py-1.5 cursor-pointer"
                >
                   <div className="flex items-center w-full">
                     <span className="mr-2 h-4 w-4 flex items-center justify-center">
                      {selectedValues.has(option) ? '✅' : '🔲'}
                    </span>
                    <span className="truncate">{option}</span>
                   </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onClear();
                      setOpen(false);
                    }}
                    className="justify-center text-center text-xs text-muted-foreground py-1.5 cursor-pointer"
                  >
                    Clear selection
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
