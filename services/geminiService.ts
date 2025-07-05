import { GoogleGenAI, GenerateContentResponse, Part, Content } from "@google/genai";
import { Routine, ChatMessage, Recipe } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("VITE_GEMINI_API_KEY is not defined. Por favor, configúralo en tu .env.local.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const model = 'gemini-2.5-flash-preview-04-17';

const cleanJsonString = (jsonStr: string): string => {
    let cleanStr = jsonStr.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanStr.match(fenceRegex);
    if (match && match[2]) {
        cleanStr = match[2].trim();
    }
    return cleanStr;
};


export const getFitnessAdviceStream = async (question: string, history: ChatMessage[]) => {
  if (!ai) {
    throw new Error("El servicio de IA no está disponible en este momento. Verifica la configuración de la API Key.");
  }
  
  const systemInstruction = `
Contexto: Eres el Asistente de Fitness IA de "Gym Max", una aplicación dedicada a mejorar el rendimiento y la salud de sus usuarios a través del ejercicio y la nutrición. Tu misión principal es proporcionar información fiable y basada en evidencia para ayudar a los usuarios a comprender mejor la relación entre su dieta y sus objetivos de fitness.

Objetivo de Expansión de Conocimiento: Nutrición Integral

Debes ser capaz de ofrecer respuestas detalladas, precisas y fácilmente comprensibles sobre los siguientes pilares de la nutrición, siempre enfocándote en la aplicación práctica para un estilo de vida activo y saludable:

1. Macronutrientes (Proteínas, Carbohidratos, Grasas):
   - Funciones biológicas esenciales.
   - Fuentes alimentarias de alta calidad.
   - Recomendaciones generales de ingesta basadas en objetivos (ej. ganancia muscular, pérdida de grasa, mantenimiento) y niveles de actividad física.
   - Diferenciación entre tipos (ej. carbohidratos simples vs. complejos, grasas saturadas vs. insaturadas).

2. Micronutrientes (Vitaminas y Minerales):
   - Importancia para la salud general y el rendimiento deportivo.
   - Ejemplos clave de vitaminas (ej. C, D, B12) y minerales (ej. hierro, calcio, magnesio).
   - Alimentos ricos en estos micronutrientes.
   - Aclaración sobre cuándo la suplementación podría ser considerada (sin promoverla, solo informando su propósito general).

3. Principios de una Dieta Balanceada y Planificación de Comidas:
   - Cómo construir comidas equilibradas y nutritivas.
   - La importancia de la fibra dietética y sus fuentes.
   - Conceptos de porciones y control calórico (sin especificar números exactos de calorías a menos que se solicite explícitamente y con advertencias).
   - Estrategias para la preparación de alimentos y snacks saludables.

4. Hidratación:
   - La importancia vital del agua para el rendimiento físico, la recuperación y la salud general.
   - Recomendaciones de ingesta diaria de líquidos.
   - Factores que influyen en las necesidades de hidratación (ej. actividad física, clima).

Persona y Estilo de Respuesta del Asistente IA:
- Tono: Positivo, alentador, informativo, paciente y profesional.
- Precisión: Todas las respuestas deben basarse en evidencia científica reconocida (ej. pautas de organizaciones de salud, consensos de nutricionistas deportivos). Evita información no verificada o anecdótica.
- Claridad: Utiliza un lenguaje sencillo y directo. Explica conceptos complejos de forma accesible.
- Contexto: Adapta las recomendaciones a un público general interesado en fitness, sin asumir conocimientos previos avanzados.
- Formato: Proporciona respuestas concisas pero completas. Si la pregunta es compleja, puedes estructurar la respuesta con viñetas o listas para facilitar la lectura.

Límites y Advertencias Importantes:
- No Asesoramiento Médico/Personalizado: Enfatiza que tus respuestas son informativas y de carácter general. NUNCA diagnostiques, prescribas tratamientos médicos o dietas personalizadas. Si el usuario necesita recomendaciones específicas o tiene condiciones de salud preexistentes, siempre aconséjale que consulte a un profesional de la salud o un dietista-nutricionista registrado.
- No Suplementación Específica: Evita recomendar marcas o dosis específicas de suplementos.
- Foco en Nutrición: Si la conversación se desvía a temas que no son de fitness, nutrición o rutinas, reconduce amablemente al usuario al ámbito de tu especialización.
`;

  // Map ChatMessage[] to Content[]
  const contents: Content[] = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: question }]});
  
  try {
    const response = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      }
    });
    return response;
  } catch (error) {
    console.error('Error calling Gemini API stream for fitness advice:', error);
    if (error instanceof Error) {
        const googleError = error as any;
        if (googleError.message && googleError.message.includes("API key not valid")) {
          throw new Error("La clave API de Gemini no es válida. Por favor, verifica tu configuración.");
        }
        if (googleError.message && googleError.message.includes("quota")) {
            throw new Error("Se ha excedido la cuota de uso de la API. Inténtalo más tarde.");
        }
        throw new Error(`Error al contactar la API de Gemini: ${googleError.message || "Error desconocido"}`);
    }
    throw new Error('Se produjo un error desconocido al contactar la API de Gemini.');
  }
};


