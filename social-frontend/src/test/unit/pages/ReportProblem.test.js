import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportProblem from '../../../pages/ReportProblem';
import { AuthProvider } from '../../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import * as reportService from '../../../services/reportService';

// Mock dependencies
jest.mock('../../../services/reportService');
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }) => <div>{children}</div>,
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('ReportProblem Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders report form correctly when user is logged in', () => {
        // Mock logged in user
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'test-uid' }
        });

        render(
            <BrowserRouter>
                <ReportProblem />
            </BrowserRouter>
        );

        expect(screen.getByText('Area segnalazioni')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Breve riassunto (es. Login non funzionante)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Descrivi dettagliatamente cosa è successo...')).toBeInTheDocument();
        expect(screen.getByText('Invia Segnalazione')).toBeInTheDocument();
    });

    test('shows error when user is not logged in', async () => {
        // Mock NOT logged in user
        mockUseAuth.mockReturnValue({
            currentUser: null
        });

        render(
            <BrowserRouter>
                <ReportProblem />
            </BrowserRouter>
        );

        const submitButton = screen.getByText('Invia Segnalazione');
        fireEvent.click(submitButton);

        expect(await screen.findByText('Devi essere loggato per segnalare un problema')).toBeInTheDocument();
        expect(reportService.createReport).not.toHaveBeenCalled();
    });

    test('submits report successfully', async () => {
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'test-uid' }
        });
        reportService.createReport.mockResolvedValue({ id: 'report-123' });

        render(
            <BrowserRouter>
                <ReportProblem />
            </BrowserRouter>
        );

        const titleInput = screen.getByPlaceholderText('Breve riassunto (es. Login non funzionante)');
        fireEvent.change(titleInput, { target: { value: 'Bug' } });

        const textarea = screen.getByPlaceholderText('Descrivi dettagliatamente cosa è successo...');
        fireEvent.change(textarea, { target: { value: 'Something is broken' } });

        const submitButton = screen.getByText('Invia Segnalazione');
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(reportService.createReport).toHaveBeenCalledWith({
                uid: 'test-uid',
                title: 'Bug',
                description: 'Something is broken'
            });
            expect(screen.getByText(/Segnalazione inviata con successo/i)).toBeInTheDocument();
        });

        // Wait for usage of navigate (setTimeout is 2000ms in component)
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        }, { timeout: 2500 });
    });

    test('handles API error on submission', async () => {
        mockUseAuth.mockReturnValue({
            currentUser: { uid: 'test-uid' }
        });
        reportService.createReport.mockRejectedValue(new Error('Network error'));

        render(
            <BrowserRouter>
                <ReportProblem />
            </BrowserRouter>
        );

        const textarea = screen.getByPlaceholderText('Descrivi dettagliatamente cosa è successo...');
        fireEvent.change(textarea, { target: { value: 'Something is broken' } });

        const submitButton = screen.getByText('Invia Segnalazione');
        fireEvent.click(submitButton);

        expect(await screen.findByText('Impossibile segnalare il problema')).toBeInTheDocument();
    });
});
