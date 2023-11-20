import React, { FC, ReactNode, memo } from 'react';
import { getServerContext } from '@labkey/api';

export const CHART_MEASURES_AND_DIMENSIONS_TOPIC = 'chartTrouble';
export const MISSING_VALUES_TOPIC = 'manageMissing';
export const PROPERTY_FIELDS_PHI_TOPIC = 'phiLevels';

export const PROPERTY_FIELDS_TOPIC = 'propertyFields';
export const FIELD_EDITOR_TOPIC = 'fieldEditor';
export const ADVANCED_FIELD_EDITOR_TOPIC = FIELD_EDITOR_TOPIC + '#advanced';
export const FIELD_EDITOR_SAMPLE_TYPES_TOPIC = PROPERTY_FIELDS_TOPIC + '#samp';
export const DATE_FORMATS_TOPIC = 'dateFormats#date';
export const NUMBER_FORMATS_TOPIC = 'dateFormats#number';
export const ONTOLOGY_LOOKUP_TOPIC = 'ontologyLookup';
export const ONTOLOGY_CONCEPT_TOPIC = 'ontologyConcept';

export const ASSAY_EDIT_PLATE_TEMPLATE_TOPIC = 'editPlateTemplate';
export const CONFIGURE_SCRIPTING_TOPIC = 'configureScripting';
export const PROGRAMMATIC_QC_TOPIC = 'programmaticQC';
export const DEFINE_ASSAY_SCHEMA_TOPIC = 'defineAssaySchema';
export const DELETE_ASSAY_RUNS_TOPIC = 'manageAssayData#deleteRun';
export const DEFINE_DATA_CLASS_TOPIC = 'createDataClass';
export const DATA_CLASS_NAME_EXPRESSION_TOPIC = 'dataClass#name';
export const DEFINE_SAMPLE_TYPE_TOPIC = 'createSampleSet';
export const DEFINE_LIST_TOPIC = 'createListOptions';
export const DEFINE_ISSUES_LIST_TOPIC = 'adminIssues';
export const DEFINE_DATASET_TOPIC = 'createDataset';
export const DATASET_PROPERTIES_TOPIC = 'datasetProperties#advanced';

export const MOVE_SAMPLES_TOPIC = 'viewSampleSets#move';
export const DELETE_SAMPLES_TOPIC = 'viewSampleSets#delete';
export const DERIVE_SAMPLES_TOPIC = 'deriveSamples';
export const DERIVE_SAMPLES_ALIAS_TOPIC = DERIVE_SAMPLES_TOPIC + '#alias';

export const DATACLASS_ALIAS_TOPIC = 'dataclassalias';

export const URL_ENCODING_TOPIC = 'urlEncoding';

export const SEARCH_SYNTAX_TOPIC = 'luceneSearch';
export const DATA_IMPORT_TOPIC = 'dataImport';

export const SAMPLE_ALIQUOT_FIELDS_TOPIC = 'createSampleType#ali';

export const LKS_SAMPLE_ALIQUOT_FIELDS_TOPIC = 'generateSamples#fields';

export const UNIQUE_IDS_TOPIC = 'uniqueStorageIds';

export const CUSTOM_VIEW = 'customViews';

const HELP_LINK_DEFAULT_URL = 'https://www.labkey.org/Documentation/wiki-page.view?';

// See HelpTopic.java Referrer enum
export enum HELP_LINK_REFERRER {
    DEV_MENU = 'devMenu',
    DOC_MENU = 'docMenu',
    ERROR_PAGE = 'errorPage',
    IN_PAGE = 'inPage',
    PRODUCT_MENU = 'productMenu',
}

export function getHelpLink(topic: string, referrer = HELP_LINK_REFERRER.IN_PAGE, useDefaultUrl = false): string {
    const prefix = getServerContext().helpLinkPrefix;
    if (useDefaultUrl) {
        return HELP_LINK_DEFAULT_URL + 'referrer=' + referrer + '&name=' + topic;
    } else if (prefix) {
        // putting referrer= at the end causes links that go to anchors in the page not to work.
        return prefix.replace('name=', 'referrer=' + referrer + '&name=' + topic);
    }
    return undefined;
}

interface HelpLinkProps {
    className?: string;
    referrer?: HELP_LINK_REFERRER;
    topic: string;
    useDefaultUrl?: boolean;
}

export const HelpLink: FC<HelpLinkProps> = props => {
    const { className, topic, referrer, children, useDefaultUrl } = props;

    return (
        <a
            target="_blank"
            href={getHelpLink(topic, referrer, useDefaultUrl)}
            className={className}
            rel="noopener noreferrer"
        >
            {children}
        </a>
    );
};

/**
 * @deprecated use <HelpLink>
 */
export function helpLinkNode(topic: string, text: ReactNode, className?: string): ReactNode {
    return (
        <HelpLink topic={topic} className={className}>
            {text}
        </HelpLink>
    );
}

interface JavaDocsLinkProps {
    urlSuffix: string;
}

export const JavaDocsLink: FC<JavaDocsLinkProps> = memo(props => {
    const { urlSuffix, children } = props;
    const { jdkJavaDocLinkPrefix } = getServerContext();

    return (
        <a target="_blank" href={jdkJavaDocLinkPrefix + urlSuffix} rel="noopener noreferrer">
            {children}
        </a>
    );
});
