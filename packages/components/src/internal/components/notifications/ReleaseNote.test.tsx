import React from 'react';
import {
    TEST_LIMS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT
} from '../../productFixtures';
import { DISMISSED_STORAGE_PREFIX, ReleaseNoteImpl } from './ReleaseNote';
import userEvent from '@testing-library/user-event';
import { FREEZER_MANAGER_APP_PROPERTIES } from '../../app/constants';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

beforeEach(() => {
    LABKEY.versionString = "24.1";

});

describe('ReleaseNote', () => {

    function dismissButton(): HTMLButtonElement {
        return document.querySelector<HTMLButtonElement>('.fa-times-circle');
    }

    function hasReleaseNote(): boolean {
        return document.querySelectorAll('.alert-success').length > 0;

    }

    function getReleaseNoteMsg(): string {
        return document.getElementsByClassName('notification-item')[0].innerHTML;
    }

    test('LKSM', () => {
        const version = "24.1";

        localStorage.removeItem(DISMISSED_STORAGE_PREFIX + "Sample Manager" + version);

        renderWithAppContext(
            <ReleaseNoteImpl location={null} />,
            {
                serverContext: {
                    versionString: version,
                    moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                },
                appContext: {},
            }
        );

        expect(hasReleaseNote()).toBe(true);
        expect(getReleaseNoteMsg()).toBe( "Sample Manager 24.1 is here!&nbsp;<span><a target=\"_blank\" href=\"https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&amp;name=releaseNotes\" rel=\"noopener noreferrer\">See what's new.</a></span><i style=\"float: right;\" class=\"fa fa-times-circle pointer\"></i>");

        userEvent.click(dismissButton());

        expect(hasReleaseNote()).toBe(false);

    });

    test('LKB', () => {
        const version = "24.1-snap";

        localStorage.removeItem(DISMISSED_STORAGE_PREFIX + "Biologics" + version);

        renderWithAppContext(
            <ReleaseNoteImpl location={null} />,
            {
                serverContext: {
                    versionString: version,
                    moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
                },
                appContext: {},
            }
        );

        expect(hasReleaseNote()).toBe(true);
        expect(getReleaseNoteMsg()).toBe( "Biologics 24.1-snap is here!&nbsp;<span><a target=\"_blank\" href=\"https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&amp;name=bioReleaseNotes\" rel=\"noopener noreferrer\">See what's new.</a></span><i style=\"float: right;\" class=\"fa fa-times-circle pointer\"></i>");

        userEvent.click(dismissButton());

        expect(hasReleaseNote()).toBe(false);

    });

    test('FM', () => {
        const version = "24.1";

        localStorage.removeItem(DISMISSED_STORAGE_PREFIX + "Freezer Manager" + version);

        renderWithAppContext(
            <ReleaseNoteImpl location={null} />,
            {
                serverContext: {
                    versionString: version,
                    moduleContext: {
                        inventory: {
                            productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
                        }
                    },
                },
                appContext: {}
            }
        );

        expect(hasReleaseNote()).toBe(false);
    });

});
