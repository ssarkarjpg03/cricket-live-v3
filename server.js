const express = require('express');
const fs = require('fs');

const app = express();

const DATA = 'data/match.json';

let match = {
  innings: 1,
  teamA: "TEAM A",
  teamB: "TEAM B",
  oversLimit: 10,
  wicketsLimit: 8,
  target: 0,

  score: {
    runs: 0,
    wickets: 0,
    balls: 0
  },

  striker: {
    name: "Batter 1",
    runs: 0,
    balls: 0
  },

  nonStriker: {
    name: "Batter 2",
    runs: 0,
    balls: 0
  },

  bowler: {
    name: "Bowler",
    balls: 0,
    runs: 0,
    wickets: 0
  },

  recentOver: [],
  history: []
};

if (fs.existsSync(DATA)) {
  try {
    match = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  } catch (e) {
    console.log('Using default match data');
  }
}

function save() {
  fs.writeFileSync(
    DATA,
    JSON.stringify(match, null, 2)
  );
}

function swapStrike() {
  const temp = match.striker;
  match.striker = match.nonStriker;
  match.nonStriker = temp;
}

function currentOver() {
  return (
    Math.floor(match.score.balls / 6) +
    "." +
    (match.score.balls % 6)
  );
}

function getCRR() {
  if (match.score.balls === 0) return "0.00";

  return (
    match.score.runs /
    (match.score.balls / 6)
  ).toFixed(2);
}

function getBallsRemaining() {
  return (
    match.oversLimit * 6
  ) - match.score.balls;
}

function getRRR() {
  if (match.innings !== 2) return "0.00";

  const need =
    match.target -
    match.score.runs;

  const balls =
    getBallsRemaining();

  if (balls <= 0) return "0.00";

  return (
    (need / balls) * 6
  ).toFixed(2);
}

app.use(express.json());
app.use(express.static('public'));

app.get('/api/match', (req, res) => {
  res.json(match);
});

app.get('/api/live', (req, res) => {

  res.json({
    ...match,
    over: currentOver(),
    crr: getCRR(),
    rrr: getRRR(),
    ballsRemaining: getBallsRemaining(),
    need: getNeedRuns()
  });
  result: getResult()
});

app.post('/api/setup', (req, res) => {

  Object.assign(match, req.body);

  save();

  res.json(match);

});

app.post('/api/run/:n', (req, res) => {

  const runs =
    parseInt(req.params.n);

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

  if (runs % 2 === 1) {
    swapStrike();
  }

  if (match.score.balls % 6 === 0) {
    swapStrike();
  }

  save();

  res.json(match);

});

app.post('/api/wicket', (req, res) => {

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.wickets += 1;
  match.score.balls += 1;

  match.striker.balls += 1;

  match.bowler.balls += 1;
  match.bowler.wickets += 1;

  match.recentOver.push("W");

  if (match.score.balls % 6 === 0) {
    swapStrike();
  }

  save();

  res.json(match);

});

app.post('/api/wide', (req, res) => {

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.runs += 1;
  match.bowler.runs += 1;

  match.recentOver.push("WD");

  save();

  res.json(match);

});

app.post('/api/noball', (req, res) => {

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.runs += 1;
  match.bowler.runs += 1;

  match.recentOver.push("NB");

  save();

  res.json(match);

});

app.post('/api/extra/:n', (req, res) => {

  match.history.push(
    JSON.parse(JSON.stringify(match))
  );

  match.score.runs +=
    parseInt(req.params.n);

  save();

  res.json(match);

});

app.post('/api/undo', (req, res) => {

  if (match.history.length === 0) {
    return res.json(match);
  }

  match = match.history.pop();

  save();

  res.json(match);

});

app.post('/api/innings', (req, res) => {

  if (match.innings === 1) {

    match.target =
      match.score.runs + 1;

    match.innings = 2;

    match.score.runs = 0;
    match.score.wickets = 0;
    match.score.balls = 0;

    match.striker.runs = 0;
    match.striker.balls = 0;

    match.nonStriker.runs = 0;
    match.nonStriker.balls = 0;

    match.bowler.runs = 0;
    match.bowler.balls = 0;
    match.bowler.wickets = 0;

    match.recentOver = [];
  }

  save();

  res.json(match);

});
app.post('/api/newbatter', (req, res) => {

  match.striker = {
    name: req.body.name,
    runs: 0,
    balls: 0
  };

  save();

  res.json(match);

});

app.post('/api/changebowler', (req, res) => {

  match.bowler = {
    name: req.body.name,
    balls: 0,
    runs: 0,
    wickets: 0
  };

  save();

  res.json(match);

});
function getNeedRuns() {

  if (match.innings !== 2) {
    return "";
  }

  const need =
    Math.max(
      0,
      match.target - match.score.runs
    );

  return `${need} from ${getBallsRemaining()}`;
}
function getResult(){

  if(match.innings !== 2){
    return "";
  }

  if(match.score.runs >= match.target){

    const wicketsLeft =
      match.wicketsLimit -
      match.score.wickets;

    return `${match.teamB} won by ${wicketsLeft} wickets`;
  }

  if(
    getBallsRemaining() === 0 ||
    match.score.wickets >= match.wicketsLimit
  ){

    const margin =
      match.target -
      match.score.runs - 1;

    return `${match.teamA} won by ${margin} runs`;
  }

  return "";
}
app.post('/api/reset',(req,res)=>{

 match.score = {
  runs:0,
  wickets:0,
  balls:0
 };

 match.target = 0;
 match.innings = 1;

 match.striker.runs = 0;
 match.striker.balls = 0;

 match.nonStriker.runs = 0;
 match.nonStriker.balls = 0;

 match.bowler.runs = 0;
 match.bowler.balls = 0;
 match.bowler.wickets = 0;

 match.recentOver = [];
 match.history = [];

 save();

 res.json(match);

});

app.listen(3000, '0.0.0.0', () => {
  console.log('Running on port 3000');
});