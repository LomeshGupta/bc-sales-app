import { BCItem } from '@/types';

async function bcGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const sp = new URLSearchParams({ path, ...params });
  const res = await fetch(`/api/bc?${sp.toString()}`);
  if (!res.ok) throw new Error(`BC API error ${res.status}`);
  return res.json();
}

const MOCK_ITEMS: BCItem[] = [
  { id: 'i1',  no: '1000', description: 'Bicycle',             unitPrice: 520.00,  unitOfMeasureCode: 'PCS', inventory: 42,  itemCategoryCode: 'BICYCLE' },
  { id: 'i2',  no: '1001', description: 'Touring Bicycle',     unitPrice: 1250.00, unitOfMeasureCode: 'PCS', inventory: 18,  itemCategoryCode: 'BICYCLE' },
  { id: 'i3',  no: '1100', description: 'Front Wheel',         unitPrice: 98.50,   unitOfMeasureCode: 'PCS', inventory: 120, itemCategoryCode: 'PARTS' },
  { id: 'i4',  no: '1110', description: 'Rear Wheel',          unitPrice: 112.00,  unitOfMeasureCode: 'PCS', inventory: 95,  itemCategoryCode: 'PARTS' },
  { id: 'i5',  no: '1120', description: 'Spokes',              unitPrice: 2.40,    unitOfMeasureCode: 'BOX', inventory: 300, itemCategoryCode: 'PARTS' },
  { id: 'i6',  no: '1150', description: 'Front Hub',           unitPrice: 32.50,   unitOfMeasureCode: 'PCS', inventory: 88,  itemCategoryCode: 'PARTS' },
  { id: 'i7',  no: '1151', description: 'Axle Front Wheel',    unitPrice: 18.00,   unitOfMeasureCode: 'PCS', inventory: 55,  itemCategoryCode: 'PARTS' },
  { id: 'i8',  no: '1155', description: 'Nuts & Bolts Pack',   unitPrice: 8.75,    unitOfMeasureCode: 'PKG', inventory: 500, itemCategoryCode: 'PARTS' },
  { id: 'i9',  no: '1160', description: 'Touring Handlebars',  unitPrice: 65.00,   unitOfMeasureCode: 'PCS', inventory: 40,  itemCategoryCode: 'BICYCLE' },
  { id: 'i10', no: '1200', description: 'Bicycle Seat',        unitPrice: 45.00,   unitOfMeasureCode: 'PCS', inventory: 75,  itemCategoryCode: 'PARTS' },
  { id: 'i11', no: '1300', description: 'Bicycle Pump',        unitPrice: 28.00,   unitOfMeasureCode: 'PCS', inventory: 200, itemCategoryCode: 'ACCESSORIES' },
  { id: 'i12', no: '1302', description: 'Tire Repair Kit',     unitPrice: 14.50,   unitOfMeasureCode: 'KIT', inventory: 350, itemCategoryCode: 'ACCESSORIES' },
  { id: 'i13', no: '1310', description: 'Bicycle Lock',        unitPrice: 34.00,   unitOfMeasureCode: 'PCS', inventory: 130, itemCategoryCode: 'ACCESSORIES' },
  { id: 'i14', no: '1320', description: 'Bicycle Helmet',      unitPrice: 89.00,   unitOfMeasureCode: 'PCS', inventory: 65,  itemCategoryCode: 'ACCESSORIES' },
  { id: 'i15', no: '1330', description: 'Bicycle Gloves',      unitPrice: 22.50,   unitOfMeasureCode: 'PCS', inventory: 90,  itemCategoryCode: 'ACCESSORIES' },
];

export async function getItems(search?: string): Promise<BCItem[]> {
  try {
    const params: Record<string, string> = { '$top': '200', '$orderby': 'description asc' };
    if (search) params['$filter'] = `contains(description,'${search}') or contains(no,'${search}')`;
    const data = await bcGet<{ value: any[] }>('/items', params);
    return data.value.map(mapBCItem);
  } catch {
    if (search) {
      const q = search.toLowerCase();
      return MOCK_ITEMS.filter(
        (i) => i.description.toLowerCase().includes(q) || i.no.toLowerCase().includes(q)
      );
    }
    return MOCK_ITEMS;
  }
}

export async function getItemByNo(no: string): Promise<BCItem | null> {
  try {
    const data = await bcGet<{ value: any[] }>('/items', { '$filter': `no eq '${no}'`, '$top': '1' });
    return data.value[0] ? mapBCItem(data.value[0]) : null;
  } catch {
    return MOCK_ITEMS.find((i) => i.no === no) || null;
  }
}

function mapBCItem(bc: any): BCItem {
  return {
    id:                bc.id              || bc.no,
    no:                bc.no,
    description:       bc.description,
    unitPrice:         Number(bc.unitPrice || bc.unitCost || 0),
    unitOfMeasureCode: bc.baseUnitOfMeasure || bc.unitOfMeasureCode || 'PCS',
    inventory:         Number(bc.inventory || bc.qtyOnHand || 0),
    itemCategoryCode:  bc.itemCategoryCode,
    type:              bc.type,
  };
}
