// Ejemplo de integración API - Express.js
import express from 'express';
import multer from 'multer';
import { VerificacionesGenerales } from '../verificaciones/verificaciones';
import { ImportadorContactosGmail } from '../scripts/importarContactosGmail';
import { asignarCodigo, obtenerEstadisticasCodigos } from '../utils/asignarCodigo';

const router = express.Router();
const verificaciones = new VerificacionesGenerales();
const importadorGmail = new ImportadorContactosGmail();

// Configurar multer para manejar archivos
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// Middleware para manejo de errores
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * ENDPOINTS DE VERIFICACIÓN
 */

// Enviar código OTP
router.post('/enviar-otp', asyncHandler(async (req: any, res: any) => {
  const { telefono } = req.body;
  
  if (!telefono) {
    return res.status(400).json({ error: 'Teléfono requerido' });
  }
  
  const resultado = await verificaciones.enviarOTP(telefono);
  
  if (resultado) {
    res.json({ mensaje: 'Código OTP enviado exitosamente' });
  } else {
    res.status(500).json({ error: 'Error enviando código OTP' });
  }
}));

// Enviar token de verificación de email
router.post('/enviar-token-email', asyncHandler(async (req: any, res: any) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email requerido' });
  }
  
  const resultado = await verificaciones.enviarTokenEmail(email);
  
  if (resultado) {
    res.json({ mensaje: 'Token de verificación enviado al email' });
  } else {
    res.status(500).json({ error: 'Error enviando token de email' });
  }
}));

/**
 * ENDPOINTS DE REGISTRO
 */

// Registrar conductor
router.post('/registrar-conductor', upload.fields([
  { name: 'foto_cedula', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'selfie_cedula', maxCount: 1 },
  { name: 'foto_rif', maxCount: 1 },
  { name: 'foto_titulo', maxCount: 1 },
  { name: 'foto_compraventa', maxCount: 1 }
]), asyncHandler(async (req: any, res: any) => {
  try {
    // Obtener códigos existentes de la base de datos
    const codigosExistentes = await obtenerCodigosExistentesConductores();
    
    // Preparar datos del conductor
    const datosConductor = {
      ...req.body,
      foto_cedula: req.files.foto_cedula?.[0]?.buffer,
      selfie: req.files.selfie?.[0]?.buffer,
      selfie_cedula: req.files.selfie_cedula?.[0]?.buffer,
      foto_rif: req.files.foto_rif?.[0]?.buffer,
      foto_titulo: req.files.foto_titulo?.[0]?.buffer,
      foto_compraventa: req.files.foto_compraventa?.[0]?.buffer
    };
    
    // Procesar registro
    const resultado = await verificaciones.procesarRegistroConductor(
      datosConductor, 
      codigosExistentes
    );
    
    if (resultado.exito) {
      // Guardar en base de datos
      await guardarConductorEnBD(resultado.conductor!);
      
      res.json({
        exito: true,
        conductor: {
          codigo: resultado.conductor!.codigo,
          nombre: resultado.conductor!.nombre,
          apellido: resultado.conductor!.apellido,
          status: resultado.conductor!.status
        },
        mensaje: resultado.mensaje
      });
    } else {
      res.status(400).json({
        exito: false,
        errores: resultado.errores
      });
    }
    
  } catch (error) {
    console.error('Error registrando conductor:', error);
    res.status(500).json({ 
      exito: false, 
      errores: ['Error interno del servidor'] 
    });
  }
}));

// Registrar cliente
router.post('/registrar-cliente', upload.fields([
  { name: 'foto_cedula', maxCount: 1 },
  { name: 'selfie', maxCount: 1 },
  { name: 'selfie_cedula', maxCount: 1 }
]), asyncHandler(async (req: any, res: any) => {
  try {
    // Obtener códigos existentes de la base de datos
    const codigosExistentes = await obtenerCodigosExistentesClientes();
    
    // Preparar datos del cliente
    const datosCliente = {
      ...req.body,
      foto_cedula: req.files.foto_cedula?.[0]?.buffer,
      selfie: req.files.selfie?.[0]?.buffer,
      selfie_cedula: req.files.selfie_cedula?.[0]?.buffer
    };
    
    // Procesar registro
    const resultado = await verificaciones.procesarRegistroCliente(
      datosCliente, 
      codigosExistentes
    );
    
    if (resultado.exito) {
      // Guardar en base de datos
      await guardarClienteEnBD(resultado.cliente!);
      
      res.json({
        exito: true,
        cliente: {
          codigo: resultado.cliente!.codigo,
          nombre: resultado.cliente!.nombre,
          apellido: resultado.cliente!.apellido,
          status: resultado.cliente!.status
        },
        mensaje: resultado.mensaje
      });
    } else {
      res.status(400).json({
        exito: false,
        errores: resultado.errores
      });
    }
    
  } catch (error) {
    console.error('Error registrando cliente:', error);
    res.status(500).json({ 
      exito: false, 
      errores: ['Error interno del servidor'] 
    });
  }
}));

/**
 * ENDPOINTS DE CONSULTA
 */

// Obtener conductor por código
router.get('/conductores/:codigo', asyncHandler(async (req: any, res: any) => {
  const { codigo } = req.params;
  
  const conductor = await obtenerConductorPorCodigo(codigo);
  
  if (conductor) {
    res.json(conductor);
  } else {
    res.status(404).json({ error: 'Conductor no encontrado' });
  }
}));

// Listar conductores
router.get('/conductores', asyncHandler(async (req: any, res: any) => {
  const { page = 1, limit = 50, status } = req.query;
  
  const conductores = await listarConductores({
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });
  
  res.json(conductores);
}));

