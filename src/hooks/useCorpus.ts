import { getCookie, setCookie } from '../utils'
import { useState, useContext} from 'react';
import { StateSetter } from '../utils';

export const useCorpus = (ws: WebSocket, setFlag: any) => {
    const [corpus, setCorpus] = useState<useCorpusType['corpus']>([]);
    const [tfidfParams, setTfidfParams] = useState<Partial<TfidfParamsType>>(DEFAULT_TFIDF_PARAMS);
    const [nnParams, setNnParams] = useState<NnParamsType>(DEFAULT_NN_PARAMS);


    ws.onmessage = event => {
        const { data } = event;
        const response_obj = JSON.parse(data);
        const { success, message, ranks } = response_obj
        
        if (success) {
            setCorpus(ranks);
        } else {
            setFlag!({ success, message });
        }
    }

    const addCorpusElement: StateSetter<CorpusElementType> = (corpusElement: CorpusElementType) => {
        const updatedCorpus = [...corpus, corpusElement];
        setCorpus(updatedCorpus);
    }

    const removeCorpusElement: StateSetter<CorpusElementType> = (corpusElement: CorpusElementType) => {
        setCorpus(corpus.filter(element => element != corpusElement));
    }

    const updateTfidfParams: StateSetter<TfidfParamsType> = (params: Partial<TfidfParamsType>) => {
        setTfidfParams({ ...tfidfParams, ...params });
    }

    const updateNnParams: StateSetter<NnParamsType> = (params: Partial<NnParamsType>) => {
        setNnParams({ ...nnParams, ...params });
    }

    const buildModel = async () => {

        // save corpus to local storage
        localStorage.setItem('corpus-ranker_corpus', JSON.stringify(corpus));

        let user_id = getCookie()
        
        if (!user_id)   
            user_id = await setCookie();

        // send corpus to model-builder API endpoint
        const request_body = {
            user_id,
            corpus,
            tfidf_params: tfidfParams
        }

        const response_obj = await fetch('http://localhost:8000/model', {
            method: "POST",
            mode: "cors",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request_body)
        })
        

        const response = await response_obj.json();
 
        setFlag!({ success: response.success, message: response.message })   
    }

    const rankCorpus = (userInput: string) => {
        const corpus = localStorage.getItem('corpus-ranker_corpus') ?? '[]';
        const userId = getCookie()

        const corpus_obj = {
            userId,
            userInput,
            corpus: JSON.parse(corpus)
        }
        ws.send(JSON.stringify(corpus_obj))
    }

    return {
        corpus, 
        addCorpusElement, 
        removeCorpusElement, 
        buildModel, 
        rankCorpus, 
        updateTfidfParams,
        updateNnParams
    } as useCorpusType;
}


export type useCorpusType = {
    corpus: CorpusElementType[],
    addCorpusElement: StateSetter<CorpusElementType>,
    removeCorpusElement: StateSetter<CorpusElementType>,
    buildModel: () => void,
    rankCorpus: (userInput: string) => void,
    updateTfidfParams: StateSetter<TfidfParamsType>,
    updateNnParams: StateSetter<NnParamsType>
}

export type CorpusElementType = string

type TfidfParamsType = {
    stopWords: boolean,
    ngramRange: [number, number],
    analyzer: string
}

type NnParamsType = {
    metric: string
}

const DEFAULT_TFIDF_PARAMS: TfidfParamsType = {
    stopWords: false,
    ngramRange: [1,1],
    analyzer: 'word'
}

const DEFAULT_NN_PARAMS: NnParamsType = {
    metric: 'cosine'
}