import { immerable, produce } from 'immer';

export interface PipelineLogEntry {
    dateTime: string;
    level: string;
    lines: string;
    multiline: boolean;
    stackTrace: boolean;
}

export class PipelineStatusDetailModel {
    [immerable] = true;

    readonly rowId: number;
    readonly created: string;
    readonly status: string;
    readonly description: string;
    readonly info: string;
    readonly active: boolean;
    readonly fetchCount: number;
    readonly nextOffset: number;
    readonly logEntries: PipelineLogEntry[];

    readonly isLoaded: boolean;
    readonly isLoading: boolean;

    constructor(values?: Partial<PipelineStatusDetailModel>) {
        Object.assign(this, { isLoaded: false, isLoading: false, fetchCount: 1, nextOffset: 0 }, values);
    }

    static fromJSON(data?: any) {
        return new PipelineStatusDetailModel({
            rowId: data['rowId'],
            created: data['created'],
            status: data['status'],
            description: data['description'],
            info: data['info'],
            active: data['active'],
            fetchCount: data['fetchCount'],
            nextOffset: data['nextOffset'],
            logEntries: data['log'] ? data['log']['records'] : [],
            isLoaded: true,
            isLoading: false,
        });
    }

    mutate(props: Partial<PipelineStatusDetailModel>): PipelineStatusDetailModel {
        return produce<PipelineStatusDetailModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}
