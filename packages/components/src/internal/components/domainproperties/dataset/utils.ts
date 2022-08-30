import { getServerContext } from '@labkey/api';

import { DomainField } from '../models';

export function allowAsManagedField(field: DomainField): boolean {
    return (
        field &&
        field.dataType &&
        (field.dataType.isString() || field.dataType.isNumeric() || field.dataType.isLookup())
    );
}

export function getStudySubjectProp(prop: string): string {
    return getServerContext().moduleContext.study.subject[prop];
}

export function getStudyTimepointLabel(): string {
    return getServerContext().moduleContext.study.timepointType === 'VISIT' ? 'Visits' : 'Timepoints';
}
