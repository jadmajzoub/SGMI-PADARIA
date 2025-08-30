export type Shift = 1 | 2 | 3;

export type ProductionEntryForm = {
  product: string;
  shift: Shift;
  date: string; // ISO string dd-mm-yyyy
};
