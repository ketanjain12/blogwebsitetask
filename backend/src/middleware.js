const jwt=require('jsonwebtoken'); const {pool}=require('./db');
async function auth(req,res,next){
 try{
  const h=req.headers.authorization||'', token=h.startsWith('Bearer ')?h.slice(7):null;
  if(!token)return res.status(401).json({message:'Please sign in.'});
  const p=jwt.verify(token,process.env.JWT_SECRET);
  const [rows]=await pool.execute('SELECT id,name,email,role,is_active FROM users WHERE id=?',[p.id]);
  if(!rows[0]||!rows[0].is_active)return res.status(401).json({message:'Account unavailable.'});
  req.user=rows[0];next();
 }catch(e){res.status(401).json({message:'Session invalid or expired.'});}
}
function admin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({message:'Admin access required.'});next();}
module.exports={auth,admin};
