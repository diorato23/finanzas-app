import Dexie, { Table } from 'dexie';

export interface PendingTransaction {
  id?: number;
  descripcion: string;
  monto: number;
  tipo: 'pago' | 'cobro';
  categoria: string;
  estado: 'pendiente' | 'pagado' | 'recibido';
  fecha_vencimiento?: string | null;
  created_at: string;
}

export class FinanzasLocalDB extends Dexie {
  // 'pendingTransactions' é onde guardaremos os gastos feitos sem internet
  pendingTransactions!: Table<PendingTransaction>;

  constructor() {
    super('FinanzasLocalDB');
    this.version(1).stores({
      pendingTransactions: '++id, descripcion, tipo, estado' // Índices para busca rápida
    });
  }
}

export const db = new FinanzasLocalDB();
