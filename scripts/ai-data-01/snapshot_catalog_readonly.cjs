// Explicit, read-only snapshot for dataset preparation. Never logs connection secrets.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../server'),{createRequire}=require('node:module'),req=createRequire(path.join(root,'package.json'));
async function main(){
 const out=process.argv[2];if(!out)throw Error('Output filename required');
 const env=req('dotenv').parse(fs.readFileSync(path.join(root,'.env'))),conn=process.env.DATABASE_URL||env.DATABASE_URL;
 const url=new URL(conn);if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname))throw Error('Only configured local database is authorized');
 const {PrismaClient}=req('@prisma/client'),db=new PrismaClient({datasources:{db:{url:conn}},log:[]});
 try{
  const snapshot=await db.$transaction(async tx=>{
   await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
   await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '15000'");
   const identity=await tx.$queryRawUnsafe("SELECT current_setting('transaction_read_only') AS read_only");
   return {capturedAt:new Date().toISOString(),source:'local PostgreSQL READ ONLY / RepeatableRead',identity,
    symptoms:await tx.symptom.findMany({select:{id:true,targetId:true,code:true,name:true,kind:true,reviewStatus:true,isActive:true,description:true},orderBy:{id:'asc'}}),
    symptomServices:await tx.symptomService.findMany({select:{symptomId:true,serviceId:true,targetId:true,priority:true,reason:true,reviewStatus:true,isActive:true}}),
    services:await tx.service.findMany({select:{id:true,categoryId:true,targetId:true,name:true,slug:true,description:true,basePrice:true,maxPrice:true,unit:true,isActive:true},orderBy:{id:'asc'}}),
    categories:await tx.serviceCategory.findMany({select:{id:true,name:true,slug:true,isActive:true},orderBy:{id:'asc'}}),
    targets:await tx.serviceTarget.findMany({select:{id:true,categoryId:true,name:true,slug:true,isActive:true,aiPrompts:true},orderBy:{id:'asc'}})};
  },{isolationLevel:'RepeatableRead',timeout:30000,maxWait:5000});
  fs.mkdirSync(path.dirname(path.resolve(out)),{recursive:true});fs.writeFileSync(out,JSON.stringify(snapshot,null,2),{flag:'wx',mode:0o600});
  console.log(JSON.stringify({status:'verified_read_only',categories:snapshot.categories.length,targets:snapshot.targets.length}));
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(JSON.stringify({status:'failed',code:e.code||e.name,note:'No database writes; no credentials logged'}));process.exitCode=1;});
