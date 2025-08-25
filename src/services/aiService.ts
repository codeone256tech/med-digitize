import { supabase } from "@/integrations/supabase/client";
import { ExtractedFields } from "@/utils/ocrService";

export class AIService {
  static async enhanceExtraction(extractedText: string): Promise<ExtractedFields> {
    try {
      console.log('Calling AI enhancement service...');
      
      const { data, error } = await supabase.functions.invoke('enhance-extraction', {
        body: { extractedText }
      });

      if (error) {
        console.error('AI enhancement error:', error);
        throw error;
      }

      console.log('AI enhancement result:', data);
      return data.extractedFields;
    } catch (error) {
      console.error('Failed to enhance extraction with AI:', error);
      
      // Fallback to basic extraction
      return this.fallbackExtraction(extractedText);
    }
  }

  private static fallbackExtraction(text: string): ExtractedFields {
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

    return fields;
  }
}