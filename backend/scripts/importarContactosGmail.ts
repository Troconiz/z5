import { google } from 'googleapis';
import { asignarCodigo, migrarConductorRechazadoACliente } from '../utils/asignarCodigo';
import { ClienteRegistro } from '../verificaciones/tiposCliente';
import { ConductorRegistro } from '../verificaciones/tiposConductor';
import { registroClienteService } from '../verificaciones/registroCliente';

// Tipos para la importación
export type ContactoGmail = {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  tipo_contacto?: 'cliente' | 'conductor'; // Se determina por algún criterio
};

export type ResultadoImportacion = {
  total_contactos: number;
  clientes_importados: number;
  conductores_importados: number;
  errores: string[];
  resumen: string;
};

// Servicio principal de importación
export class ImportacionGmailService {

  // Configura OAuth2 y obtiene contactos de Gmail
  private async obtenerContactosGmail(): Promise<ContactoGmail[]> {
    // TODO: Implementar autenticación OAuth2 con Gmail
    // TODO: Usar People API para obtener contactos
    // Por ahora retornamos array vacío como ejemplo
    console.log('Conectando con Gmail API...');
    return [];
  }

  // Clasifica contactos en clientes y conductores según criterios de negocio
  private clasificarContactos(contactos: ContactoGmail[]): { clientes: ContactoGmail[], conductores: ContactoGmail[] } {
    const clientes: ContactoGmail[] = [];
    const conductores: ContactoGmail[] = [];

    contactos.forEach(contacto => {
      // TODO: Implementar lógica de clasificación según criterios de negocio
      // Por ejemplo: por etiquetas, nombres de grupos, etc.
      
      // Lógica temporal de ejemplo (se debe reemplazar):
      if (contacto.tipo_contacto === 'conductor') {
        conductores.push(contacto);
      } else {
        clientes.push(contacto);
      }
    });

    return { clientes, conductores };
  }

  // Obtiene códigos existentes de base de datos
  private async obtenerCodigosExistentes(): Promise<{ clientes: string[], conductores: string[] }> {
    // TODO: Implementar consultas a base de datos
    return { clientes: [], conductores: [] };
  }

