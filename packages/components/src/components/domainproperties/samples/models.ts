import {fromJS, Map, Record} from "immutable";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import {DomainDesign, DomainDetails} from "../models";
import {IParentAlias} from "../../entities/models";

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameExpression: undefined,
    description: undefined,
    parentAliases: undefined,
    importAliases: undefined,
    domainId: undefined,
    domain: undefined,
}) {
    rowId: number;
    name: string;
    nameExpression: string;
    description: string;
    parentAliases?: Map<string, string>;
    importAliases?: Map<string, IParentAlias>;
    domainId?: number;
    domain?: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw?: DomainDetails): SampleTypeModel {
        if (!raw)
            return new SampleTypeModel();

        let domain = raw.domainDesign ?
            raw.domainDesign :
            DomainDesign.create({});

        const {options} = raw;
        let parentAliases = Map<string,string>();
        if (options) {
            let aliases = options.get('parentAliases') || {};
            parentAliases = Map<string,string>(fromJS(aliases));
        }

        return new SampleTypeModel({
            ...options.toJS(),
            parentAliases,
            domain
        });
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({domain}).toJS();
    }

    isNew(): boolean {
        return !this.rowId;
    };

    static isValid(model: SampleTypeModel) {
        const errDomain = !!model.domain.domainException && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR;
        return !errDomain && model.hasValidProperties();
    }

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    static parentAliasInvalid(alias: IParentAlias): boolean {
        if (!alias)
            return true;

        //return true if alias is null or blank; or if parentValue option is not set
        return !alias.alias || alias.alias.trim() === '' || !alias.parentValue;
    }

    hasValidProperties(): boolean {
        const {importAliases} = this;
        const hasInvalidAliases = importAliases && importAliases.size > 0 && importAliases.find(SampleTypeModel.parentAliasInvalid);

        return ((this.name !== undefined && this.name !== null && this.name.trim().length > 0)
            && !hasInvalidAliases
        );
    }

    getImportAliasesAsMap(): Map<string,string> {
        const { importAliases } = this;

        let aliases = {};

        if (importAliases) {
            importAliases.map((alias: IParentAlias) => {
                aliases[alias.alias] = alias.parentValue.value;
            });
        }

        return Map<string,string>(aliases);
    }
}
