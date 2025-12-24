import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { StorageService } from '../services/storage.service.js';

// Necesario para usar __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ruta existente: servir PDFs desde local
router.get('/documentacion/pdf/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../../uploads/pdfs', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'PDF no encontrado' });
  }
});

// Nueva ruta: generar y guardar PDF
router.post('/documentacion/generar', async (req, res) => {
  try {
    const { datos, useCloudinary } = req.body;
    
    // 1. Generar el PDF (PLACEHOLDER - aquí irá tu lógica)
    // Por ahora creamos un buffer de ejemplo
    const pdfBuffer = Buffer.from('PDF de prueba');
    
    // TODO: Cuando tengas tu función de generar PDF, reemplaza la línea anterior por:
    // const pdfBuffer = await generarPDF(datos);
    
    // 2. Guardar según preferencia
    const filename = `doc-${Date.now()}.pdf`;
    const resultado = await StorageService.savePDF(
      pdfBuffer, 
      filename, 
      useCloudinary || false
    );
    
    // 3. Si es local, construir URL completa
    if (resultado.storage === 'local') {
      resultado.url = `${req.protocol}://${req.get('host')}${resultado.url}`;
    }
    
    res.json({
      success: true,
      url: resultado.url,
      storage: resultado.storage,
      filename
    });
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ 
      error: 'Error generando PDF',
      message: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;