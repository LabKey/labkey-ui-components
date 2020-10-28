import { fromJS, List, Map, OrderedMap, Record } from 'immutable';
import { Filter } from '@labkey/api';

import { AppURL, QueryColumn, SchemaQuery, WHERE_FILTER_TYPE } from '..';

export enum AssayDomainTypes {
    BATCH = 'Batch',
    RUN = 'Run',
    RESULT = 'Result',
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
    domain: AssayDomainTypes;
    column: QueryColumn;
}

export const enum AssayUploadTabs {
    Files = 1,
    Copy = 2,
    Grid = 3,
}

export class AssayDefinitionModel extends Record({
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
    reRunSupport: undefined,
    templateLink: undefined,
    type: undefined,
}) {
    containerPath: string;
    description: string;
    domains: Map<string, List<QueryColumn>>;
    domainTypes: Map<string, string>;
    id: number;
    importAction: string;
    importController: string;
    links: Map<AssayLink, string>;
    name: string;
    projectLevel: boolean;
    protocolSchemaName: string;
    reRunSupport: string;
    templateLink: string;
    type: string;

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
                    result[k] = List<QueryColumn>(rawModel.domains[k].map(rawColumn => QueryColumn.create(rawColumn)));
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

    getImportUrl(dataTab?: AssayUploadTabs, selectionKey?: string, filterList?: List<Filter.IFilter>) {
        let url;
        // Note, will need to handle the re-import run case separately. Possibly introduce another URL via links
        if (this.name !== undefined && this.importAction === 'uploadWizard' && this.importController === 'assay') {
            url = AppURL.create('assays', this.type, this.name, 'upload').addParam('rowId', this.id);
            if (dataTab) url = url.addParam('dataTab', dataTab);
            if (filterList && !filterList.isEmpty()) {
                filterList.forEach(filter => {
                    // if the filter has a URL suffix and is not registered as one recognized for URL filters, we ignore it here
                    // CONSIDER:  Applications might want to be able to register their own filter types
                    const urlSuffix = filter.getFilterType().getURLSuffix();
                    if (!urlSuffix || Filter.getFilterTypeForURLSuffix(urlSuffix)) {
                        url = url.addParam(filter.getURLParameterName(), filter.getURLParameterValue());
                    }
                });
            }
            if (selectionKey) url = url.addParam('selectionKey', selectionKey);
            url = url.toHref();
        } else {
            url = this.links.get(AssayLink.IMPORT);
        }
        return url;
    }

    getRunsUrl() {
        return AppURL.create('assays', this.type, this.name, 'runs');
    }

    hasLookup(targetSQ: SchemaQuery): boolean {
        const isSampleSet = targetSQ.hasSchema('samples');
        const findLookup = col => {
            if (col.isLookup()) {
                const lookupSQ = SchemaQuery.create(col.lookup.schemaName, col.lookup.queryName);
                const isMatch = targetSQ.isEqual(lookupSQ);

                // 35881: If targetSQ is a Sample Set then allow targeting exp.materials table as well
                if (isSampleSet) {
                    return isMatch || SchemaQuery.create('exp', 'Materials').isEqual(lookupSQ);
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
     * get all sample lookup columns found in the result, run, and batch domains.
     */
    getSampleColumns(): List<ScopedSampleColumn> {
        let ret = [];
        // The order matters here, we care about result, run, and batch in that order.
        for (const domain of [AssayDomainTypes.RESULT, AssayDomainTypes.RUN, AssayDomainTypes.BATCH]) {
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
    getSampleColumn(): ScopedSampleColumn {
        const sampleColumns = this.getSampleColumns();
        return !sampleColumns.isEmpty() ? sampleColumns.first() : null;
    }

    /**
     * returns the FieldKey string of the sample column relative from the assay Results table.
     */
    sampleColumnFieldKey(sampleCol: ScopedSampleColumn): string {
        if (sampleCol.domain == AssayDomainTypes.RESULT) {
            return sampleCol.column.fieldKey;
        } else if (sampleCol.domain == AssayDomainTypes.RUN) {
            return `Run/${sampleCol.column.fieldKey}`;
        } else if (sampleCol.domain == AssayDomainTypes.BATCH) {
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

    createSampleFilter(
        sampleColumns: List<string>,
        value,
        singleFilter: Filter.IFilterType,
        whereClausePart: (fieldKey, value) => string,
        useLsid?: boolean,
        singleFilterValue?: any
    ) {
        const keyCol = useLsid ? '/LSID' : '/RowId';
        if (sampleColumns.size == 1) {
            // generate simple equals filter
            const sampleColumn = sampleColumns.get(0);
            return Filter.create(sampleColumn + keyCol, singleFilterValue ? singleFilterValue : value, singleFilter);
        } else {
            // generate an OR filter to include all sample columns
            const whereClause =
                '(' +
                sampleColumns
                    .map(sampleCol => {
                        const fieldKey = (sampleCol + keyCol).replace(/\//g, '.');
                        return whereClausePart(fieldKey, value);
                    })
                    .join(' OR ') +
                ')';
            return Filter.create('*', whereClause, WHERE_FILTER_TYPE);
        }
    }

    getDomainColumns(type: AssayDomainTypes): OrderedMap<string, QueryColumn> {
        let columns = OrderedMap<string, QueryColumn>();

        if (this.domains && this.domains.size) {
            const domainColumns = this.getDomainByType(type);

            if (domainColumns && domainColumns.size) {
                domainColumns.forEach(dc => {
                    columns = columns.set(dc.fieldKey.toLowerCase(), dc);
                });
            }
        }

        return columns;
    }
}
