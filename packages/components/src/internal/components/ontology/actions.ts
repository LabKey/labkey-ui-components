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
    static getOntology(ontologyId: string): Promise<OntologyModel> {
        return new Promise<OntologyModel>((resolve, reject) => {
            const { container } = getServerContext();
            const form = {
                abbreviation: ontologyId,
            };

            Ajax.request({
                url: ActionURL.buildURL(ONTOLOGY_CONTROLLER, GET_ONTOLOGY_ACTION, container?.path, form),
                method: 'GET',
                success: Utils.getCallbackWrapper(response => {
                    resolve(new OntologyModel(response));
                }),
                failure: Utils.getCallbackWrapper(
                    response => {
                        reject(response);
                    },
                    null,
                    false
                ),
            });
        });
    }
}

export function getOntologyDetails(ontologyId: string): Promise<OntologyModel> {
    return Ontology.getOntology(ontologyId);
}
