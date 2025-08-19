import Tesseract from 'tesseract.js';

export interface ExtractedFields {
  patientName: string;
  age: string;
  gender: string;
  date: string;
  diagnosis: string;
  prescription: string;
}

export class OCRService {
  static async extractText(imageFile: File): Promise<string> {
    try {
      const result = await Tesseract.recognize(imageFile, 'eng', {
        logger: m => console.log(m)
      });
      return result.data.text;
    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error('Failed to extract text from image');
    }
  }

  static extractFields(text: string): ExtractedFields {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const fields: ExtractedFields = {
      patientName: '',
      age: '',
      gender: '',
      date: '',
      diagnosis: '',
      prescription: ''
    };

    // Enhanced pattern matching for medical records
    const patterns = {
      name: /(?:name|patient|pt)[:\s]*([a-zA-Z\s.]+)/i,
      age: /(?:age|dob|birth)[:\s]*(\d{1,3}|\d{2}\/\d{2}\/\d{4})/i,
      gender: /(?:gender|sex|m\/f)[:\s]*(male|female|m|f)/i,
      date: /(?:date|dated)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      diagnosis: /(?:diagnosis|dx|condition|problem)[:\s]*([^\.]+)/i,
      prescription: /(?:prescription|rx|medication|medicine|drug)[:\s]*([^\.]+)/i
    };

    // Extract using patterns
    for (const line of lines) {
      if (!fields.patientName && patterns.name.test(line)) {
        const match = line.match(patterns.name);
        if (match) fields.patientName = match[1].trim();
      }
      
      if (!fields.age && patterns.age.test(line)) {
        const match = line.match(patterns.age);
        if (match) fields.age = match[1].trim();
      }
      
      if (!fields.gender && patterns.gender.test(line)) {
        const match = line.match(patterns.gender);
        if (match) {
          const g = match[1].toLowerCase();
          fields.gender = g === 'm' || g === 'male' ? 'Male' : 'Female';
        }
      }
      
      if (!fields.date && patterns.date.test(line)) {
        const match = line.match(patterns.date);
        if (match) fields.date = match[1].trim();
      }
      
      if (!fields.diagnosis && patterns.diagnosis.test(line)) {
        const match = line.match(patterns.diagnosis);
        if (match) fields.diagnosis = match[1].trim();
      }
      
      if (!fields.prescription && patterns.prescription.test(line)) {
        const match = line.match(patterns.prescription);
        if (match) fields.prescription = match[1].trim();
      }
    }

    // Fallback: try to extract from unstructured text
    if (!fields.patientName) {
      // Look for names (capitalized words)
      const nameMatch = text.match(/[A-Z][a-z]+ [A-Z][a-z]+/);
      if (nameMatch) fields.patientName = nameMatch[0];
    }

    if (!fields.age) {
      // Look for standalone numbers that could be age
      const ageMatch = text.match(/\b([1-9]\d?|100)\b/);
      if (ageMatch) fields.age = ageMatch[1];
    }

    return fields;
  }

  static generatePatientId(patientName: string): string {
    const timestamp = Date.now().toString().slice(-6);
    const namePrefix = patientName.replace(/\s+/g, '').slice(0, 3).toUpperCase();
    return `${namePrefix}${timestamp}`;
  }
}