import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractedText } = await req.json();

    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get('HUGGING_FACE_ACCESS_TOKEN')}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: `Extract and organize this medical record text into structured fields. Fix OCR errors and common medical handwriting mistakes. Format as JSON with fields: patientName, age, gender, date, diagnosis, prescription.

Text: ${extractedText}

Response (JSON only):`,
          parameters: {
            max_length: 500,
            temperature: 0.3,
            do_sample: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Hugging Face response:', result);

    // Extract the generated text
    let aiResponse = '';
    if (Array.isArray(result) && result.length > 0) {
      aiResponse = result[0].generated_text || '';
    }

    // Try to extract JSON from the response
    let extractedFields = {
      patientName: '',
      age: '',
      gender: '',
      date: '',
      diagnosis: '',
      prescription: ''
    };

    // Look for JSON in the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        extractedFields = { ...extractedFields, ...parsed };
      } catch (e) {
        console.error('Failed to parse JSON from AI response:', e);
      }
    }

    // Fallback: use regex patterns to extract fields from the original text if AI didn't provide good results
    if (!extractedFields.patientName || !extractedFields.diagnosis) {
      const patterns = {
        name: /(?:name|patient|pt)[:\s]*([a-zA-Z\s.'-]+)/i,
        age: /(?:age|yrs?|years?)[:\s]*(\d{1,3})/i,
        gender: /(?:gender|sex)[:\s]*(male|female|m|f)/i,
        date: /(?:date|visit)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
        diagnosis: /(?:diagnosis|dx|condition)[:\s]*([^,\n\r]+)/i,
        prescription: /(?:prescription|rx|medication)[:\s]*([^,\n\r]+)/i
      };

      for (const [field, pattern] of Object.entries(patterns)) {
        if (!extractedFields[field as keyof typeof extractedFields]) {
          const match = extractedText.match(pattern);
          if (match) {
            let value = match[1].trim();
            if (field === 'gender') {
              const g = value.toLowerCase();
              value = g === 'm' || g === 'male' ? 'Male' : 'Female';
            }
            (extractedFields as any)[field] = value;
          }
        }
      }
    }

    return new Response(JSON.stringify({ extractedFields }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in enhance-extraction function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      extractedFields: {
        patientName: '',
        age: '',
        gender: '',
        date: '',
        diagnosis: '',
        prescription: ''
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});