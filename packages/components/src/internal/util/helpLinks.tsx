import React, { ReactNode } from 'react';
import { getServerContext } from '@labkey/api';

export const CHART_MEASURES_AND_DIMENSIONS_TOPIC = 'chartTrouble';
export const MISSING_VALUES_TOPIC = 'manageMissing';
export const PROPERTY_FIELDS_PHI_TOPIC = 'phiLevels';

export const FIELD_EDITOR_TOPIC = 'fieldEditor';
export const ADVANCED_FIELD_EDITOR_TOPIC = FIELD_EDITOR_TOPIC + '#advanced';
export const FIELD_EDITOR_RANGE_VALIDATION_TOPIC = FIELD_EDITOR_TOPIC + '#range';
export const FIELD_EDITOR_REGEX_TOPIC = FIELD_EDITOR_TOPIC + '#regex';
export const FIELD_EDITOR_CONDITIONAL_FORMAT_TOPIC = FIELD_EDITOR_TOPIC + '#conditional';
export const FIELD_EDITOR_SAMPLE_TYPES_TOPIC = FIELD_EDITOR_TOPIC + '#samp';
export const DATE_FORMATS_TOPIC = 'dateFormats#date';
export const NUMBER_FORMATS_TOPIC = 'dateFormats#number';
export const ONTOLOGY_LOOKUP_TOPIC = 'ontologyLookup';
export const ONTOLOGY_CONCEPT_TOPIC = 'ontologyConcept';

export const ASSAY_EDIT_PLATE_TEMPLATE_TOPIC = 'editPlateTemplate';
export const CONFIGURE_SCRIPTING_TOPIC = 'configureScripting';
export const PROGRAMMATIC_QC_TOPIC = 'programmaticQC';
export const DEFINE_ASSAY_SCHEMA_TOPIC = 'defineAssaySchema';
export const DEFINE_DATA_CLASS_TOPIC = 'createDataClass';
export const DATA_CLASS_NAME_EXPRESSION_TOPIC = 'dataClass#name';
export const DEFINE_SAMPLE_TYPE_TOPIC = 'createSampleSet';
export const DEFINE_LIST_TOPIC = 'createListOptions';
export const DEFINE_ISSUES_LIST_TOPIC = 'adminIssues';
export const DEFINE_DATASET_TOPIC = 'createDataset';
export const DATASET_PROPERTIES_TOPIC = 'datasetProperties#advanced';

export const DELETE_SAMPLES_TOPIC = 'viewSampleSets#delete';
export const DERIVE_SAMPLES_TOPIC = 'deriveSamples';
export const DERIVE_SAMPLES_ALIAS_TOPIC = DERIVE_SAMPLES_TOPIC + '#alias';

export const URL_ENCODING_TOPIC = 'urlEncoding';

export const SEARCH_SYNTAX_TOPIC = 'luceneSearch';
export const DATA_IMPORT_TOPIC = 'dataImport';

export const SAMPLE_ALIQUOT_TOPIC = 'aliquot';

export const UNIQUE_IDS_TOPIC = 'uniqueStorageIds';

export function getHelpLink(topic: string): string {
    return getServerContext().helpLinkPrefix + topic;
}

// TODO: This should be converted into a React.FC with arguments switched to props
export function helpLinkNode(topic: string, text: ReactNode, className?: string): ReactNode {
    return (
        <a target="_blank" href={getHelpLink(topic)} className={className}>
            {text}
        </a>
    );
}
