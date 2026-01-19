import React, { useState, useEffect, useRef } from 'react';
import { CustomerRecord, FieldDefinition, DependencyRule, ModalSize, FieldType } from '../../types';
import { X, Save, Layout, Grip, ArrowRightLeft, Maximize2, Move, Plus } from 'lucide-react';
import { NewFieldModal } from './NewFieldModal';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: CustomerRecord;
  fields: FieldDefinition[];
  dependencies: DependencyRule[];
  onSave: (record: CustomerRecord) => void;
  onUpdateFields: (fields: FieldDefinition[]) => void;
  modalSize: ModalSize;
  onUpdateModalSize: (size: ModalSize) => void;
}

const MODAL_SIZES: { value: ModalSize; label: string; class: string }[] = [
  { value: 'sm', label: 'Small', class: 'sm:max-w-sm' },
  { value: 'md', label: 'Medium', class: 'sm:max-w-md' },
  { value: 'lg', label: 'Large', class: 'sm:max-w-lg' },
  { value: 'xl', label: 'XL', class: 'sm:max-w-xl' },
  { value: '2xl', label: '2XL', class: 'sm:max-w-2xl' },
  { value: '4xl', label: 'Wide', class: 'sm:max-w-4xl' },
  { value: 'full', label: 'Full', class: 'sm:max-w-full sm:m-4' },
];

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen, onClose, record, fields, dependencies, onSave, onUpdateFields, modalSize, onUpdateModalSize
}) => {
  const [formData, setFormData] = useState<Partial<CustomerRecord>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);

  // For Drag Logic
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(record || {});
      setIsEditMode(false);
    }
  }, [isOpen, record]);

  // Ensure all fields have layout
  useEffect(() => {
    if (isOpen) {
        const fieldsWithoutLayout = fields.some(f => !f.layout);
        if (fieldsWithoutLayout) {
            const updatedFields = fields.map((f, index) => ({
                ...f,
                layout: f.layout || { x: (index % 2) * 6, y: Math.floor(index / 2), w: 6, h: 1 }
            }));
            onUpdateFields(updatedFields);
        }
    }
  }, [isOpen, fields, onUpdateFields]);


  // Dependency Engine
  const handleChange = (fieldId: string, value: any) => {
    let newData = { ...formData, [fieldId]: value };

    // Check for dependencies
    const matchingRules = dependencies.filter(
      d => d.triggerFieldId === fieldId && String(d.triggerValue) === String(value)
    );

    matchingRules.forEach(rule => {
      newData[rule.targetFieldId] = rule.targetValue;
    });

    setFormData(newData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRecord: CustomerRecord = {
      id: record?.id || `rec_${Date.now()}`,
      created_at: record?.created_at || new Date().toISOString(),
      ...formData
    };
    onSave(finalRecord);
    onClose();
  };

  // Layout Editing Logic
  const handleLayoutUpdate = (fieldId: string, changes: Partial<{ x: number; y: number; w: number; h: number }>) => {
    const updatedFields = fields.map(f => {
      if (f.id === fieldId && f.layout) {
        let newLayout = { ...f.layout, ...changes };
        // Boundary checks
        if (newLayout.x < 0) newLayout.x = 0;
        if (newLayout.w < 1) newLayout.w = 1;
        if (newLayout.x + newLayout.w > 12) newLayout.x = 12 - newLayout.w;
        if (newLayout.y < 0) newLayout.y = 0;
        return { ...f, layout: newLayout };
      }
      return f;
    });
    onUpdateFields(updatedFields);
  };

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent ghost
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent, targetX: number, targetY: number) => {
    e.preventDefault();
    if (!draggingId || !gridRef.current) return;

    // Simple snap: just update position to hovered cell
    // Note: Better UX would be to check if it fits, but for prototype, we allow overlap temporarily
    const field = fields.find(f => f.id === draggingId);
    if (field && field.layout) {
        // Implementation note: real-time drag updates would go here
    }
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
      e.preventDefault();
      if(draggingId) {
          handleLayoutUpdate(draggingId, { x, y });
          setDraggingId(null);
      }
  };
  
  // Custom "Move" buttons for precision as DnD can be finicky in pure React without libraries
  const moveField = (id: string, dx: number, dy: number) => {
      const f = fields.find(f => f.id === id);
      if(!f?.layout) return;
      handleLayoutUpdate(id, { x: f.layout.x + dx, y: f.layout.y + dy });
  }

  // Calculate max rows to define grid height
  const maxRow = fields.reduce((max, f) => Math.max(max, (f.layout?.y || 0) + (f.layout?.h || 1)), 0);

  // Add New Field Logic
  const handleAddNewField = (name: string, type: FieldType) => {
    // Find next available Y position (append to bottom)
    const nextY = maxRow > 0 ? maxRow : 0;
    
    const newField: FieldDefinition = {
      id: `f_${Date.now()}`,
      name: name,
      type: type,
      visible: true,
      order: fields.length,
      width: 200,
      layout: { x: 0, y: nextY, w: 6, h: 1 }, // Default half width, new row
      options: type === 'select' ? [] : undefined
    };

    onUpdateFields([...fields, newField]);
  };

  const activeSizeClass = MODAL_SIZES.find(s => s.value === modalSize)?.class || 'sm:max-w-lg';

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} aria-hidden="true"></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className={`relative inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${activeSizeClass}`}>
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
               <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {record ? 'Edit Customer' : 'Add New Customer'}
                  </h3>
                  {isEditMode && <p className="text-xs text-brand-600 font-medium mt-1">Layout Editor Active</p>}
               </div>
               
               <div className="flex items-center space-x-2">
                 <button 
                    type="button" 
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`p-2 rounded-md transition-colors ${isEditMode ? 'bg-brand-100 text-brand-700' : 'text-gray-400 hover:bg-gray-200'}`}
                    title="Customize Layout"
                 >
                    <Layout size={20} />
                 </button>
                 <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500">
                  <X size={24} />
                 </button>
               </div>
            </div>
            
            {/* Toolbar (Edit Mode Only) */}
            {isEditMode && (
              <div className="px-6 py-3 bg-brand-50 border-b border-brand-100 flex flex-wrap items-center gap-4">
                 <button 
                   type="button" 
                   onClick={() => setIsNewFieldModalOpen(true)}
                   className="flex items-center px-3 py-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm shadow-sm transition-colors"
                 >
                   <Plus size={16} className="mr-1.5" /> Add Field
                 </button>

                 <div className="h-6 w-px bg-brand-200 mx-2 hidden sm:block"></div>

                 <div className="flex items-center gap-2 overflow-x-auto">
                   <span className="text-xs font-bold text-brand-800 uppercase tracking-wide whitespace-nowrap">Size:</span>
                   <div className="flex space-x-1">
                      {MODAL_SIZES.map(size => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() => onUpdateModalSize(size.value)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${modalSize === size.value ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400'}`}
                          >
                              {size.label}
                          </button>
                      ))}
                   </div>
                 </div>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-6 bg-white flex-1">
              
              {/* Grid Container */}
              <div 
                ref={gridRef}
                className="grid grid-cols-12 gap-4 relative"
                style={{ 
                    gridAutoRows: 'minmax(60px, auto)',
                    minHeight: isEditMode ? `${Math.max(maxRow + 1, 4) * 80}px` : 'auto' 
                }}
              >
                {/* Background Grid Lines (Edit Mode) */}
                {isEditMode && Array.from({ length: 12 * Math.max(maxRow + 2, 6) }).map((_, i) => (
                    <div 
                        key={`grid-${i}`} 
                        className="border border-dashed border-gray-100 rounded-md h-full w-full pointer-events-none"
                        style={{ gridColumn: 'span 1', gridRow: 'span 1' }} 
                    />
                ))}

                {/* Drop Zones (Overlay logic for dropping) */}
                {isEditMode && Array.from({ length: 12 }).map((_, col) => 
                     Array.from({ length: Math.max(maxRow + 2, 6) }).map((_, row) => (
                        <div
                           key={`drop-${col}-${row}`}
                           className="absolute w-full h-full z-0"
                           style={{
                               gridColumnStart: col + 1,
                               gridRowStart: row + 1,
                           }}
                           onDragOver={(e) => {
                               e.preventDefault();
                               e.stopPropagation(); // Stop bubbling
                           }}
                           onDrop={(e) => {
                               e.preventDefault();
                               e.stopPropagation();
                               handleDrop(e, col, row);
                           }}
                        />
                     ))
                )}

                {/* Fields */}
                {fields.filter(f => f.visible).map(field => {
                    const { x = 0, y = 0, w = 12, h = 1 } = field.layout || {};
                    
                    return (
                        <div
                          key={field.id}
                          draggable={isEditMode}
                          onDragStart={(e) => handleDragStart(e, field.id)}
                          className={`
                            relative group transition-all duration-200
                            ${isEditMode ? 'cursor-move border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 hover:border-brand-500 rounded-lg p-2 z-10' : ''}
                          `}
                          style={{
                            gridColumnStart: x + 1,
                            gridColumnEnd: `span ${w}`,
                            gridRowStart: y + 1,
                            gridRowEnd: `span ${h}`,
                          }}
                        >
                          {/* Edit Mode Controls */}
                          {isEditMode && (
                             <div className="absolute -top-3 -right-3 hidden group-hover:flex bg-white shadow-md rounded-md border border-gray-200 overflow-hidden z-20 scale-90">
                                <button type="button" onClick={() => handleLayoutUpdate(field.id, { w: w - 1 })} className="p-1 hover:bg-gray-100 border-r" title="Shrink Width">-</button>
                                <span className="text-xs px-2 py-1 text-gray-500 select-none">W:{w}</span>
                                <button type="button" onClick={() => handleLayoutUpdate(field.id, { w: w + 1 })} className="p-1 hover:bg-gray-100" title="Expand Width">+</button>
                             </div>
                          )}

                          {isEditMode && (
                             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden group-hover:flex space-x-1 z-20 opacity-90">
                                <div className="flex flex-col bg-white shadow-sm rounded border border-gray-300">
                                    <button type="button" onClick={() => moveField(field.id, 0, -1)} className="p-1 hover:bg-gray-100"><Move size={10} className="rotate-0"/></button>
                                    <div className="flex">
                                        <button type="button" onClick={() => moveField(field.id, -1, 0)} className="p-1 hover:bg-gray-100"><Move size={10} className="-rotate-90"/></button>
                                        <div className="w-4 h-4 flex items-center justify-center"><Grip size={10}/></div>
                                        <button type="button" onClick={() => moveField(field.id, 1, 0)} className="p-1 hover:bg-gray-100"><Move size={10} className="rotate-90"/></button>
                                    </div>
                                    <button type="button" onClick={() => moveField(field.id, 0, 1)} className="p-1 hover:bg-gray-100"><Move size={10} className="rotate-180"/></button>
                                </div>
                             </div>
                          )}

                          {/* Actual Input */}
                          <div className={`h-full flex flex-col ${isEditMode ? 'pointer-events-none opacity-50' : ''}`}>
                             <label className="block text-sm font-medium text-gray-700 mb-1 truncate" title={field.name}>
                                {field.name}
                             </label>
                             
                             {field.type === 'select' ? (
                                <select
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleChange(field.id, e.target.value)}
                                  className="flex-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md border shadow-sm"
                                >
                                  <option value="">Select...</option>
                                  {field.options?.map(opt => (
                                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                                  ))}
                                </select>
                              ) : field.type === 'number' || field.type === 'currency' ? (
                                <div className="relative rounded-md shadow-sm flex-1">
                                  {field.type === 'currency' && (
                                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                       <span className="text-gray-500 sm:text-sm">$</span>
                                     </div>
                                  )}
                                  <input
                                    type="number"
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field.id, Number(e.target.value))}
                                    className={`focus:ring-brand-500 focus:border-brand-500 block w-full h-full sm:text-sm border-gray-300 rounded-md border p-2 ${field.type === 'currency' ? 'pl-7' : ''}`}
                                  />
                                </div>
                              ) : (
                                <input
                                  type={field.type}
                                  value={formData[field.id] || ''}
                                  onChange={(e) => handleChange(field.id, e.target.value)}
                                  className="focus:ring-brand-500 focus:border-brand-500 block w-full h-full sm:text-sm border-gray-300 rounded-md border p-2 shadow-sm"
                                />
                              )}
                          </div>
                        </div>
                    );
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-lg border-t border-gray-200">
              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-brand-600 text-base font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                <Save size={16} className="mr-2" /> Save Record
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {/* Secondary Modal for Adding Fields */}
    <NewFieldModal 
       isOpen={isNewFieldModalOpen}
       onClose={() => setIsNewFieldModalOpen(false)}
       onAdd={handleAddNewField}
    />
    </>
  );
};