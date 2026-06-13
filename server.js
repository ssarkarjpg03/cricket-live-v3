
const express=require('express');
const fs=require('fs');
const path=require('path');
const app=express();

const DATA='data/match.json';
let match={
teamA:'TEAM A',teamB:'TEAM B',oversLimit:10,wicketsLimit:8,
innings:1,target:0,runs:0,wickets:0,balls:0,
striker:'Batter 1',nonStriker:'Batter 2',bowler:'Bowler'
};

if(fs.existsSync(DATA)){ try{ match=JSON.parse(fs.readFileSync(DATA)); }catch{} }

function save(){ fs.writeFileSync(DATA,JSON.stringify(match,null,2)); }

app.use(express.json());
app.use(express.static('public'));

app.get('/api/match',(req,res)=>res.json(match));

app.post('/api/setup',(req,res)=>{
 Object.assign(match,req.body);
 save(); res.json(match);
});

app.post('/api/run/:n',(req,res)=>{
 match.runs += parseInt(req.params.n);
 match.balls += 1;
 save(); res.json(match);
});

app.post('/api/wicket',(req,res)=>{
 match.wickets += 1; match.balls += 1;
 save(); res.json(match);
});

app.post('/api/extra/:n',(req,res)=>{
 match.runs += parseInt(req.params.n);
 save(); res.json(match);
});

app.post('/api/innings',(req,res)=>{
 if(match.innings===1){
   match.target=match.runs+1;
   match.innings=2;
   match.runs=0; match.wickets=0; match.balls=0;
 }
 save(); res.json(match);
});

app.listen(3000,'0.0.0.0',()=>console.log('Running on 3000'));
