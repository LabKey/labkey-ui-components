import React from 'react';
import { AssayHeader } from './AssayHeader';
import { MenuSectionModel, ProductMenuModel } from '../internal/components/navigation/model';
import { List } from 'immutable';
import { ASSAYS_KEY } from '../internal/app/constants';
import { TemplateDownloadButton } from '../public/files/TemplateDownloadButton';
import { mountWithServerContext } from '../internal/testHelpers';

describe("AssayHeader", () => {
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
                        label: 'Assay Type 1',
                    },
                ]),
                itemLimit: 2,
                key: ASSAYS_KEY,
            }),
        ]),
    });

   test("no assayDefinition", () => {
       const wrapper = mountWithServerContext(
           <AssayHeader menu={menuWithNoJobInProgress} navigate={jest.fn()} menuInit={jest.fn()}/>
       );

       expect(wrapper.find(TemplateDownloadButton)).toHaveLength(1);
   });


   test("with active job", () => {

   });

   test("with staticTitle", () => {

   });

   test("with runId", () => {

   });
});
