import { Map } from 'immutable';
import { LabKey } from '@labkey/api';
import mock, { proxy } from "xhr-mock";
import { initQueryGridState } from './global';
import { initQueryGridMocks, initLineageMocks, initUserPropsMocks } from './stories/mock';

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(metadata?: Map<string, any>, columnRenderers?: Map<string, any>) {
    initMockServerContext({
        container: {
            formats: {
                dateFormat: 'yyyy-MM-dd',
                dateTimeFormat: 'yyyy-MM-dd HH:mm',
                numberFormat: null,
            },
            path: 'testContainer',
        },
        contextPath: 'labkey',
    });

    initQueryGridState(metadata, columnRenderers);

    mock.setup();
    initQueryGridMocks();
    initLineageMocks();
    initUserPropsMocks();
    mock.use(proxy);
}

declare let LABKEY: LabKey;

export function initMockServerContext(context: Partial<LabKey>): void {
    Object.assign(LABKEY, context);
}