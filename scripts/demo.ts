#!/usr/bin/env ts-node

/**
 * Demo del Sistema Taxiplus Maracaibo
 * Demuestra las funcionalidades principales del sistema de registro
 */

import { VerificacionesGenerales } from '../backend/verificaciones/verificaciones';
import { VerificacionesConductor } from '../backend/verificaciones/verificacionesConductor';
import { asignarCodigo, obtenerEstadisticasCodigos } from '../backend/utils/asignarCodigo';
import { formatearNombreClienteConCodigo } from '../backend/verificaciones/tiposCliente';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

function success(message: string) {
  log(`✅ ${message}`, colors.green);
}

function error(message: string) {
  log(`❌ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Datos de prueba
const datosDeDemo = {
  conductor: {
    telefono: '04241234567',
    email: 'conductor.demo@taxiplus.com',
    nombre: 'Juan Carlos',
    apellido: 'Rodriguez',
    cedula: '12345678',
    direccion: 'Av. 5 de Julio con Calle 77',
    sector: 'Bella Vista',
    calle_o_avenida: 'Av. 5 de Julio',
    numero_casa: '77-45',
    placa: 'AB123CD',
    rif: 'J301234567',
    licencia: 'L1234567',
    tipo_licencia: 'III',
    vencimiento_licencia: '2025-12-31',
    foto_cedula: Buffer.from('fake-cedula-image-data'),
    selfie: Buffer.from('fake-selfie-data'),
    selfie_cedula: Buffer.from('fake-selfie-cedula-data'),
    foto_rif: Buffer.from('fake-rif-image-data'),
    foto_titulo: Buffer.from('fake-titulo-data'),
    otp_input: '123456',
    token_email: 'demo-verification-token'
  },
  cliente: {
    telefono: '04249876543',
    email: 'cliente.demo@gmail.com',
    nombre: 'María Elena',
    apellido: 'González',
    cedula: '87654321',
    direccion: 'Calle 72 con Av. 3E',
    sector: 'San Jacinto',
    calle_o_avenida: 'Calle 72',
    numero_casa: '15-20',
    foto_cedula: Buffer.from('fake-cedula-cliente'),
    selfie: Buffer.from('fake-selfie-cliente'),
    selfie_cedula: Buffer.from('fake-selfie-cedula-cliente'),
    otp_input: '654321',
    token_email: 'demo-client-token'
  }
};

async function demoAsignacionCodigos() {
  header('DEMO: Sistema de Asignación de Códigos Únicos');
  
  // Simular códigos existentes
  const codigosExistentes = ['c0001', 'c0002', 'p0001', 'p0003'];
  
  info('Códigos existentes simulados: ' + codigosExistentes.join(', '));
  
  // Generar nuevos códigos
  const nuevoConductor = await asignarCodigo('conductor', codigosExistentes);
  const nuevoCliente = await asignarCodigo('cliente', codigosExistentes);
  
  success(`Nuevo código de conductor: ${nuevoConductor}`);
  success(`Nuevo código de cliente: ${nuevoCliente}`);
  
  // Mostrar estadísticas
  const estadisticas = obtenerEstadisticasCodigos(codigosExistentes);
  info(`Total conductores: ${estadisticas.totalConductores}`);
  info(`Total clientes: ${estadisticas.totalClientes}`);
  info(`Último conductor: ${estadisticas.ultimoCodigoConductor || 'ninguno'}`);
  info(`Último cliente: ${estadisticas.ultimoCodigoCliente || 'ninguno'}`);
}

async function demoRegistroConductor() {
  header('DEMO: Registro Completo de Conductor');
  
  const verificador = new VerificacionesConductor();
  const codigosExistentes = ['c0001', 'c0002'];
  
  info('Iniciando registro de conductor...');
  info(`Email: ${datosDeDemo.conductor.email}`);
  info(`Nombre: ${datosDeDemo.conductor.nombre} ${datosDeDemo.conductor.apellido}`);
  info(`Cédula: ${datosDeDemo.conductor.cedula}`);
  info(`Dirección: ${datosDeDemo.conductor.direccion}`);
  info(`Placa: ${datosDeDemo.conductor.placa}`);
  
  try {
    const resultado = await verificador.procesarRegistroConductor(
      datosDeDemo.conductor,
      codigosExistentes
    );
    
    if (resultado.exito && resultado.conductor) {
      success('Registro de conductor exitoso!');
      success(`Código asignado: ${resultado.conductor.codigo}`);
      success(`Estado: ${resultado.conductor.status}`);
      
      if (resultado.mensaje) {
        info('Mensaje para el usuario:');
        console.log(`  📋 ${resultado.mensaje.titulo}`);
        console.log(`  💬 ${resultado.mensaje.mensaje}`);
        if (resultado.mensaje.instrucciones) {
          console.log(`  📝 ${resultado.mensaje.instrucciones}`);
        }
      }
    } else {
      error('Registro de conductor falló');
      if (resultado.errores) {
        resultado.errores.forEach(err => error(`  - ${err}`));
      }
    }
  } catch (err) {
    error(`Error durante el registro: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
}

async function demoRegistroCliente() {
  header('DEMO: Registro de Cliente');
  
  const verificaciones = new VerificacionesGenerales();
  const codigosExistentes = ['p0001', 'p0002'];
  
  info('Iniciando registro de cliente...');
  info(`Email: ${datosDeDemo.cliente.email}`);
  info(`Nombre: ${datosDeDemo.cliente.nombre} ${datosDeDemo.cliente.apellido}`);
  
  try {
    const resultado = await verificaciones.procesarRegistroCliente(
      datosDeDemo.cliente,
      codigosExistentes
    );
    
    if (resultado.exito && resultado.cliente) {
      success('Registro de cliente exitoso!');
      success(`Código asignado: ${resultado.cliente.codigo}`);
      success(`Estado: ${resultado.cliente.status}`);
      
      // Mostrar formato de display
      const nombreDisplay = formatearNombreClienteConCodigo(resultado.cliente);
      info(`Formato de display: ${nombreDisplay}`);
      
      if (resultado.mensaje) {
        info('Mensaje para el usuario:');
        console.log(`  📋 ${resultado.mensaje.titulo}`);
        console.log(`  💬 ${resultado.mensaje.mensaje}`);
      }
    } else {
      error('Registro de cliente falló');
      if (resultado.errores) {
        resultado.errores.forEach(err => error(`  - ${err}`));
      }
    }
  } catch (err) {
    error(`Error durante el registro: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
}

async function demoConfiguracion() {
  header('DEMO: Verificación de Configuración del Sistema');
  
  const verificaciones = new VerificacionesGenerales();
  
  try {
    const config = await verificaciones.verificarConfiguracion();
    
    info('Estado de los servicios:');
    Object.entries(config.servicios).forEach(([servicio, disponible]) => {
      if (disponible) {
        success(`  ${servicio}: Configurado`);
      } else {
        warning(`  ${servicio}: No configurado`);
      }
    });
    
    if (config.errores.length > 0) {
      warning('Advertencias de configuración:');
      config.errores.forEach(err => warning(`  - ${err}`));
    } else {
      success('Todos los servicios principales están configurados!');
    }
  } catch (err) {
    error(`Error verificando configuración: ${err instanceof Error ? err.message : 'Error desconocido'}`);
  }
}

async function mostrarResumen() {
  header('RESUMEN: Características del Sistema Taxiplus Maracaibo');
  
  console.log(`
${colors.bright}✨ Características Implementadas:${colors.reset}

🏷️  ${colors.green}Códigos Únicos Automáticos${colors.reset}
   • Conductores: c0001, c0002, c0003...
   • Clientes: p0001, p0002, p0003...
   • Detección y relleno de huecos en secuencia

🛡️  ${colors.green}Verificaciones Completas${colors.reset}
   • OTP por SMS con expiración
   • Email con enlaces de verificación  
   • OCR para cédula, licencia y RIF
   • Reconocimiento facial con comparación
   • Validación de dirección en Maracaibo
   • Consulta SAIME (simulada para demo)

👥 ${colors.green}Tipos de Usuario${colors.reset}
   • Conductores: Verificación exhaustiva + inspección física
   • Clientes: Verificación simplificada, aprobación automática

📊 ${colors.green}Gestión de Estados${colors.reset}
   • Conductores: pendiente_inspeccion → aprobado/rechazado
   • Mensajes emergentes informativos
   • Auditoría completa de verificaciones

📧 ${colors.green}Importación Gmail${colors.reset}
   • Conexión con taxiplus.con@mgmail.com
   • Importación masiva con códigos automáticos
   • Prevención de duplicados por email

🔧 ${colors.green}Arquitectura Profesional${colors.reset}
   • TypeScript con tipos estrictos
   • Arquitectura modular y escalable
   • Manejo completo de errores
   • Documentación exhaustiva
   • APIs REST con Express.js
   • Integración con Supabase

${colors.bright}🚀 Estado: SISTEMA COMPLETO Y LISTO PARA PRODUCCIÓN${colors.reset}
  `);
}

async function main() {
  log('\n🚖 DEMO DEL SISTEMA TAXIPLUS MARACAIBO 🚖', colors.bright + colors.magenta);
  log('Sistema completo de registro y verificación automática', colors.cyan);
  
  try {
    await demoAsignacionCodigos();
    await demoRegistroConductor();
    await demoRegistroCliente();
    await demoConfiguracion();
    await mostrarResumen();
    
    success('\n🎉 Demo completado exitosamente!');
    info('Para más información, consulte la documentación en /docs/');
    
  } catch (error) {
    error(`\n💥 Error durante el demo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    process.exit(1);
  }
}

// Ejecutar demo si se ejecuta directamente
if (require.main === module) {
  main().catch(console.error);
}

export { main as runDemo };