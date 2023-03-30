import { fromJS, Map, OrderedMap, Record, Set } from 'immutable';

import { DomainDesign, DomainDetails, IDomainField } from '../models';
import {IParentAlias, IParentOption} from '../../entities/models';

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameReadOnly: false,
    nameExpression: undefined,
    aliquotNameExpression: undefined,
    description: undefined,
    labelColor: undefined,
    metricUnit: undefined,
    parentAliases: undefined,
    importAliases: undefined,
    domainId: undefined,
    domain: undefined,
    autoLinkTargetContainerId: undefined,
    autoLinkCategory: undefined,
    exception: undefined,
}) {
    declare rowId: number;
    declare name: string;
    declare nameReadOnly?: boolean;
    declare nameExpression: string;
    declare aliquotNameExpression: string;
    declare description: string;
    declare labelColor: string;
    declare metricUnit: string;
    declare parentAliases?: OrderedMap<string, IParentAlias>;
    declare importAliases?: Map<string, string>;
    declare domainId?: number;
    declare domain?: DomainDesign;
    declare autoLinkTargetContainerId: string;
    declare autoLinkCategory: string;
    declare exception: string;

    static create(raw?: DomainDetails, name?: string): SampleTypeModel {
        const options = raw?.options;
        let importAliases = Map<string, string>();
        if (options) {
            const aliases = options.get('importAliases') || {};
            importAliases = Map<string, string>(fromJS(aliases));
        }

        return new SampleTypeModel({
            ...options?.toJS(),
            aliquotNameExpression: options?.get('aliquotNameExpression') || '',
            name,
            nameReadOnly: raw?.nameReadOnly,
            importAliases,
            labelColor: options?.get('labelColor') || undefined, // helps to convert null to undefined
            metricUnit: options?.get('metricUnit') || undefined,
            domain: raw?.domainDesign ?? DomainDesign.create({}),
        });
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({ domain }).toJS();
    }

    isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>, metricUnitRequired?: boolean) {
        return (
            this.hasValidProperties() &&
            !this.hasInvalidNameField(defaultNameFieldConfig) &&
            this.getDuplicateAlias(true).size === 0 &&
            !this.domain.hasInvalidFields() &&
            this.isMetricUnitValid(metricUnitRequired)
        );
    }

    isMetricUnitValid(metricUnitRequired?: boolean) {
        return !metricUnitRequired || this.metricUnit != null;
    }

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    parentAliasInvalid(alias: Partial<IParentAlias>): boolean {
        if (!alias) return true;

        const aliasValueInvalid = !alias.alias || alias.alias.trim() === '';
        const parentValueInvalid = !alias.parentValue || !alias.parentValue.value;

        return !!(aliasValueInvalid || parentValueInvalid || alias.isDupe);
    }

    hasValidProperties(): boolean {
        const { parentAliases } = this;
        const hasInvalidAliases =
            parentAliases && parentAliases.size > 0 && parentAliases.find(this.parentAliasInvalid) !== undefined;

        return this.name !== undefined && this.name !== null && this.name.trim().length > 0 && !hasInvalidAliases;
    }

    hasInvalidNameField(defaultNameFieldConfig: Partial<IDomainField>): boolean {
        return this.domain && defaultNameFieldConfig ? this.domain.hasInvalidNameField(defaultNameFieldConfig) : false;
    }

    /**
     * returns a Set of ids corresponding to the aliases that have duplicate alias values
     */
    getDuplicateAlias(returnAliases = false): Set<string> {
        const { parentAliases } = this;
        let uniqueAliases = Set<string>();
        let dupeAliases = Set<string>();
        let dupeIds = Set<string>();

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                if (uniqueAliases.has(alias.alias)) {
                    dupeIds = dupeIds.add(alias.id);
                    dupeAliases = dupeAliases.add(alias.alias);
                } else {
                    uniqueAliases = uniqueAliases.add(alias.alias);
                }
            });
        }

        return returnAliases ? dupeAliases : dupeIds;
    }

    get containerPath(): string {
        return this.domain.container;
    }
}

export interface MetricUnitProps {
    includeMetricUnitProperty?: boolean;
    metricUnitHelpMsg?: string;
    metricUnitLabel?: string;
    metricUnitOptions?: any[];
    metricUnitRequired?: boolean;
}

export interface AliquotNamePatternProps {
    aliquotNameExpressionInfoUrl?: string;
    aliquotNameExpressionPlaceholder?: string;
    showAliquotNameExpression?: boolean;
}
