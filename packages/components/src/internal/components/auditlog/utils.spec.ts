/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ReactElement } from 'react';
import { List, Map } from 'immutable';

import { ASSAYS_KEY, SAMPLES_KEY, USER_KEY, WORKFLOW_KEY } from '../../app/constants';

import { getAuditQueries, getEventDataValueDisplay, getTimelineEntityUrl } from './utils';

describe('utils', () => {
    test('getAuditQueries', () => {
        LABKEY.moduleContext = {
            samplemanagement: {},
            inventory: {},
        };
        let auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(13);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(5);

        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(12);
        expect(auditQueries.findIndex(entry => entry.value === 'inventoryauditevent')).toBe(-1);

        LABKEY.moduleContext = {};
        auditQueries = getAuditQueries();
        expect(auditQueries.length).toBe(0);
    });
    test('getEventDataValueDisplay', () => {
        expect(getEventDataValueDisplay(undefined)).toEqual(null);
        expect(getEventDataValueDisplay('asAString')).toEqual('asAString');
        expect(getEventDataValueDisplay(15)).toEqual(15);
        expect(getEventDataValueDisplay(true)).toEqual('true');

        const data: any = { value: 'RawValue' };

        // Respects "value"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.value);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.value);

        data.displayValue = 'DefaultValue';

        // Respects "displayValue"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.displayValue);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.displayValue);

        data.formattedValue = 'NiceFormatValue';

        // Respects "formattedValue"
        expect(getEventDataValueDisplay(Map(data), false)).toEqual(data.formattedValue);
        expect(getEventDataValueDisplay(data, false)).toEqual(data.formattedValue);

        // showLink -- without a URL
        expect(getEventDataValueDisplay(Map(data), true)).toEqual(data.formattedValue);
        expect(getEventDataValueDisplay(data, true)).toEqual(data.formattedValue);

        data.urlType = SAMPLES_KEY;

        // showLink -- without a URL
        let node = getEventDataValueDisplay(data, true) as ReactElement;
        expect(node.type).toEqual('a');
        expect(node.props).toEqual({
            children: data.formattedValue,
            href: getTimelineEntityUrl(data).toHref(),
        });

        data.url = '#/some/location';

        // showLink -- with a URL
        node = getEventDataValueDisplay(Map(data), true) as ReactElement;
        expect(node.type).toEqual('a');
        expect(node.props).toEqual({ children: data.formattedValue, href: data.url });
    });
    test('getTimelineEntityUrl', () => {
        expect(getTimelineEntityUrl(undefined)).toEqual(undefined);
        expect(getTimelineEntityUrl({})).toEqual(undefined);
        expect(getTimelineEntityUrl({ urlType: SAMPLES_KEY, value: 42 }).toHref()).toEqual(`#/rd/${SAMPLES_KEY}/42`);
        expect(getTimelineEntityUrl({ urlType: WORKFLOW_KEY, value: 77 }).toHref()).toEqual(`#/${WORKFLOW_KEY}/77`);
        expect(getTimelineEntityUrl({ urlType: 'workflowTemplate', value: 101 }).toHref()).toEqual(
            `#/${WORKFLOW_KEY}/template/101`
        );
        expect(getTimelineEntityUrl({ urlType: USER_KEY, value: 24 }).toHref()).toEqual('#/q/core/siteusers/24');
        expect(getTimelineEntityUrl({ urlType: 'assayRun', value: ['myassay', 13] }).toHref()).toEqual(
            `#/${ASSAYS_KEY}/general/myassay/runs/13`
        );

        expect(getTimelineEntityUrl(Map().toJS())).toEqual(undefined);
        expect(
            getTimelineEntityUrl(Map({ urlType: 'assayRun', value: List(['myassay', 44]) }).toJS()).toHref()
        ).toEqual(`#/${ASSAYS_KEY}/general/myassay/runs/44`);

        expect(getTimelineEntityUrl({ urlType: 'inventoryLocation', value: ['freezer1', 101] }).toHref()).toEqual(
            '#/freezers/freezer1/storageView?locationId=101'
        );
        expect(getTimelineEntityUrl({ urlType: 'inventoryBox', value: 101 }).toHref()).toEqual('#/boxes/101');
    });
});
