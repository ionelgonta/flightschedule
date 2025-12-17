'use client'

import * as React from "react"

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'dense'
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: "w-full border-collapse",
      dense: "w-full border-collapse text-sm"
    }
    
    return (
      <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface">
        <div className="overflow-x-auto">
          <table
            ref={ref}
            className={`${variants[variant]} ${className || ''}`}
            {...props}
          />
        </div>
      </div>
    )
  }
)
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={`bg-surface-container-high border-b border-outline-variant ${className || ''}`}
    {...props}
  />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={`bg-surface ${className || ''}`}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={`bg-surface-container border-t border-outline-variant ${className || ''}`}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    interactive?: boolean
  }
>(({ className, interactive = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={`
      border-b border-outline-variant/50 transition-colors duration-200
      ${interactive ? 'state-layer hover:bg-surface-container-high cursor-pointer' : ''}
      ${className || ''}
    `}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={`
      px-4 py-3 text-left label-large font-medium text-on-surface-variant
      first:pl-6 last:pr-6
      ${className || ''}
    `}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={`
      px-4 py-4 body-medium text-on-surface
      first:pl-6 last:pr-6
      ${className || ''}
    `}
    {...props}
  />
))
TableCell.displayName = "TableCell"

// Mobile-optimized table component
export interface MobileTableProps {
  data: Array<Record<string, any>>
  columns: Array<{
    key: string
    label: string
    render?: (value: any, row: Record<string, any>) => React.ReactNode
    mobileLabel?: string
    hideOnMobile?: boolean
  }>
  onRowClick?: (row: Record<string, any>) => void
  className?: string
}

const MobileTable = React.forwardRef<HTMLDivElement, MobileTableProps>(
  ({ data, columns, onRowClick, className }, ref) => {
    return (
      <div ref={ref} className={className}>
        {/* Desktop Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow 
                  key={index} 
                  interactive={!!onRowClick}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {data.map((row, index) => (
            <div
              key={index}
              className={`
                bg-surface-container rounded-xl border border-outline-variant p-4
                ${onRowClick ? 'state-layer cursor-pointer hover:bg-surface-container-high' : ''}
              `}
            >
              {columns
                .filter(column => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-start py-1">
                    <span className="label-medium text-on-surface-variant min-w-0 flex-1 pr-3">
                      {column.mobileLabel || column.label}:
                    </span>
                    <span className="body-medium text-on-surface text-right min-w-0 flex-1">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
MobileTable.displayName = "MobileTable"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  MobileTable,
}