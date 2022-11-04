import React from 'react';

import { List } from 'immutable';

import { ReactWrapper } from 'enzyme';

import { MenuSectionModel, ProductMenuModel } from '../internal/components/navigation/model';
import { ASSAYS_KEY } from '../internal/app/constants';
import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';
import { mountWithAppServerContext } from '../internal/testHelpers';
import { AssayContextProvider } from '../internal/components/assay/withAssayModels';

import { TEST_ASSAY_STATE_MODEL } from '../test/data/constants';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { Tip } from '../internal/components/base/Tip';

import { AssayHeader } from './AssayHeader';

describe('AssayHeader', () => {
    const menuWithNoJobInProgress = new ProductMenuModel({
        productIds: ['testProductMenu'],
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>([
            MenuSectionModel.create({
                label: 'Assays',
                url: undefined,
                items: List<MenuSectionModel>([
                    {
                        id: 1,
                        label: 'GPAT 1',
                    },
                ]),
                itemLimit: 2,
                key: ASSAYS_KEY,
            }),
        ]),
    });

    const menuWithJobInProgress = new ProductMenuModel({
        productIds: ['testProductMenu'],
        isLoaded: true,
        isLoading: false,
        sections: List<MenuSectionModel>([
            MenuSectionModel.create({
                label: 'Assays',
                url: undefined,
                items: List<MenuSectionModel>([
                    {
                        id: 1,
                        label: 'GPAT 1',
                        hasActiveJob: true,
                    },
                ]),
                itemLimit: 2,
                key: ASSAYS_KEY,
            }),
        ]),
    });
    const testProtocol = AssayProtocolModel.create({ name: 'TestProtocol' });

    function validate(
        wrapper: ReactWrapper,
        title: string,
        subTitle: string,
        description: string,
        titleActiveIndicator = false,
        descriptionActiveIndicator = false
    ) {
        expect(wrapper.find(TemplateDownloadButton)).toHaveLength(1);
        const pageHeader = wrapper.find(PageDetailHeader);
        if (titleActiveIndicator) {
            expect(pageHeader.find(Tip)).toHaveLength(1);
            expect(pageHeader.find('.page-detail-header-title-padding').text()).toBe(title);
        } else {
            // this is important as jest goes haywire on the next line if the title prop is not a string
            if (title) expect(typeof pageHeader.prop('title')).toBe('string');

            expect(pageHeader.prop('title')).toBe(title);
        }
        expect(pageHeader.prop('subTitle')).toBe(subTitle);
        if (descriptionActiveIndicator) {
            expect(pageHeader.find(Tip)).toHaveLength(1);
            expect(pageHeader.find('.page-detail-header-title-padding').text()).toBe(description);
        } else {
            if (description) expect(typeof pageHeader.prop('description')).toBe('string');
            expect(pageHeader.prop('description')).toBe(description);
        }
    }

    test('no assayDefinition', () => {
        const wrapper = mountWithAppServerContext(
            <AssayContextProvider value={{ assayDefinition: undefined, assayProtocol: undefined }}>
                <AssayHeader menu={menuWithNoJobInProgress} />
            </AssayContextProvider>
        );

        validate(wrapper, undefined, undefined, undefined);
    });

    test('no active job, default title', () => {
        const wrapper = mountWithAppServerContext(
            <AssayContextProvider
                value={{
                    assayDefinition: TEST_ASSAY_STATE_MODEL.definitions[1],
                    assayProtocol: testProtocol,
                }}
            >
                <AssayHeader menu={menuWithNoJobInProgress} subTitle="Subtext" description="Description text" />
            </AssayContextProvider>
        );
        validate(wrapper, TEST_ASSAY_STATE_MODEL.definitions[1].name, 'Subtext', 'Description text');
    });

    test('no active job, custom title', () => {
        const wrapper = mountWithAppServerContext(
            <AssayContextProvider
                value={{
                    assayDefinition: TEST_ASSAY_STATE_MODEL.definitions[1],
                    assayProtocol: testProtocol,
                }}
            >
                <AssayHeader menu={menuWithNoJobInProgress} title="Customized" subTitle="Subtext" />
            </AssayContextProvider>
        );
        validate(wrapper, 'Customized', 'Subtext', undefined);
    });

    test('with active job', () => {
        const wrapper = mountWithAppServerContext(
            <AssayContextProvider
                value={{
                    assayDefinition: TEST_ASSAY_STATE_MODEL.definitions[1],
                    assayProtocol: testProtocol,
                }}
            >
                <AssayHeader menu={menuWithJobInProgress} />
            </AssayContextProvider>
        );

        validate(wrapper, TEST_ASSAY_STATE_MODEL.definitions[1].name, undefined, undefined, true);
    });

    test('active job, name as description', () => {
        const wrapper = mountWithAppServerContext(
            <AssayContextProvider
                value={{
                    assayDefinition: TEST_ASSAY_STATE_MODEL.definitions[1],
                    assayProtocol: testProtocol,
                }}
            >
                <AssayHeader
                    menu={menuWithJobInProgress}
                    title="Batch"
                    description={TEST_ASSAY_STATE_MODEL.definitions[1].name}
                />
            </AssayContextProvider>
        );

        validate(wrapper, 'Batch', undefined, TEST_ASSAY_STATE_MODEL.definitions[1].name, false, true);
    });
});
