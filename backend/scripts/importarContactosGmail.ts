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

import { asignarCodigo } from '../utils/asignarCodigo';
import { ClienteRegistro, GMAIL_IMPORT_CONFIG } from '../verificaciones/tiposCliente';

// Configuración OAuth2 para Gmail API
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Interfaz para contacto importado desde Gmail
interface ContactoGmail {
  email: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

export class ImportadorContactosGmail {
  
  /**
   * Importa contactos desde Gmail y registra clientes automáticamente
   */
  async importarContactosYRegistrarClientes(
    accessToken: string,
    codigosExistentes: string[],
    emailsExistentes: string[]
  ): Promise<{
    exito: boolean;
    clientesImportados: ClienteRegistro[];
    duplicadosEvitados: string[];
    errores: string[];
  }> {
    try {
      // Configurar token de acceso
      oauth2Client.setCredentials({ access_token: accessToken });
      
      // 1. Obtener contactos desde Gmail
      const contactos = await this.obtenerContactosGmail();
      
      // 2. Filtrar contactos válidos y evitar duplicados
      const contactosValidos = this.filtrarContactosValidos(contactos, emailsExistentes);
      
      // 3. Registrar cada contacto como cliente
      const resultados = await this.procesarContactos(contactosValidos, codigosExistentes);
      
      return resultados;
      
    } catch (error) {
      return {
        exito: false,
        clientesImportados: [],
        duplicadosEvitados: [],
        errores: [`Error durante la importación: ${error.message}`]
      };
    }
  }

  /**
   * Obtiene contactos desde la API de Gmail/People
   */
  private async obtenerContactosGmail(): Promise<ContactoGmail[]> {
    try {
      const people = google.people({ version: 'v1', auth: oauth2Client });
      
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 1000,
        personFields: 'names,emailAddresses,phoneNumbers'
      });

      const contactos: ContactoGmail[] = [];
      
      if (response.data.connections) {
        for (const person of response.data.connections) {
          const contacto = this.extraerDatosContacto(person);
          if (contacto) {
            contactos.push(contacto);
          }
        }
      }
      
      return contactos;
      
    } catch (error) {
      console.error('Error obteniendo contactos de Gmail:', error);
      throw new Error('No se pudieron obtener los contactos de Gmail');
    }
  }

  /**
   * Extrae datos relevantes de un contacto de la API de People
   */
  private extraerDatosContacto(person: any): ContactoGmail | null {
    const emails = person.emailAddresses?.filter((email: any) => email.value);
    const nombres = person.names?.filter((name: any) => name.givenName || name.familyName);
    const telefonos = person.phoneNumbers?.filter((phone: any) => phone.value);
    
    if (!emails || emails.length === 0) {
      return null; // Sin email no se puede importar
    }
    
    const email = emails[0].value;
    const nombre = nombres?.[0];
    const telefono = telefonos?.[0];
    
    return {
      email: email,
      nombre: nombre?.givenName || '',
      apellido: nombre?.familyName || '',
      telefono: telefono?.value?.replace(/\D/g, '') || ''
    };
  }

  /**
   * Filtra contactos válidos y evita duplicados
   */
  private filtrarContactosValidos(
    contactos: ContactoGmail[], 
    emailsExistentes: string[]
  ): ContactoGmail[] {
    return contactos.filter(contacto => {
      // Debe tener email válido
      if (!contacto.email || !this.validarEmail(contacto.email)) {
        return false;
      }
      
      // No debe ser duplicado
      if (emailsExistentes.includes(contacto.email)) {
        return false;
      }
      
      // Debe tener al menos nombre
      if (!contacto.nombre && !contacto.apellido) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Procesa una lista de contactos y los convierte en clientes
   */
  private async procesarContactos(
    contactos: ContactoGmail[], 
    codigosExistentes: string[]
  ): Promise<{
    exito: boolean;
    clientesImportados: ClienteRegistro[];
    duplicadosEvitados: string[];
    errores: string[];
  }> {
    const clientesImportados: ClienteRegistro[] = [];
    const duplicadosEvitados: string[] = [];
    const errores: string[] = [];
    const codigosUtilizados = [...codigosExistentes];

    for (const contacto of contactos) {
      try {
        // Asignar código único
        const codigo = await asignarCodigo('cliente', codigosUtilizados);
        codigosUtilizados.push(codigo);
        
        // Crear registro de cliente
        const cliente: ClienteRegistro = {
          codigo,
          telefono: contacto.telefono || '',
          telefono_verificado: false,
          email: contacto.email,
          email_verificado: true, // Asumimos que Gmail tiene emails válidos
          nombre: contacto.nombre || 'Sin nombre',
          apellido: contacto.apellido || 'Sin apellido',
          cedula: '', // Se completará manualmente d
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
=======
          status: GMAIL_IMPORT_CONFIG.status_inicial,
          fecha_registro: new Date(),
          origen_registro: 'gmail_import'
        };
        
        clientesImportados.push(cliente);
        
      } catch (error) {
        errores.push(`Error procesando ${contacto.email}: ${error.message}`);
      }
    }

    return {
      exito: errores.length === 0,
      clientesImportados,
      duplicadosEvitados,
      errores
    };
  }

  /**
   * Valida formato de email
   */
  private validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Obtiene estadísticas de la importación
   */
  async obtenerEstadisticasImportacion(accessToken: string): Promise<{
    totalContactosGmail: number;
    contactosConEmail: number;
    contactosConNombre: number;
    estimadoImportables: number;
  }> {
    try {
      oauth2Client.setCredentials({ access_token: accessToken });
      const contactos = await this.obtenerContactosGmail();
      
      const conEmail = contactos.filter(c => c.email).length;
      const conNombre = contactos.filter(c => c.nombre || c.apellido).length;
      const importables = contactos.filter(c => 
        c.email && this.validarEmail(c.email) && (c.nombre || c.apellido)
      ).length;
      
      return {
        totalContactosGmail: contactos.length,
        contactosConEmail: conEmail,
        contactosConNombre: conNombre,
        estimadoImportables: importables
      };
      
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Valida la configuración de Gmail antes de importar
   */
  static validarConfiguracion(): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      errores.push('GOOGLE_CLIENT_ID no configurado');
    }
    
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      errores.push('GOOGLE_CLIENT_SECRET no configurado');
    }
    
    if (!process.env.GOOGLE_REDIRECT_URI) {
      errores.push('GOOGLE_REDIRECT_URI no configurado');
    }
    
    return {
      valido: errores.length === 0,
      errores
    };
  }
}