// Obtener cliente por código
router.get('/clientes/:codigo', asyncHandler(async (req: any, res: any) => {
  const { codigo } = req.params;
  
  const cliente = await obtenerClientePorCodigo(codigo);
  
  if (cliente) {
    res.json(cliente);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
}));

// Listar clientes con formato de display
router.get('/clientes', asyncHandler(async (req: any, res: any) => {
  const { page = 1, limit = 50, status } = req.query;
  
  const clientes = await listarClientes({
    page: parseInt(page),
    limit: parseInt(limit),
    status
  });
  
  // Formatear con código antes del nombre
  const clientesFormateados = clientes.map((cliente: any) => ({
    ...cliente,
    nombre_display: `${cliente.codigo} - ${cliente.nombre} ${cliente.apellido}`
  }));
  
  res.json(clientesFormateados);
}));

/**
 * ENDPOINTS DE IMPORTACIÓN GMAIL
 */

// Importar contactos desde Gmail
router.post('/importar-gmail', asyncHandler(async (req: any, res: any) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Token de acceso requerido' });
  }
  
  try {
    const codigosExistentes = await obtenerCodigosExistentesClientes();
    const emailsExistentes = await obtenerEmailsExistentesClientes();
    
    const resultado = await importadorGmail.importarContactosYRegistrarClientes(
      accessToken,
      codigosExistentes,
      emailsExistentes
    );
    
    if (resultado.exito) {
      // Guardar clientes importados en la base de datos
      for (const cliente of resultado.clientesImportados) {
        await guardarClienteEnBD(cliente);
      }
    }
    
    res.json(resultado);
    
  } catch (error) {
    console.error('Error importando desde Gmail:', error);
    res.status(500).json({ 
      error: 'Error durante la importación',
      detalles: error.message 
    });
  }
}));

// Obtener estadísticas de Gmail
router.post('/estadisticas-gmail', asyncHandler(async (req: any, res: any) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ error: 'Token de acceso requerido' });
  }
  
  try {
    const estadisticas = await importadorGmail.obtenerEstadisticasImportacion(accessToken);
    res.json(estadisticas);
  } catch (error) {
    console.error('Error obteniendo estadísticas de Gmail:', error);
    res.status(500).json({ 
      error: 'Error obteniendo estadísticas',
      detalles: error.message 
    });
  }
}));

/**
 * ENDPOINTS DE ADMINISTRACIÓN
 */

// Actualizar estado de conductor después de inspección
router.put('/conductores/:codigo/inspeccion', asyncHandler(async (req: any, res: any) => {
  const { codigo } = req.params;
  const { aprobado, inspector_id, razon_rechazo } = req.body;
  
  try {
    await actualizarEstadoInspeccion(codigo, aprobado, inspector_id, razon_rechazo);
    
    res.json({ 
      mensaje: `Conductor ${codigo} ${aprobado ? 'aprobado' : 'rechazado'} exitosamente` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando estado de inspección' });
  }
}));

// Obtener estadísticas generales
router.get('/estadisticas', asyncHandler(async (req: any, res: any) => {
  const estadisticas = await verificaciones.obtenerEstadisticas();
  const estadisticasCodigos = obtenerEstadisticasCodigos(
    await obtenerTodosLosCodigos()
  );
  
  res.json({
    ...estadisticas,
    codigos: estadisticasCodigos
  });
}));

// Verificar configuración del sistema
router.get('/configuracion', asyncHandler(async (req: any, res: any) => {
  const configuracion = await verificaciones.verificarConfiguracion();
  res.json(configuracion);
}));

/**
 * FUNCIONES AUXILIARES (implementar según la base de datos)
 */

async function obtenerCodigosExistentesConductores(): Promise<string[]> {
  // Implementar consulta a la base de datos
  // SELECT codigo FROM conductores
  return [];
}

async function obtenerCodigosExistentesClientes(): Promise<string[]> {
  // Implementar consulta a la base de datos
  // SELECT codigo FROM clientes
  return [];
}

async function obtenerEmailsExistentesClientes(): Promise<string[]> {
  // Implementar consulta a la base de datos
  // SELECT email FROM clientes
  return [];
}

async function obtenerTodosLosCodigos(): Promise<string[]> {
  const conductores = await obtenerCodigosExistentesConductores();
  const clientes = await obtenerCodigosExistentesClientes();
  return [...conductores, ...clientes];
}

async function guardarConductorEnBD(conductor: any): Promise<void> {
  // Implementar inserción en la base de datos
  console.log('Guardando conductor:', conductor.codigo);
}

async function guardarClienteEnBD(cliente: any): Promise<void> {
  // Implementar inserción en la base de datos
  console.log('Guardando cliente:', cliente.codigo);
}

async function obtenerConductorPorCodigo(codigo: string): Promise<any> {
  // Implementar consulta a la base de datos
  return null;
}

async function obtenerClientePorCodigo(codigo: string): Promise<any> {
  // Implementar consulta a la base de datos
  return null;
}

async function listarConductores(opciones: any): Promise<any[]> {
  // Implementar consulta paginada a la base de datos
  return [];
}

async function listarClientes(opciones: any): Promise<any[]> {
  // Implementar consulta paginada a la base de datos
  return [];
}

async function actualizarEstadoInspeccion(
  codigo: string, 
  aprobado: boolean, 
  inspectorId: string, 
  razonRechazo?: string
): Promise<void> {
  // Implementar actualización en la base de datos
  console.log(`Actualizando estado de ${codigo}: ${aprobado ? 'aprobado' : 'rechazado'}`);
}

// Middleware de manejo de errores
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Error en API:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Archivo demasiado grande (máximo 5MB)' });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Archivo no permitido' });
  }
  
  res.status(500).json({ error: 'Error interno del servidor' });
});

export default router;