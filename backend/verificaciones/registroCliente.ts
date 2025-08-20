import { ClienteRegistro, RecuperacionNumeroAntiguo, RespuestaRegistroCliente } from './tiposCliente';
import { asignarCodigo, asignarCodigoClienteEspecifico } from '../utils/asignarCodigo';

// Servicio para registrar un nuevo cliente
export class RegistroClienteService {
  
  // Obtiene todos los códigos de cliente existentes (implementar según tu BD)
  private async obtenerCodigosClientesExistentes(): Promise<string[]> {
    // TODO: Implementar consulta a base de datos
    // Ejemplo: SELECT codigo_cliente FROM clientes
    return [];
  }

  // Registra un nuevo cliente con posibilidad de recuperar número antiguo
  async registrarCliente(
    datosCliente: Omit<ClienteRegistro, 'codigo_cliente'>, 
    numeroAntiguoDeseado?: string
  ): Promise<RespuestaRegistroCliente> {
    try {
      const codigosExistentes = await this.obtenerCodigosClientesExistentes();
      let recuperacion: RecuperacionNumeroAntiguo | undefined;
      let codigoAsignado: string;

      // Si el cliente quiere recuperar su número antiguo
      if (numeroAntiguoDeseado) {
        const resultado = await asignarCodigoClienteEspecifico(numeroAntiguoDeseado, codigosExistentes);
        codigoAsignado = resultado.codigo;
        
        recuperacion = {
          numero_antiguo_deseado: numeroAntiguoDeseado,
          disponible: resultado.esCodigoDeseado,
          codigo_asignado: codigoAsignado,
          mensaje_usuario: resultado.esCodigoDeseado 
            ? `¡Perfecto! Hemos recuperado tu número anterior: ${numeroAntiguoDeseado}`
            : `Lo sentimos, el número ${numeroAntiguoDeseado} ya no está disponible. Te hemos asignado el número ${codigoAsignado}.`
        };
      } else {
        // Asignar el siguiente código disponible
        codigoAsignado = await asignarCodigo('cliente', codigosExistentes);
      }

      const cliente: ClienteRegistro = {
        ...datosCliente,
        codigo_cliente: codigoAsignado
      };

      // TODO: Guardar cliente en base de datos
      // await this.guardarClienteEnBD(cliente);

      return {
        exito: true,
        cliente,
        recuperacion_numero: recuperacion,
        mensaje: recuperacion?.mensaje_usuario || `Cliente registrado exitosamente con código ${codigoAsignado}`
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al registrar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Migra un conductor rechazado a cliente
  async migrarConductorRechazadoACliente(
    datosBasicos: Omit<ClienteRegistro, 'codigo_cliente' | 'es_migracion_desde_conductor' | 'codigo_conductor_anterior'>,
    codigoConductorAnterior: string
  ): Promise<RespuestaRegistroCliente> {
    try {
      const codigosExistentes = await this.obtenerCodigosClientesExistentes();
      const codigoAsignado = await asignarCodigo('cliente', codigosExistentes);

      const cliente: ClienteRegistro = {
        ...datosBasicos,
        codigo_cliente: codigoAsignado,
        es_migracion_desde_conductor: true,
        codigo_conductor_anterior: codigoConductorAnterior
      };

      // TODO: Guardar cliente en base de datos
      // TODO: Liberar código de conductor en la tabla correspondiente
      // await this.guardarClienteEnBD(cliente);
      // await this.liberarCodigoConductor(codigoConductorAnterior);

      return {
        exito: true,
        cliente,
        mensaje: `Has sido registrado como cliente con código ${codigoAsignado}. Tu solicitud como conductor ha sido procesada.`
      };

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al migrar conductor a cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }

  // Valida si un número antiguo tiene formato válido
  validarFormatoNumeroAntiguo(numeroAntiguo: string): boolean {
    // Debe ser formato p + número (ej: p123, p0001, p1)
    return /^p\d+$/.test(numeroAntiguo);
  }

  // Obtiene mensaje para mostrar al usuario sobre recuperación de número
  obtenerMensajeRecuperacion(esClienteAntiguo: boolean): string {
    if (esClienteAntiguo) {
      return "Si eras cliente del sistema anterior, puedes ingresar tu número antiguo (ejemplo: p123) para intentar recuperarlo. Si no lo recuerdas o prefieres uno nuevo, déjalo en blanco.";
    }
    return "Como nuevo cliente, se te asignará automáticamente un número de cliente.";
  }
}

// Instancia singleton del servicio
export const registroClienteService = new RegistroClienteService();