import type { ReactNode } from 'react';
import './ui.css';

export type ListTableColumn<TKey extends string> = {
  key: TKey;
  header: string;
  align?: 'start' | 'end';
};

export type ListTableRow<TKey extends string> = {
  id: string;
  cells: Record<TKey, ReactNode>;
};

type ListTableProps<TKey extends string> = {
  caption: string;
  columns: readonly ListTableColumn<TKey>[];
  rows: readonly ListTableRow<TKey>[];
  emptyLabel?: string;
};

export const ListTable = <TKey extends string>({
  caption,
  columns,
  rows,
  emptyLabel,
}: ListTableProps<TKey>) => (
  <div className="ni-card ni-table-card">
    <table className="ni-table">
      <caption className="ni-visually-hidden">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} scope="col" data-align={column.align}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && emptyLabel ? (
          <tr>
            <td colSpan={columns.length} className="ni-table__empty">
              {emptyLabel}
            </td>
          </tr>
        ) : (
          rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td key={column.key} data-align={column.align}>
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