export const parseRoutineFromFileContent = async (
  fileContent: string, // For TXT, this is raw text. For PDF, this is base64.
  mimeType: 'text/plain' | 'application/pdf',
  fileName: string
): Promise<Partial<Routine> | null> => {
  if (!ai) {
    throw new Error("El servicio de IA no está disponible (API Key no configurada).");
  }

  const routineTypeDefinitions = `
    interface Exercise {
      id: string; 
      exerciseName: string;
      sets: string | number;
      reps: string; 
      weightKg?: string | number;
      notes?: string;
    }
    interface Day {
      id: string;
      name: string;
      order: number;
      exercises: Exercise[];
      warmUpExercises?: Exercise[];
    }
    interface Routine {
      name: string;
      description?: string;
      days: Day[];
    }
  `;

  const prompt = `Por favor, actúa como un experto en fitness y procesador de datos. Analiza el contenido del archivo adjunto (nombre: "${fileName}") que detalla una rutina de ejercicios. Extrae la información para estructurarla en un ÚNICO objeto JSON que represente UNA rutina de entrenamiento completa. El JSON DEBE seguir estrictamente las siguientes interfaces TypeScript:
${routineTypeDefinitions}
Instrucciones detalladas de formato y contenido:
1.  **Formato JSON Estricto**: La respuesta DEBE ser exclusivamente un objeto JSON válido, sin texto ni comentarios adicionales. Todas las claves y valores de tipo string deben estar entre comillas dobles. No incluyas claves opcionales si no tienen valor.
2.  **IDs**: NO generes IDs. Los IDs serán asignados por el sistema posteriormente.
3.  **Nombre de Rutina**: Determina un nombre descriptivo para la rutina.
4.  **Días**: Identifica cada día de entrenamiento, asignando un nombre y un orden secuencial (empezando en 0).
5.  **Ejercicios**: Separa los ejercicios de 'calentamiento' (warm-up) de los 'principales'. Colócalos en los arrays 'warmUpExercises' y 'exercises' respectivamente.
6.  **Contenido del archivo**: Procesa el contenido adjunto para el análisis.`;

  const parts: Part[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType,
        data: mimeType === 'text/plain' ? btoa(unescape(encodeURIComponent(fileContent))) : fileContent, // Correct base64 encoding for text
      },
    },
  ];
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonStr = cleanJsonString(response.text ?? "");
    const parsedData = JSON.parse(jsonStr) as Partial<Routine>;
    
    if (!parsedData || typeof parsedData.name !== 'string' || !Array.isArray(parsedData.days)) {
        console.error("Invalid JSON structure received from AI:", parsedData);
        throw new Error("El AI devolvió una estructura JSON inesperada para la rutina.");
    }
    
    return parsedData;

  } catch (error) {
    console.error('Error calling Gemini API or parsing routine JSON:', error);
    let errorMessage = 'Error al procesar el archivo de rutina con IA.';
    if (error instanceof SyntaxError) {
        errorMessage = `Error al interpretar la respuesta del AI (JSON inválido): ${error.message}. Por favor, verifica el formato del archivo o intenta con un archivo de texto más simple.`;
    } else if (error instanceof Error) {
        errorMessage = `Error del servicio de IA: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};


export const generateRoutine = async (numberOfDays: number): Promise<Partial<Routine> | null> => {
  if (!ai) {
    throw new Error("El servicio de IA no está disponible (API Key no configurada).");
  }

  const routineTypeDefinitions = `
    interface Exercise {
      id: string; 
      exerciseName: string;
      sets: string | number;
      reps: string; 
      weightKg?: string | number;
      notes?: string;
    }
    interface Day {
      id: string;
      name: string;
      order: number;
      exercises: Exercise[];
      warmUpExercises?: Exercise[];
    }
    interface Routine {
      name: string;
      description?: string;
      days: Day[];
    }
  `;

  const prompt = `Por favor, actúa como un experto en fitness y procesador de datos. Genera una rutina de entrenamiento completa y bien estructurada para ${numberOfDays} días. El objetivo es una rutina de hipertrofia general para un usuario intermedio.
  
  Extrae la información para estructurarla en un ÚNICO objeto JSON. El JSON DEBE seguir estrictamente las siguientes interfaces TypeScript:
${routineTypeDefinitions}

Instrucciones detalladas de formato y contenido:
1.  **Formato JSON Estricto**: La respuesta DEBE ser exclusivamente un objeto JSON válido, sin texto ni comentarios adicionales. Todas las claves y valores de tipo string deben estar entre comillas dobles. No incluyas claves opcionales si no tienen valor.
2.  **Nombre de Rutina**: Crea un nombre creativo y descriptivo para la rutina (ej. "Plan de Hipertrofia de ${numberOfDays} Días: Forjando Acero").
3.  **Descripción**: Añade una breve descripción motivadora para la rutina.
4.  **Días**: Crea exactamente ${numberOfDays} objetos de día. Asigna un nombre claro y específico a cada día (ej: "Día 1: Empuje - Pecho, Hombros y Tríceps", "Día 2: Tirón - Espalda y Bíceps", "Día 3: Pierna y Abdominales"). Asigna un orden secuencial (empezando en 0).
5.  **Ejercicios**: Para cada día, incluye una lista de 5-7 ejercicios principales en el array 'exercises'.
6.  **Calentamiento**: Para cada día, incluye 2-3 ejercicios de calentamiento relevantes en el array 'warmUpExercises'.
7.  **Detalles de Ejercicio**: Para cada ejercicio, especifica 'exerciseName', 'sets', y 'reps'. Por ejemplo, para un ejercicio principal \`sets: 4\`, \`reps: "8-12"\`. Para calentamiento, \`sets: 2\`, \`reps: "15"\`.
8.  **IDs**: NO generes IDs. Los IDs serán asignados por el sistema posteriormente.
9. **Idioma**: Todos los nombres de ejercicios, días y descripciones deben estar en español.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const jsonStr = cleanJsonString(response.text ?? "");
    const parsedData = JSON.parse(jsonStr) as Partial<Routine>;
    
    if (!parsedData || typeof parsedData.name !== 'string' || !Array.isArray(parsedData.days)) {
        console.error("Invalid JSON structure received from AI for generated routine:", parsedData);
        throw new Error("El AI devolvió una estructura JSON inesperada para la rutina.");
    }
    
    return parsedData;

  } catch (error) {
    console.error('Error calling Gemini API or parsing generated routine JSON:', error);
    let errorMessage = 'Error al generar la rutina con IA.';
    if (error instanceof SyntaxError) {
        errorMessage = `Error al interpretar la respuesta del AI (JSON inválido): ${error.message}.`;
    } else if (error instanceof Error) {
        errorMessage = `Error del servicio de IA: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};


export const generateRecipe = async (goal: string, preferences: string, history: string[]): Promise<Recipe | null> => {
    if (!ai) {
        throw new Error("El servicio de IA no está disponible (API Key no configurada).");
    }

    const recipeTypeDefinition = `
      interface Recipe {
        recipeName: string;
        description: string;
        ingredients: string[];
        steps: string[];
        calories: string;
        protein: string;
        carbs: string;
        fats: string;
      }
    `;
    
    const prompt = `
        Tu rol es ser un chef y nutricionista experto. Tu tarea es generar una receta completa en un único objeto JSON.
        
        Contexto del usuario:
        - Objetivo: ${goal}
        - Preferencias: "${preferences || 'ninguna'}"
        - Historial de recetas recientes (evita repetirlas): ${JSON.stringify(history)}
        
        Requisitos Críticos de la Respuesta:
        1.  Formato: La respuesta DEBE SER EXCLUSIVAMENTE un único objeto JSON válido que siga la interfaz TypeScript. No incluyas markdown, texto adicional, ni comentarios.
        2.  Contenido:
            - recipeName: Un nombre creativo y en español.
            - description: Una descripción corta, apetitosa y en español.
            - ingredients: Un array de strings. CADA string DEBE especificar una cantidad (ej: "200g de pechuga de pollo"). NO PUEDE estar vacío.
            - steps: Un array de strings con los pasos de preparación, claros, concisos y en español.
            - nutrition: Todos los campos nutricionales (calories, protein, carbs, fats) DEBEN ser strings que representen valores aproximados para UNA porción (ej: "450 kcal", "30g"). Si no puedes calcular un valor, devuelve "N/A".
        
        Interfaz TypeScript a seguir estrictamente:
        ${recipeTypeDefinition}
    `;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        const jsonStr = cleanJsonString(response.text ?? "");
        const parsedData = JSON.parse(jsonStr) as Recipe;

        if (!parsedData || !parsedData.recipeName || !Array.isArray(parsedData.ingredients) || !Array.isArray(parsedData.steps) || !parsedData.calories) {
            console.error("Invalid JSON structure received from AI for recipe:", parsedData);
            throw new Error("El AI devolvió una estructura JSON inesperada para la receta.");
        }

        return parsedData;

    } catch (error) {
        console.error('Error calling Gemini API or parsing recipe JSON:', error);
        let errorMessage = 'Error al generar la receta con IA.';
        if (error instanceof SyntaxError) {
            errorMessage = `Error al interpretar la respuesta del AI (JSON inválido): ${error.message}.`;
        } else if (error instanceof Error) {
            errorMessage = `Error del servicio de IA: ${error.message}`;
        }
        throw new Error(errorMessage);
  }
};

