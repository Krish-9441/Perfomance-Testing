const express=require('express');
const client=require('prom-client');

const app=express();
const port=3000;

client.collectDefaultMetrics();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', service: 'memory-leaker' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

let memoryLeakArray = [];

app.get('/leak',(req,res)=>{

  const chunkSize = parseInt(req.query.size) || 10000;
  const chunk = new Array(chunkSize).fill('LEAK_').join('');

  memoryLeakArray.push(chunk);

  res.json({ 
    message: 'Memory intentionally leaked!', 
    arrayLength: memoryLeakArray.length 
  });
})

//Reset endpoint
app.get('/reset',(req,res)=>{
    memoryLeakArray=[];
   res.json({ message: 'Memory array reset', arrayLength: memoryLeakArray.length });
})

app.listen(port, () => {
  console.log(`Memory Leaker service listening on port ${port}`);
});
