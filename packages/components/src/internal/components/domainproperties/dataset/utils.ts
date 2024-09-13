import { useEffect, useState } from 'react';

import { DomainField, SystemField } from '../models';
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

export const getDatasetSystemFields = (studyProperties: StudyProperties): SystemField[] => {
    const isVisitBased = studyProperties.TimepointType === VISIT_TIMEPOINT_TYPE;

    const systemFields = [
        {
            Name: studyProperties.SubjectColumnName,
            Label: studyProperties.SubjectColumnName,
            DataType: 'Text',
            Required: true,
            Description: 'Subject identifier',
            Disableble: false,
        },
        {
            Name: 'SequenceNum',
            Label: 'Sequence Num',
            DataType: 'Decimal (floating point)',
            Required: isVisitBased,
            Description: '',
            Disableble: false,
        },
    ];

    if (!isVisitBased) {
        systemFields.push({
            Name: 'date',
            Label: 'Date',
            DataType: 'DateTime',
            Required: true,
            Description: 'The day of the visit. Primarily used in date-based studies.',
            Disableble: false,
        });
        systemFields.push({
            Name: 'Day',
            Label: 'Day',
            DataType: 'Integer',
            Required: false,
            Description: 'The day of the visit. Primarily used in date-based studies.',
            Disableble: false,
        });
    }

    systemFields.push({
        Name: 'DatasetId',
        Label: 'Dataset Id',
        DataType: 'Integer',
        Required: true,
        Description: '',
        Disableble: false,
    });

    return systemFields;
};
