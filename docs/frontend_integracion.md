# Integración Frontend - Mensajes y UI

## Componentes de UI Requeridos

### 1. Popup de Mensaje de Éxito

```typescript
interface MensajeExito {
  titulo: string;
  mensaje: string;
  instrucciones?: string;
}

// Componente React/Vue/Angular
const PopupExito = ({ mensaje, onClose }: { mensaje: MensajeExito, onClose: () => void }) => {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>{mensaje.titulo}</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="popup-body">
          <div className="success-icon">✓</div>
          <p>{mensaje.mensaje}</p>
          {mensaje.instrucciones && (
            <div className="instrucciones">
              <strong>Próximos pasos:</strong>
              <p>{mensaje.instrucciones}</p>
            </div>
          )}
        </div>
        <div className="popup-footer">
          <button onClick={onClose} className="btn-primary">Entendido</button>
        </div>
      </div>
    </div>
  );
};
```

### 2. Formulario de Registro de Conductor

```typescript
interface FormularioConductor {
  // Datos personales
  telefono: string;
  email: string;
  nombre: string;
  apellido: string;
  cedula: string;
  
  // Documentos (archivos)
  fotoCedula: File;
  selfie: File;
  selfieCedula: File;
  fotoRif: File;
  fotoTitulo: File;
  fotoCompraventa?: File;
  
  // Dirección
  direccion: string;
  sector: string;
  calleAvenida: string;
  numeroCasa: string;
  
  // Vehículo
  placa: string;
  rif: string;
  licencia: string;
  tipoLicencia: string;
  vencimientoLicencia: string;
  
  // Verificaciones
  otpInput?: string;
  tokenEmail?: string;
}

const RegistroConductor = () => {
  const [form, setForm] = useState<FormularioConductor>({} as FormularioConductor);
  const [paso, setPaso] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<MensajeExito | null>(null);
  const [errores, setErrores] = useState<string[]>([]);

  const enviarOTP = async () => {
    setCargando(true);
    try {
      const response = await fetch('/api/verificaciones/enviar-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono: form.telefono })
      });
      
      if (response.ok) {
        alert('Código OTP enviado a su teléfono');
      } else {
        alert('Error enviando OTP');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const enviarTokenEmail = async () => {
    setCargando(true);
    try {
      const response = await fetch('/api/verificaciones/enviar-token-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email })
      });
      
      if (response.ok) {
        alert('Token de verificación enviado a su email');
      } else {
        alert('Error enviando token de email');
      }
    } catch (error) {
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  const registrarConductor = async () => {
    setCargando(true);
    setErrores([]);
    
    try {
      const formData = new FormData();
      
      // Agregar datos del formulario
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/verificaciones/registrar-conductor', {
        method: 'POST',
        body: formData
      });

      const resultado = await response.json();

      if (resultado.exito) {
        setMensajeExito(resultado.mensaje);
      } else {
        setErrores(resultado.errores || ['Error en el registro']);
      }
    } catch (error) {
      setErrores(['Error de conexión con el servidor']);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-conductor">
      {/* Pasos del formulario */}
      <div className="pasos-header">
        <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1. Datos Personales</div>
        <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2. Documentos</div>
        <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3. Verificación</div>
        <div className={`paso ${paso >= 4 ? 'activo' : ''}`}>4. Confirmación</div>
      </div>

      {/* Mostrar errores */}
      {errores.length > 0 && (
        <div className="errores">
          <h4>Errores encontrados:</h4>
          <ul>
            {errores.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenido del paso actual */}
      {paso === 1 && <PasoDatosPersonales form={form} setForm={setForm} />}
      {paso === 2 && <PasoDocumentos form={form} setForm={setForm} />}
      {paso === 3 && <PasoVerificacion form={form} setForm={setForm} enviarOTP={enviarOTP} enviarTokenEmail={enviarTokenEmail} />}
      {paso === 4 && <PasoConfirmacion form={form} registrar={registrarConductor} cargando={cargando} />}

      {/* Navegación */}
      <div className="navegacion">
        {paso > 1 && (
          <button onClick={() => setPaso(paso - 1)} disabled={cargando}>
            Anterior
          </button>
        )}
        {paso < 4 && (
          <button onClick={() => setPaso(paso + 1)} disabled={cargando}>
            Siguiente
          </button>
        )}
      </div>

      {/* Popup de éxito */}
      {mensajeExito && (
        <PopupExito 
          mensaje={mensajeExito} 
          onClose={() => setMensajeExito(null)} 
        />
      )}
    </div>
  );
};
```

### 3. Formulario de Registro de Cliente

