import { immerable, produce } from 'immer';

import { flattenValuesFromRow } from '../../../public/QueryModel/QueryModel';

export interface BarTenderConfigurationModel {
    defaultLabel?: number;
    serviceURL?: string;
}

export class BarTenderConfiguration implements BarTenderConfigurationModel {
    [immerable] = true;

    readonly serviceURL: string;
    readonly defaultLabel: number;

    constructor(values?: Partial<BarTenderConfigurationModel>) {
        Object.assign(this, values);
    }

    static create(config?: { defaultLabel: string; serviceURL: string }): BarTenderConfiguration {
        return new BarTenderConfiguration({
            serviceURL: config.serviceURL,
            defaultLabel: parseInt(config.defaultLabel, 10),
        });
    }

    isConfigured(): boolean {
        return this.serviceURL !== undefined && this.serviceURL !== null && this.serviceURL.trim() !== '';
    }
}

enum BarTenderResponseStatus {
    Faulted = 'Faulted',
    RanToCompletion = 'RanToCompletion',
}

/*
BarTender Web Service responses settings configured as:
ContentType-Type = application/json
Source = Action Summary

Example response bodies:
Success:
    {
        "Version": "1.0",
        "Status": "RanToCompletion",
        "WaitStatus": "Completed",
        "Validated": true,
        "Messages": []
    }

Label Template not found:
    {
        "Version": "1.0",
        "Status": "Faulted",
        "WaitStatus": "Faulted",
        "Validated": true,
        "Messages": [
            {
                "ActionName": null,
                "Level": 4,
                "Text": "Failed to run action 'Print BTXML Script'. Details: BarTender document 'C:\\BarTenderDocs\\notFoundTest' does not exist or can not be accessed."
            }
        ]
    }
 */
export interface BarTenderResponseModel {
    Messages: BarTenderMessages[];
    Status: string;
    Version: string;
    WaitStatus: string;
}

export interface BarTenderMessages {
    ActionName?: string;
    Level: number;
    Text?: string;
}

export class BarTenderResponse implements BarTenderResponseModel {
    [immerable] = true;
    readonly Messages: BarTenderMessages[];
    readonly Status: string;
    readonly Version: string;
    readonly WaitStatus: string;

    private static LABEL_NOT_FOUND_MSG = 'does not exist or can not be accessed';

    constructor(values?: Partial<BarTenderConfigurationModel>) {
        Object.assign(this, values);
    }

    ranToCompletion(): boolean {
        return this.Status === BarTenderResponseStatus.RanToCompletion;
    }

    faulted(): boolean {
        return this.Status === BarTenderResponseStatus.Faulted;
    }

    getFaultMessage(): string {
        return this.Messages.map(msg => msg.Text).join('\n');
    }

    isLabelUnavailableError(): boolean {
        // best we can do is to look in the error message as this doesn't have a specific property to indicate this error
        const message = this.getFaultMessage();
        return message.indexOf(BarTenderResponse.LABEL_NOT_FOUND_MSG) >= 0;
    }
}

// LabKey model for Label Template
export class LabelTemplate {
    [immerable] = true;

    readonly description: string;
    readonly rowId: number;
    readonly name: string;
    readonly path: string;
    readonly container: string;

    constructor(values: { [k: string]: any }) {
        Object.assign(this, values);
    }

    set(prop: string, val: any): LabelTemplate {
        return this.mutate({ [prop]: val });
    }

    mutate(props: Partial<LabelTemplate>): LabelTemplate {
        return produce<LabelTemplate>(this, draft => {
            Object.assign(draft, props);
        });
    }

    static create(row?: { [k: string]: { value: any } }): LabelTemplate {
        const fieldValues = flattenValuesFromRow(row, Object.keys(row));

        return new LabelTemplate({
            path: fieldValues.path,
            rowId: fieldValues.rowId,
            name: fieldValues.name,
            description: fieldValues.description,
            container: fieldValues.container,
        });
    }
}
