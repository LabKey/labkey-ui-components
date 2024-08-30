import React from 'react';

import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { CreatedModified } from './CreatedModified';

describe('CreatedModified', () => {
    test('with created row', () => {
        // Arrange
        const createdRow = {
            Created: {
                formattedValue: '2019-05-15 19:45',
                value: '2019-05-15 19:45:40.593',
            },
            CreatedBy: {
                displayValue: 'username',
                url: '#/q/core/siteusers/' + JEST_SITE_ADMIN_USER_ID,
                value: 1001,
            },
        };

        // Act
        renderWithAppContext(<CreatedModified row={createdRow} useServerDate={false} />);

        // Assert
        const element = document.querySelector('.createdmodified');
        expect(element.textContent).toContain('Created ');

        const title = element.getAttribute('title');
        expect(title).toContain('Created by: username');
        expect(title.indexOf('Modified')).toBe(-1);
    });

    test('with modified row', () => {
        // Arrange
        const createdModifiedRow = {
            Created: {
                formattedValue: '2019-05-15 19:45',
                value: '2019-05-15 19:45:40.593',
            },
            CreatedBy: {
                displayValue: 'username',
                url: '#/q/core/siteusers/1001',
                value: 1001,
            },
            Modified: {
                formattedValue: '2019-05-16 19:45',
                value: '2019-05-16 19:45:40.593',
            },
            ModifiedBy: {
                displayValue: 'username2',
                url: '#/q/core/siteusers/1002',
                value: 1002,
            },
        };

        // Act
        renderWithAppContext(<CreatedModified row={createdModifiedRow} useServerDate={false} />);

        // Assert
        const element = document.querySelector('.createdmodified');
        expect(element.textContent).toContain('Modified ');

        const title = element.getAttribute('title');
        expect(title).toContain('Created by: username');
        expect(title).toContain('Modified by: username2');
    });

    test('with badly formatted row', () => {
        // Arrange
        const createdModifiedRow = {
            Created: {
                formattedValue: '2019-05-15 19:45',
                value: 'Not a good date value',
            },
            CreatedBy: {
                displayValue: 'username',
                url: '#/q/core/siteusers/1001',
                value: 1001,
            },
            Modified: {
                formattedValue: '2019-05-16 19:45',
                value: 'Not a good date value',
            },
            ModifiedBy: {
                displayValue: 'username2',
                url: '#/q/core/siteusers/1002',
                value: 1002,
            },
        };

        // Act
        renderWithAppContext(<CreatedModified row={createdModifiedRow} useServerDate={false} />);

        // Assert
        const element = document.querySelector('.createdmodified');
        expect(element.textContent).not.toContain('Modified');
    });
});
