export type LocationType = '店舗' | '工場';
export type SupplierType = '工場' | '業者';

export interface Location {
    id: string;
    name: string;
    type: LocationType;
    defaultSupplierId?: string;
}

export interface Supplier {
    id: string;
    name: string;
    type: SupplierType;
    officialName?: string;
    contactInfo?: {
        zip?: string;
        address?: string;
        tel?: string;
        fax?: string;
        method?: string;
    };
}

export interface Item {
    id: string;
    category: string;
    name: string;
    unit: string;
    displayName?: string;
    price?: number; // Added price
    defaultSupplierId?: string; // Hint for which supplier usually carries this
}

export interface OrderItem {
    itemId: string;
    quantity: number;
    itemName: string;
    unit: string; // Snapshot of unit at time of order
    price: number; // Snapshot of price at time of order
}

export interface Order {
    id: string;
    date: string;
    sourceId: string;
    destinationId: string;
    items: OrderItem[];
    totalAmount: number; // Added total
    status: 'pending' | 'evaluated' | 'approved' | 'shipping' | 'completed';
    desiredDeliveryDate?: string;
    remarks?: string;
}
