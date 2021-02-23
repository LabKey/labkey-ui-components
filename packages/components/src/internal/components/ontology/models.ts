import { immerable } from "immer";

export class ConceptModel {
    [immerable] = true;

    readonly label: string;
    readonly code: string;
    readonly paths: string[];
    readonly description: string;

    constructor(values?: Partial<ConceptModel>) {
        Object.assign(this, values);
    }
}

export class PathModel {
    [immerable] = true;

    readonly path: string;
    readonly code: string;
    readonly label: string;
    readonly hasChildren: boolean;
    readonly children: PathModel[];

    constructor(values?: Partial<PathModel>) {
        Object.assign(this, values);
    }
}

export class OntologyModel {
    [immerable] = true;

    readonly name: string;
    readonly description: string;
    readonly rowId: number;
    readonly abbreviation: string;
    readonly path: string;
    readonly conceptCount: number;
    readonly children: PathModel[] = undefined;

    constructor(values?: Partial<OntologyModel>) {
        Object.assign(this, values);
    }

    getPathModel = (): PathModel => {
        return new PathModel({
            path: this.path,
            code: this.abbreviation,
            label: this.name,
            hasChildren: !!this.children,
            children: this.children,
        });
    };
}
