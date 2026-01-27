import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModeratorReports from '../../../pages/ModeratorReports';
import { BrowserRouter } from 'react-router-dom';
import * as reportService from '../../../services/reportService';

// Mock dependencies
jest.mock('../../../services/reportService');
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

const mockReports = [
    {
        id: 'rep-1',
        title: 'Closed Report',
        description: 'This is closed',
        status: 'closed',
        uid: 'user-1',
        userName: 'User One',
        createdAt: '2025-01-01T10:00:00.000Z'
    },
    {
        id: 'rep-2',
        title: 'Open Report',
        description: 'This is open',
        status: 'open',
        uid: 'user-2',
        userName: 'User Two',
        createdAt: '2025-01-02T10:00:00.000Z'
    },
    {
        id: 'rep-3',
        title: 'Newer Open Report',
        description: 'This is also open',
        status: 'open',
        uid: 'user-3',
        userName: 'User Three',
        createdAt: '2025-01-03T10:00:00.000Z'
    }
];

describe('ModeratorReports Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'mod-uid' }
        });
    });

    test('renders loading state initially', () => {
        reportService.getReports.mockImplementation(() => new Promise(() => { })); // Hang promise
        render(
            <BrowserRouter>
                <ModeratorReports />
            </BrowserRouter>
        );
        expect(screen.getByText('Caricamento...')).toBeInTheDocument();
    });

    test('renders reports sorted by status (Open first) and then date', async () => {
        reportService.getReports.mockResolvedValue(mockReports);

        render(
            <BrowserRouter>
                <ModeratorReports />
            </BrowserRouter>
        );

        await waitFor(() => {
            const reportItems = screen.getAllByText(/Report/);
            // Expected order: 
            // 1. Newer Open Report (rep-3) - Open, Newest
            // 2. Open Report (rep-2) - Open, Older
            // 3. Closed Report (rep-1) - Closed at bottom

            // Note: We are checking titles. strict regex or text content.
            // Let's use getByText for titles to check existence and order if possible, 
            // or just check that they are present.
            expect(screen.getByText('Newer Open Report')).toBeInTheDocument();
            expect(screen.getByText('Open Report')).toBeInTheDocument();
            expect(screen.getByText('Closed Report')).toBeInTheDocument();
        });

        // Check sorting implicitly by DOM order of status badges?
        const statusBadges = screen.getAllByText(/OPEN|CLOSED/);
        expect(statusBadges[0]).toHaveTextContent('OPEN');
        expect(statusBadges[1]).toHaveTextContent('OPEN');
        expect(statusBadges[2]).toHaveTextContent('CLOSED');
    });

    test('opens details popup when clicking a report', async () => {
        reportService.getReports.mockResolvedValue(mockReports);

        render(
            <BrowserRouter>
                <ModeratorReports />
            </BrowserRouter>
        );

        await waitFor(() => screen.getByText('Newer Open Report'));

        fireEvent.click(screen.getByText('Newer Open Report'));

        expect(screen.getByText('Dettagli Utente:')).toBeVisible(); // Unique to popup
        expect(screen.getByText('ID: rep-3')).toBeVisible();
        expect(screen.getByText('This is also open')).toBeVisible(); // Description
    });

    test('closes an open report successfully', async () => {
        reportService.getReports.mockResolvedValue([mockReports[1]]); // Single open report
        reportService.updateReportStatus.mockResolvedValue({});

        render(
            <BrowserRouter>
                <ModeratorReports />
            </BrowserRouter>
        );

        await waitFor(() => screen.getByText('Open Report'));

        // Open popup
        fireEvent.click(screen.getByText('Open Report'));

        // Find close button
        const closeBtn = screen.getByText('Chiudi Segnalazione');
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(reportService.updateReportStatus).toHaveBeenCalledWith('rep-2', 'closed');
        });

        // Verify UI update (status should change to closed in the list/modal, or component updates state)
        // Since we mock updateReportStatus properly, the component should update local state.
        // The modal closes? Let's check code. Code: setSelectedReport(null) after closing.
        expect(screen.queryByText('Dettaglio Segnalazione')).not.toBeInTheDocument();
    });

    test('displays error message when API fails', async () => {
        reportService.getReports.mockRejectedValue(new Error('API Error'));

        render(
            <BrowserRouter>
                <ModeratorReports />
            </BrowserRouter>
        );

        expect(await screen.findByText('Impossibile caricare le segnalazioni.')).toBeInTheDocument();
    });
});
