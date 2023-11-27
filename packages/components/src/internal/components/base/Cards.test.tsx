import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Cards } from './Cards';

describe('Cards', () => {
    test('no cards', () => {
        render(<Cards cards={[]} />);
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    test('with cards', () => {
        const cards = [
            { title: 'card1', onClick: jest.fn() },
            { title: 'card2', onClick: jest.fn() },
        ];
        render(<Cards cards={cards} />);
        expect(document.querySelectorAll('.cards__card')).toHaveLength(2);
        expect(cards[0].onClick).toHaveBeenCalledTimes(0);
        expect(cards[1].onClick).toHaveBeenCalledTimes(0);
        userEvent.click(screen.getByText('card1'));
        userEvent.click(screen.getByText('card2'));
        userEvent.click(screen.getByText('card2'));
        expect(cards[0].onClick).toHaveBeenCalledTimes(1);
        expect(cards[1].onClick).toHaveBeenCalledTimes(2);
    });

    test('with card prop combinations', () => {
        render(
            <Cards
                cards={[
                    { title: 'card1' },
                    { title: 'card2', caption: 'caption2' },
                    { title: 'card3', iconSrc: 'iconSrc' },
                    { title: 'card4', iconUrl: 'iconUrl' },
                    { title: 'card5', disabled: true },
                    { title: 'card6', href: 'href' },
                    { title: 'card7', onClick: jest.fn() },
                    {
                        title: 'all',
                        caption: 'captionAll',
                        iconSrc: 'iconSrc',
                        iconUrl: 'iconUrl',
                        href: 'href',
                        disabled: true,
                        onClick: jest.fn(),
                    },
                ]}
            />
        );

        expect(document.querySelectorAll('.cards__card')).toHaveLength(8);
        expect(document.querySelectorAll('.cards__block-disabled')).toHaveLength(2);
        expect(screen.queryAllByRole('img')).toHaveLength(4);

        // verify the card content for the first card
        expect(screen.getByText('card1')).toBeInTheDocument();

        // verify the card content for the second card has the caption
        expect(screen.getByText('card2')).toBeInTheDocument();
        expect(screen.getByText('caption2')).toBeInTheDocument();
    });
});
