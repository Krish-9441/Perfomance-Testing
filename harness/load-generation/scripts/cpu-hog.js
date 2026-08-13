import http from 'k6/http';
import {check,sleep} from 'k6';

export const options={
    stages:[
        {duration:'10s',target:5}, //ramp up to 5 users
        {duration:'20s',target:3}, //spike to 15 users
        {duration:'10s',target:0}, //ramp down
    ],
}

export default function(){
    const res = http.get('http://host.docker.internal:3001/fibonacci?n=25');
    check(res,{
        'status is 200': (r)=>r.status===200
    });
    console.log(`Status: ${res.status} | Body: ${res.body}`);
    sleep(0.5); //small pause between request per virtual user 
}
