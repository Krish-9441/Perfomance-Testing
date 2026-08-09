const express=require('express');
const client=require('prom-client');

const app=express();
const port=3000;

client.collectDefaultMetrics();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', service: 'socket-hoarder' });
});

app.get('/metrics',async (req,res)=>{
    res.set('Content-Type',client.register.contentType);
    res.end(await client.register.metrics());
});

// The Bad actor endpoint 
app.get('/hold',(req,res)=>{
    const drop= req.query.drop==='true';

    if(drop)
    {
      // Behaviour 2 : abruptly destroy the socket (simulating packet loss)
      console.log('socket intentionally destroyed');
      req.socket.destroy();
    }
    else
    {
        //Behaviour 1: Accept connection,but never respond
        console.log('Connection accepted and held indefinitely...');
         // Notice there is no res.send() or res.json() here!
    }
});

const server=app.listen(port,()=>{
    console.log(`Socket Hoarder service listening port on ${port}`);
})

server.maxConnections=10;


