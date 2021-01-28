import { OntologyModel } from './models';

interface OntologyOptions {
    ontologyId: string | number;
    success: (model: OntologyModel) => void;
    failure: (resp: { [key: string]: any }) => any;
}

//TODO remove
const mockResponse = {
    ontologyId: 16,
    name: 'My Ontology',
    conceptCount: 65,
    concepts: [],
    paths: [],
};

class Ontology {
    static getOntology = (params: OntologyOptions) => {
        //TODO make an actual request to server
        return params.success(mockResponse);
    };
}

export function getOntologyDetails(ontologyId: number): Promise<OntologyModel> {
    return new Promise<OntologyModel>((resolve, reject) => {
        Ontology.getOntology({
            ontologyId,
            success: (rawOntology: { [key: string]: any }): void => {
                console.log(rawOntology);
                resolve(new OntologyModel(rawOntology));
            },
            failure: error => {
                reject(error);
            },
        });
    });
}
