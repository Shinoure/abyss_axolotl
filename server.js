const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const crypto = require("crypto");
const path = require("path");
const app = express(), server = http.createServer(app), io = new Server(server);
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, "public")));

const topics = [
  {name:"Назови животное", key:"animal"},
  {name:"Назови город", key:"city"},
  {name:"Назови фрукт или ягоду", key:"fruit"},
  {name:"Назови морское существо", key:"sea"},
  {name:"Назови известную игру", key:"game"},
  {name:"Назови блюдо", key:"food"},
  {name:"Назови страну", key:"country"},
  {name:"Назови растение", key:"plant"}
];

// MVP knowledge tiers: curated Russian vocabulary. Unknown answers are accepted as "неизученные"
// and receive a conservative Common tier; this can later be replaced by a richer lexicon/moderation service.
const lexicon = {
 animal:{
  common:["кот","кошка","собака","лошадь","корова","свинья","овца","коза","курица","утка","гусь","рыба","мышь","крыса","заяц","кролик","волк","лиса","медведь","слон","лев","тигр","обезьяна","жираф","зебра","дельфин","кит","акула","черепаха","лягушка","змея","попугай","орел","ворона","голубь","белка","ёж","ёжик","олень","лось"],
 uncommon:["енот","барсук","выдра","бобр","росомаха","рысь","гепард","пума","ягуар","тапир","альпака","лама","капибара","фламинго","пеликан","тукан","лемур","хамелеон","игуана","саламандра","аксолотль","морж","тюлень","нарвал","скат","осьминог","медуза","краб","омар","морской конек","мангуст","дикобраз","броненосец","муравьед"],
 rare:["окапи","фенек","ай-ай","трубкозуб","плащеносная акула","рыба-луна","глубоководный удильщик","голый землекоп","сайгак","какапо","грифовая черепаха","аксолотль мексиканский","листохвостый геккон"],
 epic:["аксолотль","гоблинская акула","рыба-капля","дамбо-осьминог","гигантский изопод","звездонос","нарвал альбинос","синекольчатый осьминог"],
 legendary:["колоссальный кальмар","мегамут","латимерия","гребневик","рыба-тренога","плащеносец"],
 mythic:["фантомная медуза","чёрный пожиратель","рыба-призрак","бочкоглаз","психролютес"]
 },
 city:{common:["москва","санкт-петербург","казань","сочи","владимир","екатеринбург","новосибирск","самара","омск","пермь","тверь","тула","воронеж","краснодар","минск","париж","лондон","рим","токио","берлин"],
 uncommon:["суздаль","плес","дербент","выборг","калининград","муром","иркутск","томск","якутск","магадан","мурманск","рейкьявик","любляна","портo","севилья","киото","осло","генуя"],
 rare:["арзамас","торжок","каргополь","монтепульчано","тимбукту","уагадугу","самарканд","бухара","катманду","луангпрабанг"],
 epic:["петропавловск-камчатский","ушуаия","иллоккортурмиут","пальмира","нан-мадол"],
 legendary:["иттоккортоормит","шишмарёв","фуншал"],
 mythic:["вальдзассен","киббер"]
 },
 fruit:{common:["яблоко","груша","банан","апельсин","мандарин","лимон","лайм","виноград","арбуз","дыня","клубника","малина","вишня","черешня","персик","абрикос","слива","ананас","манго","киви"],
 uncommon:["гранат","папайя","маракуйя","личи","фейхоа","айва","хурма","инжир","помело","грейпфрут","клюква","брусника","крыжовник","жимолость","шелковица","питайя"],
 rare:["рамбутан","лонган","салак","карамбола","дуриан","джекфрут","чиримойя","тамарилло","пепино","черимойя","акаи"],
 epic:["плод монстеры","рука будды","канистель","маммея","панданус"],
 legendary:["плод хлебного дерева","плод хала","маранг"],
 mythic:["плод коко-де-мер","плод жаботикабы"]
 },
 sea:{common:["дельфин","кит","акула","осьминог","кальмар","краб","медуза","морская звезда","морской конек","черепаха","тюлень","морж","скат"],
 uncommon:["наутилус","мурена","рыба-клоун","рыба-меч","камбала","морской еж","трепанг","лангуст","креветка-богомол","морской огурец","трубач"],
 rare:["удильщик","изопод","рыба-топорик","глубоководный осьминог","вампирский кальмар","губка-бочонок","голотурия"],
 epic:["дамбо-осьминог","рыба-дракон","малоротая макропинна","гигантский кальмар","плащеносная акула"],
 legendary:["колоссальный кальмар","гигантский сифонофор","рыба-тренога"],
 mythic:["фантомная медуза","чёрный пожиратель","бочкоглаз"]
 },
 game:{common:["майнкрафт","роблокс","фортнайт","дота 2","кс","гта","ведьмак","террария","сталкер","симс","among us","portal","half-life"],
 uncommon:["hollow knight","celeste","hades","dead cells","subnautica","outer wilds","disco elysium","inscryption","undertale","omori","fear and hunger"],
 rare:["pathologic 2","rain world","noita","kenshi","return of the obra dinn","animal well","fear and hunger 2"],
 epic:["cruelty squad","voices of the void","hylics","mundaun","norco"],
 legendary:["space funeral","garage bad dream adventure","moon remix rpg"],
 mythic:["the cat lady","yume nikki"]
 },
 food:{common:["пицца","борщ","суп","паста","салат","пельмени","вареники","котлета","шашлык","суши","бургер","блины","каша","омлет"],
 uncommon:["том ям","рамэн","фо бо","тако","хумус","паэлья","фондю","рататуй","чак-чак","хачапури","долма","кимчи"],
 rare:["лакса","окономияки","моти","кулебяка","кальбитан","пибимпап","кюфта"],
 epic:["хаукарль","касумарцу","фугу","сурустрёмминг"],
 legendary:["балют","копальхен"],
 mythic:["эскамолес"]
 },
 country:{common:["россия","китай","япония","сша","германия","франция","италия","испания","бразилия","индия","египет","финляндия","норвегия","швеция","польша","украина","казахстан"],
 uncommon:["бутан","непал","лаос","камбоджа","монголия","грузия","армения","албания","черногория","исландия","мальта","андорра","молдавия"],
 rare:["кирибати","тувалу","науру","палау","доминика","суринам","лесото","э스ватини","джибути"],
 epic:["микронезия","сан-томе и принсипи","маршалловы острова"],
 legendary:["ниуэ","токелау"],
 mythic:["питкэрнские острова"]
 },
 plant:{common:["дуб","береза","сосна","ель","роза","тюльпан","ромашка","подсолнух","кактус","мята","крапива","клён"],
 uncommon:["баобаб","гинкго","раффлезия","венерина мухоловка","росянка","секвойя","мангровое дерево","лотос","папоротник","орхидея"],
 rare:["вельвичия","такка","литопс","непентес","аморфофаллус","эвкалипт радужный"],
 epic:["цветок трупа","кровавое дерево","драконово дерево"],
 legendary:["пуйя раймонда","сосна остистая"],
 mythic:["коко-де-мер"]
 }
};
const tierInfo = {
 common:{label:"Обычный",depth:8,rank:1}, uncommon:{label:"Необычный",depth:18,rank:2},
 rare:{label:"Редкий",depth:35,rank:3}, epic:{label:"Эпический",depth:65,rank:4},
 legendary:{label:"Легендарный",depth:110,rank:5}, mythic:{label:"Мифический",depth:180,rank:6}
};
function norm(s){return String(s||"").trim().toLocaleLowerCase("ru-RU").replace(/ё/g,"е").replace(/\s+/g," ");}
function classify(topicKey, answer){
 const n=norm(answer), groups=lexicon[topicKey]||{};
 for(const [tier,words] of Object.entries(groups)) if(words.some(w=>norm(w)===n)) return tier;
 return "common";
}
function clean(s){return String(s||"").trim().replace(/\s+/g," ").slice(0,50);}
const rooms=new Map(), makeCode=()=>crypto.randomBytes(2).toString("hex").toUpperCase();
function publicState(r){return {code:r.code,status:r.status,players:r.players.map(p=>({id:p.id,name:p.name,host:p.host,depth:p.depth,lives:p.lives,out:p.out})),hostId:r.hostId,topic:r.topic,used:r.used,currentId:r.currentId,endsAt:r.endsAt,log:r.log.slice(-10),winner:r.winner};}
function send(r){io.to(r.code).emit("state",publicState(r));}
function alive(r){return r.players.filter(p=>!p.out);}
function stop(r){if(r.timer)clearTimeout(r.timer);r.timer=null;}
function next(r,id){let a=alive(r),i=a.findIndex(p=>p.id===id);return a[(i+1+a.length)%a.length]||null;}
function end(r,p){stop(r);r.status="finished";r.winner=p?.name||"Никто";r.currentId=null;send(r);}
function explode(code){let r=rooms.get(code);if(!r||r.status!=="playing")return;let p=r.players.find(x=>x.id===r.currentId);if(!p)return;p.lives--;r.log.push(`${p.name} не успел — аксолотль потерял пузырёк воздуха!`);if(p.lives<=0)p.out=true;let a=alive(r);if(a.length<=1)return end(r,a[0]);let n=next(r,p.id);r.currentId=n.id;r.used=[];r.topic=topics[Math.floor(Math.random()*topics.length)];r.endsAt=Date.now()+20000;r.timer=setTimeout(()=>explode(code),20000);send(r);}
function leave(s){let code=s.data.room;if(!code)return;s.data.room=null;let r=rooms.get(code);if(!r)return;r.players=r.players.filter(p=>p.id!==s.id);if(!r.players.length){stop(r);rooms.delete(code);return;}if(r.hostId===s.id){r.hostId=r.players[0].id;r.players[0].host=true;}if(r.status==="playing"&&r.currentId===s.id){let n=alive(r)[0];if(n){r.currentId=n.id;r.topic=topics[Math.floor(Math.random()*topics.length)];r.endsAt=Date.now()+20000;r.timer=setTimeout(()=>explode(code),20000);}}if(r.status==="playing"&&alive(r).length<=1)return end(r,alive(r)[0]);send(r);}
io.on("connection",s=>{
 s.on("createRoom",({name},cb)=>{let code;do{code=makeCode()}while(rooms.has(code));let p={id:s.id,name:clean(name)||"Игрок",host:true,lives:2,out:false,depth:0};let r={code,players:[p],hostId:s.id,status:"lobby",topic:null,used:[],currentId:null,endsAt:0,timer:null,log:[],winner:null};rooms.set(code,r);s.join(code);s.data.room=code;cb({ok:true,code});send(r);});
 s.on("joinRoom",({name,code},cb)=>{let r=rooms.get(clean(code).toUpperCase());if(!r)return cb({ok:false,error:"Комната не найдена."});if(r.status!=="lobby")return cb({ok:false,error:"Раунд уже начался."});if(r.players.length>=6)return cb({ok:false,error:"Комната заполнена."});let n=clean(name)||"Игрок";if(r.players.some(p=>norm(p.name)===norm(n)))return cb({ok:false,error:"Это имя уже занято."});r.players.push({id:s.id,name:n,host:false,lives:2,out:false,depth:0});s.join(r.code);s.data.room=r.code;cb({ok:true,code:r.code});send(r);});
 s.on("startGame",cb=>{let r=rooms.get(s.data.room);if(!r||r.hostId!==s.id)return cb?.({ok:false,error:"Начать может ведущий."});if(r.players.length<4)return cb?.({ok:false,error:"Нужно минимум 4 игрока."});r.status="playing";r.players.forEach(p=>{p.lives=2;p.out=false;p.depth=0});r.topic=topics[Math.floor(Math.random()*topics.length)];r.used=[];r.currentId=r.players[0].id;r.log=["Погружение началось!"];r.endsAt=Date.now()+20000;r.timer=setTimeout(()=>explode(r.code),20000);send(r);cb?.({ok:true});});
 s.on("answer",({answer},cb)=>{let r=rooms.get(s.data.room);if(!r||r.status!=="playing"||r.currentId!==s.id)return cb?.({ok:false,error:"Сейчас не твой ход."});if(Date.now()>=r.endsAt)return cb?.({ok:false,error:"Время вышло."});let a=clean(answer);if(a.length<2)return cb?.({ok:false,error:"Ответ слишком короткий."});if(r.used.includes(norm(a)))return cb?.({ok:false,error:"Такой ответ уже называли."});let tier=classify(r.topic.key,a),info=tierInfo[tier],p=r.players.find(x=>x.id===s.id);p.depth+=info.depth;r.used.push(norm(a));r.log.push(`${p.name}: ${a} · ${info.label} (+${info.depth} м)`);let n=next(r,s.id);if(!n)return end(r,p);r.currentId=n.id;r.topic=topics[Math.floor(Math.random()*topics.length)];r.endsAt=Date.now()+20000;r.timer=setTimeout(()=>explode(r.code),20000);cb?.({ok:true,tier,depth:info.depth,label:info.label});send(r);});
 s.on("leaveRoom",()=>leave(s));s.on("disconnect",()=>leave(s));
});
server.listen(PORT,()=>console.log(`Abyss Axolotl: http://localhost:${PORT}`));
