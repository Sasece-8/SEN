import * as aiService from '../services/aiService.js';
export const getResult = async (req, res) => {
    try {
        const { prompt } = req.query;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const response = await aiService.generateResponse(prompt);
        res.json({ response });
    } catch (error) {
        console.error('Error generating AI response:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}