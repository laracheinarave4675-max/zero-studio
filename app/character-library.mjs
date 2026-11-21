import {uid} from "./engine.mjs";
import {validateCharacterModel} from "./character-model.mjs";

export const MAX_CHARACTER_LIBRARY=100;
const MAX_CHARACTER_BYTES=5*1024*1024;

function ensureLibrary(project){
 if(!project||project.format!=="zero-studio"||project.version!==2)throw Error("مشروع ZERO STUDIO غير صالح");
 if(!Array.isArray(project.characterLibrary))project.characterLibrary=[];
 if(project.characterLibrary.length>MAX_CHARACTER_LIBRARY)throw Error("تجاوزت مكتبة الشخصيات الحد الأقصى");
 return project.characterLibrary;
}

export function saveCharacterToLibrary(project,model,name){
 const library=ensureLibrary(project),safe=validateCharacterModel(model);
 const serialized=JSON.stringify(safe);
 if(serialized.length>MAX_CHARACTER_BYTES)throw Error("نموذج الشخصية يتجاوز 5 ميغابايت");
 if(library.length>=MAX_CHARACTER_LIBRARY)throw Error("مكتبة الشخصيات ممتلئة (100 نموذج)");
 const label=String(name??safe.name).trim().slice(0,100);
 if(!label)throw Error("اسم عنصر المكتبة لا يمكن أن يكون فارغاً");
 const entry={id:uid("character"),name:label,model:JSON.parse(serialized)};
 library.push(entry);
 return entry;
}

export function loadCharacterFromLibrary(project,assetId){
 const library=ensureLibrary(project),entry=library.find(item=>item.id===assetId);
 if(!entry)throw Error("الشخصية غير موجودة في المكتبة");
 return validateCharacterModel(JSON.parse(JSON.stringify(entry.model)));
}

export function removeCharacterFromLibrary(project,assetId){
 const library=ensureLibrary(project),index=library.findIndex(item=>item.id===assetId);
 if(index<0)throw Error("الشخصية غير موجودة في المكتبة");
 return library.splice(index,1)[0];
}
