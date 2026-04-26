const STORAGE_KEY="godsaeng-routine-v1";

const defaultRoutines=[
"10분이상 요가",
"독서 30분",
"스쿼트 30개 이상",
"영어 1문장 외우기",
"영양제 챙겨 먹기",
"54일 기도 하기",
"매일 1개 정리하기",

];

let state=JSON.parse(localStorage.getItem(STORAGE_KEY))||{
routines:defaultRoutines.map(t=>({id:Date.now()+Math.random(),title:t})),
checks:{},
notes:{}
};

function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

function todayKey(){
let d=new Date();
return d.toISOString().slice(0,10);
}

function render(){
let list=document.getElementById("routineList");
if(!list) return;

let key=todayKey();
if(!state.checks[key]) state.checks[key]={};

list.innerHTML="";

state.routines.forEach(r=>{
let div=document.createElement("div");
div.className="routine-item";

if(state.checks[key][r.id]) div.classList.add("done");

div.innerHTML=`
<span>${r.title}</span>
<span class="check">${state.checks[key][r.id]?"✓":""}</span>
`;

div.onclick=()=>{
state.checks[key][r.id]=!state.checks[key][r.id];
save();
render();
};

list.appendChild(div);
});
}

function addRoutine(){
let name=prompt("루틴 이름?");
if(!name) return;

state.routines.push({id:Date.now(),title:name});
save();
render();
}

document.addEventListener("DOMContentLoaded",()=>{
let btn=document.getElementById("addRoutineBtn");
if(btn) btn.onclick=addRoutine;

render();
});
