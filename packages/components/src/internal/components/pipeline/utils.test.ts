import { List } from 'immutable';

import { MenuSectionModel, ProductMenuModel } from '../navigation/model';

import { hasActivePipelineJob } from './utils';

describe('pipeline utils', () => {
    test('hasActiveJob', () => {
        const sampleSetItems = List<MenuSectionModel>([
            {
                id: 1,
                label: 'Sample Set 1',
            },
            {
                id: 2,
                label: 'Sample Set 2',
                hasActiveJob: true,
            },
        ]);

        const sections = List<MenuSectionModel>().asMutable();
        const samplesSection = MenuSectionModel.create({
            label: 'Sample Sets',
            url: undefined,
            items: sampleSetItems,
            key: 'samples',
        });
        sections.push(samplesSection);

        const emptyMenu = new ProductMenuModel({
            productIds: ['empty'],
        });

        const withActiveJobMenu = new ProductMenuModel({
            productIds: ['withJob'],
            isLoaded: true,
            isLoading: false,
            sections: sections.asImmutable(),
        });

        expect(hasActivePipelineJob(emptyMenu, 'sectionA', 'labelA')).toBeFalsy();
        expect(hasActivePipelineJob(withActiveJobMenu, 'assays', 'Sample Set 2')).toBeFalsy();
        expect(hasActivePipelineJob(withActiveJobMenu, 'samples', 'Assay 1')).toBeFalsy();
        expect(hasActivePipelineJob(withActiveJobMenu, 'samples', 'Sample Set 1')).toBeFalsy();
        expect(hasActivePipelineJob(withActiveJobMenu, 'samples', 'Sample Set 2')).toBeTruthy();
    });
});
