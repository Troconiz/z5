export type PromocionCliente = {
  clienteId: string;
  semana: number;                // Número de la semana actual (puedes usar moment().isoWeek() o equivalente)
  serviciosCompletados: number;  // Servicios realizados esta semana
  fechaUltimoServicio: Date;
};