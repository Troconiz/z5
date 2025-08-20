// Test setup file
import { config } from 'dotenv';

// Load environment variables for testing
config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = 'smtp.example.com';
process.env.SMTP_USER = 'test@example.com';
process.env.SMTP_PASSWORD = 'test-password';
process.env.BASE_URL = 'http://localhost:3000';

// Mock external services for testing
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    textDetection: jest.fn().mockResolvedValue([{
      textAnnotations: [{
        description: 'REPÚBLICA BOLIVARIANA DE VENEZUELA\nCÉDULA DE IDENTIDAD\nV-12345678\nJUAN CARLOS\nRODRIGUEZ GONZALEZ\n15/03/1985',
        score: 0.95
      }]
    }]),
    faceDetection: jest.fn().mockResolvedValue([{
      faceAnnotations: [{
        detectionConfidence: 0.95,
        rollAngle: 0,
        panAngle: 0,
        tiltAngle: 0,
        boundingPoly: {
          vertices: [
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 200, y: 200 },
            { x: 100, y: 200 }
          ]
        },
        landmarks: [
          { type: 'LEFT_EYE', position: { x: 120, y: 130 } },
          { type: 'RIGHT_EYE', position: { x: 180, y: 130 } },
          { type: 'NOSE_TIP', position: { x: 150, y: 160 } }
        ]
      }]
    }])
  }))
}));

jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      status: 'OK',
      results: [{
        geometry: {
          location: { lat: 10.6666, lng: -71.6167 }
        },
        formatted_address: 'Av. 5 de Julio, Maracaibo, Zulia, Venezuela'
      }]
    }
  }),
  post: jest.fn().mockResolvedValue({
    data: { success: true }
  })
}));

// Global test utilities
export function createMockBuffer(content: string = 'fake-image-data'): Buffer {
  return Buffer.from(content);
}

export function createMockConductorData() {
  return {
    telefono: '04241234567',
    email: 'conductor.test@example.com',
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
    foto_cedula: createMockBuffer(),
    selfie: createMockBuffer(),
    selfie_cedula: createMockBuffer(),
    foto_rif: createMockBuffer(),
    foto_titulo: createMockBuffer(),
    otp_input: '123456',
    token_email: 'fake-token-12345'
  };
}

export function createMockClienteData() {
  return {
    telefono: '04249876543',
    email: 'cliente.test@example.com',
    nombre: 'María Elena',
    apellido: 'González',
    cedula: '87654321',
    direccion: 'Calle 72 con Av. 3E',
    sector: 'San Jacinto',
    calle_o_avenida: 'Calle 72',
    numero_casa: '15-20',
    foto_cedula: createMockBuffer(),
    selfie: createMockBuffer(),
    selfie_cedula: createMockBuffer(),
    otp_input: '654321',
    token_email: 'fake-token-67890'
  };
}