export function createDigitalArtistDemoPlan(){
 const pointList=values=>values.map(([x,y],index)=>({x,y,pressure:(index===0||index===values.length-1)?0.24:0.48+((index%3)*0.16)}));
 const stroke=(id,intent,brush,color,size,values,extra={})=>({id,intent,brush,color,size,points:pointList(values),...extra});
 const region=(id,intent,color,values,extra={})=>({id,intent,kind:"region-fill",color,points:pointList(values),...extra});
 return{
  format:"zero-studio-digital-artist-brush-plan",version:1,title:"Anime portrait — native brush execution study",
  identity:{characterAssetId:"zero-demo-anime-face"},
  layers:[
   {id:"construction",name:"01 · Construction",role:"construction",strokes:[
    stroke("guide-head","Establish the head oval and facial proportions.","graphite","#85818a",5,[[960,235],[1080,260],[1155,355],[1170,485],[1135,615],[1060,710],[960,748],[860,710],[785,615],[750,485],[765,355],[840,260],[960,235]]),
    stroke("guide-eye","Mark the eye alignment.","graphite","#aaa5ad",3,[[755,470],[850,465],[960,470],[1070,465],[1165,470]]),
    stroke("guide-center","Mark the face centerline.","graphite","#aaa5ad",3,[[960,250],[958,390],[960,540],[960,700]])
   ]},
   {id:"rough","name":"02 · Rough sketch",role:"rough-sketch",strokes:[
    stroke("rough-hair","Block in the hair silhouette.","graphite","#77747e",8,[[755,480],[735,345],[790,220],[900,155],[1035,155],[1145,235],[1190,365],[1165,500]]),
    stroke("rough-body","Block in the neck and shoulders.","graphite","#77747e",7,[[875,690],[875,790],[800,820],[690,900],[640,1010],[960,1040],[1280,1010],[1230,900],[1120,820],[1045,790],[1045,690]])
   ]},
   {id:"flats",name:"04 · Flat colors",role:"flat-color",strokes:[
    region("hair-cap-fill","Fill the crown inside the outer hair silhouette.","#34384c",[[760,465],[738,350],[785,250],[875,175],[975,150],[1080,190],[1150,275],[1180,390],[1150,485],[1115,410],[1095,330],[1040,280],[970,255],[900,275],[840,335],[790,425]]),
    region("hair-left-lock-fill","Fill the long left hair lock within its contour.","#34384c",[[770,405],[748,525],[755,680],[790,800],[855,885],[900,850],[865,760],[840,650],[820,535],[810,440]]),
    region("hair-right-lock-fill","Fill the long right hair lock within its contour.","#34384c",[[1150,405],[1172,525],[1165,680],[1130,800],[1065,885],[1020,850],[1055,760],[1080,650],[1100,535],[1110,440]]),
    region("skin-face-fill","Fill the enclosed face silhouette with the warm skin base.","#efc4b1",[[800,390],[835,370],[885,360],[960,365],[1035,360],[1085,370],[1120,390],[1115,500],[1085,610],[1020,685],[960,710],[900,685],[835,610],[805,500]]),
    region("skin-ear-left-fill","Fill the left ear inside its outline.","#efc4b1",[[790,485],[765,475],[752,505],[775,550],[802,552]]),
    region("skin-ear-right-fill","Fill the right ear inside its outline.","#efc4b1",[[1130,485],[1155,475],[1168,505],[1145,550],[1118,552]]),
    region("neck-skin-fill","Fill the neck shape between the jaw and clothing.","#efc4b1",[[895,685],[1025,685],[1022,785],[1060,820],[1015,850],[960,865],[905,850],[860,820],[898,785]]),
    region("hair-bang-left-fill","Fill the left fringe lock without crossing the face contour.","#34384c",[[790,355],[850,290],[900,280],[925,440],[885,410],[850,380]]),
    region("hair-bang-center-fill","Fill the central fringe lock inside its ink contour.","#34384c",[[900,245],[970,220],[1030,270],[1000,435],[970,390],[940,350]]),
    region("hair-bang-right-fill","Fill the right fringe lock inside its ink contour.","#34384c",[[1040,275],[1105,300],[1145,380],[1090,430],[1070,360]]),
    region("cloth-main-fill","Fill the complete upper clothing silhouette.","#71999c",[[875,800],[800,825],[710,890],[665,990],[790,1010],[960,1030],[1130,1010],[1255,990],[1210,890],[1120,825],[1045,800],[1020,850],[960,880],[900,850]]),
    region("cloth-collar-fill","Paint the inner collar panel within the clothing shape.","#9bb8b1",[[890,810],[960,885],[1030,810],[1015,900],[960,935],[905,900]])
   ]},
   {id:"ink","name":"03 · Clean line art",role:"clean-line",strokes:[
    stroke("face-outline","Ink the cheeks, jaw and chin.","ink","#28232e",8,[[790,390],[795,500],[835,615],[900,690],[960,715],[1020,690],[1085,615],[1125,500],[1130,390]]),
    stroke("hair-cap","Ink the outer hair shape.","ink","#24232e",10,[[755,470],[735,350],[785,245],[875,175],[975,150],[1080,190],[1150,275],[1180,390],[1150,485]]),
    stroke("bang-left","Draw the first front hair lock.","ink","#24232e",8,[[790,350],[845,290],[900,280],[925,440],[885,405],[850,375]]),
    stroke("bang-center","Draw the central hair lock.","ink","#24232e",8,[[900,245],[970,220],[1030,270],[1000,435],[970,390],[940,350]]),
    stroke("bang-right","Draw the right front hair lock.","ink","#24232e",8,[[1040,275],[1105,300],[1145,380],[1090,430],[1070,360]]),
    stroke("hair-left-side","Draw the long left hair silhouette.","ink","#24232e",9,[[770,400],[740,555],[755,720],[820,850],[870,895]]),
    stroke("hair-right-side","Draw the long right hair silhouette.","ink","#24232e",9,[[1150,405],[1180,555],[1165,720],[1100,850],[1050,895]]),
    stroke("left-brow","Draw the left eyebrow.","ink","#342a32",7,[[825,425],[865,408],[910,418]]),
    stroke("right-brow","Draw the right eyebrow.","ink","#342a32",7,[[1005,418],[1050,408],[1090,425]]),
    stroke("left-eye","Ink the left upper eyelid.","ink","#211e29",8,[[820,475],[850,445],[890,442],[925,470],[900,490],[860,495],[820,475]]),
    stroke("right-eye","Ink the right upper eyelid.","ink","#211e29",8,[[995,470],[1030,442],[1070,445],[1100,475],[1080,495],[1040,490],[995,470]]),
    stroke("left-lower-eye","Finish the left lower eyelid.","ink","#55434c",4,[[830,482],[865,510],[900,505],[920,480]]),
    stroke("right-lower-eye","Finish the right lower eyelid.","ink","#55434c",4,[[1000,480],[1020,505],[1055,510],[1090,482]]),
    stroke("left-iris","Draw the left iris.","ink","#302634",6,[[865,452],[880,448],[894,465],[890,490],[875,498],[862,480],[865,452]]),
    stroke("right-iris","Draw the right iris.","ink","#302634",6,[[1035,452],[1050,448],[1065,465],[1060,490],[1045,498],[1032,480],[1035,452]]),
    stroke("nose","Suggest the nose with a light line.","ink","#6d5054",4,[[966,500],[955,545],[973,552]]),
    stroke("mouth","Draw a small expressive mouth.","ink","#8b4d58",5,[[930,610],[960,620],[990,610]]),
    stroke("left-ear","Outline the left ear.","ink","#332832",5,[[790,485],[765,470],[750,505],[775,555],[805,555]]),
    stroke("right-ear","Outline the right ear.","ink","#332832",5,[[1130,485],[1155,470],[1170,505],[1145,555],[1115,555]]),
    stroke("neck-left","Draw the left neck contour.","ink","#302832",7,[[890,680],[895,790],[870,825]]),
    stroke("neck-right","Draw the right neck contour.","ink","#302832",7,[[1030,680],[1025,790],[1050,825]]),
    stroke("shoulders","Draw the shoulder and upper clothing contours.","ink","#302832",9,[[875,800],[800,825],[710,890],[665,990],[960,1030],[1255,990],[1210,890],[1120,825],[1045,800]])
   ]},
   {id:"shadow","name":"05 · Shadows",role:"shadow",strokes:[
    stroke("left-cheek-shadow","Add a soft left cheek shadow.","watercolor","#bd8889",30,[[820,555],[850,565],[875,555]],{opacity:.5,texture:.45}),
    stroke("right-cheek-shadow","Add a soft right cheek shadow.","watercolor","#bd8889",30,[[1045,555],[1075,565],[1100,555]],{opacity:.5,texture:.45}),
    stroke("jaw-shadow","Shape the underside of the chin.","gouache","#cc9f98",19,[[875,660],[930,680],[980,680],[1030,660]],{opacity:.62}),
    stroke("neck-shadow","Add neck depth.","watercolor","#ae777d",22,[[890,765],[930,790],[1015,765]],{opacity:.48}),
    stroke("hair-shadow","Deepen the hair mass.","gouache","#202331",35,[[820,310],[900,280],[1000,290],[1100,345]],{opacity:.65})
   ]},
   {id:"highlight","name":"06 · Highlights",role:"highlight",strokes:[
    stroke("forehead-light","Place a soft forehead highlight.","gouache","#ffe0c9",19,[[900,390],[950,380],[1000,390]],{opacity:.7,texture:.2}),
    stroke("nose-light","Add a small nose highlight.","gouache","#ffe3d1",8,[[970,520],[975,535]],{opacity:.8,texture:.1}),
    stroke("hair-light","Add a restrained hair sheen.","gouache","#8c91a7",12,[[850,225],[930,195],[1000,195]],{opacity:.65,texture:.65})
   ]},
   {id:"detail","name":"07 · Details",role:"detail",strokes:[
    stroke("left-pupil","Darken the left pupil.","ink","#171824",8,[[877,455],[882,472],[880,485]]),
    stroke("right-pupil","Darken the right pupil.","ink","#171824",8,[[1047,455],[1052,472],[1050,485]]),
    stroke("left-lashes","Accentuate the left eyelashes.","ink","#171824",5,[[825,470],[812,453],[808,445]]),
    stroke("right-lashes","Accentuate the right eyelashes.","ink","#171824",5,[[1095,470],[1108,453],[1112,445]]),
    stroke("hair-strand-1","Add a fine strand over the left fringe.","ink","#55596f",3,[[825,305],[855,335],[885,375]]),
    stroke("hair-strand-2","Add a fine strand over the central fringe.","ink","#777b91",3,[[955,250],[970,300],[985,350]]),
    stroke("hair-strand-3","Add a fine strand over the right fringe.","ink","#55596f",3,[[1080,315],[1060,355],[1045,390]])
   ]}
  ]
 };
}
