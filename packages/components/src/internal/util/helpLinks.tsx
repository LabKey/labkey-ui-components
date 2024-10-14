import React, { FC, ReactNode, memo, PropsWithChildren } from 'react';
import { getServerContext } from '@labkey/api';

import { getPrimaryAppProperties } from '../app/utils';
import { useServerContext } from '../components/base/ServerContext';
import { LabelHelpTip } from '../components/base/LabelHelpTip';

export const CHART_MEASURES_AND_DIMENSIONS_TOPIC = 'chartTrouble';
export const MISSING_VALUES_TOPIC = 'manageMissing';
export const PROPERTY_FIELDS_PHI_TOPIC = 'phiLevels';

export const PROPERTY_FIELDS_TOPIC = 'propertyFields';
export const FIELD_EDITOR_TOPIC = 'fieldEditor';
export const ADVANCED_FIELD_EDITOR_TOPIC = FIELD_EDITOR_TOPIC + '#advanced';
export const FIELD_EDITOR_SAMPLE_TYPES_TOPIC = PROPERTY_FIELDS_TOPIC + '#samp';
export const FIELD_EDITOR_CALC_COLS_TOPIC = PROPERTY_FIELDS_TOPIC + '#calc';
export const DATE_FORMATS_TOPIC = 'dateFormats#date';
export const NUMBER_FORMATS_TOPIC = 'dateFormats#number';
export const ONTOLOGY_LOOKUP_TOPIC = 'ontologyLookup';
export const ONTOLOGY_CONCEPT_TOPIC = 'ontologyConcept';
export const LABKEY_SQL_TOPIC = 'labkeysql';

export const ASSAY_EDIT_PLATE_TEMPLATE_TOPIC = 'editPlateTemplate';
export const CONFIGURE_SCRIPTING_TOPIC = 'configureScripting';
export const PROGRAMMATIC_QC_TOPIC = 'programmaticQC';
export const RUN_PROPERTIES_TOPIC = 'runProperties';
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

export const SAMPLE_IMPORT_TOPIC = 'importSamples';

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

export function getHelpLink(
    topic: string,
    referrer = HELP_LINK_REFERRER.IN_PAGE,
    useDefaultUrl = false,
    helpLinkPrefix?: string
): string {
    const prefix = helpLinkPrefix ?? getServerContext().helpLinkPrefix;
    if (useDefaultUrl) {
        return HELP_LINK_DEFAULT_URL + 'referrer=' + referrer + '&name=' + topic;
    } else if (prefix) {
        // putting referrer= at the end causes links that go to anchors in the page not to work.
        return prefix.replace('name=', 'referrer=' + referrer + '&name=' + topic);
    }
    return undefined;
}

interface HelpLinkProps extends PropsWithChildren {
    className?: string;
    referrer?: HELP_LINK_REFERRER;
    topic: string;
    useBaseAppUrl?: boolean;
    useDefaultUrl?: boolean;
}

export const HelpLink: FC<HelpLinkProps> = props => {
    const { moduleContext } = useServerContext();
    const { useBaseAppUrl, className, topic, referrer, children, useDefaultUrl } = props;

    return (
        <a
            target="_blank"
            href={getHelpLink(
                topic,
                referrer,
                useDefaultUrl,
                useBaseAppUrl ? getPrimaryAppProperties(moduleContext)?.baseProductHelpLinkPrefix : undefined
            )}
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

interface JavaDocsLinkProps extends PropsWithChildren {
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

const DATETIME_HELP_CONTENT = (
    <>
        <p>Examples for August 14, 2024 01:45 PM:</p>
        <table className="table-bordered margin-bottom help-table">
            <thead>
                <tr>
                    <th>Format String</th>
                    <th>Display Result</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>yyyy-MM-dd HH:mm</td>
                    <td>2024-08-14 13:45</td>
                </tr>
                <tr>
                    <td>yyyy-MMM-dd hh:mm a</td>
                    <td>2024-Aug-14 01:45 PM</td>
                </tr>
                <tr>
                    <td>dd-MMM-yyyy</td>
                    <td>14-Aug-2024</td>
                </tr>
                <tr>
                    <td>dd-MMM-yy</td>
                    <td>14-Aug-24</td>
                </tr>
            </tbody>
        </table>
    </>
);
const DATE_HELP_CONTENT = (
    <>
        <p>Examples for August 14, 2024:</p>
        <table className="table-bordered margin-bottom help-table">
            <thead>
                <tr>
                    <th>Format String</th>
                    <th>Display Result</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>yyyy-MM-dd</td>
                    <td>2024-08-14</td>
                </tr>
                <tr>
                    <td>yyyy-MMM-dd</td>
                    <td>2024-Aug-14</td>
                </tr>
                <tr>
                    <td>dd-MMM-yyyy</td>
                    <td>14-Aug-2024</td>
                </tr>
                <tr>
                    <td>dd-MMM-yy</td>
                    <td>14-Aug-24</td>
                </tr>
            </tbody>
        </table>
    </>
);
const TIME_HELP_CONTENT = (
    <>
        <p>Examples for 01:45:15 PM:</p>
        <table className="table-bordered margin-bottom help-table">
            <thead>
                <tr>
                    <th>Format String</th>
                    <th>Display Result</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>HH:mm:ss</td>
                    <td>13:45:15</td>
                </tr>
                <tr>
                    <td>HH:mm</td>
                    <td>13:45</td>
                </tr>
                <tr>
                    <td>HH:mm:ss.SSS</td>
                    <td>13:45:15.000</td>
                </tr>
                <tr>
                    <td>hh:mm a</td>
                    <td>01:45 PM</td>
                </tr>
            </tbody>
        </table>
    </>
);

export const getFolderDateTimeHelpBody = (isDate: boolean = true, isTime: boolean = true): ReactNode => {
    const content = isDate && isTime ? DATETIME_HELP_CONTENT : isDate ? DATE_HELP_CONTENT : TIME_HELP_CONTENT;
    const contentLabel = isDate && isTime ? 'date or time' : isDate ? 'date' : 'time';
    return (
        <>
            <p>
                To control how a {contentLabel} value is displayed, provide a string format compatible with the Java{' '}
                <JavaDocsLink urlSuffix="java/text/SimpleDateFormat.html">SimpleDateFormat</JavaDocsLink> class.
            </p>
            {content}
            <p>
                Learn more about using <HelpLink topic={DATE_FORMATS_TOPIC}>Date and Time formats</HelpLink> in LabKey.
            </p>
        </>
    );
};

export const getFolderDateTimeHelp = (isDate: boolean = true, isTime: boolean = true): ReactNode => {
    const titleLabel = isDate && isTime ? 'Date-time' : isDate ? 'Date' : 'Time';
    return <LabelHelpTip title={titleLabel + ' format'}>{getFolderDateTimeHelpBody(isDate, isTime)}</LabelHelpTip>;
};
