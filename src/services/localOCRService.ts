// Local Tesseract OCR service
const OCR_API_URL = 'http://localhost:3002/api'; // Your local Tesseract service URL

export interface ExtractedFields {
  patientName: string;
  age: string;
  gender: string;
  date: string;
  diagnosis: string;
  prescription: string;
}

class LocalOCRService {
  async extractText(imageFile: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`${OCR_API_URL}/ocr/extract-text`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.status}`);
      }

      const data = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  async extractFields(text: string): Promise<ExtractedFields> {
    try {
      const response = await fetch(`${OCR_API_URL}/ocr/extract-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Field extraction error: ${response.status}`);
      }

      const data = await response.json();
      return data.fields || this.fallbackExtraction(text);
    } catch (error) {
      console.error('Field extraction failed:', error);
      return this.fallbackExtraction(text);
    }
  }

  private fallbackExtraction(text: string): ExtractedFields {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const fields: ExtractedFields = {
      patientName: '',
      age: '',
      gender: '',
      date: '',
      diagnosis: '',
      prescription: ''
    };

    const patterns = {
      name: /(?:name|patient|pt|mr|mrs|miss|dr)[:\s]*([a-zA-Z\s.'-]+)/i,
      age: /(?:age|yrs?|years?|y\/o|born)[:\s]*(\d{1,3}|[1-9]\d?)/i,
      gender: /(?:gender|sex|male|female|m\/f|patient)[:\s]*(male|female|m|f|man|woman)/i,
      date: /(?:date|visit|seen|examined|today)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
      diagnosis: /(?:diagnosis|dx|condition|problem|complain|chief|complaint|presenting)[:\s]*([^,\n\r]+)/i,
      prescription: /(?:prescription|rx|medication|medicine|drug|treatment|advised|prescribed)[:\s]*([^,\n\r]+)/i
    };

    for (const line of lines) {
      Object.entries(patterns).forEach(([field, pattern]) => {
        if (!(fields as any)[field] && pattern.test(line)) {
          const match = line.match(pattern);
          if (match) {
            let value = match[1].trim();
            if (field === 'gender') {
              const g = value.toLowerCase();
              value = g === 'm' || g === 'male' ? 'Male' : 'Female';
            }
            (fields as any)[field] = value;
          }
        }
      });
    }

    return fields;
  }

  generatePatientId(patientName: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const namePrefix = patientName.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    return `${namePrefix}${timestamp}`;
  }
}

export const localOCRService = new LocalOCRService();