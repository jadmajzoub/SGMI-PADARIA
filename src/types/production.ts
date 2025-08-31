export type Shift = "MANHÃ" | "TARDE" | "NOITE";

export type ProductionEntryForm = {
  product: string;
  shift: Shift;
  date: string; // ISO string dd-mm-yyyy
  bateladas: number; // batch count
  duration: number; // duration in minutes
};
