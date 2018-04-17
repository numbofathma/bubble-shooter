import {AlphabetizedMap} from '../utils/EntityMap';

let {_,x,a,b,c,d,e,f,g,h,i,o} = AlphabetizedMap;
/* 
    b=flame=red
    f=solidBlack=purple
    d=coin=green
    e=star=yellow
    i=block=gold
*/
export default [
    [i,0,i,i,i,i,i,i,b,i,i,i,i,i,i,0,i],
     [i,i,0,0,0,0,0,b,b,0,0,0,0,0,i,i,_],
    [0,i,0,f,f,f,b,b,d,b,b,e,e,e,0,i,0],
     [i,0,f,d,0,e,e,d,d,f,f,0,d,e,0,i,_],
    [i,0,0,f,d,0,e,0,b,0,f,0,d,e,0,0,i],
     [0,0,0,b,d,d,0,b,b,0,d,d,b,0,0,0,_],
    [0,0,0,b,b,0,f,f,0,e,e,0,b,b,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,_],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,_],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,_]
    [x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x,x]
];