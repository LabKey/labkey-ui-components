import {List, Map, Record} from "immutable";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import { DomainDesign } from "../models";
import {IParentAlias} from "../../samples/models";

export class SampleTypeModel extends Record({
    rowId: undefined,
    name: undefined,
    nameExpression: undefined,
    description: undefined,
    parentAliases: undefined,
    // importAliasKeys: undefined,
    // importAliasValues: undefined,
    domainId: undefined,
    domain: undefined,
}) {
    rowId: number;
    name: string;
    nameExpression: string;
    description: string;
    parentAliases?: Map<string, IParentAlias>;
    // importAliasKeys?: Array<string>;
    // importAliasValues?: Array<string>;
    domainId?: number;
    domain?: DomainDesign;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any): SampleTypeModel {
        let domain = raw.domainDesign ?
            DomainDesign.create(raw.domainDesign) :
            DomainDesign.create({});

        return new SampleTypeModel({...raw, domain});
    }

    static serialize(model: SampleTypeModel): any {
        const domain = DomainDesign.serialize(model.domain);
        return model.merge({domain}).toJS();
    }

    isNew = (): boolean => {
        return !this.rowId;
    };

    static isValid(model: SampleTypeModel) {
        const errDomain = !!model.domain.domainException && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR;
        return !errDomain && model.hasValidProperties();
    }

    hasValidProperties(): boolean {
        return ((this.name !== undefined && this.name !== null && this.name.trim().length > 0)
            // && //additional validation to come
        );
    }
}
