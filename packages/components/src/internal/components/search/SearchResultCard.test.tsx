/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { SearchResultCard } from './SearchResultCard';

describe('<SearchResultCard/>', () => {
    test('default', () => {
        const summary = 'Card Summary';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
        };
        render(<SearchResultCard cardData={cardData} isTopResult={false} summary="Card Summary" url="#card" />);

        // When there is no category or typeName the first card detail will be the summary
        expect(document.querySelectorAll('.search-result__summary')[0].textContent).toEqual(summary);
        expect(document.querySelector('img').getAttribute('src')).toBe('/labkey/_images/testsource.svg');
    });

    test('category', () => {
        const category = 'My Category';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            category,
        };
        render(<SearchResultCard cardData={cardData} isTopResult={false} summary="Card Summary" url="#card" />);

        expect(document.querySelector('.status-pill').textContent).toEqual(category);
    });

    test('typeName', () => {
        const typeName = 'My Type';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            typeName,
        };
        const wrapper = render(
            <SearchResultCard cardData={cardData} isTopResult={false} summary="Card Summary" url="#card" />
        );

        expect(document.querySelector('.status-pill').textContent).toEqual(typeName);
        expect(document.querySelectorAll('.folder-field_archived-tag')).toHaveLength(0);
    });

    test('archived', () => {
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            category: 'samples',
        };
        const wrapper = render(
            <SearchResultCard
                archived={true}
                cardData={cardData}
                isTopResult={false}
                summary="Card Summary"
                url="#card"
            />
        );

        expect(document.querySelectorAll('.folder-field_archived-tag')).toHaveLength(1);
    });

    test('iconDir', () => {
        const iconUrl = '/url/for/icon.png';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            iconDir: 'test/dir',
        };
        const wrapper = render(
            <SearchResultCard cardData={cardData} isTopResult={false} summary="Card Summary" url="#card" />
        );
        expect(document.querySelector('img').getAttribute('src')).toBe('/labkey/test/dir/testsource.svg');
    });

    test('iconUrl', () => {
        const iconUrl = '/url/for/icon.png';
        const cardData = {
            title: 'my title',
            iconSrc: 'testsource',
            iconDir: 'test/dir',
        };
        const wrapper = render(
            <SearchResultCard
                cardData={cardData}
                iconUrl={iconUrl}
                isTopResult={false}
                summary="Card Summary"
                url="#card"
            />
        );
        expect(document.querySelector('img').getAttribute('src')).toBe(iconUrl);
    });

    test('no summary', () => {
        render(<SearchResultCard cardData={{}} isTopResult={false} summary={undefined} url="#card" />);
        expect(document.querySelector('.search-result__summary').textContent).toEqual('No summary provided');
    });

    test('summary empty', () => {
        render(<SearchResultCard cardData={{}} isTopResult={false} summary="" url="#card" />);

        expect(document.querySelector('.search-result__summary').textContent).toEqual('No summary provided');
    });

    test('none empty summary', () => {
        const shortSummary = 'Short summary';
        const longSummary = 'This is a very long summary it should get truncated at some point';
        render(<SearchResultCard cardData={{}} isTopResult={false} summary={shortSummary} url="#card" />);

        expect(document.querySelector('.search-result__summary').textContent).toEqual(shortSummary);
    });

    test('long summary', () => {
        const longSummary = 'This is a very long summary it should get truncated at some point';
        render(<SearchResultCard cardData={{}} isTopResult={false} summary={longSummary} url="#card" />);

        // Long summary should get truncated
        expect(document.querySelector('.search-result__summary').textContent).toEqual(longSummary);
    });
});
