import { GoogleGenAI } from '@google/genai';
import { getFiaContextForRole } from '../config/fiaRoleContexts.js';

const ai = new GoogleGenAI({});

/**
 * POST /api/fia/chat (protected).
 * Body: { message: string }
 *
 * Sends role-scoped FMS documentation + user message to Gemini. Role comes from JWT only.
 */
export async function chatWithFIA(req, res) {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!message) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const role = req.user?.role || 'Student';
    const platformContext = getFiaContextForRole(role);

    const contents = `You are FIA, the official assistant for FMS (FYP Management System — "FMS").

RULES:
- First decide whether the user message is about FMS/platform usage or a general question.
- If the message is about FMS/platform usage, answer using the PLATFORM CONTEXT below.
- For FMS questions, do not claim features, URLs, or workflows that are not described in the context.
- The logged-in user role is: ${role}. For FMS questions, only explain workflows and pages that this role can use. If they ask about another role's private admin or internal tools, say you can only help with ${role} tasks and they should use the appropriate account or contact their coordinator.
- If the message is a general non-FMS question (e.g., study help, coding, writing, career, general knowledge), answer normally with helpful and accurate general guidance.
- Prefer concise, step-by-step answers. Mention relevant page names and paths from the context when helpful.

PLATFORM CONTEXT:
${platformContext}

USER MESSAGE:
${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    return res.status(200).json({
      reply: response?.text || 'No response from Gemini.',
    });
  } catch (err) {
    console.error('chatWithFIA error:', err);
    return res.status(500).json({ message: err.message || 'Failed to generate FIA response.' });
  }
}

