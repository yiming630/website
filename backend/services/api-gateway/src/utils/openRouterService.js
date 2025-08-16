const axios = require('axios');

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.model = process.env.OPENROUTER_MODEL || 'google/gemini-pro-1.5';
    this.siteUrl = process.env.SITE_URL || 'http://localhost:3000';
    this.siteName = process.env.SITE_NAME || 'Translation Platform';
  }

  // Translation using Gemini
  async translateText(text, sourceLang, targetLang, style = 'general') {
    try {
      const stylePrompts = {
        'general': 'Translate naturally and accurately',
        'academic': 'Translate using formal academic language and terminology',
        'business': 'Translate using professional business language',
        'legal': 'Translate using precise legal terminology',
        'technical': 'Translate using technical terms accurately',
        'creative': 'Translate creatively while preserving the original meaning',
        'medical': 'Translate using medical terminology accurately',
        'financial': 'Translate using financial and economic terminology'
      };

      const systemPrompt = `You are a professional translator. ${stylePrompts[style] || stylePrompts.general}. 
        Translate from ${this.getLanguageName(sourceLang)} to ${this.getLanguageName(targetLang)}.
        Preserve the original formatting, tone, and style.
        Only provide the translation without any explanations or notes.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.3, // Lower temperature for more accurate translations
          max_tokens: Math.min(text.length * 3, 4000) // Estimate max tokens needed
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.error) {
        throw new Error(`Translation error: ${response.data.error.message}`);
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter translation error:', error.response?.data || error.message);
      throw new Error(`Translation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Chat with AI for translation assistance
  async chatWithAI(messages, context = '') {
    try {
      const systemMessage = {
        role: 'system',
        content: `You are a professional translation assistant helping users with document translation. 
          You provide helpful suggestions, explain translation choices, and answer questions about translations.
          ${context ? `Context: ${context}` : ''}
          Be concise, professional, and helpful.`
      };

      const allMessages = [systemMessage, ...messages];

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.error) {
        throw new Error(`Chat error: ${response.data.error.message}`);
      }

      return {
        content: response.data.choices[0].message.content,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('OpenRouter chat error:', error.response?.data || error.message);
      throw new Error(`Chat failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  // Batch translation for multiple texts
  async batchTranslate(texts, sourceLang, targetLang, style = 'general') {
    try {
      const translations = await Promise.all(
        texts.map(text => this.translateText(text, sourceLang, targetLang, style))
      );
      return translations;
    } catch (error) {
      console.error('Batch translation error:', error);
      throw new Error('Batch translation failed');
    }
  }

  // Document analysis for better translation context
  async analyzeDocument(text, sourceLang) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a document analysis expert. Analyze the given text and provide insights about its type, tone, domain, and key terminology.'
            },
            {
              role: 'user',
              content: `Analyze this ${this.getLanguageName(sourceLang)} text and provide:
                1. Document type (academic, business, technical, etc.)
                2. Tone (formal, informal, neutral)
                3. Domain/field
                4. Key terminology that should be consistently translated
                5. Any cultural context to consider
                
                Text: ${text.substring(0, 2000)}` // Limit to first 2000 chars for analysis
            }
          ],
          temperature: 0.5,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Document analysis error:', error.response?.data || error.message);
      throw new Error('Document analysis failed');
    }
  }

  // Improve translation quality
  async improveTranslation(originalText, translation, sourceLang, targetLang, feedback = '') {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are a professional translation editor. Review and improve translations based on accuracy, fluency, and style.`
            },
            {
              role: 'user',
              content: `Original ${this.getLanguageName(sourceLang)} text: "${originalText}"
                
                Current ${this.getLanguageName(targetLang)} translation: "${translation}"
                
                ${feedback ? `User feedback: ${feedback}` : ''}
                
                Please provide an improved translation that:
                1. Is more accurate to the original meaning
                2. Sounds more natural in ${this.getLanguageName(targetLang)}
                3. Maintains the original tone and style
                
                Only provide the improved translation without explanations.`
            }
          ],
          temperature: 0.4,
          max_tokens: Math.min(translation.length * 2, 4000)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Translation improvement error:', error.response?.data || error.message);
      throw new Error('Failed to improve translation');
    }
  }

  // Get available models from OpenRouter
  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      // Filter for translation-capable models
      const translationModels = response.data.data.filter(model => 
        model.id.includes('gemini') || 
        model.id.includes('claude') || 
        model.id.includes('gpt')
      );

      return translationModels;
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }

  // Helper function to get full language names
  getLanguageName(code) {
    const languages = {
      'en': 'English',
      'zh': 'Chinese',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'ja': 'Japanese',
      'ko': 'Korean',
      'ru': 'Russian',
      'ar': 'Arabic',
      'pt': 'Portuguese',
      'it': 'Italian',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish',
      'vi': 'Vietnamese',
      'th': 'Thai',
      'id': 'Indonesian',
      'ms': 'Malay',
      'hi': 'Hindi',
      'he': 'Hebrew'
    };
    return languages[code] || code;
  }

  // Validate API key
  async validateApiKey() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.status === 200;
    } catch (error) {
      console.error('API key validation failed:', error.message);
      return false;
    }
  }
}

module.exports = new OpenRouterService();