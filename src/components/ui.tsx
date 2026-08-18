import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, Loader2, ChevronDown, Check } from 'lucide-react'
import { getPriorityColor } from '../utils/date'
import clsx from 'clsx'

// ==================== Button ====================
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }[variant]

  const sizeClass = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }[size]

  return (
    <button
      className={clsx(variantClass, sizeClass, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}

// ==================== Card ====================
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('card', className)} {...props}>{children}</div>
}

// ==================== Modal ====================
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  footer?: React.ReactNode
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [open])

  if (!open) return null

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative w-full bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col animate-slide-up', sizeClass)}>
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
            <h3 className="text-lg font-semibold text-ink-800">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-600">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}

// ==================== Confirm Dialog ====================
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="text-center py-2">
        {danger && (
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}
        <h3 className="text-base font-semibold text-ink-800 mb-1">{title}</h3>
        <p className="text-sm text-ink-500 mb-5">{message}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ==================== Input ====================
export function Input({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-700 mb-1">{label}</label>}
      <input className={clsx('input-field', error && 'border-red-400', className)} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export function Textarea({
  label,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-ink-700 mb-1">{label}</label>}
      <textarea className={clsx('textarea-field', error && 'border-red-400', className)} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

// ==================== Select ====================
export function Select({
  label,
  options,
  value,
  onChange,
  className,
  placeholder,
}: {
  label?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}) {
  return (
    <div className={clsx('relative', className)}>
      {label && <label className="block text-sm font-medium text-ink-700 mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field appearance-none pr-8 cursor-pointer"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-[38px] w-4 h-4 text-ink-400 pointer-events-none" />
    </div>
  )
}

// ==================== Empty State ====================
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mb-3">
        <Icon className="w-7 h-7 text-ink-300" />
      </div>
      <h3 className="text-base font-medium text-ink-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ==================== Loading Spinner ====================
export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      {text && <p className="text-sm text-ink-500 mt-2">{text}</p>}
    </div>
  )
}

// ==================== Priority Badge ====================
export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={clsx('badge', getPriorityColor(priority))}>{priority}</span>
  )
}

// ==================== Tag ====================
export function Tag({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'blue' | 'green' | 'purple' | 'orange' }) {
  const colors = {
    default: 'bg-ink-100 text-ink-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return <span className={clsx('badge', colors[color])}>{children}</span>
}

// ==================== Checkbox ====================
export function Checkbox({
  checked,
  onChange,
  className,
}: {
  checked: boolean
  onChange: () => void
  className?: string
}) {
  return (
    <button
      onClick={onChange}
      className={clsx(
        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0',
        checked ? 'bg-primary-600 border-primary-600' : 'border-ink-300 hover:border-primary-400',
        className
      )}
    >
      {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
    </button>
  )
}

// ==================== AI Loading Button ====================
export function AIButton({
  onClick,
  loading,
  children,
  disabled,
  className,
}: {
  onClick: () => void
  loading?: boolean
  children: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <Button
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      className={clsx('bg-gradient-to-r from-primary-600 to-primary-500', className)}
    >
      {children}
    </Button>
  )
}
