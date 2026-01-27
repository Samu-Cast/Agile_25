const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Invia una nuova segnalazione di problema.
 * @param {Object} reportData - Oggetto contenente { uid, description }
 */
export const createReport = async (reportData) => {
    try {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) {
            throw new Error('Failed to create report');
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating report:", error);
        throw error;
    }
};
