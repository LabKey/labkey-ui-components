import { useEffect, useState } from 'react';

import { DomainField } from '../models';
import { selectRows } from '../../../query/selectRows';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { caseInsensitive } from '../../../util/utils';

import { VISIT_TIMEPOINT_TYPE } from './constants';

export function allowAsManagedField(field: DomainField): boolean {
    return (
        field &&
        field.dataType &&
        (field.dataType.isString() || field.dataType.isNumeric() || field.dataType.isLookup())
    );
}

export function getStudyTimepointLabel(timepointType: string): string {
    return timepointType === VISIT_TIMEPOINT_TYPE ? 'Visits' : 'Timepoints';
}

export type StudyProperties = {
    SubjectColumnName: string;
    SubjectNounPlural: string;
    SubjectNounSingular: string;
    TimepointType: string;
};

// Issue 50822: query for study properties instead of relying on moduleContext to include them
export const useStudyPropertiesContext = (): StudyProperties => {
    const [state, setState] = useState<StudyProperties>();
    useEffect(() => {
        (async () => {
            const response = await selectRows({
                schemaQuery: new SchemaQuery('study', 'StudyProperties'),
                columns: ['SubjectColumnName', 'SubjectNounPlural', 'SubjectNounSingular', 'TimepointType'],
            });
            const row = response.rows?.[0] || {};
            setState({
                SubjectColumnName: caseInsensitive(row, 'SubjectColumnName')?.value,
                SubjectNounPlural: caseInsensitive(row, 'SubjectNounPlural')?.value,
                SubjectNounSingular: caseInsensitive(row, 'SubjectNounSingular')?.value,
                TimepointType: caseInsensitive(row, 'TimepointType')?.value,
            });
        })();
    }, []);
    return state;
};
