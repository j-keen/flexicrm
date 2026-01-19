import { AppState, FieldDefinition, CustomerRecord, DependencyRule, ModalSize } from '../types';

export const INITIAL_FIELDS: FieldDefinition[] = [
  { 
    id: 'f_name', name: 'Name', type: 'text', visible: true, order: 0, isSystem: true, width: 200,
    layout: { x: 0, y: 0, w: 6, h: 1 } 
  },
  { 
    id: 'f_email', name: 'Email', type: 'email', visible: true, order: 1, width: 250,
    layout: { x: 6, y: 0, w: 6, h: 1 }
  },
  { 
    id: 'f_status', 
    name: 'Status', 
    type: 'select', 
    visible: true, 
    order: 2, 
    width: 150,
    layout: { x: 0, y: 1, w: 4, h: 1 },
    options: [
      { id: 'opt_lead', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
      { id: 'opt_contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
      { id: 'opt_closed', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
      { id: 'opt_lost', label: 'Lost', color: 'bg-red-100 text-red-800' }
    ]
  },
  { 
    id: 'f_device', 
    name: 'Device Model', 
    type: 'select', 
    visible: true, 
    order: 3, 
    width: 180,
    layout: { x: 4, y: 1, w: 4, h: 1 },
    options: [
      { id: 'dev_iphone15', label: 'iPhone 15', color: 'bg-gray-100 text-gray-800' },
      { id: 'dev_s24', label: 'Galaxy S24', color: 'bg-gray-100 text-gray-800' },
      { id: 'dev_pixel8', label: 'Pixel 8', color: 'bg-gray-100 text-gray-800' }
    ]
  },
  { 
    id: 'f_price', name: 'Est. Price', type: 'currency', visible: true, order: 4, width: 120,
    layout: { x: 8, y: 1, w: 4, h: 1 }
  },
];

export const INITIAL_DEPENDENCIES: DependencyRule[] = [
  // Example: If Device is iPhone 15, Price is 1200
  { id: 'dep_1', triggerFieldId: 'f_device', triggerValue: 'dev_iphone15', targetFieldId: 'f_price', targetValue: 1200 },
  { id: 'dep_2', triggerFieldId: 'f_device', triggerValue: 'dev_s24', targetFieldId: 'f_price', targetValue: 1000 },
  { id: 'dep_3', triggerFieldId: 'f_device', triggerValue: 'dev_pixel8', targetFieldId: 'f_price', targetValue: 800 },
];

export const INITIAL_MODAL_SIZE: ModalSize = 'lg';

const generateMockData = (count: number): CustomerRecord[] => {
  const data: CustomerRecord[] = [];
  const names = ['Alice Kim', 'John Doe', 'Emma Lee', 'Michael Park', 'Sarah Choi'];
  const emails = ['alice@test.com', 'john@test.com', 'emma@gmail.com', 'mike@corp.com', 'sarah@design.io'];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: `rec_${i}`,
      created_at: new Date().toISOString(),
      f_name: names[i % names.length] + ` ${i + 1}`,
      f_email: emails[i % emails.length],
      f_status: ['opt_lead', 'opt_contacted', 'opt_closed'][i % 3],
      f_device: i % 2 === 0 ? 'dev_iphone15' : 'dev_s24',
      f_price: i % 2 === 0 ? 1200 : 1000, 
    });
  }
  return data;
};

export const INITIAL_DATA = generateMockData(50); // Start with 50 for demo