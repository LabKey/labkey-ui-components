import { fromJS, Map, OrderedMap, Record, Set } from 'immutable';

import { DomainDesign, DomainDetails, IDomainField } from '../models';
import { IParentOption } from '../../entities/models';

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameReadOnly: false,
    nameExpression: undefined,
    description: undefined,
    labelColor: undefined,
    parentAliases: undefined,
    importAliases: undefined,
    domainId: undefined,
    domain: undefined,
    exception: undefined,
}) {
    rowId: number;
    name: string;
    nameReadOnly?: boolean;
    nameExpression: string;
    description: string;
    labelColor: string;
    parentAliases?: OrderedMap<string, IParentAlias>;
    importAliases?: Map<string, string>;
    domainId?: number;
    domain?: DomainDesign;
    exception: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    static create(raw?: DomainDetails, name?: string): SampleTypeModel {
        if (!raw) return new SampleTypeModel();

        const domain = raw.domainDesign ? raw.domainDesign : DomainDesign.create({});

        const { options } = raw;
        let importAliases = Map<string, string>();
        if (options) {
            const aliases = options.get('importAliases') || {};
            importAliases = Map<string, string>(fromJS(aliases));
        }

        return new SampleTypeModel({
            ...options.toJS(),
            name,
            nameReadOnly: raw.nameReadOnly,
            importAliases,
            labelColor: options.get('labelColor') || undefined, // helps to convert null to undefined
            domain,
        });
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({ domain }).toJS();
    }

    isNew(): boolean {
        return !this.rowId;
    }

    isValid(defaultNameFieldConfig?: Partial<IDomainField>) {
        return (
            this.hasValidProperties() &&
            !this.hasInvalidNameField(defaultNameFieldConfig) &&
            this.getDuplicateAlias(true).size === 0 &&
            !this.domain.hasInvalidFields()
        );
    }

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    parentAliasInvalid(alias: IParentAlias): boolean {
        if (!alias) return true;

        const aliasValueInvalid = !alias.alias || alias.alias.trim() === '';
        const parentValueInvalid = !alias.parentValue || !alias.parentValue.value;

        return aliasValueInvalid || parentValueInvalid || alias.isDupe;
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
}

export interface IParentAlias {
    alias: string;
    id: string; // generated by panel used for removal, not saved
    parentValue: IParentOption;
    ignoreAliasError: boolean;
    ignoreSelectError: boolean;
    isDupe?: boolean;
}
