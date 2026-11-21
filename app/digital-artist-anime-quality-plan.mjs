const pt = (values) => values.map(([x,y], i) => ({ x, y, pressure: i === 0 || i === values.length - 1 ? 0.22 : 0.62 + (i % 4) * 0.08 }));
const bezier = (a,b,c,d,n=12) => Array.from({length:n+1},(_,i) => {
  const t=i/n, u=1-t;
  return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];
});
const join = (...parts) => parts.flatMap((part,i)=>i?part.slice(1):part);
const line = (id,intent,brush,color,size,points,extra={}) => ({id,intent,brush,color,size,points:pt(points),...extra});
const fill = (id,intent,color,points,extra={}) => ({id,intent,kind:"region-fill",color,points:pt(points),...extra});
const shape = (id,intent,color,parts,extra={}) => fill(id,intent,color,join(...parts),extra);
const outline = (id,intent,points,size=7,color="#302538") => line(id,intent,"ink",color,size,points,{texture:0});

export function createDigitalArtistAnimeQualityPlan() {
  const hairBack = join(
    bezier([720,430],[620,170],[820,75],[970,92],18),
    bezier([970,92],[1160,55],[1300,205],[1305,420],18),
    bezier([1305,420],[1335,650],[1290,875],[1190,1000],18),
    bezier([1190,1000],[1040,1040],[820,1040],[700,1000],16),
    bezier([700,1000],[620,850],[620,650],[650,520],14),
    bezier([650,520],[665,465],[690,440],[720,430],8)
  );
  const faceJaw = join(
    bezier([790,390],[785,510],[835,650],[920,710],16),
    bezier([920,710],[950,735],[985,735],[1015,710],10),
    bezier([1015,710],[1090,650],[1140,510],[1135,390],16)
  );
  const face = join(
    bezier([790,340],[850,260],[1070,250],[1135,350],16),
    bezier([1135,350],[1140,535],[1080,690],[970,735],18),
    bezier([970,735],[850,710],[780,560],[790,340],18)
  );
  const fringeLeft = join(bezier([700,410],[680,230],[820,120],[960,125],16),bezier([960,125],[925,250],[890,350],[835,440],12),bezier([835,440],[790,410],[750,400],[700,410],8));
  const fringeMid = join(bezier([860,150],[970,80],[1110,150],[1160,300],16),bezier([1160,300],[1100,340],[1050,390],[1010,470],12),bezier([1010,470],[970,380],[920,300],[860,150],12));
  const fringeRight = join(bezier([1080,175],[1220,230],[1280,390],[1200,500],16),bezier([1200,500],[1150,430],[1120,365],[1090,310],10));
  const leftHairClip = join(bezier([650,350],[620,500],[650,760],[800,1010],18),bezier([800,1010],[700,950],[625,800],[625,620],14),bezier([625,620],[615,480],[625,390],[650,350],10));
  const rightHairClip = join(bezier([1180,330],[1280,470],[1310,720],[1180,1010],18),bezier([1180,1010],[1290,930],[1330,760],[1320,590],14),bezier([1320,590],[1310,450],[1250,360],[1180,330],10));
  const shoulder = join(
    bezier([890,700],[820,745],[700,750],[600,900],18),
    bezier([600,900],[530,1000],[610,1060],[760,1070],16),
    bezier([760,1070],[960,1090],[1160,1070],[1360,1060],16),
    bezier([1360,1060],[1510,1010],[1450,900],[1340,820],16),
    bezier([1340,820],[1240,745],[1120,740],[1050,700],14),
    bezier([1050,700],[1000,790],[940,790],[890,700],10)
  );
  const neckClip = join(bezier([875,670],[880,750],[850,805],[815,835],12),bezier([815,835],[940,900],[1060,875],[1110,820],12),bezier([1110,820],[1050,770],[1040,720],[1045,670],12));
  const leftEye = join(bezier([810,455],[850,405],[920,410],[950,460],10),bezier([950,460],[925,515],[850,520],[810,455],10));
  const rightEye = join(bezier([990,460],[1025,405],[1095,405],[1135,455],10),bezier([1135,455],[1100,520],[1025,515],[990,460],10));
  const layers = [
    {id:"background",name:"01 Background and atmosphere",role:"construction",strokes:[
      fill("bg-warm-field","Lay a calm warm background field.","#f5e8df",[[0,0],[1920,0],[1920,1080],[0,1080]]),
      line("bg-halo","Paint a soft circular halo behind the portrait.","watercolor","#f4c8bd",180,join(bezier([960,35],[1270,35],[1370,210],[1330,390],18),bezier([1330,390],[1280,560],[1120,620],[960,610],18),bezier([960,610],[800,620],[640,560],[590,390],18),bezier([590,390],[550,210],[650,35],[960,35],18)),{opacity:.34,texture:.4})
    ]},
    {id:"hair-base",name:"02 Hair silhouette",role:"rough-sketch",strokes:[
      fill("hair-back-mass","Establish one flowing rear hair mass with a tapered silhouette.","#292438",hairBack),
      fill("hair-left-fall","Separate the left falling hair ribbon.","#30283f",join(bezier([720,390],[665,560],[700,800],[810,990],14),bezier([810,990],[750,940],[680,850],[660,720],12),bezier([660,720],[630,560],[660,440],[720,390],12))),
      fill("hair-right-fall","Separate the right falling hair ribbon.","#302438",join(bezier([1190,390],[1280,560],[1270,810],[1140,990],14),bezier([1140,990],[1210,920],[1300,790],[1300,650],12),bezier([1300,650],[1310,510],[1250,420],[1190,390],12))),
      fill("hair-fringe-left","Build the left swept fringe lock.","#30263b",fringeLeft),
      fill("hair-fringe-mid","Build the central tapered fringe lock.","#272235",fringeMid),
      fill("hair-fringe-right","Build the right swept fringe lock.","#342a42",fringeRight)
    ]},
    {id:"skin-flats",name:"03 Skin and facial planes",role:"flat-color",strokes:[
      fill("face-base","Fill the face with a clean warm skin tone.","#f4cbb7",face),
      fill("neck-base","Connect jaw and shoulders with a believable neck.","#efbda9",neckClip),
      fill("ear-left","Place the left ear inside the hair silhouette.","#efbda9",join(bezier([790,480],[730,440],[720,520],[790,575],10),bezier([790,575],[815,550],[810,505],[790,480],8))),
      fill("ear-right","Place the right ear inside the hair silhouette.","#efbda9",join(bezier([1130,475],[1190,435],[1210,510],[1135,575],10),bezier([1135,575],[1110,545],[1110,500],[1130,475],8)))
    ]},
    {id:"clothing-flats",name:"04 Clothing silhouette and panels",role:"flat-color",strokes:[
      fill("shoulder-clothing","Block the full shoulder and collar silhouette.","#d9d6e8",shoulder),
      fill("collar-inner","Create a layered collar with a visible overlap.","#fff0e6",join(bezier([865,735],[900,815],[940,860],[970,875],10),bezier([970,875],[1000,850],[1040,800],[1080,735],10),bezier([1080,735],[1050,900],[1010,970],[970,980],10),bezier([970,980],[925,950],[890,870],[865,735],10))),
      fill("bodice-panel","Add a deep plum central garment panel.","#6b526f",[[780,865],[890,820],[970,900],[1050,820],[1170,865],[1260,1050],[690,1050]]),
      fill("sleeve-left","Shape the left sleeve with a soft flared edge.","#c5b9dc",join(bezier([650,860],[560,890],[550,980],[640,1030],12),bezier([640,1030],[720,1000],[760,940],[790,900],10))),
      fill("sleeve-right","Shape the right sleeve with a soft flared edge.","#c5b9dc",join(bezier([1290,850],[1390,880],[1420,980],[1320,1030],12),bezier([1320,1030],[1240,1000],[1200,940],[1170,900],10)))
    ]},
    {id:"features",name:"05 Anime facial features",role:"flat-color",strokes:[
      fill("eye-left-white","Place the left sclera inside its eyelid.","#fff8f0",leftEye),
      fill("eye-right-white","Place the right sclera inside its eyelid.","#fff8f0",rightEye),
      fill("iris-left","Build a large amber iris clipped to the left sclera.","#a65f52",join(bezier([850,430],[880,410],[925,430],[925,475],10),bezier([925,475],[920,520],[875,525],[850,490],10),bezier([850,490],[840,465],[842,445],[850,430],8)),{clipPolygon:leftEye}),
      fill("iris-right","Build the matching amber iris clipped to the right sclera.","#a65f52",join(bezier([1020,430],[1050,410],[1095,430],[1095,475],10),bezier([1095,475],[1090,520],[1045,525],[1020,490],10),bezier([1020,490],[1010,465],[1012,445],[1020,430],8)),{clipPolygon:rightEye}),
      fill("pupil-left","Set a rounded dark pupil into the left iris, clipped to the sclera.","#34273c",join(bezier([872,448],[872,430],[900,430],[902,450],8),bezier([902,450],[904,480],[900,502],[887,507],8),bezier([887,507],[875,500],[870,475],[872,448],8)),{clipPolygon:leftEye}),
      fill("pupil-right","Set a rounded dark pupil into the right iris, clipped to the sclera.","#34273c",join(bezier([1042,448],[1042,430],[1070,430],[1072,450],8),bezier([1072,450],[1074,480],[1070,502],[1057,507],8),bezier([1057,507],[1045,500],[1040,475],[1042,448],8)),{clipPolygon:rightEye}),
      fill("glint-left","Add reflected lights clipped to the left sclera.","#fffdf8",[[858,440],[875,432],[884,445],[878,458]],{clipPolygon:leftEye}),
      fill("glint-right","Add reflected lights clipped to the right sclera.","#fffdf8",[[1028,440],[1045,432],[1054,445],[1048,458]],{clipPolygon:rightEye}),
      fill("iris-shade-left","Add a warm lower iris shade inside the left eye.","#874b4d",[[850,480],[875,495],[900,498],[925,478],[918,515],[880,522],[855,505]],{opacity:.55,clipPolygon:leftEye}),
      fill("iris-shade-right","Add a warm lower iris shade inside the right eye.","#874b4d",[[1020,480],[1045,495],[1070,498],[1095,478],[1088,515],[1050,522],[1025,505]],{opacity:.55,clipPolygon:rightEye})
    ]},
    {id:"ink",name:"06 Clean anime line art",role:"clean-line",strokes:[
      outline("face-ink","Ink the open cheek and chin contour without drawing a line across the forehead.",faceJaw,6),
      line("hair-top-contour","Ink only the visible outer crown contour.","ink","#302538",8,join(bezier([720,430],[620,170],[820,75],[970,92],18),bezier([970,92],[1160,55],[1300,205],[1305,420],18)),{opacity:.96}),\n      line("hair-left-contour","Ink the visible left outer hair edge above the shoulder.","ink","#302538",8,join(bezier([720,430],[665,465],[635,560],[635,680],12)),{opacity:.96,clipPolygon:leftHairClip}),\n      line("hair-right-contour","Ink the visible right outer hair edge above the shoulder.","ink","#302538",8,join(bezier([1305,420],[1325,500],[1325,600],[1310,690],12)),{opacity:.96,clipPolygon:rightHairClip}),
      line("hair-crown-seam-left","Define the crown flow without crossing the face.","ink","#40334e",4,join(bezier([730,290],[750,205],[825,145],[905,135],12)),{opacity:.9,clipPolygon:hairBack}),
      line("hair-crown-seam-right","Define the opposite crown flow within the hair mass.","ink","#40334e",4,join(bezier([1015,135],[1110,145],[1195,220],[1225,310],12)),{opacity:.9,clipPolygon:hairBack}),
      outline("shoulder-ink","Ink the clothing silhouette with tapered pressure.",shoulder,7),
      outline("eye-left-ink","Ink the expressive left eyelid.",leftEye,7),
      outline("eye-right-ink","Ink the expressive right eyelid.",rightEye,7),
      line("eye-left-lash","Extend the outer left lashes.","ink","#282236",5,[[815,460],[795,445],[782,428]]),
      line("eye-right-lash","Extend the outer right lashes.","ink","#282236",5,[[1130,455],[1150,438],[1165,420]]),
      line("brow-left","Place the left expressive eyebrow above the left eye.","ink","#55404b",5,[[820,390],[860,375],[920,385]]),
      line("brow-right","Place the right expressive eyebrow above the right eye.","ink","#55404b",5,[[1010,385],[1070,375],[1110,390]]),
      line("nose","Suggest the nose with two delicate marks.","ink","#bd827f",3,[[975,500],[965,545],[980,548]]),
      line("mouth","Draw a small confident smile.","ink","#9c5364",4,[[935,620],[965,632],[995,620]]),
      line("ear-details","Add restrained inner-ear contours.","ink","#b47778",3,[[765,490],[780,515],[770,535],[790,540],[800,520]]),
      line("collar-ink","Clarify the overlapping collar edge.","ink","#55435c",5,[[865,735],[930,830],[970,875],[1010,830],[1080,735]])
    ]},
    {id:"cel-shadows",name:"07 Cel shadows",role:"shadow",strokes:[
      fill("face-shadow","Place a deliberate shadow plane under the fringe, clipped to skin.","#d99f9d",[[795,365],[900,395],[970,390],[1050,390],[1130,365],[1110,445],[1060,470],[970,455],[870,475],[810,440]],{opacity:.62,clipPolygon:face}),
      fill("jaw-shadow","Add a compact jaw shadow following the chin, clipped to skin.","#d99a99",[[835,620],[900,690],[970,720],[1040,690],[1100,620],[1070,680],[970,750],[870,680]],{opacity:.48,clipPolygon:face}),
      fill("neck-shadow","Give the neck a readable cast shadow, clipped to the neck.","#c98791",[[875,700],[970,750],[1050,700],[1040,795],[970,835],[890,790]],{opacity:.58,clipPolygon:neckClip}),
      fill("hair-shadow-left","Add a cool shadow ribbon clipped to the left hair mass.","#171d31",[[690,430],[750,490],[760,720],[825,940],[780,900],[710,740]],{opacity:.68,clipPolygon:leftHairClip}),
      fill("garment-shadow","Create an under-collar shadow clipped to the clothing silhouette.","#493c5d",[[850,840],[970,900],[1090,840],[1160,1000],[970,1040],[780,1000]],{opacity:.72,clipPolygon:shoulder})
    ]},
    {id:"hair-light",name:"08 Hair flow and highlights",role:"highlight",strokes:[
      line("hair-ribbon-left","Paint a long curved reflected ribbon clipped to the left hair mass.","gouache","#8d829d",12,join(bezier([680,330],[655,500],[665,700],[700,850],16)),{opacity:.62,texture:.2,clipPolygon:leftHairClip}),
      line("hair-ribbon-mid","Paint a fine highlight following the crown inside the hair silhouette.","gouache","#9c8da9",8,join(bezier([900,125],[850,155],[820,195],[800,235],14)),{opacity:.62,texture:.18,clipPolygon:hairBack}),
      line("hair-ribbon-right","Paint a tapered highlight clipped to the right hair mass.","gouache","#81768f",11,join(bezier([1240,320],[1270,500],[1260,720],[1210,870],16)),{opacity:.62,texture:.2,clipPolygon:rightHairClip}),
      line("hair-strands-left","Add fine directional strands inside the left hair mass.","ink","#554b65",2,join(bezier([675,430],[655,570],[685,730],[750,865],14)),{opacity:.65,clipPolygon:leftHairClip}),
      line("hair-strands-right","Add fine directional strands inside the right hair mass.","ink","#554b65",2,join(bezier([1240,430],[1280,580],[1260,740],[1200,865],14)),{opacity:.65,clipPolygon:rightHairClip})
    ]},
    {id:"fabric-folds",name:"09 Fabric folds and finish",role:"detail",strokes:[
      line("fold-left-1","Describe the left sleeve fold with a tapered line.","ink","#887a9d",3,[[680,900],[735,940],[770,990]]),
      line("fold-left-2","Add a secondary sleeve crease.","ink","#a194ae",2,[[650,945],[700,975],[730,1015]]),
      line("fold-right-1","Describe the right sleeve fold.","ink","#887a9d",3,[[1260,900],[1205,940],[1170,990]]),
      line("fold-right-2","Add a secondary garment crease.","ink","#a194ae",2,[[1290,945],[1240,975],[1210,1015]]),
      line("bodice-seams","Add the garment seam and waist construction.","ink","#b8a7c1",2,[[820,870],[900,925],[970,950],[1040,925],[1120,870]]),
      line("cheek-blush","Blend a restrained blush across the left cheek inside the face.","watercolor","#e98e9b",22,[[825,565],[850,575],[875,565]],{opacity:.38,texture:.2,clipPolygon:face}),
      line("cheek-blush-right","Blend a restrained blush across the right cheek inside the face.","watercolor","#e98e9b",22,[[1065,565],[1090,575],[1115,565]],{opacity:.38,texture:.2,clipPolygon:face}),
      line("eye-lower-left","Add the soft lower lash line clipped to the left eye.","ink","#806477",3,[[820,475],[865,510],[925,480]],{clipPolygon:leftEye}),
      line("eye-lower-right","Add the soft lower lash line clipped to the right eye.","ink","#806477",3,[[995,480],[1055,510],[1125,475]],{clipPolygon:rightEye}),
      line("eye-upper-left-accent","Build a tapered outer upper lash accent.","ink","#282236",5,[[820,455],[805,442],[790,435]]),
      line("eye-upper-right-accent","Build a tapered outer upper lash accent.","ink","#282236",5,[[1125,455],[1145,442],[1160,435]]),
      line("iris-light-left","Add a curved warm reflection within the left iris.","gouache","#e8a77d",3,[[862,470],[878,480],[894,478]],{opacity:.8,clipPolygon:leftEye}),
      line("iris-light-right","Add a curved warm reflection within the right iris.","gouache","#e8a77d",3,[[1032,470],[1048,480],[1064,478]],{opacity:.8,clipPolygon:rightEye}),
      line("nose-bridge","Suggest a delicate nose bridge and tip.","ink","#d69b91",2,[[970,500],[968,530],[980,545]],{opacity:.65,clipPolygon:face}),
      line("lower-lip","Separate the lower lip with a soft tapered accent.","gouache","#c77e82",3,[[945,640],[970,646],[990,640]],{opacity:.7,clipPolygon:face}),
      line("hair-strand-crown-left","Add a short crown strand following hair growth.","ink","#665a72",2,[[790,245],[835,205],[890,180]],{opacity:.7,clipPolygon:hairBack}),
      line("hair-strand-crown-right","Add a second crown strand following hair growth.","ink","#665a72",2,[[1040,175],[1100,190],[1140,235]],{opacity:.7,clipPolygon:hairBack}),
      line("hair-strand-top-left","Add a fine curved strand over the upper left crown.","ink","#766983",2,join(bezier([760,265],[790,190],[860,155],[925,150],12)),{opacity:.8,clipPolygon:hairBack}),
      line("hair-strand-top-right","Add a fine curved strand over the upper right crown.","ink","#766983",2,join(bezier([1000,150],[1080,155],[1150,195],[1190,265],12)),{opacity:.8,clipPolygon:hairBack}),
      line("hair-strand-left-inner","Add a short directional strand on the upper left side lock.","ink","#766983",2,join(bezier([680,390],[670,455],[675,520],[695,575],10)),{opacity:.72,clipPolygon:leftHairClip}),
      line("hair-strand-right-inner","Add a short directional strand on the upper right side lock.","ink","#766983",2,join(bezier([1250,390],[1270,455],[1265,520],[1245,575],10)),{opacity:.72,clipPolygon:rightHairClip})
    ]}
  ];
  return {
    format:"zero-studio-digital-artist-brush-plan", version:1,
    title:"General anime drawing quality benchmark — original character",
    identity:{characterAssetId:"general-anime-quality-benchmark"},
    layers
  };
}
