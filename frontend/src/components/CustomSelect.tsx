"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SelectOption = { value: string; label: string };

type CustomSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  autoFocus?: boolean;
  className?: string;
};

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  required = false,
  name,
  id,
  autoFocus = false,
  className = "",
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [autoFocus]);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      setDropdownPosition({
        top: rect.bottom + scrollTop + 4,
        left: rect.left + scrollLeft,
        width: rect.width,
      });
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        setDropdownPosition({
          top: rect.bottom + scrollTop + 4,
          left: rect.left + scrollLeft,
          width: rect.width,
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0) {
        onChange(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen((prev) => !prev);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((i) => (i + 1) % options.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((i) => (i - 1 + options.length) % options.length);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      setIsOpen((prev) => {
        const newIsOpen = !prev;
        if (newIsOpen) {
          const index = options.findIndex((opt) => opt.value === value);
          setHighlightedIndex(index >= 0 ? index : 0);
        }
        return newIsOpen;
      });
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`input-shell flex w-full min-w-0 items-center justify-between rounded-2xl px-4 py-3 text-left text-sm text-white transition-opacity ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>
          {selectedOption?.label || placeholder}
          {required && !value && <span className="ml-1 text-(--accent-ice)">*</span>}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-(--text-dim) transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen &&
        dropdownPosition &&
        createPortal(
          <div
            className="absolute z-9999 overflow-hidden rounded-[20px] border border-white/10 bg-[rgba(12,16,24,0.98)] py-2 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {options.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  option.value === value
                    ? "bg-[rgba(144,229,255,0.12)] text-white"
                    : highlightedIndex === index
                      ? "bg-white/8 text-white"
                      : "text-(--text-secondary) hover:bg-white/5 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
