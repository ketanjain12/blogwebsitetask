require('dotenv').config();
const express=require('express'),cors=require('cors'),helmet=require('helmet'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),slugify=require('slugify');
const {pool,initializeDatabase}=require('./db');const {auth,admin}=require('./middleware');
const app=express();const origins=(process.env.CLIENT_URL||'http://localhost:5173').split(',').map(x=>x.trim());
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:(o,cb)=>!o||origins.includes(o)||process.env.NODE_ENV!=='production'?cb(null,true):cb(new Error('CORS origin not allowed')),credentials:true}));
app.use(express.json({limit:'2mb'}));
app.get('/api/health',(_q,s)=>s.json({status:'ok',service:'blogspace-api'}));
app.post('/api/auth/register',async(q,s,n)=>{try{
 const name=String(q.body.name||'').trim(),email=String(q.body.email||'').trim().toLowerCase(),pw=String(q.body.password||'');
 if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pw.length<8)return s.status(400).json({message:'Enter a valid name, email and password (8+ characters).'});
 const [e]=await pool.execute('SELECT id FROM users WHERE email=?',[email]);if(e.length)return s.status(409).json({message:'Email already registered.'});
 const hash=await bcrypt.hash(pw,12),[r]=await pool.execute('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)',[name,email,hash]);
 const user={id:r.insertId,name,email,role:'user'},token=jwt.sign({id:user.id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
 s.status(201).json({user,token});
}catch(e){n(e)}});
app.post('/api/auth/login',async(q,s,n)=>{try{
 const email=String(q.body.email||'').trim().toLowerCase(),pw=String(q.body.password||'');
 const [rows]=await pool.execute('SELECT * FROM users WHERE email=? LIMIT 1',[email]),u=rows[0];
 if(!u||!u.is_active||!(await bcrypt.compare(pw,u.password_hash)))return s.status(401).json({message:'Email or password is incorrect.'});
 const token=jwt.sign({id:u.id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
 s.json({token,user:{id:u.id,name:u.name,email:u.email,role:u.role}});
}catch(e){n(e)}});
app.get('/api/auth/me',auth,(q,s)=>s.json({user:q.user}));
app.get('/api/posts',async(q,s,n)=>{try{
 const search=String(q.query.q||'').trim(),cat=String(q.query.category||'');let where="WHERE p.status='published'",args=[];
 if(search){where+=' AND (p.title LIKE ? OR p.excerpt LIKE ?)';args.push(`%${search}%`,`%${search}%`)}
 if(cat&&cat!=='All'){where+=' AND p.category=?';args.push(cat)}
 const [posts]=await pool.execute(`SELECT p.id,p.title,p.slug,p.excerpt,p.cover_image,p.category,p.read_time,p.published_at,u.name author_name FROM posts p LEFT JOIN users u ON u.id=p.author_id ${where} ORDER BY p.published_at DESC`,args);
 s.json({posts});
}catch(e){n(e)}});
app.get('/api/posts/:slug',async(q,s,n)=>{try{
 const [r]=await pool.execute("SELECT p.*,u.name author_name FROM posts p LEFT JOIN users u ON u.id=p.author_id WHERE p.slug=? AND p.status='published'",[q.params.slug]);
 if(!r[0])return s.status(404).json({message:'Article not found.'});s.json({post:r[0]});
}catch(e){n(e)}});
app.get('/api/ads',async(q,s,n)=>{try{const [ads]=await pool.query('SELECT placement,title,description,label FROM ads WHERE is_active=1');s.json({ads})}catch(e){n(e)}});
app.use('/api/admin',auth,admin);
app.get('/api/admin/stats',async(q,s,n)=>{try{
 const [[u]] = await pool.query("SELECT COUNT(*) total FROM users WHERE role='user'"),[[p]]=await pool.query('SELECT COUNT(*) total FROM posts'),[[pub]]=await pool.query("SELECT COUNT(*) total FROM posts WHERE status='published'"),[[d]]=await pool.query("SELECT COUNT(*) total FROM posts WHERE status='draft'");
 const [recent]=await pool.query('SELECT id,title,status,created_at FROM posts ORDER BY created_at DESC LIMIT 5');s.json({stats:{users:u.total,posts:p.total,published:pub.total,drafts:d.total},recent});
}catch(e){n(e)}});
app.get('/api/admin/users',async(q,s,n)=>{try{const [users]=await pool.query('SELECT id,name,email,role,is_active,created_at FROM users ORDER BY created_at DESC');s.json({users})}catch(e){n(e)}});
app.put('/api/admin/users/:id',async(q,s,n)=>{try{await pool.execute('UPDATE users SET is_active=? WHERE id=? AND role="user"',[q.body.is_active?1:0,q.params.id]);s.json({message:'User updated'})}catch(e){n(e)}});
app.delete('/api/admin/users/:id',async(q,s,n)=>{try{if(+q.params.id===+q.user.id)return s.status(400).json({message:'Cannot delete your own admin account.'});await pool.execute('DELETE FROM users WHERE id=? AND role="user"',[q.params.id]);s.json({message:'User deleted'})}catch(e){n(e)}});
app.get('/api/admin/posts',async(q,s,n)=>{try{const [posts]=await pool.query('SELECT * FROM posts ORDER BY created_at DESC');s.json({posts})}catch(e){n(e)}});
app.post('/api/admin/posts',async(q,s,n)=>{try{
 const {title,excerpt,content,category='General',cover_image='',status='draft'}=q.body;
 if(!title||!excerpt||!content)return s.status(400).json({message:'Title, excerpt and content are required.'});
 const slug=slugify(title,{lower:true,strict:true})+'-'+Date.now().toString().slice(-6),read=Math.max(1,Math.ceil(content.split(/\s+/).length/200));
 await pool.execute('INSERT INTO posts(author_id,title,slug,excerpt,content,category,cover_image,status,read_time,published_at) VALUES(?,?,?,?,?,?,?,?,?,?)',[q.user.id,title,slug,excerpt,content,category,cover_image,status==='published'?'published':'draft',read,status==='published'?new Date():null]);
 s.status(201).json({message:'Post created'});
}catch(e){n(e)}});
app.put('/api/admin/posts/:id',async(q,s,n)=>{try{
 const {title,excerpt,content,category='General',cover_image='',status='draft'}=q.body;
 if(!title||!excerpt||!content)return s.status(400).json({message:'Title, excerpt and content are required.'});
 const st=status==='published'?'published':'draft';
 await pool.execute("UPDATE posts SET title=?,excerpt=?,content=?,category=?,cover_image=?,status=?,published_at=IF(?='published',COALESCE(published_at,NOW()),NULL) WHERE id=?",[title,excerpt,content,category,cover_image,st,st,q.params.id]);s.json({message:'Post updated'});
}catch(e){n(e)}});
app.delete('/api/admin/posts/:id',async(q,s,n)=>{try{await pool.execute('DELETE FROM posts WHERE id=?',[q.params.id]);s.json({message:'Post deleted'})}catch(e){n(e)}});
app.use((q,s)=>s.status(404).json({message:`Not found: ${q.method} ${q.originalUrl}`}));
app.use((e,q,s,n)=>{console.error(e.message);s.status(500).json({message:'Server error. Check API logs.'})});
const port=Number(process.env.PORT||5000);
initializeDatabase().then(()=>app.listen(port,'0.0.0.0',()=>console.log(`BlogSpace API listening on ${port}`))).catch(e=>{console.error('Database initialization failed:',e.message);process.exit(1)});
