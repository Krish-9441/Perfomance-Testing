import k6 from 'k6/http'
import {check,sleep} from 'k6';

export const options={
    vus:10,
    duration:'30s'
}

export default function (){
    const res=http.get('http://host.docker.internal:3002/leak?size=100000');
    check(res,{'status is 200':(r)=>r.status===200})
    sleep(0.1);
}