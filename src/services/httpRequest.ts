import {CANCEL} from 'redux-saga';
import axios from "axios";

export enum EHttpMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
    HEAD = "HEAD",
}

function createRequest(method:EHttpMethod, url:string) {
    const cancelTokenSource = axios.CancelToken.source();
    const promise = axios.request({
        method,
        url,
        cancelToken: cancelTokenSource.token
    });
    (promise as any)[CANCEL] = cancelTokenSource.cancel;
    return promise;
}

