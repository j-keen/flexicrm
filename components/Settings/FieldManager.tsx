import React, { useState } from 'react';
import { FieldDefinition, FieldType, SelectOption, DependencyRule } from '../../types';
import { Plus, Trash2, GripVertical, Settings2, ArrowRight } from 'lucide-react';

interface FieldManagerProps {
  fields: FieldDefinition[];
  dependencies: DependencyRule[];
  onUpdateFields: (fields: FieldDefinition[]) => void;
  onUpdateDependencies: (deps: DependencyRule[]) => void;
  readOnly?: boolean;
}

export const FieldManager: React.FC<FieldManagerProps> = ({
  fields,
  dependencies,
  onUpdateFields,
  onUpdateDependencies,
  readOnly = false
}) => {
  const [activeTab, setActiveTab] = useState<'fields' | 'dependencies'>('fields');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Field Management Logic
  const handleAddField = () => {
    const newField: FieldDefinition = {
      id: `f_${Date.now()}`,
      name: 'New Field',
      type: 'text',
      visible: true,
      order: fields.length,
      width: 200,
    };
    onUpdateFields([...fields, newField]);
    setEditingFieldId(newField.id);
  };

  const handleFieldChange = (id: string, updates: Partial<FieldDefinition>) => {
    onUpdateFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleDeleteField = (id: string) => {
    if (confirm('Are you sure? This will hide the data associated with this column.')) {
      onUpdateFields(fields.filter(f => f.id !== id));
    }
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === fields.length - 1)) return;
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    
    // Update order property
    newFields.forEach((f, i) => f.order = i);
    onUpdateFields(newFields);
  };

  // Option Management for Select fields
  const handleAddOption = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    const newOption: SelectOption = {
      id: `opt_${Date.now()}`,
      label: 'New Option',
      color: 'bg-gray-100 text-gray-800'
    };
    
    handleFieldChange(fieldId, { options: [...(field.options || []), newOption] });
  };

  const handleUpdateOption = (fieldId: string, optionId: string, updates: Partial<SelectOption>) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field || !field.options) return;

    const newOptions = field.options.map(o => o.id === optionId ? { ...o, ...updates } : o);
    handleFieldChange(fieldId, { options: newOptions });
  };

  // Dependency Management
  const handleAddDependency = () => {
    const newRule: DependencyRule = {
      id: `dep_${Date.now()}`,
      triggerFieldId: fields[2]?.id || '', // Default to first convenient field
      triggerValue: '',
      targetFieldId: fields[4]?.id || '',
      targetValue: ''
    };
    onUpdateDependencies([...dependencies, newRule]);
  };

  const updateDependency = (id: string, updates: Partial<DependencyRule>) => {
    onUpdateDependencies(dependencies.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDependency = (id: string) => {
    onUpdateDependencies(dependencies.filter(d => d.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex space-x-4">
        <button 
          onClick={() => setActiveTab('fields')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'fields' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Column Setup
        </button>
        <button 
          onClick={() => setActiveTab('dependencies')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'dependencies' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Automation Rules
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {activeTab === 'fields' ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Database Schema</h2>
              <button onClick={handleAddField} className="flex items-center px-3 py-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm">
                <Plus size={16} className="mr-1.5" /> Add Column
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col space-y-1 text-gray-400">
                      <button onClick={() => handleMoveField(index, 'up')} className="hover:text-gray-600"><Settings2 size={12} className="rotate-90" /></button>
                      <button onClick={() => handleMoveField(index, 'down')} className="hover:text-gray-600"><Settings2 size={12} className="-rotate-90" /></button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input 
                        value={field.name} 
                        onChange={(e) => handleFieldChange(field.id, { name: e.target.value })}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                        placeholder="Column Name"
                      />
                      
                      <select 
                        value={field.type}
                        onChange={(e) => handleFieldChange(field.id, { type: e.target.value as FieldType })}
                        disabled={field.isSystem}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm border p-2"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown Select</option>
                        <option value="date">Date</option>
                        <option value="currency">Currency</option>
                        <option value="email">Email</option>
                      </select>

                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2 text-sm text-gray-600">
                          <input 
                            type="checkbox" 
                            checked={field.visible} 
                            onChange={(e) => handleFieldChange(field.id, { visible: e.target.checked })}
                            className="rounded text-brand-600 focus:ring-brand-500"
                          />
                          <span>Visible</span>
                        </label>
                      </div>

                      <div className="flex justify-end items-center">
                        {!field.isSystem && (
                          <button onClick={() => handleDeleteField(field.id)} className="text-red-400 hover:text-red-600 p-2">
                            <Trash2 size={18} />
                          </button>
                        )}
                        {field.type === 'select' && (
                          <button 
                            onClick={() => setEditingFieldId(editingFieldId === field.id ? null : field.id)}
                            className={`text-sm text-brand-600 hover:underline ml-2 ${editingFieldId === field.id ? 'font-bold' : ''}`}
                          >
                            {editingFieldId === field.id ? 'Done' : 'Edit Options'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sub-panel for editing select options */}
                  {editingFieldId === field.id && field.type === 'select' && (
                    <div className="mt-4 pl-12 pr-4 py-4 bg-gray-50 rounded-md border border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Dropdown Options</h4>
                      <div className="space-y-2">
                        {field.options?.map(opt => (
                          <div key={opt.id} className="flex gap-2 items-center">
                            <input 
                              value={opt.label}
                              onChange={(e) => handleUpdateOption(field.id, opt.id, { label: e.target.value })}
                              className="flex-1 text-sm border-gray-300 rounded-md shadow-sm border p-1.5"
                              placeholder="Option Label"
                            />
                            <select 
                              value={opt.color}
                              onChange={(e) => handleUpdateOption(field.id, opt.id, { color: e.target.value })}
                              className="text-sm border-gray-300 rounded-md shadow-sm border p-1.5 w-32"
                            >
                              <option value="bg-gray-100 text-gray-800">Gray</option>
                              <option value="bg-blue-100 text-blue-800">Blue</option>
                              <option value="bg-green-100 text-green-800">Green</option>
                              <option value="bg-red-100 text-red-800">Red</option>
                              <option value="bg-yellow-100 text-yellow-800">Yellow</option>
                              <option value="bg-purple-100 text-purple-800">Purple</option>
                            </select>
                          </div>
                        ))}
                        <button onClick={() => handleAddOption(field.id)} className="text-xs text-brand-600 hover:text-brand-800 font-medium mt-1">
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
             <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Automation Logic</h2>
              <button onClick={handleAddDependency} className="flex items-center px-3 py-1.5 bg-brand-600 text-white rounded-md hover:bg-brand-700 text-sm">
                <Plus size={16} className="mr-1.5" /> Add Rule
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Automatically set field values when specific conditions are met.
            </p>

            <div className="space-y-3">
              {dependencies.map(rule => (
                <div key={rule.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">IF</span>
                  
                  {/* Trigger Field */}
                  <select 
                    value={rule.triggerFieldId} 
                    onChange={(e) => updateDependency(rule.id, { triggerFieldId: e.target.value })}
                    className="border-gray-300 rounded-md text-sm p-1.5 border"
                  >
                    <option value="" disabled>Select Field</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>

                  <span className="text-sm text-gray-500">EQUALS</span>
                  
                  {/* Trigger Value (Simulated as text for now, could be dynamic based on type) */}
                  <div className="w-32">
                     {/* If trigger field is a select, show select options */}
                     {(() => {
                        const triggerField = fields.find(f => f.id === rule.triggerFieldId);
                        if (triggerField?.type === 'select') {
                           return (
                             <select
                                value={rule.triggerValue}
                                onChange={(e) => updateDependency(rule.id, { triggerValue: e.target.value })}
                                className="w-full border-gray-300 rounded-md text-sm p-1.5 border"
                             >
                               <option value="">Select Option</option>
                               {triggerField.options?.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                             </select>
                           )
                        }
                        return (
                          <input 
                            value={rule.triggerValue}
                            onChange={(e) => updateDependency(rule.id, { triggerValue: e.target.value })}
                            className="w-full border-gray-300 rounded-md text-sm p-1.5 border"
                            placeholder="Value"
                          />
                        )
                     })()}
                  </div>

                  <span className="text-sm text-gray-500"><ArrowRight size={16} /> THEN SET</span>
                  
                  {/* Target Field */}
                   <select 
                    value={rule.targetFieldId} 
                    onChange={(e) => updateDependency(rule.id, { targetFieldId: e.target.value })}
                    className="border-gray-300 rounded-md text-sm p-1.5 border"
                  >
                    <option value="" disabled>Select Field</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>

                  <span className="text-sm text-gray-500">TO</span>

                  <input 
                    value={rule.targetValue}
                    onChange={(e) => updateDependency(rule.id, { targetValue: e.target.value })}
                    className="border-gray-300 rounded-md text-sm p-1.5 border w-32"
                    placeholder="Result Value"
                  />

                  <button onClick={() => deleteDependency(rule.id)} className="ml-auto text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {dependencies.length === 0 && (
                 <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
                    <p className="text-gray-500 text-sm">No rules defined yet.</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};