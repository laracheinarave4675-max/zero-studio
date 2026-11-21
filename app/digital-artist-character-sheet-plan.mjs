// ZERO STUDIO — real character-sheet brush test.
// The geometry below is an artist-authored approximation measured against the
// selected 1280x720 gallery reference. It contains no embedded source pixels.
export function createDigitalArtistCharacterSheetPlan(){
 const layers={
  construction:{id:"construction",name:"01 · Construction",role:"construction",visible:false,strokes:[]},
  rough:{id:"rough",name:"02 · Rough drawing",role:"rough-sketch",visible:false,strokes:[]},
  flats:{id:"flats",name:"03 · Flat colors",role:"flat-color",strokes:[]},
  ink:{id:"ink",name:"04 · Clean line art",role:"clean-line",strokes:[]},
  shadow:{id:"shadow",name:"05 · Cel shadows",role:"shadow",strokes:[]},
  highlight:{id:"highlight",name:"06 · Highlights",role:"highlight",strokes:[]},
  detail:{id:"detail",name:"07 · Costume and face details",role:"detail",strokes:[]}
 };
 let serial=0;
 const pointList=values=>values.map(([x,y],i)=>({x,y,pressure:i===0||i===values.length-1?.24:.52+(i%3)*.12}));
 const poly=(layer,id,intent,color,values,opacity=1)=>layers[layer].strokes.push({id,intent,kind:"region-fill",color,opacity,points:pointList(values),seed:serial++});
 const line=(layer,id,intent,brush,color,size,values,extra={})=>layers[layer].strokes.push({id,intent,brush,color,size,points:pointList(values),texture:brush==="ink"?.05:.32,seed:serial++,...extra});
 const map=(cx,pts)=>pts.map(([x,y])=>[cx+x,y]);
 const hair="#25232c",hairHi="#51414a",ink="#352b35",skin="#f5d7c8",skinShadow="#dbaeb0",ivory="#fff4e7",rose="#e6a0a5",roseDeep="#c96f83",obi="#d77f91",gold="#b88b54";
 const views=[{cx:420,id:"front"},{cx:960,id:"side"},{cx:1500,id:"back"}];
 // Construction guides and gesture paths: kept in the project but hidden in the final composite.
 for(const v of views){
  line("construction",v.id+"-axis","Establish the center axis and full-body proportions.","graphite","#aaa3a6",3,map(v.cx,[[0,35],[0,180],[0,430],[0,700],[0,970]]));
  line("construction",v.id+"-head-guide","Block the head-to-body ratio before inking.","graphite","#aaa3a6",3,map(v.cx,[[-82,190],[-65,95],[0,55],[65,95],[82,190],[60,295],[0,335],[-60,295],[-82,190]]));
  line("rough",v.id+"-gesture","Establish the weight line through the kimono silhouette.","graphite","#8f8990",6,map(v.cx,[[0,300],[4,470],[-2,680],[0,950]]));
 }
 // FRONT — face, long side locks, wide kimono sleeves, pink obi and floral details.
 const c=420;
 poly("flats","front-hair-mass","Lay in the long dark hair mass behind the face.",hair,map(c,[[-86,215],[-105,140],[-76,66],[-25,35],[35,38],[85,85],[105,160],[94,330],[91,560],[65,755],[36,790],[20,620],[0,475],[-20,620],[-38,790],[-68,755],[-93,560],[-98,340]]));
 poly("flats","front-face","Fill the warm face shape inside the hairline.",skin,map(c,[[-58,142],[-40,108],[0,96],[42,110],[60,148],[58,224],[42,285],[0,321],[-42,285],[-58,224]]));
 poly("flats","front-neck","Fill the visible neck below the jaw.",skin,map(c,[[-24,285],[24,285],[29,365],[0,388],[-29,365]]));
 poly("flats","front-kimono-body","Fill the ivory kimono body and broad skirt.",ivory,map(c,[[-38,340],[-78,365],[-116,448],[-92,500],[-65,468],[-70,555],[-102,720],[-112,920],[-72,970],[0,990],[72,970],[112,920],[102,720],[70,555],[65,468],[92,500],[116,448],[78,365],[38,340],[0,390]]));
 poly("flats","front-left-sleeve","Fill the left flowing kimono sleeve.",ivory,map(c,[[-72,365],[-118,390],[-145,490],[-120,545],[-82,520],[-60,445]]));
 poly("flats","front-right-sleeve","Fill the right flowing kimono sleeve.",ivory,map(c,[[72,365],[118,390],[145,490],[120,545],[82,520],[60,445]]));
 poly("flats","front-left-cuff","Color the left sleeve cuff rose pink.",rose,map(c,[[-145,490],[-120,545],[-82,520],[-72,545],[-112,578],[-153,540]]));
 poly("flats","front-right-cuff","Color the right sleeve cuff rose pink.",rose,map(c,[[145,490],[120,545],[82,520],[72,545],[112,578],[153,540]]));
 poly("flats","front-obi","Fill the wide rose-pink obi around the waist.",obi,map(c,[[-72,520],[72,520],[82,588],[58,608],[-58,608],[-82,588]]));
 poly("flats","front-obi-knot","Fill the tied bow at the back edge of the visible obi.",roseDeep,map(c,[[58,535],[100,520],[116,555],[92,585],[62,570]]));
 poly("flats","front-hem-gradient","Lay in the rose gradient at the lower kimono hem.",rose,map(c,[[-110,855],[-76,882],[0,894],[76,882],[110,855],[112,920],[72,970],[0,990],[-72,970],[-112,920]]));
 poly("flats","front-hem-deep","Deepen the pink edge along the hem.",roseDeep,map(c,[[-112,930],[-72,970],[0,990],[72,970],[112,930],[100,955],[65,985],[0,1004],[-65,985],[-100,955]]));
 poly("flats","front-sandals","Paint both sandals beneath the hem.",roseDeep,map(c,[[-48,970],[-12,970],[-9,1015],[-56,1015],[-60,1000]]));
 poly("flats","front-sandal-right","Paint the second sandal.",roseDeep,map(c,[[12,970],[48,970],[60,1000],[56,1015],[9,1015]]));
 // Front hair fringe and face features.
 poly("flats","front-bang-left","Fill the left fringe lock.",hair,map(c,[[-88,150],[-65,88],[-18,66],[-12,185],[-34,166],[-55,190]]));
 poly("flats","front-bang-center","Fill the central pointed fringe lock.",hair,map(c,[[-28,72],[22,62],[50,100],[20,205],[0,170],[-12,145]]));
 poly("flats","front-bang-right","Fill the right fringe lock.",hair,map(c,[[42,90],[83,120],[96,185],[57,202],[45,155]]));
 poly("flats","front-eye-left-white","Fill left sclera.", "#fffdf9",map(c,[[-49,205],[-36,190],[-15,194],[-8,210],[-24,220],[-43,218]]));
 poly("flats","front-eye-right-white","Fill right sclera.","#fffdf9",map(c,[[8,210],[15,194],[36,190],[49,205],[43,218],[24,220]]));
 poly("flats","front-eye-left-iris","Paint the left dark iris.", "#65463d",map(c,[[-39,196],[-25,190],[-15,202],[-17,222],[-29,226],[-40,214]]));
 poly("flats","front-eye-right-iris","Paint the right dark iris.","#65463d",map(c,[[15,202],[25,190],[39,196],[40,214],[29,226],[17,222]]));
 poly("flats","front-eye-left-pupil","Paint the left pupil.", "#211f28",map(c,[[-29,196],[-21,196],[-21,222],[-29,224]]));
 poly("flats","front-eye-right-pupil","Paint the right pupil.","#211f28",map(c,[[21,196],[29,196],[29,224],[21,222]]));
 // SIDE — visible profile, swept hair, narrow body silhouette and same costume palette.
 const s=960;
 poly("flats","side-hair-mass","Fill the long hair mass flowing behind the profile.",hair,map(s,[[-30,92],[18,45],[72,66],[100,130],[93,250],[88,440],[65,630],[20,690],[-18,650],[-38,470],[-42,260]]));
 poly("flats","side-face-profile","Fill the side-view face profile.",skin,map(s,[[-34,132],[8,115],[40,135],[48,166],[68,190],[52,208],[51,250],[24,292],[-15,300],[-40,260],[-48,190]]));
 poly("flats","side-neck","Fill the side-view neck.",skin,map(s,[[-20,275],[22,275],[24,350],[-8,378],[-28,345]]));
 poly("flats","side-kimono","Fill the side-view ivory kimono silhouette.",ivory,map(s,[[-25,345],[-68,375],[-92,470],[-64,540],[-42,500],[-44,620],[-70,850],[-65,960],[-10,990],[48,970],[74,900],[54,700],[38,545],[58,480],[42,390],[18,350]]));
 poly("flats","side-sleeve","Fill the visible side sleeve.",ivory,map(s,[[22,380],[76,410],[100,500],[68,560],[42,525],[35,450]]));
 poly("flats","side-sleeve-cuff","Paint the pink side sleeve cuff.",rose,map(s,[[100,500],[68,560],[42,525],[35,548],[73,585],[112,530]]));
 poly("flats","side-obi","Paint the pink obi seen in profile.",obi,map(s,[[-56,535],[52,535],[62,596],[-42,605],[-64,580]]));
 poly("flats","side-hem","Paint the rose gradient at the side-view hem.",rose,map(s,[[-65,860],[-40,890],[45,890],[74,860],[74,930],[48,970],[-10,990],[-65,960]]));
 poly("flats","side-sandal","Paint the visible sandal.",roseDeep,map(s,[[-30,970],[26,970],[45,1000],[38,1016],[-42,1016],[-48,1000]]));
 poly("flats","side-fringe","Fill the sweeping fringe over the profile.",hair,map(s,[[-36,140],[-15,85],[35,65],[68,100],[34,155],[18,195],[0,178]]));
 poly("flats","side-eye-white","Fill the visible eye.", "#fffdf9",map(s,[[18,192],[31,186],[42,194],[34,205],[21,204]]));
 poly("flats","side-eye-iris","Paint the side-view iris.","#65463d",map(s,[[28,190],[38,191],[37,205],[28,205]]));
 // BACK — hair covers the nape; rear collar, sash and kimono folds remain visible.
 const b=1500;
 poly("flats","back-hair-mass","Fill the back hair silhouette from crown to mid-back.",hair,map(b,[[-90,210],[-105,130],[-70,62],[-20,35],[38,45],[86,92],[105,165],[96,320],[88,500],[62,590],[0,610],[-62,590],[-88,500],[-96,320]]));
 poly("flats","back-kimono","Fill the ivory rear kimono silhouette.",ivory,map(b,[[-42,330],[-88,370],[-126,470],[-95,535],[-65,490],[-76,620],[-112,900],[-108,960],[0,995],[108,960],[112,900],[76,620],[65,490],[95,535],[126,470],[88,370],[42,330],[0,380]]));
 poly("flats","back-left-sleeve","Fill the left rear sleeve.",ivory,map(b,[[-82,370],[-126,420],[-150,500],[-116,558],[-78,520]]));
 poly("flats","back-right-sleeve","Fill the right rear sleeve.",ivory,map(b,[[82,370],[126,420],[150,500],[116,558],[78,520]]));
 poly("flats","back-left-cuff","Color the left rear cuff pink.",rose,map(b,[[-150,500],[-116,558],[-78,520],[-95,580],[-142,555]]));
 poly("flats","back-right-cuff","Color the right rear cuff pink.",rose,map(b,[[150,500],[116,558],[78,520],[95,580],[142,555]]));
 poly("flats","back-obi","Fill the rear obi band.",obi,map(b,[[-78,520],[78,520],[82,595],[-82,595]]));
 poly("flats","back-obi-bow","Fill the broad tied obi bow at the rear.",roseDeep,map(b,[[-35,540],[0,525],[35,540],[58,600],[0,635],[-58,600]]));
 poly("flats","back-hem","Paint the pink gradient on the lower rear hem.",rose,map(b,[[-112,860],[-70,890],[70,890],[112,860],[112,930],[70,980],[0,995],[-70,980],[-112,930]]));
 poly("flats","back-fringe","Fill the upper rear hair layers.",hairHi,map(b,[[-80,130],[-25,55],[45,66],[84,120],[40,170],[0,155],[-40,175]]));
 // Clean line art: outer contours, face, costume seams and flowing hair.
 for(const v of views){
  const cx=v.cx,id=v.id;
  if(id==="front"){
   line("ink","front-hair-outline","Ink the outer silhouette of the long front-view hair.","ink",ink,9,map(cx,[[-86,215],[-105,140],[-76,66],[-25,35],[35,38],[85,85],[105,160],[94,330],[91,560],[65,755],[36,790]]));
   line("ink","front-face-outline","Ink cheeks, jaw and chin with a soft anime contour.","ink",ink,6,map(cx,[[-58,142],[-58,224],[-42,285],[0,321],[42,285],[58,224],[58,148]]));
   line("ink","front-fringe-left","Ink the left fringe lock.","ink",ink,7,map(cx,[[-88,150],[-65,88],[-18,66],[-12,185],[-34,166],[-55,190]]));
   line("ink","front-fringe-center","Ink the central fringe lock.","ink",ink,7,map(cx,[[-28,72],[22,62],[50,100],[20,205],[0,170],[-12,145]]));
   line("ink","front-fringe-right","Ink the right fringe lock.","ink",ink,7,map(cx,[[42,90],[83,120],[96,185],[57,202],[45,155]]));
   line("ink","front-left-eye","Ink the left expressive eye.","ink",ink,5,map(cx,[[-49,205],[-36,190],[-15,194],[-8,210],[-24,220],[-43,218]]));
   line("ink","front-right-eye","Ink the right expressive eye.","ink",ink,5,map(cx,[[8,210],[15,194],[36,190],[49,205],[43,218],[24,220]]));
   line("ink","front-nose","Suggest the nose with a restrained anime mark.","ink","#9d7376",3,map(cx,[[2,230],[0,246],[7,249]]));
   line("ink","front-mouth","Draw the small mouth.","ink","#985e68",3,map(cx,[[-10,272],[0,277],[10,272]]));
   line("ink","front-neck-lines","Ink both sides of the neck.","ink",ink,4,map(cx,[[-24,285],[-24,350],[0,370],[24,350],[24,285]]));
   line("ink","front-kimono-outline","Ink the robe silhouette and long hem.","ink",ink,7,map(cx,[[-38,340],[-78,365],[-116,448],[-92,500],[-65,468],[-70,555],[-102,720],[-112,920],[-72,970],[0,990],[72,970],[112,920],[102,720],[70,555],[65,468],[92,500],[116,448],[78,365],[38,340]]));
   line("ink","front-sleeve-left-outline","Ink left sleeve edge.","ink",ink,6,map(cx,[[-72,365],[-118,390],[-145,490],[-120,545],[-82,520]]));
   line("ink","front-sleeve-right-outline","Ink right sleeve edge.","ink",ink,6,map(cx,[[72,365],[118,390],[145,490],[120,545],[82,520]]));
   line("ink","front-obi-outline","Ink the obi and its folded knot.","ink",ink,5,map(cx,[[-72,520],[72,520],[82,588],[58,608],[-58,608],[-82,588],[-72,520]]));
   line("ink","front-collar-left","Ink the left overlapping collar.","ink",ink,5,map(cx,[[-42,340],[-16,408],[0,430]]));
   line("ink","front-collar-right","Ink the right overlapping collar.","ink",ink,5,map(cx,[[42,340],[16,408],[0,430]]));
   line("ink","front-hem-line","Define the lower pink hem.","ink",ink,4,map(cx,[[-110,855],[-76,882],[0,894],[76,882],[110,855]]));
   line("ink","front-sandals-outline","Ink both sandals and toes.","ink",ink,4,map(cx,[[-48,970],[-56,1015],[-9,1015],[12,970],[56,1015],[9,1015]]));
  }else if(id==="side"){
   line("ink","side-hair-outline","Ink the rear hair silhouette in profile.","ink",ink,8,map(cx,[[-30,92],[18,45],[72,66],[100,130],[93,250],[88,440],[65,630],[20,690],[-18,650],[-38,470]]));
   line("ink","side-face-outline","Ink the nose, lips, chin and profile jaw.","ink",ink,5,map(cx,[[-34,132],[8,115],[40,135],[48,166],[68,190],[52,208],[51,250],[24,292],[-15,300],[-40,260],[-48,190]]));
   line("ink","side-fringe-outline","Ink the swept profile fringe.","ink",ink,6,map(cx,[[-36,140],[-15,85],[35,65],[68,100],[34,155],[18,195],[0,178]]));
   line("ink","side-eye-outline","Ink the visible eye and brow.","ink",ink,4,map(cx,[[18,192],[31,186],[42,194],[34,205],[21,204]]));
   line("ink","side-mouth","Ink the profile mouth.","ink","#985e68",3,map(cx,[[48,238],[57,242],[52,247]]));
   line("ink","side-neck-outline","Ink the neck joining the collar.","ink",ink,5,map(cx,[[-20,275],[-20,345],[-8,378],[24,350],[22,275]]));
   line("ink","side-kimono-outline","Ink the narrow side-view kimono silhouette.","ink",ink,7,map(cx,[[-25,345],[-68,375],[-92,470],[-64,540],[-42,500],[-44,620],[-70,850],[-65,960],[-10,990],[48,970],[74,900],[54,700],[38,545],[58,480],[42,390],[18,350]]));
   line("ink","side-sleeve-outline","Ink the visible sleeve and cuff.","ink",ink,6,map(cx,[[22,380],[76,410],[100,500],[68,560],[42,525]]));
   line("ink","side-obi-outline","Ink the obi band.","ink",ink,4,map(cx,[[-56,535],[52,535],[62,596],[-42,605],[-64,580]]));
   line("ink","side-hem-outline","Ink the hem and sandal.","ink",ink,5,map(cx,[[-65,860],[-40,890],[45,890],[74,860],[74,930],[48,970],[-10,990],[-65,960]]));
  }else{
   line("ink","back-hair-outline","Ink the rear silhouette of the long hair.","ink",ink,8,map(cx,[[-90,210],[-105,130],[-70,62],[-20,35],[38,45],[86,92],[105,165],[96,320],[88,500],[62,590],[0,610],[-62,590],[-88,500],[-96,320]]));
   line("ink","back-kimono-outline","Ink the back view of the kimono.","ink",ink,7,map(cx,[[-42,330],[-88,370],[-126,470],[-95,535],[-65,490],[-76,620],[-112,900],[-108,960],[0,995],[108,960],[112,900],[76,620],[65,490],[95,535],[126,470],[88,370],[42,330]]));
   line("ink","back-sleeves-outline","Ink both back-view sleeves.","ink",ink,6,map(cx,[[-82,370],[-126,420],[-150,500],[-116,558],[-78,520],[78,520],[116,558],[150,500],[126,420],[82,370]]));
   line("ink","back-obi-outline","Ink the rear obi band and bow.","ink",ink,5,map(cx,[[-78,520],[78,520],[82,595],[58,600],[0,635],[-58,600],[-82,595],[-78,520]]));
   line("ink","back-hem-outline","Ink the lower hem.","ink",ink,5,map(cx,[[-112,860],[-70,890],[70,890],[112,860],[112,930],[70,980],[0,995],[-70,980],[-112,930]]));
  }
 }
 // Shared hair flow, cloth folds, floral motifs and cel shading.
 for(const v of views){
  const cx=v.cx,id=v.id;
  for(let i=0;i<5;i++){
   const x=-65+i*32;
   line("detail",id+"-hair-strand-"+i,"Draw a separate tapered strand following the hair flow.","ink",hairHi,2.6,map(cx,[[x,105],[x+8,210],[x+6,360],[x+12,520],[x+4,650]]),{opacity:.8});
  }
  for(let i=0;i<4;i++){
   const x=-48+i*32;
   line("detail",id+"-robe-fold-"+i,"Draw a fine fold in the ivory kimono fabric.","gouache","#c9b7ae",2.5,map(cx,[[x,625],[x+8,740],[x+4,850],[x+10,925]]),{opacity:.75});
  }
 }
 // Face blush and soft cel shadows.
 for(const x of [420]){
  line("shadow","front-cheek-shadow-left","Shade the left cheek softly.","watercolor",skinShadow,18,map(x,[[-48,248],[-38,260],[-25,258]]),{opacity:.55});
  line("shadow","front-cheek-shadow-right","Shade the right cheek softly.","watercolor",skinShadow,18,map(x,[[25,258],[38,260],[48,248]]),{opacity:.55});
 }
 line("shadow","front-neck-shadow","Add a soft shadow beneath the chin.","watercolor",skinShadow,24,map(420,[[-20,320],[0,334],[20,320]]),{opacity:.55});
 line("shadow","front-hair-shadow","Deepen the shadow beneath the bangs.","gouache","#55414a",12,map(420,[[-48,160],[-20,178],[0,184],[26,175],[48,158]]),{opacity:.62});
 for(const cx of [420,960,1500]){
  line("shadow","obi-shadow-"+cx,"Add a darker crease beneath the obi.","watercolor","#a85f76",14,map(cx,[[-65,592],[0,600],[65,592]]),{opacity:.45});
  line("highlight","kimono-light-"+cx,"Brush a soft highlight down the ivory fabric.","watercolor","#fffdf7",12,map(cx,[[-18,650],[-10,760],[-14,870]]),{opacity:.55});
  line("highlight","hair-light-"+cx,"Add a narrow reflected highlight in the black hair.","watercolor","#8a7477",5,map(cx,[[-45,105],[-40,190],[-42,290]]),{opacity:.48});
 }
 // White glints and small floral motifs: petals are individually drawn strokes.
 for(const eye of [{cx:420,x:-24},{cx:420,x:24},{cx:960,x:34}]){
  line("highlight","eye-glint-"+eye.cx+"-"+eye.x,"Place a clean catchlight in the iris.","gouache","#fffdf7",5,map(eye.cx,[[eye.x-3,198],[eye.x,195],[eye.x+3,198]]),{opacity:1,texture:.08});
 }
 const flower=(cx,cy,id,scale=1)=>{
  const petalColor="#d77d91";
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5-Math.PI/2,px=Math.cos(a)*9*scale,py=Math.sin(a)*9*scale;
   line("detail",id+"-petal-"+i,"Paint one individual petal in the kimono floral motif.","gouache",petalColor,5*scale,[[cx+px-2*scale,cy+py-2*scale],[cx+px,cy+py],[cx+px+2*scale,cy+py+2*scale]],{opacity:.9,texture:.2});
  }
  line("detail",id+"-center","Dot the center of the flower motif.","gouache",gold,4*scale,[[cx,cy]],{opacity:1,texture:.1});
 };
 flower(370,700,"front-flower-left",1);flower(462,790,"front-flower-right",.85);
 flower(920,760,"side-flower",.8);flower(1545,760,"back-flower-left",.9);flower(1460,840,"back-flower-right",.75);
 // Sleeve edges, sash folds, hair tips and shoe straps.
 for(const cx of [420,960,1500]){
  line("detail","obi-weave-"+cx,"Add fine horizontal obi fabric folds.","ink","#f0b4bb",2,map(cx,[[-58,550],[-25,555],[10,552],[52,558]]),{opacity:.8});
  line("detail","kimono-seam-"+cx,"Add a subtle inner collar seam.","ink","#c9aaa4",2,map(cx,[[-25,360],[0,420],[25,360]]),{opacity:.8});
 }
 return{
  format:"zero-studio-digital-artist-brush-plan",version:1,
  title:"Selected kimono character — three-view native raster brush study",
  identity:{characterAssetId:"be172712-e073-4d06-9587-eec7e6c62a84"},
  layers:Object.values(layers)
 };
}
