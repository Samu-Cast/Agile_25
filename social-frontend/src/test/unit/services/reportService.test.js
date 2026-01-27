import * as reportService from '../../../services/reportService';

describe('ReportService', () => {
    beforeEach(() => {
        global.fetch = jest.fn();
        jest.spyOn(console, 'error').mockImplementation(() => { }); // Suppress error logs during testing
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('createReport', () => {
        const mockReportData = { uid: 'user1', title: 'Problem', description: 'Desc' };

        test('successfully creates a report', async () => {
            const mockResponse = { id: 'report-id', ...mockReportData };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await reportService.createReport(mockReportData);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/reports'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mockReportData),
            });
            expect(result).toEqual(mockResponse);
        });

        test('throws error when API response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
            });

            await expect(reportService.createReport(mockReportData)).rejects.toThrow('Failed to create report');
        });

        test('throws error when network fails', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(reportService.createReport(mockReportData)).rejects.toThrow('Network error');
        });
    });

    describe('getReports', () => {
        const mockReports = [
            { id: 1, title: 'Report 1', status: 'open' },
            { id: 2, title: 'Report 2', status: 'closed' }
        ];

        test('successfully fetches reports', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockReports,
            });

            const result = await reportService.getReports();

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/reports'));
            expect(result).toEqual(mockReports);
        });

        test('throws error when API response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
            });

            await expect(reportService.getReports()).rejects.toThrow('Failed to fetch reports');
        });

        test('throws error when network fails', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(reportService.getReports()).rejects.toThrow('Network error');
        });
    });

    describe('updateReportStatus', () => {
        const reportId = 'report-1';
        const status = 'closed';

        test('successfully updates report status', async () => {
            const mockResponse = { id: reportId, status };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => mockResponse,
            });

            const result = await reportService.updateReportStatus(reportId, status);

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/reports/${reportId}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            expect(result).toEqual(mockResponse);
        });

        test('throws error when API response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
            });

            await expect(reportService.updateReportStatus(reportId, status)).rejects.toThrow('Failed to update report');
        });

        test('throws error when network fails', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(reportService.updateReportStatus(reportId, status)).rejects.toThrow('Network error');
        });
    });
});
