import { decode } from 'html-entities';
import { Filter } from 'bad-words';
import { boolean, success } from 'zod';

const filter = new Filter();

function fullyDecode(input : string) : {data?:string,success:boolean}{
    let prev = '';
    let decoded = input;
    // To find double or more encoding of tags we run this loop
    try{
        while (prev !== decoded){
            prev = decoded;
            decoded = decodeURIComponent(decoded.replace(/\+/g, '')); // decoded the URL Encoding (percent-encoding)
            decoded = decode(decoded); // decoded the HTML entries Encoding, both can be ran on the same var since one encoding cannot change the encoding of other
        }
        return {data:decoded,success:true};
    } catch(e) {
        return {success:false};
    }
}

function removeInvisible(str : string) : string{
    return str.replace(
    /[\u200B\u200C\u202A-\u202E\u2060-\u2069\uFEFF\u00AD]/gu,'').replace(/\p{M}/gu, '');
}


export default function validate(raw: string,lenLimit=2000) : {valid:boolean,error?:string,value?:string | null} {
    if (typeof raw !== 'string') return { valid:false, error: 'Must be a string' }

    if (raw.length > lenLimit) return { valid:false, error: `Too many characters, ${lenLimit} is max` }

    if ([...raw].length > 3000) return { valid:false, error: `Too many characters, 3000 is max` } // For unicode 3000 is max

    const msg = removeInvisible(raw);
    
    if (filter.isProfane(msg)) return { valid:false, error: 'Contains Prohibited langauge' }
    
    const decodedmsg = fullyDecode(msg);

    if(!decodedmsg.success) return { valid:false, error: 'Some characters are not supported' }

    if(!decodedmsg.data) {
        return { valid : true, value : null};
    }

    const final = decodedmsg?.data.trim().normalize('NFC');

    return {valid:true, value:final.trim().replace(/\s+/g, ' ')};
}

export function slugify(text : string) : string {
    return text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "")
}