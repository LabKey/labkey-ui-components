/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { __setController } from '@labkey/api';
import {
    BIOLOGICS_PRODUCT_ID,
    biologicsIsPrimaryApp,
    FREEZER_MANAGER_PRODUCT_ID, LIMS_PRODUCT_ID, limsIsPrimaryApp,
    SAMPLE_MANAGER_PRODUCT_ID, sampleManagerIsPrimaryApp
} from './products';

test('biologcisIsPrimaryApp', () => {
    __setController('project');
    expect(biologicsIsPrimaryApp({})).toBeFalsy();
    expect(biologicsIsPrimaryApp({ samplemanagement: {}, core: { primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID} })).toBeFalsy();
    expect(biologicsIsPrimaryApp({ inventory: {}, core: { primaryApplicationId: FREEZER_MANAGER_PRODUCT_ID} })).toBeFalsy();
    expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {}, core: { primaryApplicationId: BIOLOGICS_PRODUCT_ID} })).toBeTruthy();
    expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {}, core: { primaryApplicationId: BIOLOGICS_PRODUCT_ID} })).toBeTruthy();
});


test('limsIsPrimaryApp', () => {
    __setController('project');
    expect(limsIsPrimaryApp({})).toBe(false);
    expect(limsIsPrimaryApp({ inventory: {} })).toBeFalsy();
    expect(limsIsPrimaryApp({ samplemanagement: {}, inventory: {}, core: { primaryApplicationId: LIMS_PRODUCT_ID } })).toBeTruthy();
    expect(limsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {}, core: { primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID } })).toBeFalsy();
    expect(limsIsPrimaryApp({ samplemanagement: {}, core: { primaryApplicationId: LIMS_PRODUCT_ID } })).toBeTruthy();
});

test('sampleManagerIsPrimaryApp', () => {
    __setController('project');
    expect(sampleManagerIsPrimaryApp({})).toBeFalsy();
    expect(sampleManagerIsPrimaryApp({ inventory: {} })).toBeFalsy();
    expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, inventory: {}, core: { primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID} })).toBeTruthy();
    expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, inventory: {}, core: { primaryApplicationId: LIMS_PRODUCT_ID} })).toBeFalsy();
    expect(sampleManagerIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {}, core: { primaryApplicationId: BIOLOGICS_PRODUCT_ID} })).toBeFalsy();
    expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, core: { primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID} })).toBeTruthy();
});

