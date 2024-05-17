import { fromJS, List, Map, OrderedMap, Record as ImmutableRecord } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../public/QueryColumn';

import { SchemaQuery } from '../public/SchemaQuery';

import { AssayUploadTabs } from './constants';

import { AppURL, createProductUrlFromParts } from './url/AppURL';

import { SCHEMAS } from './schemas';
import { WHERE_FILTER_TYPE } from './url/WhereFilterType';

export enum AssayDomainTypes {
    BATCH = 'Batch',
    RESULT = 'Result',
    RUN = 'Run',
}

export enum AssayLink {
    BATCHES = 'batches',
    BEGIN = 'begin',
    DESIGN_COPY = 'designCopy',
    DESIGN_EDIT = 'designEdit',
    IMPORT = 'import',
    RESULT = 'result',
    RESULTS = 'results',
    RUNS = 'runs',
}

interface ScopedSampleColumn {
    column: QueryColumn;
    domain: AssayDomainTypes;
}

export class AssayDefinitionModel extends ImmutableRecord({
    containerPath: undefined,
    description: undefined,
    domains: Map<string, List<QueryColumn>>(),
    domainTypes: Map<string, string>(),
    id: undefined,
    importAction: undefined,
    importController: undefined,
    links: Map<AssayLink, string>(),
    name: undefined,
    projectLevel: undefined,
    protocolSchemaName: undefined,
    requireCommentOnQCStateChange: undefined,
    reRunSupport: undefined,
    templateLink: undefined,
    type: undefined,
}) {
    declare containerPath: string;
    declare description: string;
    declare domains: Map<string, List<QueryColumn>>;
    declare domainTypes: Map<string, string>;
    declare id: number;
    declare importAction: string;
    declare importController: string;
    declare links: Map<AssayLink, string>;
    declare name: string;
    declare projectLevel: boolean;
    declare protocolSchemaName: string;
    declare requireCommentOnQCStateChange: boolean;
    declare reRunSupport: string;
    declare templateLink: string;
    declare type: string;

    static create(rawModel): AssayDefinitionModel {
        let domains = Map<string, List<QueryColumn>>();
        let domainTypes = Map<string, string>();
        let links = Map<AssayLink, string>();

        if (rawModel) {
            if (rawModel.domainTypes) {
                domainTypes = fromJS(rawModel.domainTypes);
            }

            if (rawModel.domains) {
                const rawDomains = Object.keys(rawModel.domains).reduce((result, k) => {
                    result[k] = List<QueryColumn>(rawModel.domains[k].map(rawColumn => new QueryColumn(rawColumn)));
                    return result;
                }, {});
                domains = Map<string, List<QueryColumn>>(rawDomains);
            }

            if (rawModel.links) {
                links = fromJS(rawModel.links);
            }
        }

        return new AssayDefinitionModel({
            ...rawModel,
            domains,
            domainTypes,
            links,
        });
    }

    getDomainByType(domainType: AssayDomainTypes): List<QueryColumn> {
        if (this.domainTypes.has(domainType)) {
            return this.domains.get(this.domainTypes.get(domainType));
        }

        return undefined;
    }

    getImportUrl(
        dataTab?: AssayUploadTabs,
        selectionKey?: string,
        filterList?: List<Filter.IFilter>,
        isPicklist?: boolean,
        currentProductId?: string,
        targetProductId?: string,
        ignoreFilter?: boolean
    ): string {
        let url: AppURL | string;
        // Note, will need to handle the re-import run case separately. Possibly introduce another URL via links
        if (this.name !== undefined && this.importAction === 'uploadWizard' && this.importController === 'assay') {
            const params: Record<string, any> = { rowId: this.id };
            if (dataTab) params.dataTab = dataTab;
            if (!ignoreFilter) {
                filterList?.forEach(filter => {
                    // if the filter has a URL suffix and is not registered as one recognized for URL filters, we ignore it here
                    // CONSIDER:  Applications might want to be able to register their own filter types
                    const urlSuffix = filter.getFilterType().getURLSuffix();
                    if (!urlSuffix || Filter.getFilterTypeForURLSuffix(urlSuffix)) {
                        params[filter.getURLParameterName()] = filter.getURLParameterValue();
                    }
                });
            }
            if (selectionKey) params.selectionKey = selectionKey;
            if (isPicklist) params.isPicklist = true;
            url = createProductUrlFromParts(
                targetProductId,
                currentProductId,
                params,
                'assays',
                this.type,
                this.name,
                'upload'
            );
            if (url instanceof AppURL) {
                url = url.toHref();
            }
        } else {
            url = this.links.get(AssayLink.IMPORT);
        }
        return url;
    }

    getRunsUrl() {
        return AppURL.create('assays', this.type, this.name, 'runs');
    }

    hasLookup(targetSQ: SchemaQuery, isPicklist?: boolean): boolean {
        const isSampleSet = targetSQ.hasSchema(SCHEMAS.SAMPLE_SETS.SCHEMA);

        // 44339: the SourceSamples custom query is backed by exp.materials
        const isTargetAllSamples =
            targetSQ.isEqual(SCHEMAS.SAMPLE_MANAGEMENT.SOURCE_SAMPLES) ||
            targetSQ.isEqual(SCHEMAS.SAMPLE_MANAGEMENT.INPUT_SAMPLES_SQ) ||
            (isPicklist && targetSQ.hasSchema(SCHEMAS.PICKLIST_TABLES.SCHEMA));
        const findLookup = (col: QueryColumn): boolean => {
            if (col.isLookup()) {
                const lookupSQ = col.lookup.schemaQuery;
                const isMatch =
                    targetSQ.isEqual(lookupSQ) ||
                    (isTargetAllSamples && SCHEMAS.EXP_TABLES.MATERIALS.isEqual(lookupSQ));

                // 35881: If targetSQ is a Sample Set then allow targeting exp.materials table as well
                if (isSampleSet) {
                    return isMatch || SCHEMAS.EXP_TABLES.MATERIALS.isEqual(lookupSQ);
                }

                return isMatch;
            }

            return false;
        };

        // Traditional for loop so we can short circuit.
        for (const k of Object.keys(AssayDomainTypes)) {
            const domainType = AssayDomainTypes[k];
            const domainColumns = this.getDomainByType(domainType);

            if (domainColumns && domainColumns.find(findLookup)) {
                return true;
            }
        }

        return false;
    }

    private getSampleColumnsByDomain(domainType: AssayDomainTypes): ScopedSampleColumn[] {
        const ret = [];
        const columns = this.getDomainByType(domainType);

        if (columns) {
            columns.forEach(column => {
                if (column.isSampleLookup()) {
                    ret.push({ column, domain: domainType });
                }
            });
        }

        return ret;
    }

    /**
     * get all sample lookup columns found in the result, run, and batch domains, or from a specific domainType
     */
    getSampleColumns(domainType?: AssayDomainTypes): List<ScopedSampleColumn> {
        let ret = [];
        // The order matters here, we care about result, run, and batch in that order.
        const domainTypes = domainType
            ? [domainType]
            : [AssayDomainTypes.RESULT, AssayDomainTypes.RUN, AssayDomainTypes.BATCH];
        for (const domain of domainTypes) {
            const columns = this.getSampleColumnsByDomain(domain);

            if (columns && columns.length > 0) {
                ret = ret.concat(columns);
            }
        }

        return List(ret);
    }

    /**
     * get the first sample lookup column found in the result, run, or batch domain.
     */
    getSampleColumn(domainType?: AssayDomainTypes): ScopedSampleColumn {
        const sampleColumns = this.getSampleColumns(domainType);
        return !sampleColumns.isEmpty() ? sampleColumns.first() : null;
    }

    /**
     * returns the FieldKey string of the sample column relative from the assay Results table.
     */
    sampleColumnFieldKey(sampleCol: ScopedSampleColumn): string {
        if (sampleCol.domain === AssayDomainTypes.RESULT) {
            return sampleCol.column.fieldKey;
        } else if (sampleCol.domain === AssayDomainTypes.RUN) {
            return `Run/${sampleCol.column.fieldKey}`;
        } else if (sampleCol.domain === AssayDomainTypes.BATCH) {
            return `Run/Batch/${sampleCol.column.fieldKey}`;
        }
        throw new Error('Unexpected assay domain type: ' + sampleCol.domain);
    }

    /**
     * returns the FieldKey string of the sample columns relative from the assay Results table.
     */
    getSampleColumnFieldKeys(): List<string> {
        const sampleCols = this.getSampleColumns();
        return List(sampleCols.map(this.sampleColumnFieldKey));
    }

    createSampleFilter(sampleColumns: List<string>, value: Array<string | number>, singleFilter: Filter.IFilterType) {
        const keyCol = '/RowId';
        if (sampleColumns.size === 1) {
            // generate simple equals filter
            const sampleColumn = sampleColumns.get(0);
            return Filter.create(sampleColumn + keyCol, value, singleFilter);
        } else if (sampleColumns.size > 1) {
            // generate a where clause filter to include all sample columns via a UNION (issue 47346)
            const whereClause =
                'RowId IN (' +
                sampleColumns
                    .map(sampleCol => {
                        const fieldKey = (sampleCol + keyCol)
                            .split('/')
                            .map(token => '"' + token + '"')
                            .join('.');
                        return `SELECT RowId FROM Data WHERE ${fieldKey} IN (${value.join(',')})`;
                    })
                    .join(' UNION ') +
                ')';
            return Filter.create('*', whereClause, WHERE_FILTER_TYPE);
        }
    }

    getDomainColumns(type: AssayDomainTypes): OrderedMap<string, QueryColumn> {
        const columns = OrderedMap<string, QueryColumn>().asMutable();

        if (this.domains && this.domains.size) {
            const domainColumns = this.getDomainByType(type);

            if (domainColumns && domainColumns.size) {
                domainColumns.forEach(dc => {
                    columns.set(dc.fieldKey.toLowerCase(), dc);
                });
            }
        }

        return columns.asImmutable();
    }

    domainHasFileColumn(type: AssayDomainTypes): boolean {
        const columns = this.getDomainByType(type);
        return columns.find(col => col.isFileInput) !== undefined;
    }
}
