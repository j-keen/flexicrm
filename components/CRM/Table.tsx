import React from 'react';
import { CustomerRecord, FieldDefinition } from '../../types';
import { Badge } from '../ui/Badge';
import { Edit2 } from 'lucide-react';

interface TableProps {
  fields: FieldDefinition[];
  data: CustomerRecord[];
  onRowClick: (record: CustomerRecord) => void;
}

export const Table: React.FC<TableProps> = ({ fields, data, onRowClick }) => {
  // Sort fields by order
  const activeFields = fields.filter(f => f.visible).sort((a, b) => a.order - b.order);

  // Format cell data
  const renderCell = (record: CustomerRecord, field: FieldDefinition) => {
    const value = record[field.id];

    if (value === undefined || value === null) return <span className="text-gray-400">-</span>;

    if (field.type === 'select' && field.options) {
      const option = field.options.find(o => o.id === value);
      if (option) {
        return <Badge colorClass={option.color} label={option.label} />;
      }
      return value;
    }

    if (field.type === 'currency') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
    }

    return <span className="text-gray-900">{String(value)}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 h-full">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8 h-full">
          <div className="shadow border-b border-gray-200 sm:rounded-lg h-full overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    {activeFields.map(field => (
                      <th
                        key={field.id}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        style={{ minWidth: field.width || 150 }}
                      >
                        {field.name}
                      </th>
                    ))}
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map(record => (
                    <tr 
                      key={record.id} 
                      onClick={() => onRowClick(record)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {activeFields.map(field => (
                        <td key={field.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {renderCell(record, field)}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-brand-600 hover:text-brand-900">
                           <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                     <tr>
                        <td colSpan={activeFields.length + 1} className="px-6 py-10 text-center text-gray-500">
                           No records found. Add a new customer to get started.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Simple Pagination Footer Placeholder */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                <p className="text-xs text-gray-500">Showing {data.length} records</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};