export const analyzeMeal = async (
  textInput: string,
  image?: { mimeType: 'image/jpeg' | 'image/png'; data: string }
): Promise<Recipe | null> => {
  if (!ai) {
    throw new Error('El servicio de IA no está disponible (API Key no configurada).');
  }

  const mealAnalysisInterface = `
    // IMPORTANTE: RESPONDE SOLO CON UN OBJETO JSON, SIN TEXTO EXTRA.
    // Usa exactamente estos nombres de campo y tipos:
    interface Recipe {
      recipeName: string; // Nombre del plato
      calories: number; // Calorías estimadas
      protein: number; // Proteína estimada en gramos
      carbs: number; // Carbohidratos estimados en gramos
      fats: number; // Grasas estimadas en gramos
      ingredients: string[]; // Ingredientes principales
      preparationSteps: string[]; // Pasos de preparación
      feedback: string; // Consejo útil sobre la comida
      disclaimer?: string; // Advertencia si el análisis es por texto
    }
  `;

  let prompt = '';
  const parts: Part[] = [];

  const basePrompt = `Actúa como un nutricionista experto y chef. Analiza la comida descrita y proporciona un desglose nutricional estimado, un nombre, ingredientes y un consejo útil. Haz tu mejor esfuerzo para inferir los pasos de preparación probables. Responde únicamente con un objeto JSON que siga el esquema provisto. Si es imposible inferir los pasos o los ingredientes, devuelve un array vacío para esos campos.`;

  if (image) {
    prompt = `${basePrompt} La comida está en la imagen adjunta.\nEsquema JSON: ${mealAnalysisInterface}`;
    parts.push({ text: prompt });
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  } else if (textInput) {
    prompt = `${basePrompt} La comida es: "${textInput}". Incluye una advertencia sobre la menor precisión del análisis basado en texto en el campo 'disclaimer'.\nEsquema JSON: ${mealAnalysisInterface}`;
    parts.push({ text: prompt });
  } else {
    throw new Error('Debes proporcionar una descripción o una imagen para analizar.');
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonStr = cleanJsonString(response.text ?? "");
    try {
      let parsedData = JSON.parse(jsonStr);
      // --- PARSER FLEXIBLE ---
      // Si Gemini devuelve campos alternativos, los convertimos al formato esperado
      if (parsedData) {
        // Si tiene 'name' pero no 'recipeName'
        if (parsedData.name && !parsedData.recipeName) parsedData.recipeName = parsedData.name;
        // Si tiene 'estimated_nutrition' (array de strings), intentar extraer valores
        if (Array.isArray(parsedData.estimated_nutrition)) {
          for (const line of parsedData.estimated_nutrition) {
            if (/cal.*?:/i.test(line)) parsedData.calories = Number((line.match(/([\d.]+)/g) || [])[0]) || 0;
            if (/prote[ií]na/i.test(line)) parsedData.protein = Number((line.match(/([\d.]+)/g) || [])[0]) || 0;
            if (/grasa/i.test(line)) parsedData.fats = Number((line.match(/([\d.]+)/g) || [])[0]) || 0;
            if (/carb/i.test(line)) parsedData.carbs = Number((line.match(/([\d.]+)/g) || [])[0]) || 0;
          }
        }
        // Si tiene 'preparation_steps' pero no 'preparationSteps'
        if (parsedData.preparation_steps && !parsedData.preparationSteps) parsedData.preparationSteps = parsedData.preparation_steps;
      }
      // Validación final
      if (
        !parsedData || !parsedData.recipeName ||
        typeof parsedData.calories !== 'number' ||
        typeof parsedData.protein !== 'number' ||
        typeof parsedData.carbs !== 'number' ||
        typeof parsedData.fats !== 'number' ||
        !Array.isArray(parsedData.ingredients) ||
        !Array.isArray(parsedData.preparationSteps)
      ) {
        console.error('Invalid JSON structure received from AI for meal analysis:', parsedData);
        console.error('Respuesta cruda de Gemini:', jsonStr);
        throw new Error('El AI devolvió una estructura JSON inesperada para el análisis de la comida.');
      }
      return parsedData;
    } catch (err) {
      console.error('Error al parsear JSON de Gemini:', jsonStr, err);
      throw err;
    }
  } catch (error) {
    console.error('Error calling Gemini API or parsing meal analysis JSON:', error);
    let errorMessage = 'Error al analizar la comida con IA.';
    if (error instanceof SyntaxError) {
      errorMessage = `Error al interpretar la respuesta de la IA (JSON inválido): ${error.message}.`;
    } else if (error instanceof Error) {
      errorMessage = `Error del servicio de IA: ${error.message}`;
    }
    throw new Error(errorMessage);
  }
};