const express=require('express');
const client=require('prom-client');

const app=express();
const port=3000;

client.collectDefaultMetrics();

app.get('/health',(req,res)=>{
    res.status(200).json({status:'up',service:'sluggish-io'});
})

app.get('/metrics',async (req,res)=>{
    res.set('Content-type',client.register.contentType);
    res.end(await client.register.metrics());
})

//asynchrnonus delay 
const delay=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

//bad actor 
app.get('/slow-query',async(req,res)=>{
    const baseDelay = parseInt(req.query.delay) || 2000;
    const jitter = parseInt(req.query.jitter) || 500;

    //calculate base delay between (basedelay-jitter) to (basedelay+jitter)
    const actualDelay = baseDelay + (Math.random() * jitter * 2 - jitter);

    await delay(actualDelay);
    res.json({ 
    message: 'Data successfully fetched from slow dependency', 
    delayAppliedMs: Math.round(actualDelay)
  });
})

app.listen(port,()=>{
    console.log(`sluggish I/O service listerning on port ${port}`);
})