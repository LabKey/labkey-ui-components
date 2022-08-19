import {ActionURL, Ajax, Utils} from "@labkey/api";

import { SAMPLE_MANAGER_APP_PROPERTIES } from "../../app/constants";
import {TimelineEventModel} from "../auditlog/models";

export function exportTimelineGrid(
    sampleId: number,
    recentFirst = false,
    sampleEventIds: number[],
    assayEventIds: number[]
): void {
    const url = ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'ExportTimelineGrid', undefined, { returnUrl: false });
    const form = new FormData();
    form.append('sampleId', sampleId.toString(10));
    form.append('recentFirst', recentFirst.toString());
    sampleEventIds?.forEach(id => form.append('sampleEventIds', id.toString(10)));
    assayEventIds?.forEach(id => form.append('assayEventIds', id.toString(10)));
    Ajax.request({
        downloadFile: true,
        form,
        method: 'POST',
        url: url.toString(),
    });
}

// TODO move to api so can use in jest
// optional timezone param used for teamcity jest test only
export function getTimelineEvents(sampleId : number, timezone?: string) : Promise<TimelineEventModel[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getTimeline.api'),
            method: 'GET',
            params: {sampleId},
            success: Utils.getCallbackWrapper((response) => {
                if (response.success) {
                    let events : TimelineEventModel[] = [];
                    if (response.events) {
                        (response.events as []).forEach((event) => events.push(TimelineEventModel.create(event, timezone)));
                    }
                    resolve(events);
                }
                else {
                    console.error("Sample timeline is empty. Timeline audit may have been disabled.");
                    reject("There was a problem retrieving the sample timeline. Timeline audit may have been disabled.");
                }
            }),
            failure: Utils.getCallbackWrapper((error) => {
                console.error("Problem retrieving the sample timeline", error);
                reject("There was a problem retrieving the sample timeline.");
            })
        });
    });
}