  // Importa y registra clientes desde Gmail
  private async importarClientes(contactosClientes: ContactoGmail[], codigosExistentes: string[]): Promise<{ exitosos: number, errores: string[] }> {
    let exitosos = 0;
    const errores: string[] = [];

    for (const contacto of contactosClientes) {
      try {
        // Preparar datos del cliente
        const datosCliente: Omit<ClienteRegistro, 'codigo_cliente'> = {
          nombre: contacto.nombre,
          apellido: contacto.apellido,
          email: contacto.email,
          telefono: contacto.telefono || '',
          telefono_verificado: false,
          email_verificado: false,
          cedula: '', // Se completará en el proceso de verificación
          foto_cedula: Buffer.alloc(0),
          selfie: Buffer.alloc(0),
          selfie_cedula: Buffer.alloc(0),
          direccion: '',
          sector: '',
          calle_o_avenida: '',
          numero_casa: '',
          status: 'aprobado' // Los contactos importados se consideran pre-aprobados
        };

        // Registrar cliente sin número específico (se asigna automáticamente)
        const resultado = await registroClienteService.registrarCliente(datosCliente);
        
        if (resultado.exito) {
          exitosos++;
        } else {
          errores.push(`Error al importar cliente ${contacto.nombre} ${contacto.apellido}: ${resultado.mensaje}`);
        }

      } catch (error) {
        errores.push(`Error inesperado al importar cliente ${contacto.nombre} ${contacto.apellido}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return { exitosos, errores };
  }

  // Importa y registra conductores desde Gmail
  private async importarConductores(contactosConductores: ContactoGmail[], codigosExistentes: string[]): Promise<{ exitosos: number, errores: string[] }> {
    let exitosos = 0;
    const errores: string[] = [];

    for (const contacto of contactosConductores) {
      try {
        // Asignar código de conductor (c110, c111, etc.)
        const codigoConductor = await asignarCodigo('conductor', codigosExistentes);
        codigosExistentes.push(codigoConductor); // Actualizar lista para evitar duplicados

        // Preparar datos del conductor
        const datosConductor: ConductorRegistro = {
          codigo_conductor: codigoConductor,
          nombre: contacto.nombre,
          apellido: contacto.apellido,
          email: contacto.email,
          telefono: contacto.telefono || '',
          telefono_verificado: false,
          email_verificado: false,
          cedula: '', // Se completará en el proceso de verificación
          foto_cedula: Buffer.alloc(0),
          selfie: Buffer.alloc(0),
          selfie_cedula: Buffer.alloc(0),
          direccion: '',
          sector: '',
          calle_o_avenida: '',
          numero_casa: '',
          placa: '',
          rif: '',
          foto_rif: Buffer.alloc(0),
          licencia: '',
          tipo_licencia: '',
          vencimiento_licencia: '',
          foto_titulo: Buffer.alloc(0),
          status: 'pendiente_inspeccion' // Los conductores importados necesitan verificación
        };

        // TODO: Guardar conductor en base de datos
        // await this.guardarConductorEnBD(datosConductor);
        
        exitosos++;

      } catch (error) {
        errores.push(`Error inesperado al importar conductor ${contacto.nombre} ${contacto.apellido}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return { exitosos, errores };
  }

  // Función principal de importación masiva
  async importarContactosYRegistrarClientes(): Promise<ResultadoImportacion> {
    try {
      console.log('Iniciando importación masiva desde Gmail...');

      // 1. Obtener contactos de Gmail
      const contactos = await this.obtenerContactosGmail();
      console.log(`Se obtuvieron ${contactos.length} contactos de Gmail`);

      // 2. Clasificar contactos en clientes y conductores
      const { clientes, conductores } = this.clasificarContactos(contactos);
      console.log(`Clasificados: ${clientes.length} clientes, ${conductores.length} conductores`);

      // 3. Obtener códigos existentes
      const codigosExistentes = await this.obtenerCodigosExistentes();

      // 4. Importar clientes
      console.log('Importando clientes...');
      const resultadoClientes = await this.importarClientes(clientes, codigosExistentes.clientes);

      // 5. Importar conductores
      console.log('Importando conductores...');
      const resultadoConductores = await this.importarConductores(conductores, codigosExistentes.conductores);

      // 6. Preparar resumen
      const totalErrores = [...resultadoClientes.errores, ...resultadoConductores.errores];
      
      const resumen = `
Importación completada:
- Total de contactos procesados: ${contactos.length}
- Clientes importados exitosamente: ${resultadoClientes.exitosos}
- Conductores importados exitosamente: ${resultadoConductores.exitosos}
- Errores encontrados: ${totalErrores.length}

Nota: Los conductores importados requieren verificación manual antes de ser aprobados.
Los conductores que sean rechazados serán automáticamente migrados como clientes.
      `.trim();

      return {
        total_contactos: contactos.length,
        clientes_importados: resultadoClientes.exitosos,
        conductores_importados: resultadoConductores.exitosos,
        errores: totalErrores,
        resumen
      };

    } catch (error) {
      const mensajeError = `Error general en la importación: ${error instanceof Error ? error.message : 'Error desconocido'}`;
      return {
        total_contactos: 0,
        clientes_importados: 0,
        conductores_importados: 0,
        errores: [mensajeError],
        resumen: mensajeError
      };
    }
  }

  // Procesa el rechazo de un conductor y lo migra a cliente
  async procesarRechazoYMigrarACliente(codigoConductor: string, razonRechazo?: string): Promise<{ exito: boolean, mensaje: string }> {
    try {
      // TODO: Obtener datos del conductor de la base de datos
      // const conductor = await this.obtenerConductorPorCodigo(codigoConductor);
      
      // Simular datos del conductor para el ejemplo
      const datosBasicos = {
        nombre: 'Nombre',
        apellido: 'Apellido',
        email: 'email@example.com',
        telefono: '1234567890',
        telefono_verificado: false,
        email_verificado: false,
        cedula: '',
        foto_cedula: Buffer.alloc(0),
        selfie: Buffer.alloc(0),
        selfie_cedula: Buffer.alloc(0),
        direccion: '',
        sector: '',
        calle_o_avenida: '',
        numero_casa: '',
        status: 'aprobado' as const
      };

      // Migrar a cliente
      const resultado = await registroClienteService.migrarConductorRechazadoACliente(datosBasicos, codigoConductor);
      
      if (resultado.exito) {
        // TODO: Actualizar status del conductor en BD y liberar código
        console.log(`Conductor ${codigoConductor} migrado a cliente ${resultado.cliente?.codigo_cliente}`);
        return {
          exito: true,
          mensaje: `Conductor ${codigoConductor} ha sido migrado exitosamente a cliente con código ${resultado.cliente?.codigo_cliente}`
        };
      } else {
        return {
          exito: false,
          mensaje: resultado.mensaje
        };
      }

    } catch (error) {
      return {
        exito: false,
        mensaje: `Error al procesar rechazo: ${error instanceof Error ? error.message : 'Error desconocido'}`
      };
    }
  }
}

// Instancia singleton del servicio
export const importacionGmailService = new ImportacionGmailService();

// Función de conveniencia para mantener compatibilidad
export async function importarContactosYRegistrarClientes(): Promise<ResultadoImportacion> {
  return await importacionGmailService.importarContactosYRegistrarClientes();
}