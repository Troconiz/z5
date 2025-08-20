import { google } from 'googleapis';
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
          cedula: '', // Se completará manualmente después
          foto_cedula: Buffer.alloc(0),
          selfie: Buffer.alloc(0),
          selfie_cedula: Buffer.alloc(0),
          direccion: '',
          sector: '',
          calle_o_avenida: '',
          numero_casa: '',
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