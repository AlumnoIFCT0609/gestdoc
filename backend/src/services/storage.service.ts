import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class StorageService {
  
  // Opción 1: Guardar en servidor local
  static saveToLocal(pdfBuffer: Buffer, filename: string): string {
    const uploadsDir = path.join(__dirname, '../../uploads/pdfs');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, pdfBuffer);
    
    return `/uploads/pdfs/${filename}`; // URL relativa
  }
  
  // Opción 2: Subir a Cloudinary
  static async uploadToCloudinary(
    pdfBuffer: Buffer, 
    filename: string
  ): Promise<string> {
    // Verificar si Cloudinary está configurado
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary no está configurado');
    }
    
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'documentacion/pdfs',
          public_id: filename.replace('.pdf', ''),
          format: 'pdf'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result!.secure_url);
        }
      ).end(pdfBuffer);
    });
  }
  
  // Método unificado con opción
  static async savePDF(
    pdfBuffer: Buffer, 
    filename: string, 
    useCloudinary: boolean = false
  ): Promise<{ url: string; storage: 'local' | 'cloudinary' }> {
    
    if (useCloudinary) {
      try {
        const url = await this.uploadToCloudinary(pdfBuffer, filename);
        return { url, storage: 'cloudinary' };
      } catch (error) {
        console.error('Error subiendo a Cloudinary, usando almacenamiento local:', error);
        // Fallback a local si falla Cloudinary
        const url = this.saveToLocal(pdfBuffer, filename);
        return { url, storage: 'local' };
      }
    } else {
      const url = this.saveToLocal(pdfBuffer, filename);
      return { url, storage: 'local' };
    }
  }
}