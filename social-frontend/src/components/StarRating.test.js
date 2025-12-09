import { render, screen, fireEvent } from '@testing-library/react';
import StarRating from './StarRating';

describe('StarRating Component', () => {
    const mockOnRatingChange = jest.fn();

    beforeEach(() => {
        mockOnRatingChange.mockClear();
    });

    test('renders 5 stars', () => {
        const { container } = render(<StarRating postId="123" />);
        // Use class selector which is reliable here
        const stars = container.getElementsByClassName('star');
        // Actually, the component renders SVGs inside spans. Let's find by the container class or similar.
        // The SVGs don't have a role assigned in the code I saw.
        // Let's use container selector or test ID if possible, but I shouldn't modify code unless needed.
        // The code has `className="star ..."`
        // Let's count elements with class 'star'
        expect(stars.length).toBe(5);
    });

    test('displays correct average rating', () => {
        const userRatingMap = { 'user1': 5, 'user2': 3 };
        render(<StarRating postId="123" userRatingMap={userRatingMap} />);
        // Average should be (5+3)/2 = 4.0
        expect(screen.getByText(/4.0 ☕/i)).toBeInTheDocument();
    });

    test('calls onRatingChange when clicked by logged in user', () => {
        render(
            <StarRating
                postId="123"
                currentUserId="user1"
                onRatingChange={mockOnRatingChange}
            />
        );

        // Click the 5th star
        const stars = document.getElementsByClassName('star');
        fireEvent.click(stars[4]);

        expect(mockOnRatingChange).toHaveBeenCalledWith("123", 5);
    });

    test('shows alert when clicked by non-logged in user', () => {
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });
        render(
            <StarRating
                postId="123"
                currentUserId={undefined}
                onRatingChange={mockOnRatingChange}
            />
        );

        const stars = document.getElementsByClassName('star');
        fireEvent.click(stars[2]); // Click 3rd star

        expect(alertMock).toHaveBeenCalledWith('Devi essere loggato per valutare!');
        expect(mockOnRatingChange).not.toHaveBeenCalled();

        alertMock.mockRestore();
    });
});
