// Isolated auth/HTTP harness: all identities are in memory, never seeded into FixGo DB.
require('reflect-metadata');
require('@babel/register')({configFile:require('path').resolve(__dirname,'../.babelrc'),extensions:['.js'],ignore:[/node_modules/]});
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),bcrypt=require('bcrypt');
const {Test}=require('@nestjs/testing'),{PassportModule}=require('@nestjs/passport'),{JwtService}=require('@nestjs/jwt');
if (!process.env.JEST_WORKER_ID) { const firebase=require.resolve('../src/config/firebase.config'); require.cache[firebase]={id:firebase,filename:firebase,loaded:true,exports:{getFirebaseAuth:()=>{throw Error('External auth is disabled in this isolated login harness')}}}; }
const {Ai01PermissionsController}=require('../src/modules/ai01-review/ai01-permissions.controller');
const {Ai01PermissionsService}=require('../src/modules/ai01-review/ai01-permissions.service');
const {Ai01ReviewController}=require('../src/modules/ai01-review/ai01-review.controller');
const {Ai01ReviewService}=require('../src/modules/ai01-review/ai01-review.service');
const {AuthController}=require('../src/modules/auth/auth.controller');
const {AuthService}=require('../src/modules/auth/auth.service');
const {JwtStrategy}=require('../src/modules/auth/strategies/jwt.strategy');
const {JwtAuthGuard}=require('../src/modules/auth/guards/jwt-auth.guard');
const {RolesGuard}=require('../src/modules/auth/guards/roles.guard');
const {PrismaService}=require('../src/infrastructure/database/prisma.service');
const {UsersService}=require('../src/modules/users/users.service');
const {OtpService}=require('../src/modules/auth/otp.service');
const {AdminGateway}=require('../src/modules/admin/admin.gateway');
const {RegistrationProofService}=require('../src/modules/auth/registration-proof.service');
async function createHarness(){
 const home=fs.mkdtempSync(path.join(os.tmpdir(),'fixgo-ai01-admin-test-only-')),password='Isolated-test-password-123',hash=await bcrypt.hash(password,4);
 const roles=['coordinator','reviewer_a','reviewer_b','adjudicator','viewer','unassigned','customer','blocked','manager'];
 const users=roles.map((role,i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name:'TEST ONLY '+role,fullName:'TEST ONLY '+role,email:`${role}@ai01.invalid`,role:role==='customer'?'CUSTOMER':['reviewer_a','reviewer_b','adjudicator','viewer'].includes(role)?'WORKER':'ADMIN',status:role==='blocked'?'BLOCKED':'ACTIVE',passwordHash:hash}));
 const policyFile=path.join(home,'policy.json');fs.writeFileSync(policyFile,JSON.stringify({version:1,approval:{approvedBy:users[0].id,approvedAt:new Date().toISOString(),evidence:'UNIT/HTTP TEST ONLY; no real permissions granted'},permissionManagers:[users.at(-1).id],bootstrap:{approvedBy:users.at(-1).id,approvedAt:new Date().toISOString(),evidence:'ISOLATED TEST BOOTSTRAP ONLY'},users:users.slice(0,5).map((u,i)=>({userId:u.id,role:roles[i],expert:['coordinator','adjudicator'].includes(roles[i])}))}));
 process.env.JWT_SECRET='ai01-harness-only-key-not-production';process.env.AI01_REVIEW_ENABLED='true';process.env.AI01_REVIEW_POLICY_FILE=policyFile;process.env.AI01_PILOT_DIR=path.join(os.homedir(),'Work/datasetai/06-benchmarks/ai01-pilot-v1');process.env.AI01_REVIEW_STATE_DIR=path.join(home,'reviews');
 const catalog=JSON.parse(fs.readFileSync(path.join(process.env.AI01_PILOT_DIR,'taxonomy-reference.json'),'utf8'));
 const jwt=new JwtService({secret:process.env.JWT_SECRET});const lookup=new Map(users.map(u=>[u.id,u]));
 const module=await Test.createTestingModule({imports:[PassportModule.register({defaultStrategy:'jwt'})],controllers:[AuthController,Ai01ReviewController,Ai01PermissionsController],providers:[Ai01ReviewService,Ai01PermissionsService,AuthService,JwtStrategy,JwtAuthGuard,RolesGuard,{provide:PrismaService,useValue:{serviceCategory:{findMany:async()=>catalog.categories.filter(c=>c.isActive!==false)},serviceTarget:{findMany:async()=>catalog.targets.filter(t=>t.isActive!==false)},user:{findUnique:async({where,select})=>{const u=lookup.get(where.id);return !u?null:select?Object.fromEntries(Object.keys(select).map(k=>[k,u[k]])):u;},findMany:async({where,select,skip=0,take=50})=>users.filter(u=>(!where.role||u.role===where.role)&&u.status===where.status&&(!where.OR||where.OR.some(c=>Object.entries(c).some(([k,v])=>(u[k]||'').toLowerCase().includes(v.contains.toLowerCase()))))).slice(skip,skip+take).map(u=>Object.fromEntries(Object.keys(select).map(k=>[k,u[k]]))) }}},{provide:UsersService,useValue:{findByEmailOrPhone:async value=>users.find(u=>u.email===value)||null}},{provide:JwtService,useValue:jwt},{provide:OtpService,useValue:{}},{provide:AdminGateway,useValue:{}},{provide:RegistrationProofService,useValue:{}}]}).compile();
 const app=module.createNestApplication({logger:false});app.setGlobalPrefix('api');app.enableCors({origin:true});await app.init();
 return {app,home,password,users,jwt,policyFile,service:module.get(Ai01ReviewService),async close(){await app.close();fs.rmSync(home,{recursive:true,force:true});}};
}
module.exports={createHarness};
if(require.main===module){createHarness().then(async h=>{await h.app.listen(Number(process.env.AI01_TEST_PORT||3039),'127.0.0.1');console.log(JSON.stringify({ready:true,port:h.app.getHttpServer().address().port,testOnly:true}));process.on('SIGTERM',async()=>{await h.close();process.exit(0)});}).catch(e=>{console.error(e);process.exit(1)});}
