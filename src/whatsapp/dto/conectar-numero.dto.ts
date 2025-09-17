export class ConectarNumeroDto {
  nombre_agente: string;
  numero_whatsapp: string;
  usuario_id: string;
  alerta_timeout?: number; // Opcional, tiempo para alerta en segundos
}