```typescript
const RegistroCliente = () => {
  const [form, setForm] = useState<ClienteRegistro>({} as ClienteRegistro);
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<MensajeExito | null>(null);

  const registrarCliente = async () => {
    setCargando(true);
    
    try {
      const formData = new FormData();
      
      Object.entries(form).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value) {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch('/api/verificaciones/registrar-cliente', {
        method: 'POST',
        body: formData
      });

      const resultado = await response.json();

      if (resultado.exito) {
        setMensajeExito(resultado.mensaje);
      } else {
        alert(resultado.errores?.join('\n') || 'Error en el registro');
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-cliente">
      {/* Formulario simplificado para clientes */}
      <form onSubmit={(e) => { e.preventDefault(); registrarCliente(); }}>
        <div className="grupo-campos">
          <h3>Datos Básicos</h3>
          <input 
            type="tel" 
            placeholder="Teléfono"
            value={form.telefono || ''} 
            onChange={(e) => setForm({...form, telefono: e.target.value})}
            required 
          />
          <input 
            type="email" 
            placeholder="Email"
            value={form.email || ''} 
            onChange={(e) => setForm({...form, email: e.target.value})}
            required 
          />
          <input 
            type="text" 
            placeholder="Nombre"
            value={form.nombre || ''} 
            onChange={(e) => setForm({...form, nombre: e.target.value})}
            required 
          />
          <input 
            type="text" 
            placeholder="Apellido"
            value={form.apellido || ''} 
            onChange={(e) => setForm({...form, apellido: e.target.value})}
            required 
          />
        </div>

        <div className="grupo-campos">
          <h3>Documentos</h3>
          <label>
            Selfie:
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setForm({...form, selfie: e.target.files?.[0]})}
              required 
            />
          </label>
        </div>

        <button type="submit" disabled={cargando} className="btn-registrar">
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>

      {mensajeExito && (
        <PopupExito 
          mensaje={mensajeExito} 
          onClose={() => setMensajeExito(null)} 
        />
      )}
    </div>
  );
};
```

## APIs Frontend

### 1. Endpoints del Backend

```typescript
// API Routes requeridas
const API_ROUTES = {
  // Verificaciones
  enviarOTP: '/api/verificaciones/enviar-otp',
  verificarOTP: '/api/verificaciones/verificar-otp',
  enviarTokenEmail: '/api/verificaciones/enviar-token-email',
  verificarEmail: '/api/verificaciones/verificar-email',
  
  // Registros
  registrarConductor: '/api/verificaciones/registrar-conductor',
  registrarCliente: '/api/verificaciones/registrar-cliente',
  
  // Consultas
  obtenerConductor: '/api/conductores/:codigo',
  obtenerCliente: '/api/clientes/:codigo',
  listarConductores: '/api/conductores',
  listarClientes: '/api/clientes',
  
  // Gmail Import
  importarGmail: '/api/scripts/importar-gmail',
  estadisticasGmail: '/api/scripts/estadisticas-gmail'
};
```

### 2. Servicios Frontend

```typescript
class VerificacionesService {
  
  async enviarOTP(telefono: string): Promise<boolean> {
    const response = await fetch(API_ROUTES.enviarOTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono })
    });
    return response.ok;
  }

  async verificarOTP(telefono: string, codigo: string): Promise<boolean> {
    const response = await fetch(API_ROUTES.verificarOTP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono, codigo })
    });
    return response.ok;
  }

  async enviarTokenEmail(email: string): Promise<boolean> {
    const response = await fetch(API_ROUTES.enviarTokenEmail, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.ok;
  }

  async registrarConductor(formData: FormData): Promise<{
    exito: boolean;
    conductor?: any;
    errores?: string[];
    mensaje?: MensajeExito;
  }> {
    const response = await fetch(API_ROUTES.registrarConductor, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }

  async registrarCliente(formData: FormData): Promise<{
    exito: boolean;
    cliente?: any;
    errores?: string[];
    mensaje?: MensajeExito;
  }> {
    const response = await fetch(API_ROUTES.registrarCliente, {
      method: 'POST',
      body: formData
    });
    return await response.json();
  }
}

export const verificacionesService = new VerificacionesService();
```

## Lista de Clientes con Código

### Componente de Lista

```typescript
const ListaClientes = () => {
  const [clientes, setClientes] = useState<ClienteRegistro[]>([]);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const response = await fetch(API_ROUTES.listarClientes);
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.codigo.toLowerCase().includes(filtro.toLowerCase()) ||
    cliente.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    cliente.apellido.toLowerCase().includes(filtro.toLowerCase()) ||
    cliente.email.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="lista-clientes">
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar por código, nombre o email..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="tabla-clientes">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map(cliente => (
              <tr key={cliente.codigo}>
                <td className="cliente-info">
                  <strong>{cliente.codigo} - {cliente.nombre} {cliente.apellido}</strong>
                </td>
                <td>{cliente.email}</td>
                <td>{cliente.telefono}</td>
                <td>
                  <span className={`estado estado-${cliente.status}`}>
                    {cliente.status}
                  </span>
                </td>
                <td>{new Date(cliente.fecha_registro).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => verDetalles(cliente.codigo)}>
                    Ver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

## CSS de Ejemplo

```css
/* Popup de éxito */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.popup-content {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.popup-body {
  padding: 20px;
  text-align: center;
}

.success-icon {
  font-size: 48px;
  color: #28a745;
  margin-bottom: 16px;
}

.instrucciones {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 15px;
  text-align: left;
}

.popup-footer {
  padding: 20px;
  text-align: center;
  border-top: 1px solid #eee;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

/* Estados */
.estado-aprobado { background: #28a745; color: white; }
.estado-pendiente_inspeccion { background: #ffc107; color: black; }
.estado-rechazado { background: #dc3545; color: white; }
.estado-inactivo { background: #6c757d; color: white; }

/* Tabla de clientes */
.cliente-info strong {
  color: #007bff;
  font-weight: 600;
}
```