import { immerable } from 'immer';

export interface BarTenderConfigurationModel {
    defaultLabel?: string;
    serviceURL?: string;
}

export class BarTenderConfiguration implements BarTenderConfigurationModel {
    [immerable] = true;

    readonly serviceURL: string;
    readonly defaultLabel: string;

    constructor(values?: Partial<BarTenderConfigurationModel>) {
        Object.assign(this, values);
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

    isLabelUnavailableError(label: string): boolean {
        // best we can do is to look in the error message as this doesn't have a specific property to indicate this error
        const message = this.getFaultMessage();
        return message.indexOf(BarTenderResponse.LABEL_NOT_FOUND_MSG) >= 0;
    }
}
