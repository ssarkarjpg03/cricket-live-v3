
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
function getCRR() {

  if(match.score.balls === 0){
    return 0;
  }

  return (
    match.score.runs /
    (match.score.balls / 6)
  ).toFixed(2);

}

function getBallsRemaining(){

  return (
    match.oversLimit * 6
  ) - match.score.balls;

}

function getRRR(){

  if(match.innings !== 2){
    return 0;
  }

  const need =
    match.target -
    match.score.runs;

  const balls =
    getBallsRemaining();

  if(balls <= 0){
    return 0;
  }

  return (
    (need / balls) * 6
  ).toFixed(2);

}
function currentOver() {
  return (
    Math.floor(match.score.balls / 6) +
    "." +
    (match.score.balls % 6)
  );
}

function swapStrike() {
  const temp = match.striker;
  match.striker = match.nonStriker;
  match.nonStriker = temp;
}
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

 const runs=parseInt(req.params.n);

 match.history.push(
   JSON.parse(JSON.stringify(match))
 );

 match.score.runs += runs;

 match.score.balls += 1;

 match.striker.runs += runs;
 match.striker.balls += 1;

 match.bowler.runs += runs;
 match.bowler.balls += 1;

 match.recentOver.push(runs);

 if(runs % 2 === 1){
   swapStrike();
 }

 if(match.score.balls % 6 === 0){
   swapStrike();
 }

 save();
 res.json(match);

});

app.post('/api/wicket',(req,res)=>{

 match.history.push(
   JSON.parse(JSON.stringify(match))
 );

 match.score.wickets += 1;
 match.score.balls += 1;

 match.striker.balls += 1;

 match.bowler.balls += 1;
 match.bowler.wickets += 1;

 match.recentOver.push("W");

 if(match.score.balls % 6 === 0){
   swapStrike();
 }

 save();
 res.json(match);

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
app.post('/api/undo',(req,res)=>{

 if(match.history.length === 0){
   return res.json(match);
 }

 match = match.history.pop();

 save();

 res.json(match);

});
app.post('/api/wide',(req,res)=>{

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.runs += 1;
  match.bowler.runs += 1;

  match.recentOver.push("WD");

  save();

  res.json(match);

});
app.post('/api/noball',(req,res)=>{

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.runs += 1;
  match.bowler.runs += 1;

  match.recentOver.push("NB");

  save();

  res.json(match);

});
app.get('/api/live',(req,res)=>{

 res.json({

   ...match,

   over: currentOver(),

   crr: getCRR(),

   rrr: getRRR(),

   ballsRemaining: getBallsRemaining()

 });

});

app.listen(3000,'0.0.0.0',()=>console.log('Running on 3000'));
