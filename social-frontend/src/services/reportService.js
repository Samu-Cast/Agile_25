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

/**
 * Ottiene la lista di tutte le segnalazioni (per moderatori).
 */
export const getReports = async () => {
    try {
        const response = await fetch(`${API_URL}/reports`);
        if (!response.ok) {
            throw new Error('Failed to fetch reports');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching reports:", error);
        throw error;
    }
};

/**
 * Aggiorna lo stato di una segnalazione.
 * @param {string} reportId - ID della segnalazione
 * @param {string} status - Nuovo stato (es. 'closed')
 */
export const updateReportStatus = async (reportId, status) => {
    try {
        const response = await fetch(`${API_URL}/reports/${reportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            throw new Error('Failed to update report');
        }
        return await response.json();
    } catch (error) {
        console.error("Error updating report:", error);
        throw error;
    }
};
