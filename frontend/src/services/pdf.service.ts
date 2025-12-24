const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface GenerarPDFOptions {
  datos: any;
  useCloudinary?: boolean;
}

export interface PDFResponse {
  success: boolean;
  url: string;
  storage: 'local' | 'cloudinary';
  filename: string;
}

export const pdfService = {
  
  async generarPDF(options: GenerarPDFOptions, token: string): Promise<PDFResponse> {
    const response = await fetch(`${API_URL}/documentacion/generar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Para el requireAuth
      },
      body: JSON.stringify(options)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error generando PDF');
    }
    
    return response.json();
  },
  
  // Abrir PDF en nueva pestaña
  abrirPDF(url: string) {
    window.open(url, '_blank');
  },
  
  // Descargar PDF
  async descargarPDF(url: string, filename: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
};