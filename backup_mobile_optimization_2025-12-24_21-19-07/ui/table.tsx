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
      <div className="relative overflow-hidden rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm">
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
    className={`bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 border-b border-gray-300 dark:border-gray-600 ${className || ''}`}
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
    className={`bg-white dark:bg-gray-800 ${className || ''}`}
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
    className={`bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 ${className || ''}`}
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
      border-b border-gray-200 dark:border-gray-600 transition-colors duration-200
      ${interactive ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}
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
      px-4 py-4 text-left text-sm font-bold text-gray-800 dark:text-gray-200
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
      px-4 py-4 text-sm text-gray-900 dark:text-gray-100 font-semibold
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
        <div className="md:hidden space-y-4">
          {data.map((row, index) => (
            <div
              key={index}
              className={`
                bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 p-6 shadow-lg
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-xl transition-all duration-200' : ''}
              `}
            >
              {columns
                .filter(column => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-0 flex-1 pr-3">
                      {column.mobileLabel || column.label}:
                    </span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-semibold text-right min-w-0 flex-1">
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