import{useEffect,useState}from'react';
import{Sparkles}from'lucide-react';
import api from'./api';
import React from 'react';
const demo={top_banner:['Make room for your next big idea','A little inspiration can change the shape of your day.'],bottom_banner:['Build a routine that feels like yours','Small steps. Clear focus. Better days.'],sidebar:['Discover your next favourite read','Fresh perspectives for curious minds.'],in_content_1:['Create more space for deep work','Find tools that help you focus on what matters.'],in_content_2:['Keep learning, one page at a time','A good idea is always worth sharing.'],sticky_footer:['Thanks for spending time with BlogSpace','Keep exploring thoughtful stories.']};
export function Ad({placement}){const[t,setT]=useState(demo[placement]);useEffect(()=>{api.get('/ads').then(r=>{const a=r.data.ads.find(x=>x.placement===placement);if(a)setT([a.title,a.description])}).catch(()=>{})},[placement]);if(!t)return null;return <div className="ad"><div className="adtag"><Sparkles size={13}/> DEMO ADVERTISEMENT</div><b>{t[0]}</b><p>{t[1]}</p></div>}
