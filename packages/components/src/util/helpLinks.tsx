import React from 'react';

export const CHART_MEASURES_AND_DIMENSIONS_TOPIC = "chartTrouble";
export const MISSING_VALUES_TOPIC = "manageMissing";
export const PROPERTY_FIELDS_PHI_TOPIC = "propertyFields#phi";
export const ADVANCED_PROPERTY_FIELDS_TOPIC =  "propertyFields#advanced";

export const FIELD_EDITOR_TOPIC = "fieldEditor";
export const ADVANCED_FIELD_EDITOR_TOPIC = FIELD_EDITOR_TOPIC + "#advanced";
export const FIELD_EDITOR_RANGE_VALIDATION_TOPIC = FIELD_EDITOR_TOPIC + "#range";
export const FIELD_EDITOR_REGEX_TOPIC = FIELD_EDITOR_TOPIC + "#regex";
export const FIELD_EDITOR_CONDITIONAL_FORMAT_TOPIC = FIELD_EDITOR_TOPIC + "r#conditional";
export const FIELD_EDITOR_SAMPLE_TYPES_TOPIC = FIELD_EDITOR_TOPIC + "#samp";
export const DATE_FORMATS_TOPIC = 'dateFormats#date';
export const NUMBER_FORMATS_TOPIC = 'dateFormats#number';

export const ASSAY_EDIT_PLATE_TEMPLATE_TOPIC = 'editPlateTemplate';
export const CONFIGURE_SCRIPTING_TOPIC =  "configureScripting";
export const PROGRAMMATIC_QC_TOPIC = "programmaticQC";
export const DEFINE_ASSAY_SCHEMA_TOPIC = "defineAssaySchema";

export const VIEW_SAMPLE_SETS_TOPIC = "viewSampleSets";
export const DERIVE_SAMPLES_TOPIC = 'deriveSamples#alias';

export const URL_ENCODING_TOPIC = 'urlEncoding';

export const SEARCH_SYNTAX_TOPIC = "luceneSearch";

export function getHelpLink(topic: string) {
    return LABKEY.helpLinkPrefix + topic;
}

export function helpLinkNode(topic: string, text: React.ReactNode, className?: string): React.ReactNode {
    return (
        <a target="_blank" href={getHelpLink(topic)} className={className}>{text}</a>
    );
}
