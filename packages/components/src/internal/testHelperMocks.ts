import { Map } from 'immutable';
import mock, { proxy } from 'xhr-mock';

import {
    initDomainPropertiesMocks,
    initLineageMocks,
    initPipelineStatusDetailsMocks,
    initQueryGridMocks,
    initUserPropsMocks,
} from '../stories/mock';
import { initUnitTests } from "./testHelpers";

/**
 * Use this method in beforeAll() for your jest tests and you'll have full access
 * to all of the same mock API responses we use in storybook.
 */
export function initUnitTestMocks(
    metadata?: Map<string, any>,
    columnRenderers?: Map<string, any>,
    includePipeline?: boolean
): void {
    window['__react-beautiful-dnd-disable-dev-warnings'] = true;
    initUnitTests(metadata, columnRenderers);
    mock.setup();
    initQueryGridMocks();
    initDomainPropertiesMocks();
    initLineageMocks();
    initUserPropsMocks();
    if (includePipeline) {
        initPipelineStatusDetailsMocks();
    }
    mock.use(proxy);
}
